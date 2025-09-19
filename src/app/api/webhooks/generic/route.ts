import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import crypto from 'crypto';

export const runtime = 'nodejs';

interface GenericWebhookData {
  // Campos obrigatórios
  event: string;
  source: string; // 'crm', 'erp', 'payment', etc.
  
  // Dados do cliente
  customer: {
    name: string;
    email: string;
    document?: string; // CPF/CNPJ
    phone?: string;
    address?: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      country?: string;
    };
  };
  
  // Dados do serviço/produto (opcional)
  service?: {
    description: string;
    amount: number; // Valor em reais (não centavos)
    service_code?: string;
    iss_rate?: number; // Taxa ISS em % (ex: 2.0 para 2%)
  };
  
  // Dados da transação (opcional)
  transaction?: {
    id: string;
    order_id?: string;
    status?: 'pending' | 'approved' | 'canceled' | 'refunded';
    payment_method?: string;
    currency?: string;
  };
  
  // Configurações específicas
  config?: {
    auto_issue?: boolean; // Emitir NFS-e automaticamente
    rps_series?: string; // Série do RPS (padrão: source em maiúsculo)
    competence_date?: string; // Data de competência (padrão: hoje)
  };
  
  // Metadados adicionais
  metadata?: Record<string, any>;
}

// Função para validar webhook genérico
function validateGenericWebhook(body: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  
  // Suporte a diferentes algoritmos de hash
  const algorithms = ['sha256', 'sha1', 'md5'];
  
  for (const algorithm of algorithms) {
    const hash = crypto
      .createHmac(algorithm, secret)
      .update(body)
      .digest('hex');
    
    // Testar diferentes formatos de assinatura
    const formats = [
      hash,
      `${algorithm}=${hash}`,
      `${algorithm.toUpperCase()}=${hash}`,
      Buffer.from(hash).toString('base64')
    ];
    
    if (formats.includes(signature)) {
      return true;
    }
  }
  
  return false;
}

// Função para processar dados genéricos
async function processGenericWebhook(data: GenericWebhookData, supabaseAdmin: any) {
  const { customer: customerData, service, transaction, config } = data;
  
  console.log('Processando webhook genérico:', {
    event: data.event,
    source: data.source,
    customer: customerData.email,
    service: service?.description,
    transaction: transaction?.id
  });

  // 1. Buscar empresa (assumindo single-tenant por enquanto)
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('*')
    .limit(1)
    .single();

  if (!company) {
    throw new Error('Empresa não encontrada para processar webhook');
  }

  // 2. Buscar ou criar cliente
  let customer;
  const { data: existingCustomer } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('company_id', company.id)
    .eq('email', customerData.email)
    .single();

  if (existingCustomer) {
    // Atualizar dados do cliente se fornecidos
    const updateData: any = {};
    if (customerData.name && customerData.name !== existingCustomer.name) {
      updateData.name = customerData.name;
    }
    if (customerData.document && customerData.document !== existingCustomer.cpf_cnpj) {
      updateData.cpf_cnpj = customerData.document;
    }
    if (customerData.address) {
      updateData.address = customerData.address;
    }

    if (Object.keys(updateData).length > 0) {
      const { data: updatedCustomer } = await supabaseAdmin
        .from('customers')
        .update(updateData)
        .eq('id', existingCustomer.id)
        .select()
        .single();
      
      customer = updatedCustomer;
      console.log('Cliente atualizado:', customer.name);
    } else {
      customer = existingCustomer;
      console.log('Cliente existente encontrado:', customer.name);
    }
  } else {
    // Criar novo cliente
    const newCustomerData = {
      company_id: company.id,
      name: customerData.name,
      email: customerData.email,
      cpf_cnpj: customerData.document || '',
      address: customerData.address || null
    };

    const { data: newCustomer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert(newCustomerData)
      .select()
      .single();

    if (customerError) {
      throw new Error(`Erro ao criar cliente: ${customerError.message}`);
    }

    customer = newCustomer;
    console.log('Novo cliente criado:', customer.name);
  }

  // 3. Criar NFS-e se dados do serviço fornecidos e configurado para auto-emissão
  let invoice = null;
  const shouldAutoIssue = config?.auto_issue || 
    (service && transaction?.status === 'approved') ||
    (service && !transaction); // Se não há transação, assume aprovado

  if (shouldAutoIssue && service) {
    console.log('Criando NFS-e automaticamente...');
    
    const rpsSeries = config?.rps_series || data.source.toUpperCase();
    
    // Gerar próximo número RPS
    const { data: lastInvoice } = await supabaseAdmin
      .from('invoices')
      .select('rps_number')
      .eq('company_id', company.id)
      .eq('rps_series', rpsSeries)
      .order('rps_number', { ascending: false })
      .limit(1)
      .single();

    const nextRpsNumber = lastInvoice 
      ? String(parseInt(lastInvoice.rps_number) + 1).padStart(6, '0')
      : '000001';

    const competenceDate = config?.competence_date || new Date().toISOString().split('T')[0];
    const serviceCode = service.service_code || company.item_lista_servico || '01.05';
    const issRate = (service.iss_rate || 2.0) / 100;

    const invoiceData = {
      company_id: company.id,
      customer_id: customer.id,
      rps_number: nextRpsNumber,
      rps_series: rpsSeries,
      competence_date: competenceDate,
      service_code: serviceCode,
      description: service.description,
      amount: service.amount,
      deductions: 0,
      iss_rate: issRate,
      status: 'pending',
      // Metadados do webhook
      webhook_data: {
        source: data.source,
        event: data.event,
        transaction_id: transaction?.id,
        order_id: transaction?.order_id,
        metadata: data.metadata
      }
    };

    const { data: newInvoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Erro ao criar NFS-e: ${invoiceError.message}`);
    }

    invoice = newInvoice;
    console.log('NFS-e criada automaticamente:', invoice.id);
    
    // Opcional: Processar emissão imediatamente
    const autoProcess = process.env.WEBHOOK_AUTO_PROCESS === 'true';
    if (autoProcess) {
      try {
        // Simular processamento (como na API principal)
        const mockResponse = {
          nfse_number: String(Date.now()).slice(-8),
          verification_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
          protocol: `PROT${Date.now()}`.slice(-12)
        };

        await supabaseAdmin
          .from('invoices')
          .update({
            nfse_number: mockResponse.nfse_number,
            nfse_verification_code: mockResponse.verification_code,
            protocol: mockResponse.protocol,
            status: 'issued'
          })
          .eq('id', invoice.id);

        console.log('NFS-e processada automaticamente');
      } catch (processError) {
        console.error('Erro ao processar NFS-e automaticamente:', processError);
      }
    }
  }

  return { customer, invoice };
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== WEBHOOK GENÉRICO RECEBIDO ===');
    
    const body = await req.text();
    const signature = req.headers.get('x-signature') || 
                     req.headers.get('x-hub-signature') || 
                     req.headers.get('signature') || '';
    
    console.log('Headers recebidos:', {
      signature: signature ? 'Presente' : 'Ausente',
      contentType: req.headers.get('content-type'),
      userAgent: req.headers.get('user-agent'),
      origin: req.headers.get('origin')
    });

    // Validar assinatura se configurada
    const webhookSecret = process.env.GENERIC_WEBHOOK_SECRET;
    if (webhookSecret && signature && !validateGenericWebhook(body, signature, webhookSecret)) {
      console.error('Assinatura do webhook inválida');
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      );
    }

    const data: GenericWebhookData = JSON.parse(body);
    
    // Validação de campos obrigatórios
    if (!data.event || !data.source || !data.customer?.name || !data.customer?.email) {
      return NextResponse.json(
        { 
          error: 'Campos obrigatórios faltando',
          required: ['event', 'source', 'customer.name', 'customer.email']
        },
        { status: 400 }
      );
    }

    console.log('Dados do webhook:', {
      event: data.event,
      source: data.source,
      customer: data.customer.email,
      service: data.service?.description,
      transaction: data.transaction?.id
    });

    const supabaseAdmin = getSupabaseAdmin();

    // Log do webhook
    const { data: webhookLog } = await supabaseAdmin
      .from('webhook_logs')
      .insert({
        source: data.source,
        event: data.event,
        payload: data,
        signature,
        processed_at: new Date().toISOString(),
        status: 'processing'
      })
      .select()
      .single();

    let result;

    // Processar diferentes tipos de eventos
    switch (data.event.toLowerCase()) {
      case 'sale.created':
      case 'sale.approved':
      case 'order.completed':
      case 'payment.approved':
      case 'customer.created':
      case 'service.delivered':
        result = await processGenericWebhook(data, supabaseAdmin);
        break;
      
      case 'sale.canceled':
      case 'sale.refunded':
      case 'order.canceled':
      case 'payment.refunded':
        console.log('Evento de cancelamento - implementar lógica específica');
        result = { message: 'Evento de cancelamento processado' };
        break;
      
      default:
        console.log('Evento processado genericamente:', data.event);
        result = await processGenericWebhook(data, supabaseAdmin);
    }

    // Atualizar log como processado
    if (webhookLog) {
      await supabaseAdmin
        .from('webhook_logs')
        .update({ 
          status: 'processed',
          result: result 
        })
        .eq('id', webhookLog.id);
    }

    console.log('Webhook genérico processado com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Webhook processado com sucesso',
      data: result
    });

  } catch (error) {
    console.error('Erro ao processar webhook genérico:', error);

    // Log do erro
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin
        .from('webhook_logs')
        .insert({
          source: 'generic',
          event: 'error',
          payload: { error: error instanceof Error ? error.message : String(error) },
          processed_at: new Date().toISOString(),
          status: 'error'
        });
    } catch (logError) {
      console.error('Erro ao salvar log de erro:', logError);
    }

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

// Método GET para documentação da API
export async function GET() {
  return NextResponse.json({
    name: 'Webhook Genérico - Coruss NFS-e',
    description: 'Endpoint para receber webhooks de CRM, ERP e outros sistemas',
    version: '1.0.0',
    endpoints: {
      POST: '/api/webhooks/generic'
    },
    authentication: {
      type: 'HMAC',
      header: 'x-signature | x-hub-signature | signature',
      algorithms: ['sha256', 'sha1', 'md5'],
      formats: ['hash', 'algorithm=hash', 'base64']
    },
    payload: {
      required: ['event', 'source', 'customer.name', 'customer.email'],
      optional: ['service', 'transaction', 'config', 'metadata'],
      example: {
        event: 'sale.approved',
        source: 'crm',
        customer: {
          name: 'João Silva',
          email: 'joao@exemplo.com',
          document: '123.456.789-00',
          phone: '(11) 99999-9999'
        },
        service: {
          description: 'Consultoria em TI',
          amount: 1500.00,
          service_code: '01.05',
          iss_rate: 2.0
        },
        transaction: {
          id: 'TXN123456',
          order_id: 'ORD789',
          status: 'approved'
        },
        config: {
          auto_issue: true,
          rps_series: 'CRM'
        }
      }
    },
    events: [
      'sale.created', 'sale.approved', 'sale.canceled', 'sale.refunded',
      'order.completed', 'order.canceled',
      'payment.approved', 'payment.refunded',
      'customer.created', 'customer.updated',
      'service.delivered'
    ]
  });
}
