import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const source = searchParams.get('source');
    const status = searchParams.get('status');

    const supabaseAdmin = getSupabaseAdmin();

    let query = supabaseAdmin
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (source) {
      query = query.eq('source', source);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Erro ao buscar logs de webhook:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar logs' },
        { status: 500 }
      );
    }

    // Contar total de logs
    let countQuery = supabaseAdmin
      .from('webhook_logs')
      .select('*', { count: 'exact', head: true });

    if (source) {
      countQuery = countQuery.eq('source', source);
    }
    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      data: logs || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Erro na API de logs:', error);
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
