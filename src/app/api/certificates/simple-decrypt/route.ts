import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await req.json();

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    // Busca certificado
    const supabaseAdmin = getSupabaseAdmin();
    const { data: certificate, error: certError } = await (supabaseAdmin as any)
      .from('certificates')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (certError || !certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificado não encontrado' },
        { status: 404 }
      );
    }

    console.log('Certificado encontrado:', {
      id: certificate.id,
      pfx_iv: certificate.pfx_iv,
      pfx_size: certificate.pfx_ciphertext?.length,
      pass_size: certificate.passphrase_ciphertext?.length
    });

    // Tenta descriptografar de forma simples (base64)
    try {
      const pfxBuffer = Buffer.from(certificate.pfx_ciphertext, 'base64');
      const passphrase = Buffer.from(certificate.passphrase_ciphertext, 'base64').toString('utf8');
      
      console.log('Descriptografia simples OK:', {
        pfxSize: pfxBuffer.length,
        passphraseLength: passphrase.length
      });

      return NextResponse.json({
        success: true,
        data: {
          pfx_size: pfxBuffer.length,
          passphrase_length: passphrase.length,
          pfx_header: pfxBuffer.subarray(0, 10).toString('hex'),
          method: 'simple_base64'
        }
      });
    } catch (simpleError) {
      console.log('Descriptografia simples falhou:', simpleError.message);
      
      // Tenta descriptografar com AES se simples falhar
      try {
        const { decryptCertificateSimple } = await import('@/lib/crypto/simple-crypto');
        
        const encryptionKey = process.env.CERT_ENCRYPTION_KEY;
        if (!encryptionKey) {
          throw new Error('Chave de criptografia não configurada');
        }

        const decryptedCert = decryptCertificateSimple(
          {
            pfx_ciphertext: certificate.pfx_ciphertext,
            pfx_iv: certificate.pfx_iv,
            passphrase_ciphertext: certificate.passphrase_ciphertext
          },
          encryptionKey
        );
        
        console.log('Descriptografia AES OK:', {
          pfxSize: decryptedCert.pfxBuffer.length,
          passphraseLength: decryptedCert.passphrase.length
        });

        return NextResponse.json({
          success: true,
          data: {
            pfx_size: decryptedCert.pfxBuffer.length,
            passphrase_length: decryptedCert.passphrase.length,
            pfx_header: decryptedCert.pfxBuffer.subarray(0, 10).toString('hex'),
            method: 'aes_encrypted'
          }
        });
      } catch (aesError) {
        console.error('Descriptografia AES também falhou:', aesError);
        
        return NextResponse.json({
          success: false,
          error: 'Não foi possível descriptografar o certificado com nenhum método',
          details: {
            simple_error: simpleError.message,
            aes_error: aesError instanceof Error ? aesError.message : String(aesError),
            certificate_info: {
              pfx_iv: certificate.pfx_iv,
              pfx_iv_length: certificate.pfx_iv?.length,
              pfx_ciphertext_length: certificate.pfx_ciphertext?.length
            }
          }
        });
      }
    }

  } catch (error) {
    console.error('Erro geral:', error);
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
