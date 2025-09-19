import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest) {
  try {
    const { currentPassword, newPassword, userId } = await req.json();

    // Validações básicas
    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: 'Senha atual é obrigatória' },
        { status: 400 }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        { success: false, error: 'Nova senha é obrigatória' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'A nova senha deve ser diferente da atual' },
        { status: 400 }
      );
    }

    // Para desenvolvimento, usar um ID fixo se não fornecido
    const userIdToUpdate = userId || 'mock-user-id';

    // Simular validação da senha atual
    // Em produção, você validaria com Supabase Auth:
    /*
    const supabase = getSupabaseAdmin();
    
    // Buscar hash da senha atual
    const { data: userData, error: fetchError } = await supabase
      .from('user_profiles')
      .select('password_hash')
      .eq('id', userIdToUpdate)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Senha atual incorreta' },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userIdToUpdate);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar senha no banco de dados' },
        { status: 500 }
      );
    }
    */

    // Simulação de sucesso para desenvolvimento
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso'
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
