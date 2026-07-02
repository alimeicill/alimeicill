import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Configure nodemailer transporter with Gmail SMTP and explicit port/timeout
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // false for TLS (port 587), true for SSL (port 465)
      auth: {
        user: 'alimeicil@gmail.com',
        pass: 'kvjyupqexigedeqg', // Gmail App Password
      },
      connectionTimeout: 5000, // 5 seconds connection timeout
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });

    const mailOptions = {
      from: '"ApartmanYönet Sistem Geribildirim" <alimeicil@gmail.com>',
      to: 'alimeicil@gmail.com',
      subject: `[${body.Konu}] ${body.AdSoyad}`,
      text: `
ApartmanYönet Sistem Geri Bildirimi

Gönderen: ${body.AdSoyad}
Rol: ${body.Rol}
Sayfa URL: ${body.Url}
Tarih: ${new Date().toLocaleString('tr-TR')}

Açıklama / Mesaj:
---------------------------------------------
${body.Mesaj}
---------------------------------------------
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 20px;">Yeni Geri Bildirim Alındı</h2>
            <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">ApartmanYönet Yönetim Paneli</p>
          </div>
          <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #64748b;">Gönderen:</td>
                <td style="padding: 8px 0;">${body.AdSoyad}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Kullanıcı Rolü:</td>
                <td style="padding: 8px 0;"><span style="background: #f1f5f9; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; color: #475569;">${body.Rol}</span></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Tür / Konu:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #ef4444;">${body.Konu}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Sayfa Adresi:</td>
                <td style="padding: 8px 0;"><a href="${body.Url}" style="color: #6366f1; text-decoration: none;">${body.Url}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Tarih:</td>
                <td style="padding: 8px 0;">${new Date().toLocaleString('tr-TR')}</td>
              </tr>
            </table>
            
            <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 0 8px 8px 0; margin-top: 10px;">
              <h4 style="margin: 0 0 8px 0; color: #475569;">Mesaj Detayı:</h4>
              <p style="margin: 0; white-space: pre-wrap; font-size: 14px;">${body.Mesaj}</p>
            </div>
          </div>
          <div style="background: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            Bu e-posta ApartmanYönet panelinden otomatik olarak gönderilmiştir.
          </div>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    
    console.log('====== GERİ BİLDİRİM E-POSTASI GÖNDERİLDİ ======');
    console.log('Alıcı: alimeicil@gmail.com');
    console.log('Gönderen:', body.AdSoyad);
    console.log('Konu:', body.Konu);
    console.log('================================================');

    return NextResponse.json({
      success: true,
      message: 'Geri bildiriminiz başarıyla alimeicil@gmail.com adresine iletildi.',
    });
  } catch (error: any) {
    console.error('Feedback API Hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'E-posta gönderimi sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}
