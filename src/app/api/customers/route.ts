import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('=== CRIANDO NOVO CLIENTE ===');
    console.log('Dados recebidos:', body);

    const {
      company_id,
      name,
      cpf_cnpj,
      email,
      address
    } = body;

    // Validações básicas
    if (!company_id || !name || !cpf_cnpj || !email) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios faltando (company_id, name, cpf_cnpj, email)' },
        { status: 400 }
      );
    }

    // Validar CPF/CNPJ
    const numbers = cpf_cnpj.replace(/\D/g, '');
    if (numbers.length !== 11 && numbers.length !== 14) {
      return NextResponse.json(
        { success: false, error: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verificar se empresa existe
    const { data: company, error: companyError } = await (supabaseAdmin as any)
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      console.error('Empresa não encontrada:', companyError);
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já existe cliente com mesmo email ou CPF/CNPJ
    const { data: existingCustomer } = await (supabaseAdmin as any)
      .from('customers')
      .select('id, name, email, cpf_cnpj')
      .eq('company_id', company_id)
      .or(`email.eq.${email.toLowerCase()},cpf_cnpj.eq.${numbers}`)
      .single();

    if (existingCustomer) {
      const duplicateField = existingCustomer.email === email.toLowerCase() ? 'email' : 'CPF/CNPJ';
      return NextResponse.json(
        { success: false, error: `Já existe um cliente com este ${duplicateField}` },
        { status: 400 }
      );
    }

    // Preparar dados do cliente
    const customerData = {
      company_id,
      name: name.trim(),
      cpf_cnpj: numbers,
      email: email.trim().toLowerCase(),
      address: address && (address.street || address.city) ? {
        street: address.street || '',
        number: address.number || '',
        complement: address.complement || '',
        neighborhood: address.neighborhood || '',
        city: address.city || '',
        state: address.state || 'DF',
        zip_code: address.zip_code || '',
        phone: address.phone || ''
      } : null
    };

    console.log('Dados preparados:', customerData);

    // Criar cliente
    const { data: newCustomer, error: createError } = await (supabaseAdmin as any)
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar cliente:', createError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar cliente no banco de dados' },
        { status: 500 }
      );
    }

    console.log('Cliente criado com sucesso:', newCustomer.id);

    return NextResponse.json({
      success: true,
      message: 'Cliente criado com sucesso',
      data: newCustomer
    });

  } catch (error) {
    console.error('Erro na API de criação de cliente:', error);
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

// Endpoint para listar clientes (GET)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    let query = (supabaseAdmin as any)
      .from('customers')
      .select('*')
      .eq('company_id', companyId);

    if (search) {
      query = query.or(`name.ilike.%${search}%,cpf_cnpj.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query
      .order('name')
      .range(offset, offset + limit - 1);

    const { data: customers, error } = await query;

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar clientes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customers || [],
      total: customers?.length || 0
    });

  } catch (error) {
    console.error('Erro na API de listagem de clientes:', error);
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
