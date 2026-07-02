using System;
using System.IO;
using System.Threading.Tasks;

namespace ApartmentManagement.Backend.Services
{
    public class Receipt
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string InvoiceId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime ReceiptDate { get; set; } = DateTime.Now;
        public string PdfUrl { get; set; } = string.Empty;
    }

    public interface IReceiptService
    {
        Task<Receipt> GenerateReceiptAsync(string invoiceId, decimal amount);
        Task<byte[]> ExportReceiptPdfBytesAsync(string receiptId);
    }

    public class ReceiptService : IReceiptService
    {
        public ReceiptService()
        {
        }

        // ==========================================
        // 1. Resmi Tahsilat Makbuzu Kaydı ve PDF Oluşturma
        // ==========================================
        public async Task<Receipt> GenerateReceiptAsync(string invoiceId, decimal amount)
        {
            string receiptId = $"RE-{DateTime.Now.Year}-{new Random().Next(100000, 999999)}";
            string mockPdfUrl = $"/receipts/{receiptId}.pdf";

            var receipt = new Receipt
            {
                Id = receiptId,
                InvoiceId = invoiceId,
                Amount = amount,
                ReceiptDate = DateTime.Now,
                PdfUrl = mockPdfUrl
            };

            // Veritabanına kaydetme simülasyonu
            // _dbContext.Receipts.Add(receipt);
            // _dbContext.SaveChanges();

            Console.WriteLine($"Resmi Makbuz Üretildi: No={receiptId}, FaturaId={invoiceId}, Tutar={amount:F2} TL");
            return await Task.FromResult(receipt);
        }

        // ==========================================
        // 2. Makbuz PDF Byte Dizisi Çıktısı (Yazdırma/İndirme)
        // ==========================================
        public async Task<byte[]> ExportReceiptPdfBytesAsync(string receiptId)
        {
            // PDF dosyasını iTextSharp veya QuestPDF ile oluşturma simülasyonu
            using (var ms = new MemoryStream())
            {
                using (var sw = new StreamWriter(ms))
                {
                    await sw.WriteLineAsync($"ApartmanYönet Resmi Tahsilat Makbuzu");
                    await sw.WriteLineAsync($"Makbuz Seri No: {receiptId}");
                    await sw.WriteLineAsync($"Tarih: {DateTime.Now:dd.MM.yyyy HH:mm}");
                    await sw.WriteLineAsync($"Tutar: {new Random().Next(500, 2500)} TL");
                    await sw.WriteLineAsync($"Açıklama: Daire Aidat Ödemesi");
                    await sw.WriteLineAsync($"Yıldız Konakları Site Yönetimi");
                    await sw.FlushAsync();
                }
                return ms.ToArray();
            }
        }
    }
}
