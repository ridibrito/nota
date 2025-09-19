/**
 * Templates XML ABRASF 2.04 para ISSNet DF
 * Constrói XMLs para emissão, consulta e cancelamento de NFS-e
 */

import { create } from 'xmlbuilder2';
import { Company, Customer, Invoice } from '@/types';

/**
 * Constrói XML EnviarLoteRpsSincrono conforme ABRASF 2.04
 */
export function buildEnviarLoteRpsSincrono(params: {
  company: Company;
  invoice: Invoice;
  customer: Customer;
}): string {
  const { company, invoice, customer } = params;
  
  // Gera número do lote baseado no timestamp
  const loteNumber = Date.now().toString();
  
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('EnviarLoteRpsSincronoEnvio', {
      xmlns: 'http://www.abrasf.org.br/nfse.xsd'
    })
      .ele('LoteRps', {
        Id: `lote${loteNumber}`,
        versao: '2.04'
      })
        .ele('NumeroLote').txt(loteNumber).up()
        .ele('CpfCnpj')
          .ele('Cnpj').txt(company.cnpj.replace(/\D/g, '')).up()
        .up()
        .ele('InscricaoMunicipal').txt(company.im).up()
        .ele('QuantidadeRps').txt('1').up()
        .ele('ListaRps')
          .ele('Rps')
            .ele('InfRps', {
              Id: `rps${invoice.rps_number}`
            })
              .ele('IdentificacaoRps')
                .ele('Numero').txt(invoice.rps_number).up()
                .ele('Serie').txt(invoice.rps_series || 'UNICA').up()
                .ele('Tipo').txt('1').up() // 1 = RPS
              .up()
              .ele('DataEmissao').txt(formatDateTimeXml(new Date())).up()
              .ele('NaturezaOperacao').txt('1').up() // 1 = Tributação no município
              .ele('RegimeEspecialTributacao').txt('').up()
              .ele('OptanteSimplesNacional').txt('2').up() // 2 = Não
              .ele('IncentivadorCultural').txt('2').up() // 2 = Não
              .ele('Status').txt('1').up() // 1 = Normal
              .ele('Servico')
                .ele('Valores')
                  .ele('ValorServicos').txt(formatCurrency(invoice.amount)).up()
                  .ele('ValorDeducoes').txt(formatCurrency(invoice.deductions || 0)).up()
                  .ele('ValorPis').txt('0.00').up()
                  .ele('ValorCofins').txt('0.00').up()
                  .ele('ValorInss').txt('0.00').up()
                  .ele('ValorIr').txt('0.00').up()
                  .ele('ValorCsll').txt('0.00').up()
                  .ele('IssRetido').txt('2').up() // 2 = Não retido
                  .ele('ValorIss').txt(formatCurrency(invoice.iss_value || 0)).up()
                  .ele('OutrasRetencoes').txt('0.00').up()
                  .ele('Aliquota').txt(formatPercentage(invoice.iss_rate)).up()
                  .ele('DescontoIncondicionado').txt('0.00').up()
                  .ele('DescontoCondicionado').txt('0.00').up()
                .up()
                .ele('ItemListaServico').txt(company.item_lista_servico).up()
                .ele('CodigoTributacaoMunicipio').txt(company.cod_tributacao_municipio).up()
                .ele('Discriminacao').txt(invoice.description).up()
                .ele('CodigoMunicipio').txt('5300108').up() // Código IBGE Brasília
              .up()
              .ele('Prestador')
                .ele('CpfCnpj')
                  .ele('Cnpj').txt(company.cnpj.replace(/\D/g, '')).up()
                .up()
                .ele('InscricaoMunicipal').txt(company.im).up()
              .up()
              .ele('Tomador')
                .ele('IdentificacaoTomador')
                  .ele('CpfCnpj');
  
  // Adiciona CPF ou CNPJ do tomador
  if (customer.cpf_cnpj.replace(/\D/g, '').length === 11) {
    doc.ele('Cpf').txt(customer.cpf_cnpj.replace(/\D/g, '')).up();
  } else {
    doc.ele('Cnpj').txt(customer.cpf_cnpj.replace(/\D/g, '')).up();
  }
  
  doc.up() // fecha CpfCnpj
    .up() // fecha IdentificacaoTomador
    .ele('RazaoSocial').txt(customer.name).up();
  
  // Adiciona endereço se disponível
  if (customer.address) {
    doc.ele('Endereco')
      .ele('Endereco').txt(customer.address.street || '').up()
      .ele('Numero').txt(customer.address.number || 'S/N').up()
      .ele('Complemento').txt(customer.address.complement || '').up()
      .ele('Bairro').txt(customer.address.neighborhood || '').up()
      .ele('CodigoMunicipio').txt('5300108').up() // Brasília
      .ele('Uf').txt(customer.address.state || 'DF').up()
      .ele('Cep').txt(customer.address.zip_code?.replace(/\D/g, '') || '').up()
    .up();
  }
  
  // Adiciona email se disponível
  if (customer.email) {
    doc.ele('Contato')
      .ele('Email').txt(customer.email).up()
    .up();
  }
  
  return doc.end({ prettyPrint: true });
}

/**
 * Constrói XML ConsultarLoteRps
 */
export function buildConsultarLoteRps(params: {
  company: Company;
  protocol: string;
}): string {
  const { company, protocol } = params;
  
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('ConsultarLoteRpsEnvio', {
      xmlns: 'http://www.abrasf.org.br/nfse.xsd'
    })
      .ele('Prestador')
        .ele('CpfCnpj')
          .ele('Cnpj').txt(company.cnpj.replace(/\D/g, '')).up()
        .up()
        .ele('InscricaoMunicipal').txt(company.im).up()
      .up()
      .ele('Protocolo').txt(protocol).up();
  
  return doc.end({ prettyPrint: true });
}

/**
 * Constrói XML ConsultarNfse por número
 */
export function buildConsultarNfse(params: {
  company: Company;
  nfseNumber?: string;
  startDate?: Date;
  endDate?: Date;
}): string {
  const { company, nfseNumber, startDate, endDate } = params;
  
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('ConsultarNfseEnvio', {
      xmlns: 'http://www.abrasf.org.br/nfse.xsd'
    })
      .ele('Prestador')
        .ele('CpfCnpj')
          .ele('Cnpj').txt(company.cnpj.replace(/\D/g, '')).up()
        .up()
        .ele('InscricaoMunicipal').txt(company.im).up()
      .up();
  
  if (nfseNumber) {
    doc.ele('NumeroNfse').txt(nfseNumber).up();
  }
  
  if (startDate && endDate) {
    doc.ele('PeriodoEmissao')
      .ele('DataInicial').txt(formatDateXml(startDate)).up()
      .ele('DataFinal').txt(formatDateXml(endDate)).up()
    .up();
  }
  
  return doc.end({ prettyPrint: true });
}

/**
 * Constrói XML CancelarNfse
 */
export function buildCancelarNfse(params: {
  company: Company;
  nfseNumber: string;
  verificationCode: string;
  reason: string;
}): string {
  const { company, nfseNumber, verificationCode, reason } = params;
  
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('CancelarNfseEnvio', {
      xmlns: 'http://www.abrasf.org.br/nfse.xsd'
    })
      .ele('Pedido')
        .ele('InfPedidoCancelamento', {
          Id: `cancel${nfseNumber}`
        })
          .ele('IdentificacaoNfse')
            .ele('Numero').txt(nfseNumber).up()
            .ele('CpfCnpj')
              .ele('Cnpj').txt(company.cnpj.replace(/\D/g, '')).up()
            .up()
            .ele('InscricaoMunicipal').txt(company.im).up()
            .ele('CodigoMunicipio').txt('5300108').up()
            .ele('CodigoVerificacao').txt(verificationCode).up()
          .up()
          .ele('CodigoCancelamento').txt('1').up() // 1 = Erro na emissão
          .ele('MotivoCancelamento').txt(reason).up()
        .up()
      .up();
  
  return doc.end({ prettyPrint: true });
}

/**
 * Constrói envelope SOAP 1.2
 */
export function buildSoapEnvelope(xmlBody: string, soapAction: string): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('soap12:Envelope', {
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
      'xmlns:soap12': 'http://www.w3.org/2003/05/soap-envelope'
    })
      .ele('soap12:Body')
        .ele(soapAction, {
          xmlns: 'http://www.issnetonline.com.br/webserviceabrasf/homolog'
        })
          .ele('ArquivoXML').txt(`<![CDATA[${xmlBody}]]>`).up()
        .up()
      .up();
  
  return doc.end({ prettyPrint: true });
}

/**
 * Utilitários de formatação
 */

function formatDateTimeXml(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

function formatDateXml(date: Date): string {
  return date.toISOString().substring(0, 10);
}

function formatCurrency(value: number): string {
  return value.toFixed(2);
}

function formatPercentage(rate: number): string {
  return (rate * 100).toFixed(4);
}

/**
 * Parseia resposta XML do ISSNet
 */
export function parseISSNetResponse(xmlResponse: string) {
  try {
    // Remove CDATA se presente
    const cleanXml = xmlResponse.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
    
    // Aqui você implementaria um parser XML robusto
    // Por simplicidade, usando regex para extrair informações básicas
    
    const protocolMatch = cleanXml.match(/<Protocolo>([^<]+)<\/Protocolo>/);
    const nfseNumberMatch = cleanXml.match(/<Numero>([^<]+)<\/Numero>/);
    const verificationCodeMatch = cleanXml.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/);
    const errorsMatch = cleanXml.match(/<MensagemRetorno>([^<]+)<\/MensagemRetorno>/g);
    
    return {
      success: !errorsMatch || errorsMatch.length === 0,
      protocol: protocolMatch?.[1],
      nfse_number: nfseNumberMatch?.[1],
      verification_code: verificationCodeMatch?.[1],
      errors: errorsMatch?.map(match => match.replace(/<\/?MensagemRetorno>/g, '')) || [],
      xml_response: cleanXml
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [`Erro ao processar resposta: ${error instanceof Error ? error.message : String(error)}`],
      xml_response: xmlResponse
    };
  }
}

/**
 * Valida XML contra estrutura básica ABRASF
 */
export function validateABRASFXml(xml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validações básicas
  if (!xml.includes('xmlns="http://www.abrasf.org.br/nfse.xsd"')) {
    errors.push('Namespace ABRASF não encontrado');
  }
  
  if (!xml.includes('<CpfCnpj>')) {
    errors.push('Identificação do prestador não encontrada');
  }
  
  if (!xml.includes('<InscricaoMunicipal>')) {
    errors.push('Inscrição municipal não encontrada');
  }
  
  if (!xml.includes('<ValorServicos>')) {
    errors.push('Valor dos serviços não encontrado');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
