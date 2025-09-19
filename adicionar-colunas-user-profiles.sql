-- Script para adicionar colunas faltantes na tabela user_profiles
-- Execute este script no painel do Supabase (Dashboard > SQL Editor)

-- Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Adicionar coluna 'name' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'name'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Coluna name adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna name já existe';
    END IF;
END $$;

-- Adicionar coluna 'password_hash' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN password_hash TEXT;
        RAISE NOTICE 'Coluna password_hash adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna password_hash já existe';
    END IF;
END $$;

-- Adicionar coluna 'role' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN role VARCHAR(50) DEFAULT 'operator';
        RAISE NOTICE 'Coluna role adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna role já existe';
    END IF;
END $$;

-- Adicionar coluna 'company_id' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN company_id UUID;
        RAISE NOTICE 'Coluna company_id adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna company_id já existe';
    END IF;
END $$;

-- Adicionar coluna 'created_at' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Coluna created_at adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna created_at já existe';
    END IF;
END $$;

-- Adicionar coluna 'updated_at' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Coluna updated_at adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe';
    END IF;
END $$;

-- Inserir ou atualizar usuário de teste
INSERT INTO user_profiles (
    id, 
    email, 
    name, 
    role, 
    company_id,
    created_at,
    updated_at
) VALUES (
    'mock-user-id',
    'usuario@teste.com',
    'Usuário Teste',
    'admin',
    'e8281131-097c-49c4-ab97-078a8c7f4e65',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    updated_at = CURRENT_TIMESTAMP;

-- Verificar estrutura final da tabela
SELECT 'Estrutura final da tabela user_profiles:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Verificar dados inseridos
SELECT 'Dados na tabela user_profiles:' as info;
SELECT id, email, name, role, company_id, created_at, updated_at 
FROM user_profiles 
WHERE id = 'mock-user-id';

SELECT 'Script executado com sucesso! ✅' as status;
