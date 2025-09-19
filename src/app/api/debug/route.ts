import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Verifica variáveis de ambiente
    const envCheck = {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    };

    // Testa conexão com Supabase
    const supabaseAdmin = getSupabaseAdmin();
    
    // Lista todas as tabelas para verificar se as migrations rodaram
    const { data: tables, error: tablesError } = await (supabaseAdmin as any)
      .rpc('list_tables');

    if (tablesError) {
      // Se não tem a função, tenta listar companies diretamente
      const { data: companies, error: companiesError } = await (supabaseAdmin as any)
        .from('companies')
        .select('count(*)')
        .single();

      if (companiesError) {
        return NextResponse.json({
          success: false,
          error: 'Tabelas não encontradas - migrations não foram executadas',
          details: {
            env: envCheck,
            supabaseError: companiesError.message
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Conexão OK - Tabela companies existe',
        data: {
          env: envCheck,
          companies_count: companies?.count || 0
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Conexão OK',
      data: {
        env: envCheck,
        tables: tables || []
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao conectar com Supabase',
      details: {
        message: error instanceof Error ? error.message : String(error),
        env: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }
    });
  }
}
