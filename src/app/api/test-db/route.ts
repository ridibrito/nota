import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Teste simples sem usar Supabase admin
    const envCheck = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'não configurado',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasCertKey: !!process.env.CERT_ENCRYPTION_KEY
    };

    return NextResponse.json({
      success: true,
      message: 'Variáveis de ambiente carregadas',
      data: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
