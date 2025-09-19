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

    // Para desenvolvimento, usar o UUID do usuário teste criado
    const userIdToUpdate = userId || '12345678-1234-1234-1234-123456789abc';

    console.log('🔄 Iniciando atualização de perfil:', { 
      name, 
      email, 
      userIdToUpdate,
      timestamp: new Date().toISOString()
    });

    // Tentar atualizar no Supabase (se configurado)
    try {
      const supabase = getSupabaseAdmin();
      console.log('✅ Supabase client criado com sucesso');
      
      // Primeiro, verificar se o usuário existe
      console.log('🔍 Verificando se usuário existe:', userIdToUpdate);
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .eq('id', userIdToUpdate)
        .single();

      if (checkError) {
        console.error('❌ Erro ao verificar usuário:', checkError);
        if (checkError.code === 'PGRST116') {
          return NextResponse.json({
            success: false,
            error: 'Usuário não encontrado',
            details: `Usuário com ID ${userIdToUpdate} não existe na tabela user_profiles`
          }, { status: 404 });
        }
        throw checkError;
      }

      console.log('👤 Usuário encontrado:', existingUser);
      
      // Atualizar o usuário
      console.log('🔄 Atualizando dados do usuário...');
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
        // Se der erro, retornar o erro específico
        console.error('Erro do Supabase na atualização:', error);
        return NextResponse.json({
          success: false,
          error: 'Erro ao atualizar no banco de dados',
          details: error.message,
          code: error.code,
          hint: error.hint
        }, { status: 500 });
      } else {
        // Sucesso no Supabase
        console.log('Perfil atualizado com sucesso no Supabase:', data);
        return NextResponse.json({
          success: true,
          message: 'Perfil atualizado no banco de dados',
          data: data,
          source: 'supabase'
        });
      }
    } catch (supabaseError) {
      // Supabase não configurado, retornar erro
      console.error('Erro de conexão com Supabase:', supabaseError);
      return NextResponse.json({
        success: false,
        error: 'Erro de conexão com o banco de dados',
        details: supabaseError instanceof Error ? supabaseError.message : String(supabaseError),
        fallback_used: true
      }, { status: 500 });
    }

    // Este código nunca deveria ser alcançado agora
    return NextResponse.json({
      success: false,
      error: 'Fluxo inesperado na API',
      message: 'A API não deveria chegar aqui'
    }, { status: 500 });

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
