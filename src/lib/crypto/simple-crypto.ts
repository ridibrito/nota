/**
 * Sistema de criptografia simplificado para certificados
 * Versão mais robusta usando apenas Node.js crypto nativo
 */

import crypto from 'node:crypto';

/**
 * Criptografa dados usando AES-256-CBC
 */
export function encryptData(data: Buffer, key: string): {
  iv: Buffer;
  encrypted: Buffer;
} {
  const keyBuffer = Buffer.from(key, 'base64');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer.subarray(0, 32), iv);
  
  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final()
  ]);
  
  return { iv, encrypted };
}

/**
 * Descriptografa dados usando AES-256-CBC
 */
export function decryptData(encrypted: Buffer, key: string, iv: Buffer): Buffer {
  const keyBuffer = Buffer.from(key, 'base64');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer.subarray(0, 32), iv);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted;
}

/**
 * Criptografa certificado para armazenamento (versão simplificada)
 */
export function encryptCertificateSimple(
  pfxBuffer: Buffer,
  passphrase: string,
  encryptionKey: string
) {
  console.log('Iniciando criptografia simples...');
  
  try {
    // Criptografa o arquivo PFX
    const pfxResult = encryptData(pfxBuffer, encryptionKey);
    
    // Criptografa a senha
    const passphraseResult = encryptData(Buffer.from(passphrase, 'utf8'), encryptionKey);
    
    console.log('Criptografia concluída com sucesso');
    
    return {
      pfx_iv: pfxResult.iv.toString('base64'),
      pfx_ciphertext: pfxResult.encrypted.toString('base64'),
      passphrase_iv: passphraseResult.iv.toString('base64'),
      passphrase_ciphertext: passphraseResult.encrypted.toString('base64')
    };
  } catch (error) {
    console.error('Erro na criptografia:', error);
    throw new Error(`Erro ao criptografar: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Descriptografa certificado do armazenamento (versão simplificada)
 */
export function decryptCertificateSimple(
  encryptedData: {
    pfx_iv: string;
    pfx_ciphertext: string;
    passphrase_ciphertext: string;
  },
  encryptionKey: string
): { pfxBuffer: Buffer; passphrase: string } {
  try {
    console.log('Iniciando descriptografia do certificado...');
    
    // Descriptografa o arquivo PFX
    const pfxBuffer = decryptData(
      Buffer.from(encryptedData.pfx_ciphertext, 'base64'),
      encryptionKey,
      Buffer.from(encryptedData.pfx_iv, 'base64')
    );
    
    // Descriptografa a senha (usando o mesmo IV por simplicidade)
    const passphraseBuffer = decryptData(
      Buffer.from(encryptedData.passphrase_ciphertext, 'base64'),
      encryptionKey,
      Buffer.from(encryptedData.pfx_iv, 'base64') // Usando mesmo IV
    );
    
    console.log('Descriptografia concluída com sucesso');
    
    return {
      pfxBuffer,
      passphrase: passphraseBuffer.toString('utf8')
    };
  } catch (error) {
    console.error('Erro na descriptografia:', error);
    throw new Error(`Erro ao descriptografar: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Valida certificado PFX básico (sem usar node-forge)
 */
export function validatePfxBasic(pfxBuffer: Buffer, passphrase: string): boolean {
  try {
    // Validação básica - verifica se é um arquivo PKCS#12
    const header = pfxBuffer.subarray(0, 4);
    
    // PKCS#12 files começam com estes bytes
    const pkcs12Headers = [
      Buffer.from([0x30, 0x82]), // DER encoded
      Buffer.from([0x30, 0x83]), // DER encoded (longer)
    ];
    
    const isValidHeader = pkcs12Headers.some(validHeader => 
      header.subarray(0, validHeader.length).equals(validHeader)
    );
    
    if (!isValidHeader) {
      throw new Error('Arquivo não parece ser um certificado PKCS#12 válido');
    }
    
    // Validações básicas
    if (pfxBuffer.length < 100) {
      throw new Error('Arquivo muito pequeno para ser um certificado válido');
    }
    
    if (!passphrase || passphrase.length < 1) {
      throw new Error('Senha do certificado é obrigatória');
    }
    
    return true;
  } catch (error) {
    console.error('Validação básica falhou:', error);
    return false;
  }
}
