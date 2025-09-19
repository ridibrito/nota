-- ========================================
-- LIMPAR DADOS DE TESTE DO EMISSOR NFS-e DF
-- ========================================

-- Remover invoices de teste
DELETE FROM invoices WHERE company_id IN (
  SELECT id FROM companies WHERE cnpj = '12345678000190'
);

-- Remover clientes de teste
DELETE FROM customers WHERE company_id IN (
  SELECT id FROM companies WHERE cnpj = '12345678000190'
);

-- Remover certificados de teste
DELETE FROM certificates WHERE company_id IN (
  SELECT id FROM companies WHERE cnpj = '12345678000190'
);

-- Remover perfis de usuário de teste
DELETE FROM user_profiles WHERE company_id IN (
  SELECT id FROM companies WHERE cnpj = '12345678000190'
);

-- Remover empresa de teste
DELETE FROM companies WHERE cnpj = '12345678000190';

-- Remover usuário de teste do auth
DELETE FROM auth.users WHERE email = 'admin@empresa.com';

-- Verificar limpeza
SELECT 'Empresas restantes:' as info, count(*) as total FROM companies;
SELECT 'Usuários restantes:' as info, count(*) as total FROM auth.users;
SELECT 'Perfis restantes:' as info, count(*) as total FROM user_profiles;
SELECT 'Clientes restantes:' as info, count(*) as total FROM customers;
SELECT 'NFS-e restantes:' as info, count(*) as total FROM invoices;
