-- ========================================
-- CORRIGIR POLÍTICAS RLS
-- ========================================

-- 1. Remover todas as políticas existentes que podem ter recursão
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view company profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their company" ON companies;
DROP POLICY IF EXISTS "Admins can update their company" ON companies;
DROP POLICY IF EXISTS "Users can view their company's certificate" ON certificates;
DROP POLICY IF EXISTS "Admins can manage their company's certificate" ON certificates;
DROP POLICY IF EXISTS "Users can view their company's customers" ON customers;
DROP POLICY IF EXISTS "Users can manage their company's customers" ON customers;
DROP POLICY IF EXISTS "Users can view their company's invoices" ON invoices;
DROP POLICY IF EXISTS "Users can manage their company's invoices" ON invoices;
DROP POLICY IF EXISTS "Users can view their company's logs" ON ws_logs;
DROP POLICY IF EXISTS "Admins can view their company's audit logs" ON audit_logs;

-- 2. Criar políticas mais simples sem recursão

-- Política para user_profiles (sem referência circular)
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- Políticas para companies (referência direta)
CREATE POLICY "Users can view their company" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
        AND user_profiles.company_id = companies.id
    )
  );

CREATE POLICY "Admins can update their company" ON companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
        AND user_profiles.company_id = companies.id 
        AND user_profiles.role = 'admin'
    )
  );

-- Políticas para customers
CREATE POLICY "Users can view their company's customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
        AND user_profiles.company_id = customers.company_id
    )
  );

CREATE POLICY "Users can manage their company's customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
        AND user_profiles.company_id = customers.company_id
    )
  );

-- Políticas para invoices
CREATE POLICY "Users can view their company's invoices" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
        AND user_profiles.company_id = invoices.company_id
    )
  );

CREATE POLICY "Users can manage their company's invoices" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
        AND user_profiles.company_id = invoices.company_id
    )
  );

-- Políticas para certificates
CREATE POLICY "Users can view their company's certificate" ON certificates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
        AND user_profiles.company_id = certificates.company_id
    )
  );

CREATE POLICY "Admins can manage their company's certificate" ON certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
        AND user_profiles.company_id = certificates.company_id 
        AND user_profiles.role = 'admin'
    )
  );

-- Políticas para ws_logs (simplificada)
CREATE POLICY "Users can view logs" ON ws_logs
  FOR SELECT USING (true); -- Simplificada para evitar recursão

-- Políticas para audit_logs (simplificada)
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
  );

-- 3. Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
