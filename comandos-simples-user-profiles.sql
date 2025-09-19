-- Comandos simples para executar um por vez no Supabase

-- 1. Ver estrutura atual da tabela
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_profiles';

-- 2. Adicionar coluna name
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- 3. Adicionar coluna password_hash
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 4. Adicionar coluna role
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'operator';

-- 5. Adicionar coluna company_id
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_id UUID;

-- 6. Adicionar colunas de timestamp
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 7. Inserir usuário de teste
INSERT INTO user_profiles (id, email, name, role, company_id) 
VALUES ('mock-user-id', 'usuario@teste.com', 'Usuário Teste', 'admin', 'e8281131-097c-49c4-ab97-078a8c7f4e65')
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    updated_at = CURRENT_TIMESTAMP;

-- 8. Verificar resultado
SELECT * FROM user_profiles WHERE id = 'mock-user-id';
