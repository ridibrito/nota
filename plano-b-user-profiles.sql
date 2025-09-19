-- PLANO B: Se não conseguir alterar o tipo da coluna id
-- Execute este script se o anterior não funcionar completamente

-- PASSO 1: Apenas adicionar as colunas faltantes (sem alterar id)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'operator';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- PASSO 2: Gerar um UUID válido para usar
SELECT gen_random_uuid() as uuid_gerado;

-- PASSO 3: Inserir usuário com UUID válido
-- IMPORTANTE: Substitua o UUID abaixo pelo que foi gerado acima
INSERT INTO user_profiles (id, email, name, role, company_id) 
VALUES (gen_random_uuid(), 'usuario@teste.com', 'Usuário Teste', 'admin', 'e8281131-097c-49c4-ab97-078a8c7f4e65'::uuid)
ON CONFLICT (email) DO UPDATE SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    updated_at = CURRENT_TIMESTAMP;

-- PASSO 4: Verificar o UUID do usuário inserido
SELECT 'UUID DO USUÁRIO CRIADO (ANOTE ESTE UUID):' as info;
SELECT id, email, name, role FROM user_profiles WHERE email = 'usuario@teste.com';

-- IMPORTANTE: Anote o UUID retornado acima para usar no código!
