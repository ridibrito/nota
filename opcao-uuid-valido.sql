-- OPÇÃO ALTERNATIVA: Usar UUID válido ao invés de alterar o tipo da coluna
-- Execute este script se preferir manter a coluna id como UUID

-- Gerar um UUID válido para usar como ID do usuário de teste
SELECT gen_random_uuid() as novo_uuid_para_usuario;

-- Inserir usuário usando UUID válido
-- SUBSTITUA o UUID abaixo pelo que foi gerado acima
INSERT INTO user_profiles (id, email, name, role, company_id) 
VALUES ('12345678-1234-1234-1234-123456789abc'::uuid, 'usuario@teste.com', 'Usuário Teste', 'admin', 'e8281131-097c-49c4-ab97-078a8c7f4e65'::uuid)
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    updated_at = CURRENT_TIMESTAMP;

-- Verificar o usuário inserido e pegar o UUID real
SELECT id, email, name, role FROM user_profiles WHERE email = 'usuario@teste.com';

-- IMPORTANTE: Anote o UUID gerado para usar nas APIs!
