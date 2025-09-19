import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { buildConsultarNfse } from '@/lib/soap/xmlTemplates';
import { createISSNetClient } from '@/lib/soap/issnetClient';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { companyId, startDate, endDate } = await req.json();
    console.log('=== TESTE DE CONSULTA ISSNET ===');
    console.log('Parâmetros:', { companyId, startDate, endDate });

    // 1. Buscar empresa
    console.log('1. Buscando empresa...');
    const supabaseAdmin = getSupabaseAdmin();
    const { data: company, error: companyError } = await (supabaseAdmin as any)
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.log('Empresa não encontrada:', companyError);
      return NextResponse.json({
        success: false,
        step: 'company',
        error: 'Empresa não encontrada'
      });
    }
    console.log('Empresa OK:', company.name);

    // 2. Buscar certificado
    console.log('2. Buscando certificado...');
    const { data: certificate, error: certError } = await (supabaseAdmin as any)
      .from('certificates')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (certError || !certificate) {
      console.log('Certificado não encontrado:', certError);
      return NextResponse.json({
        success: false,
        step: 'certificate',
        error: 'Certificado não encontrado'
      });
    }
    console.log('Certificado OK:', { id: certificate.id, iv: certificate.pfx_iv });

    // 3. Descriptografar certificado
    console.log('3. Descriptografando certificado...');
    let pfxBuffer: Buffer;
    let passphrase: string;

    try {
      // Sempre usar método simples já que sabemos que funciona
      pfxBuffer = Buffer.from(certificate.pfx_ciphertext, 'base64');
      passphrase = Buffer.from(certificate.passphrase_ciphertext, 'base64').toString('utf8');
      console.log('Descriptografia OK - PFX:', pfxBuffer.length, 'bytes');
    } catch (decryptError) {
      console.log('Erro na descriptografia:', decryptError);
      return NextResponse.json({
        success: false,
        step: 'decrypt',
        error: 'Erro na descriptografia',
        details: decryptError.message
      });
    }

    // 4. Construir XML de consulta
    console.log('4. Construindo XML de consulta...');
    const xmlConsulta = buildConsultarNfse({
      company,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });
    console.log('XML construído - tamanho:', xmlConsulta.length);

    // 5. Criar cliente SOAP (sem certificado por enquanto para testar)
    console.log('5. Criando cliente SOAP sem certificado...');
    const client = createISSNetClient(company.environment);
    console.log('Cliente SOAP criado para ambiente:', company.environment);
    
    // Nota: O ISSNet DF pode não exigir certificado cliente para consultas
    // Vamos testar primeiro sem certificado

    // 6. Executar consulta
    console.log('6. Executando consulta SOAP...');
    try {
      const soapResponse = await client.consultarNfse(xmlConsulta);
      console.log('Resposta SOAP recebida - tamanho:', soapResponse.length);
      
      return NextResponse.json({
        success: true,
        data: {
          company: company.name,
          certificate_id: certificate.id,
          pfx_size: pfxBuffer.length,
          xml_size: xmlConsulta.length,
          response_size: soapResponse.length,
          response_preview: soapResponse.substring(0, 500) + '...',
          full_response: soapResponse // Para debug completo
        }
      });
    } catch (soapError) {
      console.log('Erro na consulta SOAP:', soapError);
      return NextResponse.json({
        success: false,
        step: 'soap',
        error: 'Erro na consulta SOAP',
        details: soapError instanceof Error ? soapError.message : String(soapError)
      });
    }

  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json({
      success: false,
      step: 'general',
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
