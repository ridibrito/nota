-- Script para corrigir o problema de UUID na tabela user_profiles
-- Execute este script no painel do Supabase (Dashboard > SQL Editor)

-- OPÇÃO 1: Alterar o tipo da coluna id de UUID para TEXT
-- (Recomendado se você quer manter 'mock-user-id' como ID)

-- Primeiro, verificar o tipo atual da coluna id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'id';

-- Alterar o tipo da coluna id de UUID para TEXT
ALTER TABLE user_profiles ALTER COLUMN id TYPE TEXT;

-- Verificar se a alteração funcionou
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'id';

-- Agora inserir o usuário de teste (deve funcionar)
INSERT INTO user_profiles (id, email, name, role, company_id) 
VALUES ('mock-user-id', 'usuario@teste.com', 'Usuário Teste', 'admin', 'e8281131-097c-49c4-ab97-078a8c7f4e65')
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    updated_at = CURRENT_TIMESTAMP;

-- Verificar se o usuário foi inserido
SELECT * FROM user_profiles WHERE id = 'mock-user-id';

SELECT '✅ Usuário de teste criado com sucesso!' as status;
