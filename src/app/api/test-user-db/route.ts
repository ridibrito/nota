import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    // Testar conexão com a tabela user_profiles
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, email, name, role, created_at, updated_at')
      .limit(5);

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao acessar tabela user_profiles',
        details: error.message,
        code: error.code
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Conexão com user_profiles funcionando',
      data: {
        users_found: users.length,
        users: users
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro de conexão com Supabase',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, userId, testPassword } = await req.json();
    const supabase = getSupabaseAdmin();

    if (action === 'check_user') {
      // Verificar se usuário específico existe
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('id, email, name, password_hash')
        .eq('id', userId || '12345678-1234-1234-1234-123456789abc')
        .single();

      if (error) {
        return NextResponse.json({
          success: false,
          error: 'Usuário não encontrado',
          details: error.message
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Usuário encontrado',
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          has_password: !!user.password_hash,
          password_hash_preview: user.password_hash ? user.password_hash.substring(0, 20) + '...' : null
        }
      });
    }

    if (action === 'set_test_password') {
      // Definir uma senha de teste para o usuário
      const bcrypt = require('bcryptjs');
      const testPasswordHash = await bcrypt.hash(testPassword || 'senha123', 12);

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          password_hash: testPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId || '12345678-1234-1234-1234-123456789abc')
        .select()
        .single();

      if (error) {
        return NextResponse.json({
          success: false,
          error: 'Erro ao definir senha',
          details: error.message
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Senha de teste definida',
        data: {
          user_id: data.id,
          test_password: testPassword || 'senha123',
          updated_at: data.updated_at
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Ação não reconhecida'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
