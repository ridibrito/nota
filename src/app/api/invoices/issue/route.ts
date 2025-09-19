import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { roundABNT } from '@/lib/tax/rounding';
import { sendInvoiceConfirmationEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('=== EMISSÃO DE NFS-e ===');
    console.log('Dados recebidos:', body);

    const {
      company_id,
      customer_id,
      rps_number,
      rps_series,
      competence_date,
      service_code,
      description,
      amount,
      deductions,
      iss_rate
    } = body;

    // Validações básicas
    if (!company_id || !customer_id || !description || !amount) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios faltando' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verificar se empresa existe
    console.log('Verificando empresa...');
    const { data: company, error: companyError } = await (supabaseAdmin as any)
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      console.error('Empresa não encontrada:', companyError);
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se cliente existe
    console.log('Verificando cliente...');
    const { data: customer, error: customerError } = await (supabaseAdmin as any)
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      console.error('Cliente não encontrado:', customerError);
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    console.log('Cliente encontrado:', {
      name: customer.name,
      email: customer.email,
      document: customer.cpf_cnpj,
      hasAddress: !!customer.address
    });

    // Gerar número RPS único
    let finalRpsNumber = rps_number;
    if (!finalRpsNumber) {
      // Buscar o próximo número RPS disponível
      const { data: lastInvoice } = await (supabaseAdmin as any)
        .from('invoices')
        .select('rps_number')
        .eq('company_id', company_id)
        .eq('rps_series', rps_series || 'UNICA')
        .order('rps_number', { ascending: false })
        .limit(1)
        .single();

      if (lastInvoice) {
        finalRpsNumber = String(parseInt(lastInvoice.rps_number) + 1).padStart(6, '0');
      } else {
        finalRpsNumber = '000001';
      }
    } else {
      // Verificar se o número RPS já existe
      const { data: existingInvoice } = await (supabaseAdmin as any)
        .from('invoices')
        .select('id')
        .eq('company_id', company_id)
        .eq('rps_number', finalRpsNumber)
        .eq('rps_series', rps_series || 'UNICA')
        .single();

      if (existingInvoice) {
        // Gerar um novo número baseado no timestamp
        finalRpsNumber = String(Date.now()).slice(-6);
      }
    }

    console.log('Número RPS final:', finalRpsNumber);

    // Calcular valores com arredondamento ABNT
    const serviceValue = roundABNT(parseFloat(amount));
    const deductionsValue = roundABNT(parseFloat(deductions) || 0);
    const calculationBase = roundABNT(serviceValue - deductionsValue);
    const issValueCalculated = roundABNT(calculationBase * parseFloat(iss_rate));

    console.log('Valores calculados:', {
      serviceValue,
      deductionsValue,
      calculationBase,
      issValueCalculated
    });

    // Criar registro da NFS-e
    console.log('Criando registro da NFS-e...');
    const { data: newInvoice, error: createError } = await (supabaseAdmin as any)
      .from('invoices')
      .insert({
        company_id,
        customer_id,
        rps_number: finalRpsNumber,
        rps_series: rps_series || 'UNICA',
        competence_date,
        service_code: service_code || company.item_lista_servico,
        description,
        amount: serviceValue,
        deductions: deductionsValue,
        iss_rate: parseFloat(iss_rate),
        iss_value: issValueCalculated,
        status: 'pending'
      })
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar NFS-e:', createError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar registro da NFS-e' },
        { status: 500 }
      );
    }

    console.log('NFS-e criada:', newInvoice.id);

    // Simular processamento (sem certificado real por enquanto)
    console.log('Simulando processamento da NFS-e...');
    
    // Simular resposta de sucesso do ISSNet
    const mockResponse = {
      nfse_number: String(Date.now()).slice(-8),
      verification_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      protocol: `PROT${Date.now()}`.slice(-12)
    };

    // Atualizar registro com dados simulados
    console.log('Atualizando com dados simulados...');
    const { data: updatedInvoice, error: updateError } = await (supabaseAdmin as any)
      .from('invoices')
      .update({
        nfse_number: mockResponse.nfse_number,
        nfse_verification_code: mockResponse.verification_code,
        protocol: mockResponse.protocol,
        status: 'issued'
      })
      .eq('id', newInvoice.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar NFS-e:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao finalizar NFS-e' },
        { status: 500 }
      );
    }

    console.log('NFS-e emitida com sucesso!');

    // Enviar email de confirmação (opcional)
    const shouldSendEmail = process.env.SEND_INVOICE_EMAILS === 'true';
    if (shouldSendEmail && customer.email) {
      console.log('Enviando email de confirmação...');
      try {
        await sendInvoiceConfirmationEmail({
          invoice: {
            id: updatedInvoice.id,
            rps_number: finalRpsNumber,
            rps_series: updatedInvoice.rps_series,
            nfse_number: mockResponse.nfse_number,
            verification_code: mockResponse.verification_code,
            protocol: mockResponse.protocol,
            amount: serviceValue,
            iss_value: issValueCalculated,
            description: updatedInvoice.description,
            competence_date: updatedInvoice.competence_date,
            status: 'issued'
          },
          customer: {
            name: customer.name,
            email: customer.email,
            cpf_cnpj: customer.cpf_cnpj
          },
          company: {
            name: company.name,
            cnpj: company.cnpj
          }
        });
        console.log('Email de confirmação enviado com sucesso');
      } catch (emailError) {
        console.error('Erro ao enviar email (não crítico):', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'NFS-e emitida com sucesso',
      data: {
        invoice_id: updatedInvoice.id,
        nfse_number: mockResponse.nfse_number,
        verification_code: mockResponse.verification_code,
        protocol: mockResponse.protocol,
        service_value: serviceValue,
        iss_value: issValueCalculated,
        status: 'issued',
        email_sent: shouldSendEmail && customer.email
      }
    });

  } catch (error) {
    console.error('Erro na API de emissão:', error);
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