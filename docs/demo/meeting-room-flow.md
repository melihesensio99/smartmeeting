# İki Kullanıcılı Toplantı Odası Akışı

Bu doküman, yerel ortamda toplantı odasının uçtan uca doğrulanması için kullanılacak kısa senaryodur.

## Hesaplar

- Toplantı oluşturucu: `MeetingCreator` yetkisine sahip kayıtlı kullanıcı
- Katılımcı: Toplantı sahibi tarafından toplantıya eklenmiş kayıtlı kullanıcı

## Senaryo

1. Birinci tarayıcıda oluşturucu hesapla giriş yapın.
2. Yeni bir toplantı oluşturun.
3. Toplantı detayında katılımcıyı e-posta ile arayıp ekleyin.
4. İkinci tarayıcıda katılımcı hesapla giriş yapın.
5. Aynı toplantı detayını açın.
6. Birinci tarayıcıda **Odaya gir** seçeneğine basın.
7. İkinci tarayıcıda **Odaya gir** seçeneğine basın.
8. Her iki ekranda da aktif katılımcı sayısının ve kullanıcı adlarının güncellendiğini doğrulayın.
9. Kamera başlangıçta kapalı kalır. **Kamerayı aç** seçeneği yalnızca görüntülü görüşme istenirse kullanılmalıdır.
10. Bir tarayıcıda **Odadan çık** seçeneğine basın; diğer tarayıcıda katılımcının listeden kaldırıldığını doğrulayın.

## Beklenen sonuç

- Yetkisiz kullanıcı toplantı detayına erişemez.
- Toplantı sahibi kayıtlı kullanıcı ekleyebilir.
- Oda presence listesi giriş ve çıkışlarda SignalR ile güncellenir.
- WebRTC ses bağlantısı kamera kapalı başlatılabilir.
- Kamera izni verilmeden kamera track’i oluşturulmaz.
