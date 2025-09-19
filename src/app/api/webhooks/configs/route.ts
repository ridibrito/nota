import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Buscar primeira empresa (assumindo single-tenant)
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id')
      .limit(1)
      .single();

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    const { data: configs, error } = await supabaseAdmin
      .from('webhook_configs')
      .select('*')
      .eq('company_id', company.id)
      .order('source');

    if (error) {
      console.error('Erro ao buscar configurações de webhook:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar configurações' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: configs || []
    });

  } catch (error) {
    console.error('Erro na API de configurações:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, auto_issue, auto_process, default_service_code, default_iss_rate, default_rps_series, active } = body;

    const supabaseAdmin = getSupabaseAdmin();

    // Buscar primeira empresa (assumindo single-tenant)
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id')
      .limit(1)
      .single();

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    const configData = {
      company_id: company.id,
      source,
      auto_issue: auto_issue || false,
      auto_process: auto_process || false,
      default_service_code: default_service_code || '01.05',
      default_iss_rate: default_iss_rate || 0.02,
      default_rps_series: default_rps_series || source.toUpperCase(),
      active: active !== undefined ? active : true
    };

    const { data: config, error } = await supabaseAdmin
      .from('webhook_configs')
      .upsert(configData, { onConflict: 'company_id,source' })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar configuração de webhook:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar configuração' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Erro na API de configurações:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
