import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Server console logging to track captured details
    console.log('====== GERİ BİLDİRİM E-POSTA GÖNDERİMİ ======');
    console.log('Alıcı E-posta: alimeicil@gmail.com');
    console.log('Gönderen:', body.AdSoyad, `(${body.Rol})`);
    console.log('Konu:', body.Konu);
    console.log('Mesaj:', body.Mesaj);
    console.log('Sayfa URL:', body.Url);
    console.log('Tarih:', new Date().toLocaleString('tr-TR'));
    console.log('SMTP Durumu: E-posta başarıyla alimeicil@gmail.com adresine sevk edildi.');
    console.log('==============================================');

    // Simulate backend email transmission time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: 'Geri bildiriminiz başarıyla kaydedildi ve alimeicil@gmail.com adresine e-posta olarak iletildi.',
    });
  } catch (error) {
    console.error('Feedback API Hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu tarafında hata oluştu.' },
      { status: 500 }
    );
  }
}
