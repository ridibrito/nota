'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function DiagnosticsPage() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Service role key não aparece no client-side por segurança
  };

  const checks = [
    {
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      value: envVars.NEXT_PUBLIC_SUPABASE_URL,
      isValid: !!(envVars.NEXT_PUBLIC_SUPABASE_URL && envVars.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here'),
      description: 'URL do projeto Supabase'
    },
    {
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      value: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      isValid: !!(envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY && envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here'),
      description: 'Chave pública do Supabase'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Diagnóstico do Sistema</h1>
          <p className="mt-2 text-gray-600">
            Verificação das configurações e variáveis de ambiente
          </p>
        </div>

        <div className="space-y-6">
          {/* Status das variáveis de ambiente */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Variáveis de Ambiente</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {checks.map((check) => (
                  <div key={check.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {check.isValid ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{check.name}</div>
                        <div className="text-xs text-gray-500">{check.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-mono px-2 py-1 rounded ${
                        check.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {check.isValid ? 'Configurado' : 'Não configurado'}
                      </div>
                      {check.value && check.isValid && (
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                          {check.value.substring(0, 20)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Instruções */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Como Configurar</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">1. Encontre suas credenciais no Supabase:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside ml-4">
                    <li>Acesse <a href="https://supabase.com/dashboard" target="_blank" className="underline">supabase.com/dashboard</a></li>
                    <li>Selecione seu projeto</li>
                    <li>Vá em <strong>Settings → API</strong></li>
                    <li>Copie as credenciais</li>
                  </ol>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg text-green-400 font-mono text-sm">
                  <p className="text-white mb-2">2. Edite o arquivo .env.local:</p>
                  <div className="space-y-1">
                    <div>NEXT_PUBLIC_SUPABASE_URL=<span className="text-yellow-300">https://seu-projeto.supabase.co</span></div>
                    <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=<span className="text-yellow-300">eyJhbGciOiJIUzI1NiIs...</span></div>
                    <div>SUPABASE_SERVICE_ROLE_KEY=<span className="text-yellow-300">eyJhbGciOiJIUzI1NiIs...</span></div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">3. Reinicie o servidor:</h4>
                  <code className="text-sm text-yellow-800 bg-yellow-100 px-2 py-1 rounded">npm run dev</code>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Debug info */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Debug Info</h3>
            </CardHeader>
            <CardBody>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-xs">
                <div>NODE_ENV: {process.env.NODE_ENV}</div>
                <div>Timestamp: {new Date().toISOString()}</div>
                <div>URL atual: {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Após configurar, acesse: <a href="/dashboard" className="text-blue-600 hover:underline">Dashboard</a>
          </p>
        </div>
      </div>
    </div>
  );
}
