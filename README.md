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
- Worker, STT ve yapılandırılmış özetleme adapter’larını çalıştırır; sonuç `Ready` olduğunda kaydeder.
- SignalR hub: `/hubs/meeting-status`; istemci metodu `JoinMeeting`, event adı `meetingStatusChanged`.

API varsayılan olarak `http://localhost:5080/api` adresindedir. Frontend için `web/.env.example` dosyasını `.env` olarak kopyalayabilirsiniz.

Mistral yapılandırması için API anahtarını User Secrets ile tanımlayın:

```powershell
dotnet user-secrets set "Mistral:ApiKey" "<MISTRAL_API_KEY>" --project src/SmartMeeting.Api
```

## Katmanlar

- `SmartMeeting.Domain`: rich domain modeli ve domain event sözleşmeleri
- `SmartMeeting.Application`: MediatR CQRS, FluentValidation ve adapter arayüzleri
- `SmartMeeting.Persistence`: EF Core SQLite DbContext ve mapping’ler
- `SmartMeeting.Infrastructure`: kuyruk, worker ve STT/özetleme adapter’ları
- `SmartMeeting.Api`: controller, middleware ve DI composition root
- `web`: React 19, TypeScript, MUI 9, React Query v5, Zod ve React Hook Form

Demo STT ve özetleme adapter’ları dış servis anahtarı gerektirmeden çalışır; gerçek Whisper/Azure Speech ve OpenAI Structured Outputs adapter’ları aynı application arayüzlerine takılacak şekilde izole edilmiştir.
