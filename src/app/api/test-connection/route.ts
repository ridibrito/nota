import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Testa se as variáveis estão configuradas
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({
        success: false,
        error: 'Variáveis de ambiente não configuradas',
        details: {
          url: !!url,
          serviceKey: !!serviceKey
        }
      });
    }

    // Testa conexão com Supabase
    const supabaseAdmin = getSupabaseAdmin();
    
    // Faz uma query simples para testar a conexão
    const { data, error } = await (supabaseAdmin as any)
      .from('companies')
      .select('count(*)')
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao conectar com Supabase',
        details: error.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Conexão com Supabase funcionando!',
      data: {
        url,
        companies_count: data?.count || 0
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
