import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { 
  ExclamationTriangleIcon,
  CogIcon,
  KeyIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function SetupGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Configuração Necessária</h1>
          <p className="mt-2 text-gray-600">
            Configure o Supabase para começar a usar o sistema
          </p>
        </div>

        <div className="space-y-6">
          {/* Passo 1 */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <h3 className="text-lg font-medium text-gray-900">Configurar Variáveis do Supabase</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Acesse seu projeto no Supabase Dashboard e copie as credenciais:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">📍 Como encontrar:</p>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Acesse <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 hover:underline">supabase.com/dashboard</a></li>
                    <li>Selecione seu projeto</li>
                    <li>Vá em <strong>Settings → API</strong></li>
                    <li>Copie as credenciais abaixo</li>
                  </ol>
                </div>

                <div className="bg-black p-4 rounded-lg text-green-400 font-mono text-sm">
                  <p className="text-white mb-2">📄 Edite o arquivo: <code>.env.local</code></p>
                  <div className="space-y-1">
                    <div>NEXT_PUBLIC_SUPABASE_URL=<span className="text-yellow-300">https://seu-projeto.supabase.co</span></div>
                    <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=<span className="text-yellow-300">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</span></div>
                    <div>SUPABASE_SERVICE_ROLE_KEY=<span className="text-yellow-300">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</span></div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Passo 2 */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <h3 className="text-lg font-medium text-gray-900">Executar Migrations do Banco</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Execute o SQL para criar as tabelas do sistema:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">📍 Como executar:</p>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>No Supabase Dashboard, vá em <strong>SQL Editor</strong></li>
                    <li>Copie todo o conteúdo do arquivo <code>supabase/migrations/001_initial_schema.sql</code></li>
                    <li>Cole no editor e clique em <strong>Run</strong></li>
                    <li>Verifique se todas as tabelas foram criadas em <strong>Table Editor</strong></li>
                  </ol>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Passo 3 */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <h3 className="text-lg font-medium text-gray-900">Criar Dados de Teste</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Execute este SQL para criar empresa e usuário de teste:
                </p>
                
                <div className="bg-black p-4 rounded-lg text-green-400 font-mono text-xs overflow-x-auto">
                  <div className="whitespace-pre">{`-- 1. Criar empresa
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

-- 2. Criar usuário (substitua pelo seu email)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, 
  encrypted_password, email_confirmed_at, 
  created_at, updated_at, raw_app_meta_data,
  raw_user_meta_data, is_super_admin
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
  '{}',
  FALSE
);

-- 3. Criar perfil
INSERT INTO user_profiles (id, email, role, company_id) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@empresa.com'),
  'admin@empresa.com',
  'admin',
  (SELECT id FROM companies WHERE cnpj = '12345678000190')
);

-- 4. Criar alguns clientes
INSERT INTO customers (company_id, cpf_cnpj, name, email) VALUES
((SELECT id FROM companies WHERE cnpj = '12345678000190'), '12345678900', 'João Silva', 'joao@email.com'),
((SELECT id FROM companies WHERE cnpj = '12345678000190'), '12345678000191', 'Maria Santos ME', 'maria@email.com');`}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CogIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Status da Configuração</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Supabase URL: Não configurado</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Supabase Keys: Não configuradas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Chave de Criptografia: Configurada</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Login de teste */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <KeyIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Credenciais de Teste</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Após configurar, use estas credenciais:</p>
                <div className="space-y-1 text-sm text-blue-800">
                  <div><strong>Email:</strong> admin@empresa.com</div>
                  <div><strong>Senha:</strong> 123456</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Após configurar, reinicie o servidor de desenvolvimento:
          </p>
          <div className="mt-2 bg-gray-900 text-green-400 p-2 rounded font-mono text-sm inline-block">
            npm run dev
          </div>
        </div>
      </div>
    </div>
  );
}
