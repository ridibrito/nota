import { Resend } from 'resend';

// Inicializar Resend apenas se API key estiver disponível
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  
  if (!resend) {
    throw new Error('Resend não configurado. Configure RESEND_API_KEY no .env.local');
  }
  
  return resend;
}

// Configurações de email
const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || 'noreply@coruss.com',
  replyTo: process.env.RESEND_REPLY_TO || 'suporte@coruss.com',
  company: {
    name: 'Coruss',
    website: 'https://coruss.com',
    support: 'suporte@coruss.com'
  }
};

// Interfaces para dados de email
interface InvoiceEmailData {
  invoice: {
    id: string;
    rps_number: string;
    rps_series: string;
    nfse_number?: string;
    verification_code?: string;
    protocol?: string;
    amount: number;
    iss_value: number;
    description: string;
    competence_date: string;
    status: string;
  };
  customer: {
    name: string;
    email: string;
    cpf_cnpj: string;
  };
  company: {
    name: string;
    cnpj: string;
  };
}

interface WebhookEmailData {
  webhook: {
    source: string;
    event: string;
    processed_at: string;
    status: string;
  };
  result: {
    customer?: { name: string; email: string };
    invoice?: { id: string; rps_number: string };
  };
  company: {
    name: string;
  };
}

// Template HTML base
const getEmailTemplate = (title: string, content: string, footer?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; }
    .content { padding: 32px 24px; }
    .footer { background-color: #f3f4f6; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; }
    .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 16px 0; }
    .info-box { background-color: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .success-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .warning-box { background-color: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background-color: #f9fafb; font-weight: 600; }
    .logo { max-width: 120px; height: auto; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏢 ${EMAIL_CONFIG.company.name}</h1>
      <p>${title}</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      ${footer || `
        <p><strong>${EMAIL_CONFIG.company.name}</strong> - Sistema de NFS-e DF</p>
        <p>Este é um email automático. Para suporte: <a href="mailto:${EMAIL_CONFIG.company.support}">${EMAIL_CONFIG.company.support}</a></p>
      `}
    </div>
  </div>
</body>
</html>
`;

// Função para enviar email de confirmação de NFS-e
export async function sendInvoiceConfirmationEmail(data: InvoiceEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Enviando email de confirmação de NFS-e:', {
      to: data.customer.email,
      invoice_id: data.invoice.id,
      nfse_number: data.invoice.nfse_number
    });

    const content = `
      <h2>✅ NFS-e Emitida com Sucesso</h2>
      
      <div class="success-box">
        <p><strong>Sua Nota Fiscal de Serviços Eletrônica foi emitida com sucesso!</strong></p>
      </div>

      <h3>📋 Dados da NFS-e</h3>
      <table>
        <tr><th>RPS Número:</th><td>${data.invoice.rps_number}</td></tr>
        <tr><th>Série:</th><td>${data.invoice.rps_series}</td></tr>
        ${data.invoice.nfse_number ? `<tr><th>NFS-e Número:</th><td>${data.invoice.nfse_number}</td></tr>` : ''}
        ${data.invoice.verification_code ? `<tr><th>Código Verificação:</th><td>${data.invoice.verification_code}</td></tr>` : ''}
        ${data.invoice.protocol ? `<tr><th>Protocolo:</th><td>${data.invoice.protocol}</td></tr>` : ''}
        <tr><th>Data Competência:</th><td>${new Date(data.invoice.competence_date).toLocaleDateString('pt-BR')}</td></tr>
        <tr><th>Valor do Serviço:</th><td>R$ ${data.invoice.amount.toFixed(2)}</td></tr>
        <tr><th>ISS Retido:</th><td>R$ ${data.invoice.iss_value.toFixed(2)}</td></tr>
      </table>

      <h3>🏢 Prestador</h3>
      <p><strong>${data.company.name}</strong><br>
      CNPJ: ${data.company.cnpj}</p>

      <h3>👤 Tomador</h3>
      <p><strong>${data.customer.name}</strong><br>
      ${data.customer.cpf_cnpj.length === 14 ? 'CPF' : 'CNPJ'}: ${data.customer.cpf_cnpj}</p>

      <h3>📄 Descrição do Serviço</h3>
      <div class="info-box">
        <p>${data.invoice.description}</p>
      </div>

      <div class="warning-box">
        <p><strong>⚠️ Importante:</strong> Guarde este email como comprovante. Esta NFS-e é válida para fins fiscais e contábeis.</p>
      </div>
    `;

    const resendClient = getResendClient();
    const result = await resendClient.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.customer.email,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `✅ NFS-e Emitida - RPS ${data.invoice.rps_number} | ${data.company.name}`,
      html: getEmailTemplate('Confirmação de NFS-e Emitida', content)
    });

    console.log('Email de NFS-e enviado:', result.data?.id);
    return { success: true };

  } catch (error) {
    console.error('Erro ao enviar email de NFS-e:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

// Função para enviar notificação de webhook processado
export async function sendWebhookNotificationEmail(data: WebhookEmailData, adminEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Enviando notificação de webhook:', {
      to: adminEmail,
      source: data.webhook.source,
      event: data.webhook.event
    });

    const content = `
      <h2>🔔 Webhook Processado</h2>
      
      <div class="info-box">
        <p><strong>Um novo webhook foi processado automaticamente!</strong></p>
      </div>

      <h3>📡 Dados do Webhook</h3>
      <table>
        <tr><th>Origem:</th><td>${data.webhook.source.toUpperCase()}</td></tr>
        <tr><th>Evento:</th><td>${data.webhook.event}</td></tr>
        <tr><th>Processado em:</th><td>${new Date(data.webhook.processed_at).toLocaleString('pt-BR')}</td></tr>
        <tr><th>Status:</th><td>${data.webhook.status}</td></tr>
      </table>

      ${data.result.customer ? `
        <h3>👤 Cliente ${data.result.customer ? 'Criado' : 'Processado'}</h3>
        <table>
          <tr><th>Nome:</th><td>${data.result.customer.name}</td></tr>
          <tr><th>Email:</th><td>${data.result.customer.email}</td></tr>
        </table>
      ` : ''}

      ${data.result.invoice ? `
        <h3>📄 NFS-e Criada</h3>
        <table>
          <tr><th>ID:</th><td>${data.result.invoice.id}</td></tr>
          <tr><th>RPS:</th><td>${data.result.invoice.rps_number}</td></tr>
        </table>
      ` : ''}

      <div class="success-box">
        <p><strong>✅ Processamento automático concluído com sucesso!</strong></p>
      </div>
    `;

    const resendClient = getResendClient();
    const result = await resendClient.emails.send({
      from: EMAIL_CONFIG.from,
      to: adminEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `🔔 Webhook ${data.webhook.source.toUpperCase()} Processado | ${data.company.name}`,
      html: getEmailTemplate('Notificação de Webhook', content)
    });

    console.log('Email de webhook enviado:', result.data?.id);
    return { success: true };

  } catch (error) {
    console.error('Erro ao enviar email de webhook:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

// Função para enviar email de erro crítico
export async function sendErrorNotificationEmail(
  error: string, 
  context: string, 
  adminEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const content = `
      <h2>🚨 Erro Crítico no Sistema</h2>
      
      <div class="warning-box">
        <p><strong>Um erro crítico foi detectado no sistema!</strong></p>
      </div>

      <h3>📋 Detalhes do Erro</h3>
      <table>
        <tr><th>Contexto:</th><td>${context}</td></tr>
        <tr><th>Horário:</th><td>${new Date().toLocaleString('pt-BR')}</td></tr>
        <tr><th>Erro:</th><td style="color: #dc2626;">${error}</td></tr>
      </table>

      <div class="info-box">
        <p><strong>Ação Recomendada:</strong> Verifique os logs do sistema e tome as medidas necessárias.</p>
      </div>
    `;

    const resendClient = getResendClient();
    const result = await resendClient.emails.send({
      from: EMAIL_CONFIG.from,
      to: adminEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `🚨 Erro Crítico - Sistema NFS-e | ${EMAIL_CONFIG.company.name}`,
      html: getEmailTemplate('Notificação de Erro', content)
    });

    console.log('Email de erro enviado:', result.data?.id);
    return { success: true };

  } catch (emailError) {
    console.error('Erro ao enviar email de erro:', emailError);
    return { 
      success: false, 
      error: emailError instanceof Error ? emailError.message : 'Erro desconhecido' 
    };
  }
}

// Função para enviar email de boas-vindas para novos clientes
export async function sendWelcomeEmail(
  customer: { name: string; email: string },
  company: { name: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const content = `
      <h2>👋 Bem-vindo(a)!</h2>
      
      <p>Olá <strong>${customer.name}</strong>,</p>
      
      <p>Você foi cadastrado(a) como cliente da <strong>${company.name}</strong> em nosso sistema de NFS-e.</p>
      
      <div class="info-box">
        <p><strong>📧 O que isso significa?</strong></p>
        <ul>
          <li>Você receberá emails automáticos quando uma NFS-e for emitida para você</li>
          <li>Todos os comprovantes fiscais serão enviados para este email</li>
          <li>Seus dados estão seguros e protegidos</li>
        </ul>
      </div>

      <p>Se você tiver alguma dúvida, entre em contato conosco.</p>
      
      <p>Atenciosamente,<br>
      <strong>${company.name}</strong></p>
    `;

    const resendClient = getResendClient();
    const result = await resendClient.emails.send({
      from: EMAIL_CONFIG.from,
      to: customer.email,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `👋 Bem-vindo(a) - ${company.name}`,
      html: getEmailTemplate('Bem-vindo ao Sistema', content)
    });

    console.log('Email de boas-vindas enviado:', result.data?.id);
    return { success: true };

  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

// Função para testar configuração do Resend
export async function testResendConfiguration(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY não configurado' };
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      return { success: false, error: 'RESEND_FROM_EMAIL não configurado' };
    }

    // Teste simples de envio
    const resendClient = getResendClient();
    const result = await resendClient.emails.send({
      from: EMAIL_CONFIG.from,
      to: 'test@resend.dev', // Email de teste do Resend
      subject: 'Teste de Configuração - Coruss NFS-e',
      html: getEmailTemplate(
        'Teste de Configuração',
        '<p>Este é um email de teste para verificar a configuração do Resend.</p>'
      )
    });

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

export { EMAIL_CONFIG };
