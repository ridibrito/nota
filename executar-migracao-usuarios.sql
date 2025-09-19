-- Execute este script no painel do Supabase para criar a tabela de usuários
-- Vá em: Dashboard > SQL Editor > Cole este código > Execute

-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
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
    FOR SELECT USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Política: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar se foi criado corretamente
SELECT 'Tabela user_profiles criada com sucesso!' as status;
SELECT * FROM user_profiles WHERE id = 'mock-user-id';
