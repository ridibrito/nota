import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('=== UPLOAD SIMPLES DE CERTIFICADO ===');
    
    const formData = await req.formData();
    const companyId = formData.get('companyId') as string;
    const passphrase = formData.get('passphrase') as string;
    const pfxFile = formData.get('certificate') as File;

    console.log('Dados recebidos:', {
      companyId,
      hasPassphrase: !!passphrase,
      fileName: pfxFile?.name,
      fileSize: pfxFile?.size
    });

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

    console.log('Validações básicas OK');

    // Verifica se a empresa existe
    const supabaseAdmin = getSupabaseAdmin();
    console.log('Verificando empresa...');
    
    const { data: company, error: companyError } = await (supabaseAdmin as any)
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('Empresa não encontrada:', companyError);
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    console.log('Empresa encontrada:', company.name);

    // Converte arquivo para buffer
    console.log('Convertendo arquivo...');
    const arrayBuffer = await pfxFile.arrayBuffer();
    const pfxBuffer = Buffer.from(arrayBuffer);
    console.log('Arquivo convertido, tamanho:', pfxBuffer.length);

    // Validação básica do arquivo
    if (pfxBuffer.length < 100) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito pequeno para ser um certificado válido' },
        { status: 400 }
      );
    }

    // Para testes, vamos armazenar sem criptografia (APENAS PARA DESENVOLVIMENTO)
    const storagePath = `certificates/${companyId}/${Date.now()}_${pfxFile.name}`;
    
    console.log('Removendo certificado anterior...');
    // Remove certificado anterior se existir
    const { data: existingCert } = await (supabaseAdmin as any)
      .from('certificates')
      .select('id')
      .eq('company_id', companyId)
      .single();

    if (existingCert) {
      await (supabaseAdmin as any)
        .from('certificates')
        .delete()
        .eq('company_id', companyId);
      console.log('Certificado anterior removido');
    }

    console.log('Salvando novo certificado...');
    
    // Salva certificado (versão simplificada para testes)
    const { data: certificate, error: certError } = await (supabaseAdmin as any)
      .from('certificates')
      .insert({
        company_id: companyId,
        storage_path: storagePath,
        pfx_iv: 'test_iv', // Dummy para testes
        pfx_tag: 'test_tag', // Dummy para testes
        pfx_ciphertext: pfxBuffer.toString('base64'), // Base64 simples para testes
        passphrase_ciphertext: Buffer.from(passphrase).toString('base64') // Base64 simples para testes
      })
      .select()
      .single();

    if (certError) {
      console.error('Erro ao salvar certificado:', certError);
      throw certError;
    }

    console.log('Certificado salvo com sucesso:', certificate.id);

    return NextResponse.json({
      success: true,
      message: 'Certificado carregado com sucesso (modo teste)',
      data: {
        certificate_id: certificate.id,
        file_name: pfxFile.name,
        file_size: pfxBuffer.length,
        uploaded_at: certificate.created_at
      }
    });

  } catch (error) {
    console.error('=== ERRO NO UPLOAD ===');
    console.error('Tipo do erro:', typeof error);
    console.error('Erro completo:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');

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
