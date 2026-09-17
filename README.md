# Meeting — Akıllı Toplantı Yönetimi ve Özetleme

Toplantı planlama, canlı ses kaydı, konuşmayı metne dönüştürme, yapay zekâ destekli raporlama ve aksiyon takibini tek bir çalışma alanında birleştiren kurumsal toplantı platformu.

Meeting; toplantı yöneticilerinin katılımcıları ve toplantı içi yetkileri yönetmesini, ekiplerin ses kaydından konuşmacılı transkript üretmesini ve toplantı sonrasında kararları ve görevleri takip etmesini sağlar.

---

## ✨ Öne Çıkan Özellikler

### 📊 Akıllı Dashboard ve Toplantı Takvimi

- Günün toplantılarını, saatlerini ve işlem durumlarını tek ekranda gösterir.
- Toplam toplantı, bugünkü program, hazır AI raporları ve açık aksiyon sayılarını sunar.
- Toplantı detayına ve not alma akışına tek tıkla erişim sağlar.

### 🎙️ Canlı Toplantı Odası

- Tarayıcı mikrofonundan canlı kayıt başlatır.
- Kayıt süresini gerçek zamanlı gösterir.
- Web Audio API ile ses frekanslarını dalga formu olarak görselleştirir.
- Toplantı sırasında alınan notları kaydeder ve AI raporuna bağlam olarak aktarır.

### 📝 Konuşmacılı Transkript ve AI Raporu

- Voxtral ile ses kaydını metne dönüştürür.
- Konuşmacı segmentlerini ve zaman aralıklarını saklar.
- Belirsiz konuşmacı eşleşmelerini kullanıcı onayına sunar.
- Mistral structured output ile tutarlı JSON üretir.
- Türkçe yazım kurallarına uygun yönetici raporu, kararlar, riskler ve aksiyonlar oluşturur.

### ✅ Aksiyon ve Görev Yönetimi

- AI aksiyonlarını ve toplantı yöneticisinin elle atadığı görevleri listeler.
- Sorumlu kullanıcı, öncelik ve termin tarihi tanımlar.
- Kullanıcıların kendilerine atanan işleri tamamlamasını sağlar.
- Global Manager tüm toplantıları ve aksiyonları görebilir.

### 👥 Katılımcı ve Yetki Yönetimi

- Yalnızca sistemde kayıtlı kullanıcılar toplantıya eklenebilir.
- Toplantı oluşturucusu katılımcıya toplantı içi yönetim yetkisi verebilir.
- Yetkili katılımcılar kayıt, not, konuşmacı ve aksiyon işlemlerini yönetebilir.
- Başka kullanıcıları çıkarma yetkisi yalnızca toplantı yöneticisi veya Global Manager’dadır.

### ✉️ Rapor E-posta Gönderimi

Hazır toplantı özeti ve aksiyon listesi SMTP üzerinden katılımcılara gönderilebilir.

---

## 🖼️ Uygulama Görselleri

Gerçek ekran görüntülerini daha sonra \`docs/screenshots\` klasörüne ekleyebilirsin.

| Ekran | Dosya |
|---|---|
| Dashboard | \`docs/screenshots/dashboard.png\` |
| Giriş | \`docs/screenshots/login.png\` |
| Toplantı listesi | \`docs/screenshots/meetings.png\` |
| Canlı toplantı odası | \`docs/screenshots/meeting-room.png\` |
| Toplantı detayı ve AI raporu | \`docs/screenshots/meeting-detail.png\` |
| Aksiyonlarım | \`docs/screenshots/my-actions.png\` |

\`\`\`markdown
![Meeting dashboard](docs/screenshots/dashboard.png)
![Canlı toplantı odası](docs/screenshots/meeting-room.png)
\`\`\`

---

## 🛠️ Teknoloji Yığını

### Frontend

- React 19 + TypeScript strict mode
- Vite 8 ve lazy-loaded route parçaları
- Material UI 9 ve Meeting mor–indigo/mercan tema sistemi
- TanStack React Query v5 + Axios
- React Hook Form + Zod
- Microsoft SignalR client
- Web Audio API: \`useAudioRecorder\`, \`useAudioVisualizer\`

### Backend

- .NET 8 Web API
- Clean Architecture
- CQRS + MediatR
- FluentValidation pipeline behavior
- Result pattern ve merkezi hata yönetimi
- ASP.NET Core Identity
- HttpOnly cookie tabanlı JWT kimlik doğrulama
- PostgreSQL + Entity Framework Core
- RabbitMQ tabanlı arka plan işleme
- SignalR toplantı durum hub’ı
- MailKit SMTP adapter’ı

### AI ve Ses İşleme

- Mistral AI structured output
- Özetleme modeli: \`ministral-3b-2512\`
- Transkripsiyon modeli: \`voxtral-mini-latest\`
- Konuşmacı diarization desteği
- Türkçe raporlama ve aksiyon çıkarımı

---

## 🏗️ Mimari Yapı

\`\`\`text
Meeting
├── src
│   ├── SmartMeeting.Domain          # Entity, enum, domain rule ve domain event
│   ├── SmartMeeting.Application     # CQRS, MediatR, validation ve abstraction'lar
│   ├── SmartMeeting.Persistence     # PostgreSQL, EF Core, Identity ve migration'lar
│   ├── SmartMeeting.Infrastructure  # Mistral, Voxtral, RabbitMQ, SMTP ve storage
│   └── SmartMeeting.Api             # Controller, middleware, SignalR ve DI
├── web                              # React 19 + TypeScript + Vite
├── tests                            # Domain, application, infrastructure ve API testleri
└── docs/screenshots                 # Uygulama ekran görüntüleri
\`\`\`

Bağımlılıklar iç katmanlara doğru akar. Domain katmanı EF Core veya harici servisleri bilmez. Application use-case’leri ve abstraction’ları barındırır. Infrastructure ve Persistence bu abstraction’ların implementasyonlarını sağlar. API yalnızca HTTP, middleware, SignalR ve dependency injection sorumluluklarını taşır.

## 🔄 Uçtan Uca İşleyiş

\`\`\`mermaid
sequenceDiagram
    actor User as Kullanıcı
    participant UI as React UI
    participant API as .NET API
    participant DB as PostgreSQL
    participant MQ as RabbitMQ
    participant Worker as Processing Worker
    participant STT as Voxtral STT
    participant AI as Mistral AI
    participant Hub as SignalR

    User->>UI: Kaydı başlat
    UI->>API: POST recording/start
    API->>DB: Meeting = Recording
    API-->>Hub: Durum değişikliği
    Hub-->>UI: Recording

    User->>UI: Kaydı durdur ve gönder
    UI->>API: POST audio
    API->>DB: Meeting = Processing
    API->>MQ: İşleme mesajı
    Worker->>MQ: Mesajı tüket
    Worker->>STT: Ses dosyasını gönder
    STT-->>Worker: Transkript ve speaker segmentleri
    Worker->>AI: Structured summary isteği
    AI-->>Worker: Rapor, kararlar ve aksiyonlar
    Worker->>DB: Transcript + Summary + Ready
    Worker-->>Hub: Ready veya Failed
    Hub-->>UI: Toplantı detayını yenile
\`\`\`

## 🧩 Katmanlar Arası Veri Akışı

\`\`\`mermaid
flowchart LR
    Browser[React 19] -->|Axios + HttpOnly Cookie| API[SmartMeeting.Api]
    API --> Application[Application CQRS]
    Application --> Domain[Domain Rules]
    Application --> Persistence[Persistence Abstractions]
    Persistence --> Postgres[(PostgreSQL)]
    Application --> Queue[IMeetingProcessingQueue]
    Queue --> Rabbit[(RabbitMQ)]
    Rabbit --> Worker[Background Worker]
    Worker --> Storage[(Audio Storage)]
    Worker --> Voxtral[Voxtral STT]
    Worker --> Mistral[Mistral AI]
    Worker --> Postgres
    Worker --> SignalR[SignalR Hub]
    SignalR --> Browser
\`\`\`

---

## 👥 Roller ve Yetkiler

| Rol | Yetkiler |
|---|---|
| Normal kullanıcı | Kendisine açık toplantıları ve atanan aksiyonları görür; kendi aksiyonlarını tamamlar. |
| Toplantı yöneticisi | Toplantı oluşturur, katılımcı ekler, toplantı içi yetki verir ve toplantıyı yönetir. |
| Global Manager | Tüm toplantıları ve aksiyonları görür; tüm toplantılarda yönetim yetkisine sahiptir. |

Kimlik doğrulama JWT’nin HttpOnly cookie içinde taşınmasıyla yapılır. Frontend token içeriğine erişmez ve token’ı localStorage’a yazmaz.

---

## 🚀 Kurulum

### Gereksinimler

- .NET SDK 8+
- Node.js 20+ ve npm
- Docker Desktop
- PostgreSQL 16 container
- RabbitMQ 4 container
- Mistral API anahtarı

### 1. Repository’yi hazırla

\`\`\`powershell
git clone https://github.com/melihesensio99/smartmeeting.git
cd smartmeeting
\`\`\`

### 2. PostgreSQL ve RabbitMQ’yu başlat

\`\`\`powershell
docker volume create smartmeeting-postgres-data
docker volume create smartmeeting-rabbitmq-data
docker compose up -d postgres rabbitmq
docker compose ps
\`\`\`

Servisler: PostgreSQL \`localhost:5432\`, RabbitMQ \`localhost:5672\`, RabbitMQ Management UI \`http://localhost:15672\`.

### 3. Secret’ları User Secrets ile tanımla

\`\`\`powershell
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=smartmeeting;Username=smartmeeting;Password=<POSTGRES_PASSWORD>" --project src/SmartMeeting.Api
dotnet user-secrets set "RabbitMq:Password" "<RABBITMQ_PASSWORD>" --project src/SmartMeeting.Api
dotnet user-secrets set "Mistral:ApiKey" "<MISTRAL_API_KEY>" --project src/SmartMeeting.Api
dotnet user-secrets set "Authentication:SigningKey" "<AT_LEAST_32_CHARACTER_SECRET>" --project src/SmartMeeting.Api
\`\`\`

### 4. API ve frontend’i çalıştır

\`\`\`powershell
dotnet run --project src/SmartMeeting.Api --urls http://localhost:5080
\`\`\`

Yeni bir terminalde:

\`\`\`powershell
cd web
npm install
npm run dev
\`\`\`

API \`http://localhost:5080\`, frontend \`http://localhost:5173\` adresinde çalışır.

---

## 📧 SMTP Yapılandırması

Gmail ile gönderim için normal hesap şifresi yerine App Password kullanılmalıdır:

\`\`\`powershell
dotnet user-secrets set "Email:Enabled" "true" --project src/SmartMeeting.Api
dotnet user-secrets set "Email:Username" "<SMTP_USERNAME>" --project src/SmartMeeting.Api
dotnet user-secrets set "Email:Password" "<GMAIL_APP_PASSWORD>" --project src/SmartMeeting.Api
dotnet user-secrets set "Email:FromAddress" "<FROM_ADDRESS>" --project src/SmartMeeting.Api
\`\`\`

---

## 🧪 Testler

Backend:

\`\`\`powershell
dotnet test SmartMeeting.slnx --no-restore
\`\`\`

Frontend:

\`\`\`powershell
cd web
npm run lint
npm run test -- --run
npm run build
\`\`\`

Test kapsamı; domain kuralları, CQRS handler’ları, validation, kimlik ve yetki, katılımcı işlemleri, RabbitMQ worker, Mistral sözleşmeleri, SMTP akışı, API entegrasyonları ve React bileşenlerini içerir.

---

## 📡 Önemli API Akışları

\`\`\`text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

GET  /api/meetings
POST /api/meetings
GET  /api/meetings/{meetingId}

POST /api/meetings/{meetingId}/recording/start
POST /api/meetings/{meetingId}/audio
POST /api/meetings/{meetingId}/processing/retry

POST /api/meetings/{meetingId}/participants
PUT  /api/meetings/{meetingId}/participants/{participantId}/management-permission
DELETE /api/meetings/{meetingId}/participants/me

POST /api/meetings/{meetingId}/action-items
PUT  /api/meetings/{meetingId}/action-items/{actionItemId}
POST /api/meetings/{meetingId}/action-items/{actionItemId}/complete
\`\`\`

SignalR hub: \`/hubs/meeting-status\`

Toplantı durumları: \`Scheduled → Recording → Processing → Ready\` ve hata durumunda \`Failed → Retry\`.

---

## 🔐 Güvenlik ve Depolama

- JWT yalnızca HttpOnly cookie içinde taşınır.
- Production ortamında HTTPS ve Secure cookie zorunludur.
- API key, SMTP App Password, JWT signing key ve veritabanı parolası kaynak koda eklenmez.
- Ses dosyaları geliştirmede \`data/audio/yyyy.MM.dd/\` altında tutulur.
- \`IAudioStorage\` abstraction’ı S3 veya Azure Blob adapter’ına geçişe izin verir.
- Uzun süren STT ve AI işlemleri RabbitMQ worker üzerinden yürütülür.

## 📄 Lisans

Bu repository kişisel ve kurumsal geliştirme amacıyla hazırlanmıştır. Lisans koşulları ayrıca belirtilmedikçe tüm hakları saklıdır.
