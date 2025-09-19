/**
 * Cliente SOAP para ISSNet DF
 * Suporte para TLS mútua e certificados cliente
 */

import https from 'https';
import axios, { AxiosResponse } from 'axios';
import { buildSoapEnvelope } from './xmlTemplates';

interface SOAPClientOptions {
  url: string;
  timeout?: number;
  clientCert?: {
    cert: Buffer;
    key: Buffer;
    passphrase?: string;
  };
}

interface SOAPCallParams {
  action: string;
  xmlBody: string;
  soapAction: string;
}

/**
 * Cliente SOAP genérico com suporte a TLS mútua
 */
export class ISSNetSOAPClient {
  private options: SOAPClientOptions;
  private agent?: https.Agent;

  constructor(options: SOAPClientOptions) {
    this.options = options;
    
    // Configura agent HTTPS se certificado cliente for fornecido
    if (options.clientCert) {
      this.agent = new https.Agent({
        cert: options.clientCert.cert,
        key: options.clientCert.key,
        passphrase: options.clientCert.passphrase,
        rejectUnauthorized: true,
        keepAlive: true
      });
    }
  }

  /**
   * Executa chamada SOAP
   */
  async call(params: SOAPCallParams): Promise<string> {
    const { action, xmlBody, soapAction } = params;
    
    try {
      // Constrói envelope SOAP
      const envelope = buildSoapEnvelope(xmlBody, action);
      
      // Headers SOAP 1.2
      const headers = {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'SOAPAction': `"http://www.issnetonline.com.br/webserviceabrasf/homolog/${soapAction}"`,
        'User-Agent': 'NFS-e Emissor DF/1.0'
      };
      
      console.log('Enviando requisição SOAP:', {
        url: this.options.url,
        action: soapAction,
        bodyLength: envelope.length
      });
      
      // Executa requisição
      const response: AxiosResponse<string> = await axios.post(
        this.options.url,
        envelope,
        {
          httpsAgent: this.agent,
          headers,
          timeout: this.options.timeout || 30000,
          responseType: 'text'
        }
      );
      
      console.log('Resposta SOAP recebida:', {
        status: response.status,
        contentLength: response.data.length
      });
      
      return response.data;
      
    } catch (error) {
      console.error('Erro na chamada SOAP:', error);
      
      if (axios.isAxiosError(error)) {
        throw new Error(`Erro SOAP: ${error.response?.status} - ${error.response?.statusText || error.message}`);
      }
      
      throw error;
    }
  }
}

/**
 * Cliente específico para ISSNet DF
 */
export class ISSNetDFClient {
  private soapClient: ISSNetSOAPClient;
  private environment: 'homolog' | 'prod';

  constructor(environment: 'homolog' | 'prod' = 'homolog', clientCert?: { cert: Buffer; key: Buffer; passphrase?: string }) {
    this.environment = environment;
    
    const urls = {
      homolog: process.env.ISSNET_SOAP_URL_HOMOLOG || 'https://homologacao.issnetonline.com.br/abrasf204/nfse.asmx',
      prod: process.env.ISSNET_SOAP_URL_PROD || 'https://www.issnetonline.com.br/abrasf204/nfse.asmx'
    };
    
    this.soapClient = new ISSNetSOAPClient({
      url: urls[environment],
      timeout: parseInt(process.env.ISSNET_SOAP_TIMEOUT_MS || '30000'),
      clientCert
    });
  }

  /**
   * Envia lote RPS síncrono
   */
  async enviarLoteRpsSincrono(xmlRps: string): Promise<string> {
    return this.soapClient.call({
      action: 'RecepcionarLoteRpsSincrono',
      xmlBody: xmlRps,
      soapAction: 'RecepcionarLoteRpsSincrono'
    });
  }

  /**
   * Consulta lote RPS por protocolo
   */
  async consultarLoteRps(xmlConsulta: string): Promise<string> {
    return this.soapClient.call({
      action: 'ConsultarLoteRps',
      xmlBody: xmlConsulta,
      soapAction: 'ConsultarLoteRps'
    });
  }

  /**
   * Consulta NFS-e por número ou período
   */
  async consultarNfse(xmlConsulta: string): Promise<string> {
    return this.soapClient.call({
      action: 'ConsultarNfse',
      xmlBody: xmlConsulta,
      soapAction: 'ConsultarNfse'
    });
  }

  /**
   * Cancela NFS-e
   */
  async cancelarNfse(xmlCancelamento: string): Promise<string> {
    return this.soapClient.call({
      action: 'CancelarNfse',
      xmlBody: xmlCancelamento,
      soapAction: 'CancelarNfse'
    });
  }
}

/**
 * Factory para criar cliente ISSNet
 */
export function createISSNetClient(
  environment?: 'homolog' | 'prod',
  clientCert?: { cert: Buffer; key: Buffer; passphrase?: string }
): ISSNetDFClient {
  const env = environment || (process.env.ISSNET_ENV as 'homolog' | 'prod') || 'homolog';
  return new ISSNetDFClient(env, clientCert);
}

/**
 * Utilitários para logging e debugging
 */
export function maskSensitiveData(xml: string): string {
  return xml
    .replace(/(<Cnpj>)([^<]+)(<\/Cnpj>)/g, '$1***$3')
    .replace(/(<Cpf>)([^<]+)(<\/Cpf>)/g, '$1***$3')
    .replace(/(<InscricaoMunicipal>)([^<]+)(<\/InscricaoMunicipal>)/g, '$1***$3')
    .replace(/(<Email>)([^<]+)(<\/Email>)/g, '$1***$3')
    .replace(/(<Signature>)([\s\S]*?)(<\/Signature>)/g, '$1[SIGNATURE_REMOVED]$3');
}

/**
 * Extrai erros da resposta SOAP
 */
export function extractSOAPErrors(soapResponse: string): string[] {
  const errors: string[] = [];
  
  try {
    // Procura por fault SOAP
    const faultMatch = soapResponse.match(/<soap:Fault>([\s\S]*?)<\/soap:Fault>/);
    if (faultMatch) {
      const faultString = faultMatch[1].match(/<faultstring>(.*?)<\/faultstring>/);
      if (faultString) {
        errors.push(`SOAP Fault: ${faultString[1]}`);
      }
    }
    
    // Procura por erros específicos do ISSNet
    const errorMatches = soapResponse.match(/<MensagemRetorno>(.*?)<\/MensagemRetorno>/g);
    if (errorMatches) {
      errorMatches.forEach(match => {
        const message = match.replace(/<\/?MensagemRetorno>/g, '');
        if (message.trim()) {
          errors.push(message.trim());
        }
      });
    }
    
  } catch (error) {
    errors.push(`Erro ao processar resposta: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return errors;
}

/**
 * Valida conectividade com ISSNet
 */
export async function testISSNetConnection(environment: 'homolog' | 'prod' = 'homolog'): Promise<{
  success: boolean;
  message: string;
  responseTime?: number;
}> {
  try {
    const client = createISSNetClient(environment);
    const startTime = Date.now();
    
    // Tenta uma consulta simples (que deve falhar por falta de dados, mas testa conectividade)
    try {
      await client.consultarNfse('<ConsultarNfseEnvio xmlns="http://www.abrasf.org.br/nfse.xsd"></ConsultarNfseEnvio>');
    } catch (error) {
      // Esperamos erro aqui, mas se chegou até o servidor, a conectividade está OK
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('SOAP') || errorMessage.includes('400') || errorMessage.includes('500')) {
        return {
          success: true,
          message: 'Conectividade OK - Servidor ISSNet respondeu',
          responseTime: Date.now() - startTime
        };
      }
      throw error;
    }
    
    return {
      success: true,
      message: 'Conectividade OK',
      responseTime: Date.now() - startTime
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Erro de conectividade: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
