import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest) {
  try {
    const { name, email, userId } = await req.json();

    // Validações básicas
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Para desenvolvimento, usar um ID fixo se não fornecido
    const userIdToUpdate = userId || 'mock-user-id';

    // Simular atualização no banco de dados
    // Em produção, aqui você atualizaria no Supabase:
    /*
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        name, 
        email,
        updated_at: new Date().toISOString()
      })
      .eq('id', userIdToUpdate)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar no banco de dados' },
        { status: 500 }
      );
    }
    */

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: { 
        id: userIdToUpdate,
        name, 
        email,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
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
