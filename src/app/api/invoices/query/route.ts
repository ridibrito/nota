import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createWSLog } from '@/lib/db/supabase';
import { buildConsultarLoteRps, buildConsultarNfse, parseISSNetResponse } from '@/lib/soap/xmlTemplates';
import { createISSNetClient, maskSensitiveData } from '@/lib/soap/issnetClient';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { 
      invoiceId, 
      protocol, 
      nfseNumber, 
      startDate, 
      endDate,
      companyId 
    } = await req.json();

    // Validações básicas
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    // Carrega dados da empresa
    const supabaseAdmin = getSupabaseAdmin();
    const { data: company, error: companyError } = await (supabaseAdmin as any)
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    let xmlConsulta: string;
    let queryType: string;

    // Determina tipo de consulta e constrói XML
    if (protocol) {
      // Consulta por protocolo (lote)
      xmlConsulta = buildConsultarLoteRps({
        company,
        protocol
      });
      queryType = 'protocol';
    } else if (nfseNumber) {
      // Consulta por número da NFS-e
      xmlConsulta = buildConsultarNfse({
        company,
        nfseNumber
      });
      queryType = 'nfse_number';
    } else if (startDate && endDate) {
      // Consulta por período
      xmlConsulta = buildConsultarNfse({
        company,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      queryType = 'period';
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'É necessário informar protocolo, número da NFS-e ou período para consulta' 
        },
        { status: 400 }
      );
    }

    // Para consultas, o ISSNet DF não exige certificado cliente
    // Apenas emissões exigem certificado para assinatura digital
    console.log('Criando cliente ISSNet para consulta (sem certificado cliente)...');
    const client = createISSNetClient(company.environment);

    // Executa consulta apropriada
    let soapResponse: string;
    if (queryType === 'protocol') {
      soapResponse = await client.consultarLoteRps(xmlConsulta);
    } else {
      soapResponse = await client.consultarNfse(xmlConsulta);
    }

    // Registra log da operação
    if (invoiceId) {
      await createWSLog({
        invoice_id: invoiceId,
        operation: 'query',
        request_xml: maskSensitiveData(xmlConsulta),
        response_xml: maskSensitiveData(soapResponse),
        http_status: 200
      });
    }

    // Processa resposta
    const result = parseISSNetResponse(soapResponse);

    if (result.success) {
      // Se temos um invoiceId e dados da NFS-e, atualiza no banco
      if (invoiceId && result.nfse_number) {
        await (supabaseAdmin as any)
          .from('invoices')
          .update({
            status: 'issued',
            nfse_number: result.nfse_number,
            nfse_verification_code: result.verification_code,
            xml_nfse: result.xml_response
          })
          .eq('id', invoiceId);
      }

      return NextResponse.json({
        success: true,
        data: {
          query_type: queryType,
          protocol: result.protocol,
          nfse_number: result.nfse_number,
          verification_code: result.verification_code,
          xml_response: result.xml_response
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro na consulta da NFS-e',
          details: result.errors
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Erro ao consultar NFS-e:', error);

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    // Constrói query
    const supabaseAdmin = getSupabaseAdmin();
    let query = (supabaseAdmin as any)
      .from('invoices')
      .select(`
        *,
        customers (
          id,
          name,
          cpf_cnpj
        )
      `)
      .eq('company_id', companyId);

    // Aplica filtros
    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('competence_date', startDate);
    }

    if (endDate) {
      query = query.lte('competence_date', endDate);
    }

    // Aplica paginação e ordenação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: invoices, error } = await query;

    if (error) {
      throw error;
    }

    // Conta total para paginação
    let countQuery = (supabaseAdmin as any)
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    if (startDate) {
      countQuery = countQuery.gte('competence_date', startDate);
    }

    if (endDate) {
      countQuery = countQuery.lte('competence_date', endDate);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao listar NFS-e:', error);

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
