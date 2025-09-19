import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createWSLog } from '@/lib/db/supabase';
import { buildCancelarNfse, parseISSNetResponse } from '@/lib/soap/xmlTemplates';
import { createISSNetClient, maskSensitiveData } from '@/lib/soap/issnetClient';
import { 
  loadPfxCertificate, 
  signXmlWithPfx, 
  decryptCertificateFromStorage 
} from '@/lib/crypto/a1';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { 
      invoiceId, 
      reason 
    } = await req.json();

    // Validações básicas
    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'ID da nota fiscal é obrigatório' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Motivo do cancelamento deve ter pelo menos 10 caracteres' },
        { status: 400 }
      );
    }

    // Carrega dados da nota fiscal
    const supabaseAdmin = getSupabaseAdmin();
    const { data: invoice, error: invoiceError } = await (supabaseAdmin as any)
      .from('invoices')
      .select(`
        *,
        companies (*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Nota fiscal não encontrada' },
        { status: 404 }
      );
    }

    // Verifica se pode ser cancelada
    if (invoice.status !== 'issued') {
      return NextResponse.json(
        { success: false, error: 'Apenas notas emitidas podem ser canceladas' },
        { status: 400 }
      );
    }

    if (!invoice.nfse_number || !invoice.nfse_verification_code) {
      return NextResponse.json(
        { success: false, error: 'Dados da NFS-e não encontrados para cancelamento' },
        { status: 400 }
      );
    }

    // Carrega certificado da empresa
    const { data: certificate, error: certError } = await (supabaseAdmin as any)
      .from('certificates')
      .select('*')
      .eq('company_id', invoice.company_id)
      .single();

    if (certError || !certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificado digital não encontrado' },
        { status: 400 }
      );
    }

    // Descriptografa certificado
    const encryptionKey = process.env.CERT_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('Chave de criptografia não configurada');
    }

    const { pfx, passphrase } = decryptCertificateFromStorage(
      {
        pfx_iv: Buffer.from(certificate.pfx_iv, 'base64'),
        pfx_tag: Buffer.from(certificate.pfx_tag, 'base64'),
        pfx_ciphertext: Buffer.from(certificate.pfx_ciphertext, 'base64'),
        passphrase_iv: Buffer.from(certificate.pfx_iv, 'base64'),
        passphrase_tag: Buffer.from(certificate.pfx_tag, 'base64'),
        passphrase_ciphertext: Buffer.from(certificate.passphrase_ciphertext, 'base64')
      },
      encryptionKey
    );

    // Carrega dados do certificado
    const certData = loadPfxCertificate(pfx, passphrase);

    // Constrói XML de cancelamento
    const xmlCancelamento = buildCancelarNfse({
      company: invoice.companies,
      nfseNumber: invoice.nfse_number,
      verificationCode: invoice.nfse_verification_code,
      reason: reason.trim()
    });

    // Assina XML
    const signedXml = signXmlWithPfx(xmlCancelamento, certData);

    // Envia para ISSNet
    const client = createISSNetClient(invoice.companies.environment);
    const soapResponse = await client.cancelarNfse(signedXml);

    // Registra log da operação
    await createWSLog({
      invoice_id: invoiceId,
      operation: 'cancel',
      request_xml: maskSensitiveData(signedXml),
      response_xml: maskSensitiveData(soapResponse),
      http_status: 200
    });

    // Processa resposta
    const result = parseISSNetResponse(soapResponse);

    if (result.success) {
      // Cancelamento bem-sucedido
      await (supabaseAdmin as any)
        .from('invoices')
        .update({
          status: 'canceled'
        })
        .eq('id', invoiceId);

      return NextResponse.json({
        success: true,
        message: 'NFS-e cancelada com sucesso',
        data: {
          nfse_number: invoice.nfse_number,
          cancellation_reason: reason.trim()
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro no cancelamento da NFS-e',
          details: result.errors
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Erro ao cancelar NFS-e:', error);

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

// Endpoint para listar NFS-e canceladas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
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

    // Constrói query para NFS-e canceladas
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
      .eq('company_id', companyId)
      .eq('status', 'canceled');

    // Aplica filtros de data
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

    const { data: canceledInvoices, error } = await query;

    if (error) {
      throw error;
    }

    // Conta total para paginação
    let countQuery = (supabaseAdmin as any)
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'canceled');

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
        canceled_invoices: canceledInvoices,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao listar NFS-e canceladas:', error);

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
