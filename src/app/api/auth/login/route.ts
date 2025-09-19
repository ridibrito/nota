import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    console.log('🔐 Tentativa de login:', { email, timestamp: new Date().toISOString() });

    // Validações básicas
    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Senha é obrigatória' },
        { status: 400 }
      );
    }

    try {
      const supabase = getSupabaseAdmin();
      
      // Buscar usuário por email
      console.log('🔍 Buscando usuário por email:', email);
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('id, email, name, role, company_id, password_hash')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (userError || !user) {
        console.log('❌ Usuário não encontrado:', userError?.message);
        return NextResponse.json(
          { success: false, error: 'Credenciais inválidas' },
          { status: 401 }
        );
      }

      console.log('👤 Usuário encontrado:', { id: user.id, email: user.email, name: user.name });

      // Se não tem senha cadastrada, permitir qualquer senha (para desenvolvimento)
      if (!user.password_hash) {
        console.log('⚠️ Usuário sem senha cadastrada - permitindo acesso para desenvolvimento');
      } else {
        // Verificar senha
        console.log('🔐 Verificando senha...');
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          console.log('❌ Senha incorreta');
          return NextResponse.json(
            { success: false, error: 'Credenciais inválidas' },
            { status: 401 }
          );
        }
        console.log('✅ Senha correta');
      }

      // Buscar dados da empresa se tiver company_id
      let company = null;
      if (user.company_id) {
        console.log('🏢 Buscando dados da empresa:', user.company_id);
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', user.company_id)
          .single();
        
        if (companyData) {
          company = companyData;
          console.log('🏢 Empresa encontrada:', company.name);
        }
      }

      // Login bem-sucedido
      console.log('✅ Login realizado com sucesso!');
      
      return NextResponse.json({
        success: true,
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        company: company
      });

    } catch (supabaseError) {
      console.error('❌ Erro no Supabase:', supabaseError);
      
      // Fallback: permitir login com credenciais específicas para desenvolvimento
      if (email === 'usuario@teste.com' && password === 'senha123') {
        console.log('🔧 Usando fallback de desenvolvimento');
        return NextResponse.json({
          success: true,
          message: 'Login de desenvolvimento',
          user: {
            id: '12345678-1234-1234-1234-123456789abc',
            email: 'usuario@teste.com',
            name: 'Usuário Teste',
            role: 'admin'
          },
          company: {
            id: 'e8281131-097c-49c4-ab97-078a8c7f4e65',
            name: 'Alb Soluções e serviços LTDA',
            environment: 'homolog'
          }
        });
      }

      return NextResponse.json(
        { success: false, error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erro geral no login:', error);
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
