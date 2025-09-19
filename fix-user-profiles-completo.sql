-- Script completo para corrigir a tabela user_profiles
-- Execute este script no painel do Supabase (Dashboard > SQL Editor)

-- PASSO 1: Verificar estrutura atual
SELECT 'ESTRUTURA ATUAL:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- PASSO 2: Verificar políticas existentes
SELECT 'POLÍTICAS EXISTENTES:' as info;
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- PASSO 3: Remover políticas temporariamente (se existirem)
DROP POLICY IF EXISTS "webhook_configs_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- PASSO 4: Desabilitar RLS temporariamente
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- PASSO 5: Adicionar colunas faltantes (uma por vez)
DO $$ 
BEGIN
    -- Adicionar coluna name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'name'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN name VARCHAR(255);
        RAISE NOTICE '✅ Coluna name adicionada';
    END IF;

    -- Adicionar coluna password_hash
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN password_hash TEXT;
        RAISE NOTICE '✅ Coluna password_hash adicionada';
    END IF;

    -- Adicionar coluna role
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN role VARCHAR(50) DEFAULT 'operator';
        RAISE NOTICE '✅ Coluna role adicionada';
    END IF;

    -- Adicionar coluna company_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN company_id UUID;
        RAISE NOTICE '✅ Coluna company_id adicionada';
    END IF;

    -- Adicionar colunas de timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Coluna created_at adicionada';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Coluna updated_at adicionada';
    END IF;
END $$;

-- PASSO 6: Tentar alterar o tipo da coluna id (agora sem políticas)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE user_profiles ALTER COLUMN id TYPE TEXT;
        RAISE NOTICE '✅ Tipo da coluna id alterado para TEXT';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  Não foi possível alterar tipo da coluna id: %', SQLERRM;
            RAISE NOTICE 'Continuando com UUID...';
    END;
END $$;

-- PASSO 7: Inserir usuário de teste
-- Primeiro, tentar com TEXT (se a alteração funcionou)
DO $$
DECLARE
    id_type text;
BEGIN
    -- Verificar o tipo atual da coluna id
    SELECT data_type INTO id_type
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'id';
    
    IF id_type = 'text' THEN
        -- Usar ID como texto
        INSERT INTO user_profiles (id, email, name, role, company_id) 
        VALUES ('mock-user-id', 'usuario@teste.com', 'Usuário Teste', 'admin', 'e8281131-097c-49c4-ab97-078a8c7f4e65')
        ON CONFLICT (id) DO UPDATE SET 
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            company_id = EXCLUDED.company_id,
            updated_at = CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Usuário inserido com ID texto';
    ELSE
        -- Usar UUID válido
        INSERT INTO user_profiles (id, email, name, role, company_id) 
        VALUES ('12345678-1234-1234-1234-123456789abc'::uuid, 'usuario@teste.com', 'Usuário Teste', 'admin', 'e8281131-097c-49c4-ab97-078a8c7f4e65'::uuid)
        ON CONFLICT (id) DO UPDATE SET 
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            company_id = EXCLUDED.company_id,
            updated_at = CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Usuário inserido com UUID';
    END IF;
END $$;

-- PASSO 8: Reabilitar RLS e recriar políticas básicas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política simples para permitir tudo por enquanto (para desenvolvimento)
CREATE POLICY "allow_all_for_development" ON user_profiles
    FOR ALL USING (true);

-- PASSO 9: Verificar resultado final
SELECT 'ESTRUTURA FINAL:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

SELECT 'DADOS INSERIDOS:' as info;
SELECT id, email, name, role, company_id, created_at 
FROM user_profiles 
LIMIT 5;

SELECT '✅ Script executado com sucesso!' as status;
