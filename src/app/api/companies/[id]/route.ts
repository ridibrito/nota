import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: company, error } = await (supabaseAdmin as any)
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    const updates = await req.json();

    console.log('Atualizando empresa:', { companyId, updates });

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    // Validações básicas
    if (updates.cnpj) {
      const cnpjNumbers = updates.cnpj.replace(/\D/g, '');
      if (cnpjNumbers.length !== 14) {
        return NextResponse.json(
          { success: false, error: 'CNPJ deve ter 14 dígitos' },
          { status: 400 }
        );
      }
    }

    const supabaseAdmin = getSupabaseAdmin();
    
    // Primeiro verifica se a empresa existe
    const { data: existingCompany, error: checkError } = await (supabaseAdmin as any)
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();

    if (checkError) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Atualiza a empresa
    const { data: updatedCompany, error: updateError } = await (supabaseAdmin as any)
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar empresa:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    console.log('Empresa atualizada com sucesso:', updatedCompany);

    return NextResponse.json({
      success: true,
      data: updatedCompany,
      message: 'Empresa atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
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
