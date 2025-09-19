import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { 
  encryptCertificateSimple,
  validatePfxBasic
} from '@/lib/crypto/simple-crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('Iniciando upload de certificado...');
    const formData = await req.formData();
    
    const companyId = formData.get('companyId') as string;
    const passphrase = formData.get('passphrase') as string;
    const pfxFile = formData.get('certificate') as File;

    // Validações básicas
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    if (!passphrase) {
      return NextResponse.json(
        { success: false, error: 'Senha do certificado é obrigatória' },
        { status: 400 }
      );
    }

    if (!pfxFile) {
      return NextResponse.json(
        { success: false, error: 'Arquivo de certificado é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica se a empresa existe
    const supabaseAdmin = getSupabaseAdmin();
    const { data: company, error: companyError } = await (supabaseAdmin as any)
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Converte arquivo para buffer
    const arrayBuffer = await pfxFile.arrayBuffer();
    const pfxBuffer = Buffer.from(arrayBuffer);

    // Valida certificado (versão simplificada)
    console.log('Validando certificado...');
    try {
      const isValid = validatePfxBasic(pfxBuffer, passphrase);
      if (!isValid) {
        throw new Error('Certificado inválido');
      }
      console.log('Certificado validado com sucesso');
    } catch (certError) {
      console.error('Erro ao validar certificado:', certError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao carregar certificado',
          details: certError instanceof Error ? certError.message : 'Verifique se o arquivo e a senha estão corretos'
        },
        { status: 400 }
      );
    }

    // Criptografa certificado para armazenamento
    console.log('Criptografando certificado...');
    const encryptionKey = process.env.CERT_ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.error('Chave de criptografia não configurada');
      throw new Error('Chave de criptografia não configurada');
    }

    const encryptedData = encryptCertificateSimple(
      pfxBuffer,
      passphrase,
      encryptionKey
    );
    console.log('Certificado criptografado com sucesso');

    // Gera nome único para o arquivo no storage
    const storagePath = `certificates/${companyId}/${Date.now()}_certificate.pfx`;

    // Remove certificado anterior se existir
    const { data: existingCert } = await supabaseAdmin
      .from('certificates')
      .select('id, storage_path')
      .eq('company_id', companyId)
      .single();

    if (existingCert) {
      // Remove arquivo anterior do storage (se necessário)
      // await supabase.storage.from('certificates').remove([existingCert.storage_path]);
      
      // Remove registro anterior
      await supabaseAdmin
        .from('certificates')
        .delete()
        .eq('company_id', companyId);
    }

    // Salva novo certificado
      const { data: certificate, error: certError } = await (supabaseAdmin as any)
      .from('certificates')
      .insert({
        company_id: companyId,
        storage_path: storagePath,
        pfx_iv: encryptedData.pfx_iv,
        pfx_tag: 'dummy_tag', // Tag dummy para compatibilidade
        pfx_ciphertext: encryptedData.pfx_ciphertext,
        passphrase_ciphertext: encryptedData.passphrase_ciphertext
      })
      .select()
      .single();

    if (certError) {
      throw certError;
    }

      return NextResponse.json({
        success: true,
        message: 'Certificado carregado com sucesso',
        data: {
          certificate_id: certificate.id,
          certificate_info: {
            uploaded_at: certificate.created_at,
            file_size: pfxBuffer.length,
            storage_path: storagePath
          }
        }
      });

  } catch (error) {
    console.error('Erro ao fazer upload do certificado:', error);

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

// Endpoint para obter informações do certificado atual
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    // Busca certificado atual
    const supabaseAdmin = getSupabaseAdmin();
    const { data: certificate, error } = await (supabaseAdmin as any)
      .from('certificates')
      .select('id, created_at')
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    if (!certificate) {
      return NextResponse.json({
        success: true,
        data: {
          has_certificate: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        has_certificate: true,
        certificate_id: certificate.id,
        uploaded_at: certificate.created_at
      }
    });

  } catch (error) {
    console.error('Erro ao buscar informações do certificado:', error);

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

// Endpoint para remover certificado
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    // Remove certificado
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await (supabaseAdmin as any)
      .from('certificates')
      .delete()
      .eq('company_id', companyId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Certificado removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover certificado:', error);

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
