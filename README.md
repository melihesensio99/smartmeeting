# SmartMeeting

Toplantı planlama, ses kayıt akışı ve AI özetleme için .NET 8 Clean Architecture + React 19 başlangıç uygulaması.

## Çalıştırma

Backend:

```powershell
dotnet run --project src/SmartMeeting.Api --urls http://localhost:5080
```

Frontend:

```powershell
cd web
npm install
npm run dev
```

Testler:

```powershell
dotnet test SmartMeeting.slnx
```

Test kapsamı domain yaşam döngüsü, domain event üretimi, katılımcı idempotency’si, CQRS handler’ları ve FluentValidation kurallarını içerir.

## RabbitMQ ile arka plan işleme

Ses dosyası STT ve AI özetleme işlemleri RabbitMQ üzerindeki `smartmeeting.meeting-processing` kuyruğuna bırakılır. Worker mesajı aldıktan sonra işi tamamlar ve başarılı/başarısız sonucu SignalR üzerinden yayınlar. RabbitMQ’da mesaj kalıcılığı ve worker tarafında `prefetch=1` kullanılır.

 Docker üzerinde yerel RabbitMQ başlatmak için proje kökünde `RABBITMQ_PASSWORD` ortam değişkenini tanımlayıp compose servislerini başlatın:

```powershell
$env:RABBITMQ_PASSWORD = "<RABBITMQ_PASSWORD>"
docker compose up -d rabbitmq
```

Compose sağlık kontrolü geçene kadar worker kuyruğa bağlanmayı bekler. Mevcut bir `smartmeeting-rabbitmq` container’ı varsa önce `docker compose up -d rabbitmq` ile aynı container yeniden kullanılabilir veya eski container durdurulabilir.

Yönetim paneli `http://localhost:15672`, uygulama bağlantısı ise `localhost:5672` adresindedir. Uygulama ayarları `RabbitMq:Host`, `RabbitMq:Port`, `RabbitMq:Username`, `RabbitMq:Password` ve `RabbitMq:QueueName` alanlarından okunur. Parola kaynak dosyada tutulmamalı; User Secrets veya ortam değişkeni kullanılmalıdır:

```powershell
dotnet user-secrets set "RabbitMq:Username" "smartmeeting" --project src/SmartMeeting.Api
dotnet user-secrets set "RabbitMq:Password" "<RABBITMQ_PASSWORD>" --project src/SmartMeeting.Api
```

RabbitMQ kapatılırsa API başlarken değil, ilk kuyruğa yazma veya okuma sırasında bağlantı hatası üretir; bu sayede web uygulamasının ayağa kalkması bağımsız kalır. Üretimde RabbitMQ için ayrı kullanıcı, TLS, erişim politikası ve izleme yapılandırılmalıdır.

## Toplantı işleme akışı

- `POST /api/meetings`: toplantı oluşturur.
- `POST /api/meetings/{id}/recording/start`: kayıt durumunu başlatır.
- `POST /api/meetings/{id}/recording/complete`: ses dosyasını kuyruğa gönderir.
- `POST /api/meetings/{id}/audio`: multipart ses dosyasını local/object storage’a kaydeder ve işleme kuyruğuna gönderir.
- Worker, STT ve yapılandırılmış özetleme adapter’larını çalıştırır; sonuç `Ready` olduğunda kaydeder.
- STT adapter’ı Mistral `voxtral-mini-latest`, özetleme adapter’ı Mistral `mistral-medium-latest` kullanır.
- SignalR hub: `/hubs/meeting-status`; istemci metodu `JoinMeeting`, event adı `meetingStatusChanged`.

Geliştirme ortamında ses dosyaları `data/audio/yyyy/MM/dd` altında tutulur. Üretimde `IAudioStorage` implementasyonu Azure Blob veya S3-compatible object storage ile değiştirilmelidir; dosyanın kendisi SQLite’a yazılmaz.

API varsayılan olarak `http://localhost:5080/api` adresindedir. Frontend için `web/.env.example` dosyasını `.env` olarak kopyalayabilirsiniz.

Mistral yapılandırması için API anahtarını User Secrets ile tanımlayın:

```powershell
dotnet user-secrets set "Mistral:ApiKey" "<MISTRAL_API_KEY>" --project src/SmartMeeting.Api
```

JWT authentication is provider-neutral and disabled for local development by default. For a production identity provider, set `Authentication:Enabled=true`, `Authentication:RequireAuthentication=true`, `Authentication:Authority` and `Authentication:Audience` through environment variables or user secrets.

Local Identity login uses the built-in JWT issuer. Authentication is required by default. Keep the signing key outside source control:

```powershell
dotnet user-secrets set "Authentication:Enabled" "true" --project src/SmartMeeting.Api
dotnet user-secrets set "Authentication:RequireAuthentication" "true" --project src/SmartMeeting.Api
dotnet user-secrets set "Authentication:SigningKey" "at-least-32-character-random-secret" --project src/SmartMeeting.Api
```

Endpoints: `POST /api/auth/register`, `POST /api/auth/login` and `POST /api/auth/logout`. Login JWT is delivered only as an HttpOnly cookie; the frontend never reads or stores the token.

Production deployments should set `Database:ApplyMigrations=true` so the Identity and meeting schema migrations are applied at startup. Existing local databases created with `EnsureCreated` should be backed up before switching to migrations.

SMTP e-mail delivery is disabled by default. Gmail is preconfigured with `smtp.gmail.com:587` and sender `melihesen123123@gmail.com`. Set the Gmail app password only through User Secrets or an environment variable, never in source control:

```powershell
dotnet user-secrets set "Email:Enabled" "true" --project src/SmartMeeting.Api
dotnet user-secrets set "Email:Username" "melihesen123123@gmail.com" --project src/SmartMeeting.Api
dotnet user-secrets set "Email:Password" "<GMAIL_APP_PASSWORD>" --project src/SmartMeeting.Api
```

Alternatively use `Email__Password` as an environment variable. Then use `POST /api/meetings/{id}/summary/email`.

## Katmanlar

- `SmartMeeting.Domain`: rich domain modeli ve domain event sözleşmeleri
- `SmartMeeting.Application`: MediatR CQRS, FluentValidation ve adapter arayüzleri
- `SmartMeeting.Persistence`: EF Core SQLite DbContext ve mapping’ler
- `SmartMeeting.Infrastructure`: kuyruk, worker ve STT/özetleme adapter’ları
- `SmartMeeting.Api`: controller, middleware ve DI composition root
- `web`: React 19, TypeScript, MUI 9, React Query v5, Zod ve React Hook Form

STT ve özetleme işlemleri Mistral Voxtral/Mistral Chat Completions servisleri üzerinden yürütülür; `Mistral:ApiKey` yapılandırılmadan işleme alınmaz.
