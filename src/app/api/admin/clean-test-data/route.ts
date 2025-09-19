import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log('Iniciando limpeza de dados de teste...');

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Buscar empresa de teste
    const { data: testCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('cnpj', '12345678000190')
      .single();

    if (!testCompany) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma empresa de teste encontrada para limpar'
      });
    }

    console.log('Empresa de teste encontrada:', testCompany.id);

    // 2. Remover invoices de teste
    const { error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .delete()
      .eq('company_id', testCompany.id);

    if (invoicesError) {
      console.error('Erro ao remover invoices:', invoicesError);
    } else {
      console.log('Invoices de teste removidas');
    }

    // 3. Remover clientes de teste
    const { error: customersError } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('company_id', testCompany.id);

    if (customersError) {
      console.error('Erro ao remover clientes:', customersError);
    } else {
      console.log('Clientes de teste removidos');
    }

    // 4. Remover certificados de teste
    const { error: certificatesError } = await supabaseAdmin
      .from('certificates')
      .delete()
      .eq('company_id', testCompany.id);

    if (certificatesError) {
      console.error('Erro ao remover certificados:', certificatesError);
    } else {
      console.log('Certificados de teste removidos');
    }

    // 5. Remover perfis de usuário de teste
    const { error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('company_id', testCompany.id);

    if (profilesError) {
      console.error('Erro ao remover perfis:', profilesError);
    } else {
      console.log('Perfis de teste removidos');
    }

    // 6. Remover empresa de teste
    const { error: companyError } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', testCompany.id);

    if (companyError) {
      console.error('Erro ao remover empresa:', companyError);
    } else {
      console.log('Empresa de teste removida');
    }

    // 7. Verificar limpeza
    const { data: remainingCompanies } = await supabaseAdmin
      .from('companies')
      .select('count(*)', { count: 'exact' });

    const { data: remainingInvoices } = await supabaseAdmin
      .from('invoices')
      .select('count(*)', { count: 'exact' });

    const { data: remainingCustomers } = await supabaseAdmin
      .from('customers')
      .select('count(*)', { count: 'exact' });

    console.log('Limpeza concluída');

    return NextResponse.json({
      success: true,
      message: 'Dados de teste removidos com sucesso',
      data: {
        remaining: {
          companies: remainingCompanies?.[0]?.count || 0,
          invoices: remainingInvoices?.[0]?.count || 0,
          customers: remainingCustomers?.[0]?.count || 0
        }
      }
    });

  } catch (error) {
    console.error('Erro ao limpar dados de teste:', error);
    
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
