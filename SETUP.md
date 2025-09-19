# 🚀 Setup do Emissor NFS-e DF

Guia completo para configurar e testar a aplicação com dados reais.

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Certificado digital A1 (.pfx/.p12) para testes

## 🔧 Configuração Inicial

### 1. Configurar Supabase

1. **Criar projeto no Supabase:**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL e as chaves

2. **Executar migrations:**
   - No painel do Supabase, vá em SQL Editor
   - Execute o conteúdo do arquivo `supabase/migrations/001_initial_schema.sql`

3. **Configurar autenticação:**
   - Em Authentication > Settings
   - Desabilite "Enable email confirmations" (para testes)
   - Configure "Site URL" para `http://localhost:3000`

### 2. Configurar Variáveis de Ambiente

1. **Copiar arquivo de exemplo:**
   ```bash
   cp env.example .env.local
   ```

2. **Preencher variáveis:**
   ```env
   # Do painel do Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Gerar chave de 32 bytes
   CERT_ENCRYPTION_KEY=base64_key_here
   ```

3. **Gerar chave de criptografia:**
   ```bash
   # Linux/Mac
   openssl rand -base64 32
   
   # Windows (PowerShell)
   [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   ```

### 3. Instalar Dependências

```bash
npm install
```

## 🎯 Dados de Teste

### 1. Criar Usuário Administrador

Execute no SQL Editor do Supabase:

```sql
-- 1. Criar empresa
INSERT INTO companies (
  id,
  name,
  cnpj,
  im,
  cnae,
  item_lista_servico,
  cod_tributacao_municipio,
  environment
) VALUES (
  gen_random_uuid(),
  'Minha Empresa de Tecnologia Ltda',
  '12.345.678/0001-90',
  '123456789',
  '6201-5/00',
  '1.05',
  '620150001',
  'homolog'
);

-- 2. Criar usuário (substitua pelo seu email)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@empresa.com',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- 3. Criar perfil (ajustar IDs)
INSERT INTO user_profiles (
  id,
  email,
  role,
  company_id
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@empresa.com'),
  'admin@empresa.com',
  'admin',
  (SELECT id FROM companies WHERE cnpj = '12.345.678/0001-90')
);
```

### 2. Criar Clientes de Teste

```sql
INSERT INTO customers (company_id, cpf_cnpj, name, email) VALUES
((SELECT id FROM companies WHERE cnpj = '12.345.678/0001-90'), '123.456.789-00', 'João Silva', 'joao@email.com'),
((SELECT id FROM companies WHERE cnpj = '12.345.678/0001-90'), '12.345.678/0001-91', 'Maria Santos Consultoria ME', 'contato@maria.com'),
((SELECT id FROM companies WHERE cnpj = '12.345.678/0001-90'), '987.654.321-00', 'Pedro Oliveira', 'pedro@email.com');
```

### 3. Criar NFS-e de Teste

```sql
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
) VALUES (
  (SELECT id FROM companies WHERE cnpj = '12.345.678/0001-90'),
  (SELECT id FROM customers WHERE cpf_cnpj = '123.456.789-00'),
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
);
```

## 🚀 Iniciar Aplicação

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🔑 Login de Teste

- **Email:** admin@empresa.com
- **Senha:** 123456

## ✅ Checklist de Testes

### Autenticação
- [ ] Login com credenciais corretas
- [ ] Redirecionamento para dashboard após login
- [ ] Logout funcional
- [ ] Proteção de rotas (tentar acessar sem login)

### Dashboard
- [ ] Carregamento de estatísticas reais
- [ ] Exibição de últimas NFS-e
- [ ] Cards com valores corretos

### Empresa
- [ ] Visualização dos dados da empresa
- [ ] Edição de dados (se implementado)
- [ ] Upload de certificado (placeholder)

### Clientes
- [ ] Listagem de clientes
- [ ] Busca por nome/documento
- [ ] Criação de novo cliente (se implementado)

### NFS-e
- [ ] Listagem com dados reais
- [ ] Filtros por status/período
- [ ] Formulário de nova NFS-e
- [ ] Emissão (testará APIs)

## 🐛 Solução de Problemas

### Erro de Conexão com Supabase
- Verificar URLs e chaves no `.env.local`
- Confirmar que o projeto Supabase está ativo
- Checar se as migrations foram executadas

### Erro de Autenticação
- Verificar se o usuário foi criado corretamente
- Confirmar que `email_confirmed_at` não é null
- Testar senha no SQL Editor

### Dados Não Aparecem
- Verificar se os dados de teste foram inseridos
- Confirmar relacionamentos entre tabelas (company_id, customer_id)
- Checar logs do browser (F12)

## 📝 Próximos Passos

Após confirmar que tudo está funcionando:

1. **Testar APIs:**
   - Emissão de NFS-e
   - Consulta por protocolo
   - Cancelamento

2. **Implementar funcionalidades restantes:**
   - Formulários funcionais
   - Upload real de certificados
   - Validações

3. **Deploy:**
   - Configurar produção
   - Variáveis de ambiente seguras
   - Domínio personalizado

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do browser (F12 > Console)
2. Checar logs do Supabase (Logs & Reports)
3. Revisar este guia de setup
4. Consultar documentação do Supabase
