using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using ApartmentManagement.Backend.Models;

namespace ApartmentManagement.Backend.Services
{
    public interface ISmsService
    {
        // Tekil SMS gönderim servisi
        Task<bool> SendSmsAsync(string phoneNumber, string message, string smsType, string? personId = null);
    }

    public class SmsService : ISmsService
    {
        private readonly HttpClient _httpClient;
        // private readonly ApplicationDbContext _dbContext; // Entity Framework DbContext (EF Core kullanan projeler için)

        public SmsService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<bool> SendSmsAsync(string phoneNumber, string message, string smsType, string? personId = null)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber) || string.IsNullOrWhiteSpace(message))
            {
                return false;
            }

            var isSuccess = false;
            try
            {
                // Örnek Üçüncü Taraf SMS Sağlayıcı API Bilgileri (örn. Netgsm / Mutlucell vb.)
                var requestUrl = "https://api.smsprovider.com/v1/send";
                var payload = new
                {
                    username = "apartmanyonet_api",
                    password = "SecurePassword123",
                    header = "APARTYONET",
                    number = phoneNumber.Replace(" ", "").Replace("+", ""),
                    message = message
                };

                var jsonPayload = JsonSerializer.Serialize(payload);
                var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                // API İsteği Gönderimi (HTTP POST)
                var response = await _httpClient.PostAsync(requestUrl, requestContent);
                isSuccess = response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                // Hata loglama
                Console.WriteLine($"SMS gönderim hatası: {ex.Message}");
                isSuccess = false;
            }

            // ==========================================
            // Loglama (Veritabanına Kayıt)
            // ==========================================
            try
            {
                var log = new SmsLog
                {
                    KisiId = personId,
                    SmsTipi = smsType,
                    TelefonNo = phoneNumber,
                    MesajMetni = message,
                    GonderimTarihi = DateTime.Now,
                    Durum = isSuccess ? "Basarili" : "Basarisiz"
                };

                // Örnek Db kaydı (EF Core kullanan projeler için aktifleştirilebilir)
                // await _dbContext.SmsLoglari.AddAsync(log);
                // await _dbContext.SaveChangesAsync();

                Console.WriteLine($"SMS Log Kaydedildi: Alıcı={phoneNumber}, Tip={smsType}, Durum={(isSuccess ? "Başarılı" : "Başarısız")}");
            }
            catch (Exception dbEx)
            {
                Console.WriteLine($"SMS loglama veritabanı hatası: {dbEx.Message}");
            }

            return isSuccess;
        }
    }
}
