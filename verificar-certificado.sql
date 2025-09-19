-- Verificar como o certificado foi salvo no banco
SELECT 
  id,
  company_id,
  storage_path,
  pfx_iv,
  pfx_tag,
  LENGTH(pfx_ciphertext) as pfx_size,
  LENGTH(passphrase_ciphertext) as pass_size,
  created_at
FROM certificates 
WHERE company_id = 'e8281131-097c-49c4-ab97-078a8c7f4e65';

-- Ver os primeiros caracteres para identificar o formato
SELECT 
  id,
  LEFT(pfx_iv, 20) as pfx_iv_sample,
  LEFT(pfx_ciphertext, 50) as pfx_sample,
  LEFT(passphrase_ciphertext, 50) as pass_sample
FROM certificates 
WHERE company_id = 'e8281131-097c-49c4-ab97-078a8c7f4e65';
