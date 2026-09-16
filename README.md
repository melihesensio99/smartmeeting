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

## Katmanlar

- `SmartMeeting.Domain`: rich domain modeli ve domain event sözleşmeleri
- `SmartMeeting.Application`: MediatR CQRS, FluentValidation ve adapter arayüzleri
- `SmartMeeting.Persistence`: EF Core SQLite DbContext ve mapping’ler
- `SmartMeeting.Infrastructure`: kuyruk, worker ve STT/özetleme adapter’ları
- `SmartMeeting.Api`: controller, middleware ve DI composition root
- `web`: React 19, TypeScript, MUI 9, React Query v5, Zod ve React Hook Form

Demo STT ve özetleme adapter’ları dış servis anahtarı gerektirmeden çalışır; gerçek Whisper/Azure Speech ve OpenAI Structured Outputs adapter’ları aynı application arayüzlerine takılacak şekilde izole edilmiştir.
