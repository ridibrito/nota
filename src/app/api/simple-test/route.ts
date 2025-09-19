import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  console.log('=== TESTE SIMPLES ===');
  
  try {
    const body = await req.json();
    console.log('Body recebido:', body);

    // Teste 1: Verificar se consegue importar o Supabase
    console.log('Teste 1: Importando Supabase...');
    const { getSupabaseAdmin } = await import('@/lib/db/supabase');
    console.log('✅ Import do Supabase OK');

    // Teste 2: Verificar variáveis de ambiente
    console.log('Teste 2: Verificando variáveis...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('SUPABASE_URL:', supabaseUrl ? 'OK' : 'MISSING');
    console.log('SERVICE_KEY:', serviceKey ? 'OK' : 'MISSING');

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Variáveis de ambiente faltando',
        details: { supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey }
      }, { status: 500 });
    }

    // Teste 3: Criar cliente Supabase
    console.log('Teste 3: Criando cliente Supabase...');
    const supabaseAdmin = getSupabaseAdmin();
    console.log('✅ Cliente Supabase criado');

    // Teste 4: Teste simples de conexão
    console.log('Teste 4: Testando conexão...');
    const { data: tables, error: tablesError } = await (supabaseAdmin as any)
      .from('companies')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.error('❌ Erro na consulta:', tablesError);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro de conexão com banco',
        details: tablesError 
      }, { status: 500 });
    }

    console.log('✅ Conexão com banco OK');
    console.log('Empresas encontradas:', tables?.length || 0);

    return NextResponse.json({
      success: true,
      message: 'Todos os testes passaram!',
      data: {
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!serviceKey,
        companiesCount: tables?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
