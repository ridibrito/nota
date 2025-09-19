-- ========================================
-- VERIFICAR DADOS EXISTENTES
-- ========================================

-- 1. Verificar empresa
SELECT 'EMPRESA' as tipo, id, name, cnpj FROM companies WHERE cnpj = '12345678000190';

-- 2. Verificar usuário
SELECT 'USUÁRIO' as tipo, id, email, email_confirmed_at FROM auth.users WHERE email = 'admin@empresa.com';

-- 3. Verificar perfil (pode não existir ainda)
SELECT 'PERFIL' as tipo, id, email, role FROM user_profiles WHERE email = 'admin@empresa.com';

-- 4. Verificar clientes
SELECT 'CLIENTES' as tipo, count(*) as quantidade FROM customers 
WHERE company_id = (SELECT id FROM companies WHERE cnpj = '12345678000190');

-- 5. Se o perfil não existir, criar agora
INSERT INTO user_profiles (id, email, role, company_id) 
SELECT 
  u.id,
  u.email,
  'admin',
  c.id
FROM auth.users u, companies c 
WHERE u.email = 'admin@empresa.com' 
  AND c.cnpj = '12345678000190'
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = u.id
  );

-- 6. Criar clientes se não existirem
INSERT INTO customers (company_id, cpf_cnpj, name, email) 
SELECT 
  c.id,
  '12345678900',
  'João Silva',
  'joao@email.com'
FROM companies c 
WHERE c.cnpj = '12345678000190'
  AND NOT EXISTS (
    SELECT 1 FROM customers WHERE cpf_cnpj = '12345678900'
  );

INSERT INTO customers (company_id, cpf_cnpj, name, email) 
SELECT 
  c.id,
  '12345678000191',
  'Maria Santos Consultoria ME',
  'maria@email.com'
FROM companies c 
WHERE c.cnpj = '12345678000190'
  AND NOT EXISTS (
    SELECT 1 FROM customers WHERE cpf_cnpj = '12345678000191'
  );

-- 7. Verificação final
SELECT 'RESUMO FINAL:' as resultado;
SELECT 'Empresas:' as item, count(*) as total FROM companies;
SELECT 'Usuários:' as item, count(*) as total FROM auth.users WHERE email = 'admin@empresa.com';
SELECT 'Perfis:' as item, count(*) as total FROM user_profiles;
SELECT 'Clientes:' as item, count(*) as total FROM customers;
