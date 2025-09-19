-- ========================================
-- DADOS DE TESTE SIMPLES (SEM ON CONFLICT)
-- ========================================

-- 1. Verificar se já existe empresa
-- Se retornar registros, pule para o passo 2
SELECT * FROM companies WHERE cnpj = '12345678000190';

-- 2. Se não existir, criar empresa
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
);

-- 3. Verificar se usuário já existe
SELECT * FROM auth.users WHERE email = 'admin@empresa.com';

-- 4. Se não existir, criar usuário admin
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
  is_super_admin
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
  FALSE
);

-- 5. Criar perfil do usuário
INSERT INTO user_profiles (id, email, role, company_id) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@empresa.com'),
  'admin@empresa.com',
  'admin',
  (SELECT id FROM companies WHERE cnpj = '12345678000190')
);

-- 6. Criar clientes de teste
INSERT INTO customers (company_id, cpf_cnpj, name, email) VALUES
(
  (SELECT id FROM companies WHERE cnpj = '12345678000190'),
  '12345678900',
  'João Silva',
  'joao@email.com'
),
(
  (SELECT id FROM companies WHERE cnpj = '12345678000190'),
  '12345678000191',
  'Maria Santos Consultoria ME',
  'maria@email.com'
),
(
  (SELECT id FROM companies WHERE cnpj = '12345678000190'),
  '98765432100',
  'Pedro Oliveira',
  'pedro@email.com'
);

-- 7. Verificar se tudo foi criado
SELECT 'Empresa:' as tipo, name as nome FROM companies WHERE cnpj = '12345678000190'
UNION ALL
SELECT 'Usuário:' as tipo, email as nome FROM auth.users WHERE email = 'admin@empresa.com'
UNION ALL
SELECT 'Perfil:' as tipo, email as nome FROM user_profiles WHERE email = 'admin@empresa.com'
UNION ALL
SELECT 'Cliente:' as tipo, name as nome FROM customers WHERE company_id = (SELECT id FROM companies WHERE cnpj = '12345678000190');
