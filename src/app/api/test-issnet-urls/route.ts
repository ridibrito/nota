import { NextResponse } from 'next/server';
import axios from 'axios';

export const runtime = 'nodejs';

export async function GET() {
  const urlsToTest = [
    'https://homologacao.issnetonline.com.br/abrasf204/nfse.asmx',
    'https://www.issnetonline.com.br/abrasf204/nfse.asmx',
    'https://homologacao.issnetonline.com.br/webserviceabrasf/homolog/nfse.asmx',
    'https://www.issnetonline.com.br/webserviceabrasf/nfse.asmx'
  ];

  const results = [];

  for (const url of urlsToTest) {
    try {
      console.log(`Testando URL: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true // Aceita qualquer status
      });
      
      results.push({
        url,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers['content-type'],
        responseSize: response.data?.length || 0,
        isWSDL: response.data?.includes('wsdl') || false,
        success: response.status < 400
      });
      
    } catch (error) {
      results.push({
        url,
        error: error instanceof Error ? error.message : String(error),
        success: false
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      tested_urls: urlsToTest.length,
      results
    }
  });
}
