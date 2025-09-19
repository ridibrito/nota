-- ========================================
-- DADOS DE TESTE PARA EMISSOR NFS-e DF
-- ========================================

-- 1. Criar empresa de teste
INSERT INTO companies (
  name, cnpj, im, cnae, item_lista_servico, 
  cod_tributacao_municipio, environment
) VALUES (
  'Minha Empresa de Tecnologia Ltda',
  '12345678000190',
  '123456789', 
  '6201-5/00',
  '1.05',
  '620150001',
  'homolog'
) ON CONFLICT (cnpj) DO NOTHING;

-- 2. Criar usuário admin no auth.users
INSERT INTO auth.users (
  instance_id, 
  id, 
  aud, 
  role, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at, 
  raw_app_meta_data,
  raw_user_meta_data, 
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated', 
  'admin@empresa.com',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin User"}',
  FALSE,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- 3. Criar perfil do usuário
INSERT INTO user_profiles (id, email, role, company_id) 
SELECT 
  u.id,
  u.email,
  'admin',
  c.id
FROM auth.users u, companies c 
WHERE u.email = 'admin@empresa.com' 
  AND c.cnpj = '12345678000190'
ON CONFLICT (id) DO NOTHING;

-- 4. Criar alguns clientes de teste
INSERT INTO customers (company_id, cpf_cnpj, name, email) 
SELECT 
  c.id,
  '12345678900',
  'João Silva',
  'joao@email.com'
FROM companies c 
WHERE c.cnpj = '12345678000190'
ON CONFLICT DO NOTHING;

INSERT INTO customers (company_id, cpf_cnpj, name, email) 
SELECT 
  c.id,
  '12345678000191',
  'Maria Santos Consultoria ME',
  'maria@email.com'
FROM companies c 
WHERE c.cnpj = '12345678000190'
ON CONFLICT DO NOTHING;

INSERT INTO customers (company_id, cpf_cnpj, name, email) 
SELECT 
  c.id,
  '98765432100',
  'Pedro Oliveira',
  'pedro@email.com'
FROM companies c 
WHERE c.cnpj = '12345678000190'
ON CONFLICT DO NOTHING;

-- 5. Criar algumas NFS-e de exemplo
INSERT INTO invoices (
  company_id,
  customer_id,
  rps_number,
  rps_series,
  competence_date,
  service_code,
  description,
  amount,
  deductions,
  iss_rate,
  iss_value,
  status
) 
SELECT 
  co.id,
  cu.id,
  '001',
  'UNICA',
  CURRENT_DATE,
  '1.05',
  'Desenvolvimento de sistema web personalizado',
  1500.00,
  0,
  0.05,
  75.00,
  'pending'
FROM companies co, customers cu 
WHERE co.cnpj = '12345678000190' 
  AND cu.cpf_cnpj = '12345678900'
ON CONFLICT DO NOTHING;

INSERT INTO invoices (
  company_id,
  customer_id,
  rps_number,
  rps_series,
  competence_date,
  service_code,
  description,
  amount,
  deductions,
  iss_rate,
  iss_value,
  status
) 
SELECT 
  co.id,
  cu.id,
  '002',
  'UNICA',
  CURRENT_DATE - 1,
  '1.05',
  'Consultoria em tecnologia da informação',
  2300.00,
  0,
  0.05,
  115.00,
  'issued'
FROM companies co, customers cu 
WHERE co.cnpj = '12345678000190' 
  AND cu.cpf_cnpj = '12345678000191'
ON CONFLICT DO NOTHING;

-- Verificar se os dados foram criados
SELECT 'Empresas criadas:' as info, count(*) as total FROM companies;
SELECT 'Usuários criados:' as info, count(*) as total FROM auth.users WHERE email = 'admin@empresa.com';
SELECT 'Perfis criados:' as info, count(*) as total FROM user_profiles;
SELECT 'Clientes criados:' as info, count(*) as total FROM customers;
SELECT 'NFS-e criadas:' as info, count(*) as total FROM invoices;
