'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function TestLoginPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('ricardo@coruss.com.br');
  const [password, setPassword] = useState('senha123');

  const addResult = (title: string, data: any) => {
    setResults(prev => [...prev, { 
      title, 
      data, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      console.log('🔐 Testando login:', { email, password: '***' });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      console.log('📥 Resposta da API:', result);
      
      addResult(`Login: ${email}`, {
        status: response.status,
        success: result.success,
        ...result
      });
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      addResult('Erro no Login', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testFallback = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'usuario@teste.com', 
          password: 'senha123' 
        })
      });

      const result = await response.json();
      addResult('Fallback: usuario@teste.com', {
        status: response.status,
        success: result.success,
        ...result
      });
    } catch (error) {
      addResult('Erro no Fallback', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testUserExists = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-user-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'check_user',
          userId: '12345678-1234-1234-1234-123456789abc'
        })
      });

      const result = await response.json();
      addResult('Verificar Usuário no Banco', result);
    } catch (error) {
      addResult('Erro na Verificação', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => setResults([]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">🔐 Teste da API de Login</h1>
            <p className="text-gray-600">Debugar problemas de autenticação</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                />
              </div>
              
              <div className="space-y-2">
                <Button onClick={testLogin} disabled={loading} className="w-full">
                  🔐 Testar Login Atual
                </Button>
                <Button onClick={testFallback} disabled={loading} variant="secondary" className="w-full">
                  🔧 Testar Fallback
                </Button>
                <Button onClick={testUserExists} disabled={loading} variant="secondary" className="w-full">
                  👤 Verificar Usuário
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Resultados dos Testes</h3>
              <Button onClick={clearResults} variant="secondary" size="sm">
                Limpar
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum teste executado ainda.
                </p>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-semibold ${
                        result.data.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.title}
                      </h4>
                      <span className="text-xs text-gray-500">{result.timestamp}</span>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">📋 Credenciais para Teste</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded">
                <h3 className="font-semibold text-blue-800">Usuário Real (Banco)</h3>
                <p><strong>Email:</strong> ricardo@coruss.com.br</p>
                <p><strong>Senha:</strong> senha123</p>
                <p><strong>UUID:</strong> 12345678-1234-1234-1234-123456789abc</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <h3 className="font-semibold text-green-800">Fallback (Desenvolvimento)</h3>
                <p><strong>Email:</strong> usuario@teste.com</p>
                <p><strong>Senha:</strong> senha123</p>
                <p><strong>Funciona:</strong> Quando Supabase falha</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
