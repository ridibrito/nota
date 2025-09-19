import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

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

    console.log('Buscando informações do certificado para empresa:', companyId);

    const supabaseAdmin = getSupabaseAdmin();

    // Buscar certificado da empresa
    const { data: certificate, error: certError } = await (supabaseAdmin as any)
      .from('certificates')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (certError) {
      if (certError.code === 'PGRST116') {
        // Nenhum certificado encontrado
        console.log('Nenhum certificado encontrado para a empresa');
        return NextResponse.json({
          success: true,
          data: null,
          message: 'Nenhum certificado encontrado'
        });
      }
      
      console.error('Erro ao buscar certificado:', certError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar certificado' },
        { status: 500 }
      );
    }

    console.log('Certificado encontrado:', {
      id: certificate.id,
      storage_path: certificate.storage_path,
      created_at: certificate.created_at
    });

    // Buscar informações do arquivo no storage
    let fileSize = 0;
    try {
      console.log('Tentando obter tamanho do arquivo...');
      console.log('Storage path:', certificate.storage_path);
      
      // Método 1: Tentar download para obter tamanho
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('certificates')
        .download(certificate.storage_path);

      if (!downloadError && fileData) {
        fileSize = fileData.size;
        console.log('✅ Tamanho obtido via download:', fileSize);
      } else {
        console.log('❌ Download falhou:', downloadError?.message);
        
        // Método 2: Listar arquivos na pasta
        const pathParts = certificate.storage_path.split('/');
        const fileName = pathParts.pop();
        const folderPath = pathParts.slice(0, -1).join('/');
        
        console.log('Tentando listar arquivos na pasta:', folderPath);
        console.log('Procurando arquivo:', fileName);
        
        const { data: fileList, error: listError } = await supabaseAdmin.storage
          .from('certificates')
          .list(folderPath);

        console.log('Resultado da listagem:', { fileList, listError });

        if (!listError && fileList) {
          const file = fileList.find(f => f.name === fileName);
          if (file) {
            fileSize = file.metadata?.size || 0;
            console.log('✅ Tamanho obtido via listagem:', fileSize);
          } else {
            console.log('❌ Arquivo não encontrado na listagem');
          }
        }
        
        // Método 3: Se ainda for 0, usar tamanho estimado
        if (fileSize === 0) {
          fileSize = 2048; // Tamanho típico de certificado A1
          console.log('⚠️ Usando tamanho estimado:', fileSize);
        }
      }
    } catch (storageError) {
      console.error('❌ Erro geral no storage:', storageError);
      fileSize = 2048; // Fallback
    }

    // Retornar informações do certificado
    const certificateInfo = {
      id: certificate.id,
      uploaded_at: certificate.created_at,
      file_size: fileSize,
      storage_path: certificate.storage_path,
      // TODO: Adicionar informações do certificado (CN, validade, etc.) quando implementar descriptografia
      valid_until: null,
      subject: null,
      issuer: null
    };

    return NextResponse.json({
      success: true,
      data: certificateInfo
    });

  } catch (error) {
    console.error('Erro na API de informações do certificado:', error);
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
