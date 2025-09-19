-- Criação do esquema inicial para o emissor de NFS-e DF
-- Baseado no PRD v2 com suporte completo ao padrão ABRASF 2.04

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de empresas (prestadores de serviço)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  im TEXT NOT NULL, -- inscrição municipal
  cnae TEXT NOT NULL,
  item_lista_servico TEXT NOT NULL,
  cod_tributacao_municipio TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'homolog' CHECK (environment IN ('homolog', 'prod')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para companies
CREATE INDEX idx_companies_cnpj ON companies(cnpj);
CREATE INDEX idx_companies_environment ON companies(environment);

-- Tabela de certificados A1
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- caminho no Supabase Storage
  pfx_iv BYTEA NOT NULL, -- IV AES-GCM
  pfx_tag BYTEA NOT NULL, -- Auth Tag AES-GCM
  pfx_ciphertext BYTEA NOT NULL, -- conteúdo .pfx criptografado
  passphrase_ciphertext BYTEA NOT NULL, -- senha criptografada
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id) -- Uma empresa pode ter apenas um certificado ativo
);

-- Tabela de tomadores (clientes)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cpf_cnpj TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  address JSONB, -- endereço estruturado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para customers
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_cpf_cnpj ON customers(cpf_cnpj);
CREATE INDEX idx_customers_name ON customers USING gin(to_tsvector('portuguese', name));

-- Tabela de RPS/NFS-e
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  rps_number TEXT NOT NULL,
  rps_series TEXT DEFAULT 'UNICA',
  competence_date DATE NOT NULL,
  service_code TEXT NOT NULL, -- item lista servico/cod tribut municipal
  description TEXT NOT NULL,
  amount NUMERIC(18,6) NOT NULL, -- manter 6 casas p/ cálculo
  deductions NUMERIC(18,6) DEFAULT 0,
  iss_rate NUMERIC(5,4) NOT NULL, -- ex: 0.0200 (2%)
  iss_value NUMERIC(18,6), -- calculado c/ ABNT
  nfse_number TEXT, -- preenchido após emissão
  nfse_verification_code TEXT,
  protocol TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'issued', 'failed', 'canceled')),
  xml_rps TEXT, -- xml enviado (opcional)
  xml_nfse TEXT, -- xml retornado (opcional)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para invoices
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_competence_date ON invoices(competence_date);
CREATE INDEX idx_invoices_nfse_number ON invoices(nfse_number);
CREATE INDEX idx_invoices_protocol ON invoices(protocol);
CREATE UNIQUE INDEX idx_invoices_rps_unique ON invoices(company_id, rps_number, rps_series);

-- Tabela de logs SOAP
CREATE TABLE ws_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('issue', 'query', 'cancel')),
  request_xml TEXT,
  response_xml TEXT,
  http_status INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para ws_logs
CREATE INDEX idx_ws_logs_invoice_id ON ws_logs(invoice_id);
CREATE INDEX idx_ws_logs_operation ON ws_logs(operation);
CREATE INDEX idx_ws_logs_created_at ON ws_logs(created_at);

-- Tabela de perfis de usuário
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY, -- mesmo ID do auth.users
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para user_profiles
CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Tabela de auditoria
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at em invoices
CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar log de auditoria
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers de auditoria para tabelas principais
CREATE TRIGGER audit_companies 
  AFTER INSERT OR UPDATE OR DELETE ON companies 
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_customers 
  AFTER INSERT OR UPDATE OR DELETE ON customers 
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_invoices 
  AFTER INSERT OR UPDATE OR DELETE ON invoices 
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para companies
CREATE POLICY "Users can view their company" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their company" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas RLS para certificates
CREATE POLICY "Users can view their company's certificate" ON certificates
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage their company's certificate" ON certificates
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas RLS para customers
CREATE POLICY "Users can view their company's customers" ON customers
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company's customers" ON customers
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Políticas RLS para invoices
CREATE POLICY "Users can view their company's invoices" ON invoices
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company's invoices" ON invoices
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Políticas RLS para ws_logs
CREATE POLICY "Users can view their company's logs" ON ws_logs
  FOR SELECT USING (
    invoice_id IN (
      SELECT i.id FROM invoices i
      JOIN user_profiles up ON i.company_id = up.company_id
      WHERE up.id = auth.uid()
    )
  );

-- Políticas RLS para user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view company profiles" ON user_profiles
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas RLS para audit_logs
CREATE POLICY "Admins can view their company's audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Views úteis
CREATE VIEW invoice_summary AS
SELECT 
  i.*,
  c.name as customer_name,
  c.cpf_cnpj as customer_document,
  co.name as company_name
FROM invoices i
JOIN customers c ON i.customer_id = c.id
JOIN companies co ON i.company_id = co.id;

-- Função para calcular totais por período
CREATE OR REPLACE FUNCTION get_invoice_totals(
  p_company_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_invoices BIGINT,
  total_amount NUMERIC,
  total_iss NUMERIC,
  total_deductions NUMERIC,
  pending_count BIGINT,
  issued_count BIGINT,
  failed_count BIGINT,
  canceled_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_invoices,
    COALESCE(SUM(amount), 0) as total_amount,
    COALESCE(SUM(iss_value), 0) as total_iss,
    COALESCE(SUM(deductions), 0) as total_deductions,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
    COUNT(*) FILTER (WHERE status = 'issued')::BIGINT as issued_count,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_count,
    COUNT(*) FILTER (WHERE status = 'canceled')::BIGINT as canceled_count
  FROM invoices
  WHERE company_id = p_company_id
    AND (p_start_date IS NULL OR competence_date >= p_start_date)
    AND (p_end_date IS NULL OR competence_date <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
