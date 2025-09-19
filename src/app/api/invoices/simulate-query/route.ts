import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { companyId, startDate, endDate } = await req.json();
    
    console.log('=== SIMULAÇÃO DE CONSULTA ISSNET ===');
    console.log('Parâmetros:', { companyId, startDate, endDate });

    // Simular notas fiscais reais que poderiam vir do ISSNet DF
    const simulatedInvoices = [
      {
        id: 'issnet-000001',
        rps_number: '000001',
        rps_series: 'UNICA',
        nfse_number: '2025000000001',
        nfse_verification_code: 'ABC123DEF456',
        amount: 1500.00,
        deductions: 0,
        iss_value: 75.00,
        description: 'Desenvolvimento de sistema web personalizado',
        status: 'issued',
        competence_date: '2025-09-15',
        created_at: '2025-09-15T10:30:00Z',
        updated_at: '2025-09-15T10:30:00Z',
        company_id: companyId,
        customer_id: 'issnet-customer-001',
        service_code: '01.05',
        iss_rate: 0.05,
        customers: {
          id: 'issnet-customer-001',
          name: 'João Silva Consultoria ME',
          cpf_cnpj: '12.345.678/0001-90'
        }
      },
      {
        id: 'issnet-000002',
        rps_number: '000002',
        rps_series: 'UNICA',
        nfse_number: '2025000000002',
        nfse_verification_code: 'DEF456GHI789',
        amount: 2800.00,
        deductions: 0,
        iss_value: 140.00,
        description: 'Consultoria em tecnologia da informação',
        status: 'issued',
        competence_date: '2025-09-10',
        created_at: '2025-09-10T14:20:00Z',
        updated_at: '2025-09-10T14:20:00Z',
        company_id: companyId,
        customer_id: 'issnet-customer-002',
        service_code: '01.05',
        iss_rate: 0.05,
        customers: {
          id: 'issnet-customer-002',
          name: 'Maria Santos',
          cpf_cnpj: '987.654.321-00'
        }
      },
      {
        id: 'issnet-000003',
        rps_number: '000003',
        rps_series: 'HOTMART',
        nfse_number: '2025000000003',
        nfse_verification_code: 'GHI789JKL012',
        amount: 497.00,
        deductions: 0,
        iss_value: 24.85,
        description: 'Venda digital - Curso Online (Pedido: HM123456)',
        status: 'issued',
        competence_date: '2025-09-05',
        created_at: '2025-09-05T09:15:00Z',
        updated_at: '2025-09-05T09:15:00Z',
        company_id: companyId,
        customer_id: 'issnet-customer-003',
        service_code: '01.05',
        iss_rate: 0.05,
        customers: {
          id: 'issnet-customer-003',
          name: 'Pedro Oliveira',
          cpf_cnpj: '456.789.123-45'
        }
      }
    ];

    // Filtrar por período se especificado
    const filteredInvoices = simulatedInvoices.filter(invoice => {
      if (startDate && endDate) {
        const invoiceDate = new Date(invoice.competence_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return invoiceDate >= start && invoiceDate <= end;
      }
      return true;
    });

    console.log(`Retornando ${filteredInvoices.length} notas simuladas`);

    return NextResponse.json({
      success: true,
      data: {
        query_type: 'period',
        invoices: filteredInvoices,
        pagination: {
          page: 1,
          limit: 50,
          total: filteredInvoices.length,
          pages: 1
        },
        source: 'simulation' // Indica que são dados simulados
      },
      message: '⚠️ Dados simulados - ISSNet DF indisponível'
    });

  } catch (error) {
    console.error('Erro na simulação:', error);
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
