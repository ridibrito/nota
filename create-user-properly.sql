-- ========================================
-- CRIAR USUÁRIO ATRAVÉS DO SUPABASE AUTH
-- ========================================

-- 1. Primeiro, delete o usuário existente se houver problemas
DELETE FROM user_profiles WHERE email = 'admin@empresa.com';
DELETE FROM auth.users WHERE email = 'admin@empresa.com';

-- 2. Verificar se a empresa existe
SELECT id, name FROM companies WHERE cnpj = '12345678000190';

-- 3. Agora você deve criar o usuário pelo painel do Supabase:
-- Vá em Authentication > Users > Add User
-- Email: admin@empresa.com
-- Password: 123456
-- Auto Confirm User: SIM (marque esta opção)

-- 4. Após criar pelo painel, execute este SQL para criar o perfil:
INSERT INTO user_profiles (id, email, role, company_id) 
SELECT 
  u.id,
  u.email,
  'admin',
  c.id
FROM auth.users u, companies c 
WHERE u.email = 'admin@empresa.com' 
  AND c.cnpj = '12345678000190';

-- 5. Verificar se foi criado corretamente
SELECT 
  u.email,
  u.email_confirmed_at,
  up.role,
  c.name as company_name
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN companies c ON up.company_id = c.id
WHERE u.email = 'admin@empresa.com';
