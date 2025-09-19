-- Migração para criar tabela de perfis de usuário
-- Arquivo: 003_user_profiles.sql

-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'operator',
    company_id UUID REFERENCES companies(id),
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);

-- Inserir usuário padrão para desenvolvimento
INSERT INTO user_profiles (
    id, 
    email, 
    name, 
    role, 
    company_id
) VALUES (
    'mock-user-id',
    'usuario@teste.com',
    'Usuário Teste',
    'admin',
    'e8281131-097c-49c4-ab97-078a8c7f4e65'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    updated_at = CURRENT_TIMESTAMP;

-- RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid()::text = id);

-- Política: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid()::text = id);

-- Política: Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE user_profiles IS 'Tabela de perfis de usuário do sistema';
COMMENT ON COLUMN user_profiles.id IS 'ID único do usuário';
COMMENT ON COLUMN user_profiles.email IS 'Email do usuário (único)';
COMMENT ON COLUMN user_profiles.name IS 'Nome completo do usuário';
COMMENT ON COLUMN user_profiles.role IS 'Função do usuário (admin, operator)';
COMMENT ON COLUMN user_profiles.company_id IS 'ID da empresa do usuário';
COMMENT ON COLUMN user_profiles.password_hash IS 'Hash da senha do usuário';
