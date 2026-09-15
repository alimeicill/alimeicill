import { NextResponse } from 'next/server';
import { calculateVat } from '@/lib/services/financeMath';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, rate = 20, inclusive = true } = body;

    if (amount === undefined || isNaN(Number(amount))) {
      return NextResponse.json({ error: 'Geçerli bir tutar girilmelidir.' }, { status: 400 });
    }

    const result = calculateVat(Number(amount), Number(rate), Boolean(inclusive));

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'KDV hesaplama hatası.', details: error.message }, { status: 500 });
  }
}
