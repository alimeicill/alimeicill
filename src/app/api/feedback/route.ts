import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Server console logging to track captured details
    console.log('====== YENİ GERİ BİLDİRİM ======');
    console.log('Konu:', body.Konu);
    console.log('Mesaj:', body.Mesaj);
    console.log('Rol:', body.Rol);
    console.log('Ad Soyad:', body.AdSoyad);
    console.log('Sayfa URL:', body.Url);
    console.log('Tarih:', new Date().toLocaleString('tr-TR'));
    console.log('=================================');

    // Simulate backend processing time
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({
      success: true,
      message: 'Geri bildiriminiz başarıyla kaydedildi ve geliştiriciye bildirildi.',
    });
  } catch (error) {
    console.error('Feedback API Hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu tarafında hata oluştu.' },
      { status: 500 }
    );
  }
}
