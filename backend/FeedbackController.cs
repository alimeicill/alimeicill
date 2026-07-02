using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ApartmentManagement.Backend.Models;
using ApartmentManagement.Backend.Services;

namespace ApartmentManagement.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;

        public FeedbackController(IFeedbackService feedbackService)
        {
            _feedbackService = feedbackService;
        }

        // ==========================================
        // Global Geri Bildirim Kaydetme ve Bildirim Tetikleme
        // ==========================================
        [HttpPost]
        public async Task<IActionResult> CreateFeedback([FromBody] CreateFeedbackDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Mesaj))
            {
                return BadRequest(new { Success = false, Message = "Geri bildirim mesajı boş olamaz." });
            }

            var feedback = new GeriBildirim
            {
                Konu = dto.Konu,
                Mesaj = dto.Mesaj,
                Rol = string.IsNullOrWhiteSpace(dto.Rol) ? "Bilinmeyen Rol" : dto.Rol,
                AdSoyad = string.IsNullOrWhiteSpace(dto.AdSoyad) ? "Anonim Sakin" : dto.AdSoyad,
                Url = string.IsNullOrWhiteSpace(dto.Url) ? "Belirtilmemiş URL" : dto.Url,
                Tarih = DateTime.Now,
                Durum = "Yeni"
            };

            var result = await _feedbackService.SaveFeedbackAsync(feedback);

            if (result)
            {
                return Ok(new { Success = true, Message = "Geri bildiriminiz başarıyla kaydedildi ve geliştiriciye bildirildi." });
            }

            return StatusCode(500, new { Success = false, Message = "Geri bildirim kaydedilirken sunucu tarafında bir hata oluştu." });
        }
    }
}
