import { NextRequest, NextResponse } from 'next/server';
import { 
  testResendConfiguration, 
  sendInvoiceConfirmationEmail,
  sendWelcomeEmail 
} from '@/lib/email/resend';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { type, email, data } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório para teste' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'config':
        result = await testResendConfiguration();
        break;

      case 'welcome':
        result = await sendWelcomeEmail(
          { name: data?.name || 'Teste', email },
          { name: 'Coruss Teste' }
        );
        break;

      case 'invoice':
        const mockInvoiceData = {
          invoice: {
            id: 'test-123',
            rps_number: '000999',
            rps_series: 'TESTE',
            nfse_number: '12345678',
            verification_code: 'ABC123XYZ',
            protocol: 'PROT123456789',
            amount: 1500.00,
            iss_value: 30.00,
            description: 'Teste de email - Consultoria em TI',
            competence_date: new Date().toISOString().split('T')[0],
            status: 'issued'
          },
          customer: {
            name: data?.name || 'Cliente Teste',
            email,
            cpf_cnpj: '123.456.789-00'
          },
          company: {
            name: 'Coruss Teste',
            cnpj: '12.345.678/0001-90'
          }
        };
        result = await sendInvoiceConfirmationEmail(mockInvoiceData);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de teste inválido. Use: config, welcome, invoice' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Email enviado com sucesso!' : 'Erro ao enviar email',
      error: result.error,
      type
    });

  } catch (error) {
    console.error('Erro no teste de email:', error);
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

// Documentação da API
export async function GET() {
  return NextResponse.json({
    name: 'API de Teste de Email - Resend',
    description: 'Endpoint para testar envio de emails',
    endpoints: {
      POST: '/api/email/test'
    },
    parameters: {
      type: 'config | welcome | invoice',
      email: 'string (obrigatório)',
      data: 'object (opcional - name, etc.)'
    },
    examples: [
      {
        description: 'Testar configuração',
        payload: {
          type: 'config',
          email: 'seu@email.com'
        }
      },
      {
        description: 'Testar email de boas-vindas',
        payload: {
          type: 'welcome',
          email: 'cliente@email.com',
          data: { name: 'João Silva' }
        }
      },
      {
        description: 'Testar email de NFS-e',
        payload: {
          type: 'invoice',
          email: 'cliente@email.com',
          data: { name: 'Maria Santos' }
        }
      }
    ],
    environment_variables: [
      'RESEND_API_KEY (obrigatório)',
      'RESEND_FROM_EMAIL (obrigatório)',
      'RESEND_REPLY_TO (opcional)',
      'SEND_INVOICE_EMAILS=true (opcional)',
      'SEND_WELCOME_EMAILS=true (opcional)'
    ]
  });
}
