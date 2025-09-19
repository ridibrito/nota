import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { sendWebhookNotificationEmail, sendWelcomeEmail } from '@/lib/email/resend';
import crypto from 'crypto';

export const runtime = 'nodejs';

interface HotmartWebhookData {
  id: string;
  event: string;
  version: string;
  date_created: number;
  data: {
    product: {
      id: number;
      name: string;
      ucode: string;
    };
    purchase: {
      order_id: string;
      transaction: string;
      status: string;
      payment: {
        method: string;
        type: string;
      };
      buyer_ip: string;
      checkout_country: {
        name: string;
        iso: string;
      };
      price: {
        value: number;
        currency_value: string;
        currency_code: string;
      };
      commission: {
        value: number;
        currency_value: string;
        currency_code: string;
      };
      full_price: {
        value: number;
        currency_value: string;
        currency_code: string;
      };
      original_offer_price: {
        value: number;
        currency_value: string;
        currency_code: string;
      };
    };
    buyer: {
      name: string;
      email: string;
      checkout_phone: string;
      document: string;
      address: {
        country: string;
        country_iso: string;
        state: string;
        state_iso: string;
        city: string;
        zip_code: string;
        address: string;
        neighborhood: string;
        number: string;
        complement: string;
      };
    };
    affiliates?: Array<{
      name: string;
      email: string;
      document: string;
    }>;
    producer: {
      name: string;
      email: string;
      document: string;
    };
  };
}

// Função para validar webhook Hotmart
function validateHotmartWebhook(body: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64');
  
  return signature === hash;
}

// Função para processar compra da Hotmart
async function processHotmartPurchase(data: HotmartWebhookData, supabaseAdmin: any) {
  const { buyer, purchase, product } = data.data;
  
  console.log('Processando compra Hotmart:', {
    orderId: purchase.order_id,
    buyer: buyer.email,
    product: product.name,
    value: purchase.price.value
  });

  // 1. Buscar ou criar empresa (assumindo single-tenant por enquanto)
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id')
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
    .eq('email', buyer.email)
    .single();

  if (existingCustomer) {
    customer = existingCustomer;
    console.log('Cliente existente encontrado:', customer.name);
  } else {
    // Criar novo cliente
    const customerData = {
      company_id: company.id,
      name: buyer.name,
      email: buyer.email,
      cpf_cnpj: buyer.document || '',
      address: buyer.address ? {
        street: buyer.address.address,
        number: buyer.address.number,
        complement: buyer.address.complement,
        neighborhood: buyer.address.neighborhood,
        city: buyer.address.city,
        state: buyer.address.state,
        zip_code: buyer.address.zip_code,
        country: buyer.address.country
      } : null
    };

    const { data: newCustomer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (customerError) {
      throw new Error(`Erro ao criar cliente: ${customerError.message}`);
    }

    customer = newCustomer;
    console.log('Novo cliente criado:', customer.name);
    
    // Enviar email de boas-vindas para novos clientes
    const shouldSendWelcome = process.env.SEND_WELCOME_EMAILS === 'true';
    if (shouldSendWelcome) {
      try {
        await sendWelcomeEmail(
          { name: customer.name, email: customer.email },
          { name: company.name }
        );
        console.log('Email de boas-vindas enviado');
      } catch (emailError) {
        console.error('Erro ao enviar email de boas-vindas (não crítico):', emailError);
      }
    }
  }

  // 3. Buscar configuração do webhook
  const { data: webhookConfig } = await supabaseAdmin
    .from('webhook_configs')
    .select('*')
    .eq('company_id', company.id)
    .eq('source', 'hotmart')
    .single();

  // Criar NFS-e automaticamente se configurado
  const shouldAutoIssue = webhookConfig?.auto_issue || process.env.HOTMART_AUTO_ISSUE_NFE === 'true';
  
  if (shouldAutoIssue && purchase.status === 'approved') {
    console.log('Criando NFS-e automaticamente...');
    
    // Gerar próximo número RPS
    const { data: lastInvoice } = await supabaseAdmin
      .from('invoices')
      .select('rps_number')
      .eq('company_id', company.id)
      .eq('rps_series', 'HOTMART')
      .order('rps_number', { ascending: false })
      .limit(1)
      .single();

    const nextRpsNumber = lastInvoice 
      ? String(parseInt(lastInvoice.rps_number) + 1).padStart(6, '0')
      : '000001';

    const invoiceData = {
      company_id: company.id,
      customer_id: customer.id,
      rps_number: nextRpsNumber,
      rps_series: webhookConfig?.default_rps_series || 'HOTMART',
      competence_date: new Date().toISOString().split('T')[0],
      service_code: webhookConfig?.default_service_code || process.env.HOTMART_SERVICE_CODE || '01.05',
      description: `Venda digital - ${product.name} (Pedido: ${purchase.order_id})`,
      amount: purchase.price.value / 100, // Hotmart envia em centavos
      deductions: 0,
      iss_rate: webhookConfig?.default_iss_rate || parseFloat(process.env.HOTMART_ISS_RATE || '2') / 100,
      status: 'pending',
      // Metadados do webhook
      webhook_data: {
        source: 'hotmart',
        event: data.event,
        order_id: purchase.order_id,
        transaction: purchase.transaction,
        product_id: product.id,
        webhook_id: data.id
      }
    };

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Erro ao criar NFS-e: ${invoiceError.message}`);
    }

    console.log('NFS-e criada automaticamente:', invoice.id);
    
    // Opcional: Processar emissão imediatamente
    if (webhookConfig?.auto_process || process.env.HOTMART_AUTO_PROCESS === 'true') {
      try {
        // Chamar API interna de emissão
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/issue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceId: invoice.id })
        });
        
        if (response.ok) {
          console.log('NFS-e processada automaticamente');
        }
      } catch (processError) {
        console.error('Erro ao processar NFS-e automaticamente:', processError);
      }
    }

    return { customer, invoice };
  }

  return { customer, invoice: null };
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== WEBHOOK HOTMART RECEBIDO ===');
    
    const body = await req.text();
    const signature = req.headers.get('x-hotmart-hottok') || '';
    
    console.log('Headers recebidos:', {
      signature: signature ? 'Presente' : 'Ausente',
      contentType: req.headers.get('content-type'),
      userAgent: req.headers.get('user-agent')
    });

    // Validar assinatura se configurada
    const webhookSecret = process.env.HOTMART_WEBHOOK_SECRET;
    if (webhookSecret && !validateHotmartWebhook(body, signature, webhookSecret)) {
      console.error('Assinatura do webhook inválida');
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      );
    }

    const data: HotmartWebhookData = JSON.parse(body);
    console.log('Dados do webhook:', {
      event: data.event,
      orderId: data.data.purchase.order_id,
      buyer: data.data.buyer.email,
      product: data.data.product.name,
      status: data.data.purchase.status
    });

    const supabaseAdmin = getSupabaseAdmin();

    // Log do webhook
    await supabaseAdmin
      .from('webhook_logs')
      .insert({
        source: 'hotmart',
        event: data.event,
        payload: data,
        signature,
        processed_at: new Date().toISOString(),
        status: 'processing'
      });

    let result;

    // Processar diferentes tipos de eventos
    switch (data.event) {
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_COMPLETE':
        result = await processHotmartPurchase(data, supabaseAdmin);
        break;
      
      case 'PURCHASE_CANCELED':
      case 'PURCHASE_REFUNDED':
        console.log('Compra cancelada/estornada - implementar lógica de cancelamento');
        result = { message: 'Evento de cancelamento processado' };
        break;
      
      default:
        console.log('Evento não processado:', data.event);
        result = { message: `Evento ${data.event} recebido mas não processado` };
    }

    // Atualizar log como processado
    await supabaseAdmin
      .from('webhook_logs')
      .update({ 
        status: 'processed',
        result: result 
      })
      .eq('source', 'hotmart')
      .eq('event', data.event)
      .eq('payload->id', data.id);

    console.log('Webhook processado com sucesso');

    // Enviar notificação para admin (opcional)
    const shouldNotifyAdmin = process.env.SEND_WEBHOOK_NOTIFICATIONS === 'true';
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (shouldNotifyAdmin && adminEmail) {
      try {
        await sendWebhookNotificationEmail(
          {
            webhook: {
              source: 'hotmart',
              event: data.event,
              processed_at: new Date().toISOString(),
              status: 'processed'
            },
            result: result || {},
            company: { name: company.name }
          },
          adminEmail
        );
        console.log('Notificação de webhook enviada para admin');
      } catch (emailError) {
        console.error('Erro ao enviar notificação de webhook (não crítico):', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processado com sucesso',
      data: result
    });

  } catch (error) {
    console.error('Erro ao processar webhook Hotmart:', error);

    // Log do erro
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin
        .from('webhook_logs')
        .insert({
          source: 'hotmart',
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
