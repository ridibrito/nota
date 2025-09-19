'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function TestUserDbPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testPassword, setTestPassword] = useState('senha123');

  const addResult = (title: string, data: any) => {
    setResults(prev => [...prev, { 
      title, 
      data, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-user-db');
      const result = await response.json();
      addResult('Teste de Conexão', result);
    } catch (error) {
      addResult('Erro de Conexão', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-user-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'check_user',
          userId: 'mock-user-id'
        })
      });
      const result = await response.json();
      addResult('Verificar Usuário', result);
    } catch (error) {
      addResult('Erro ao Verificar', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const setTestPasswordFunc = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-user-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'set_test_password',
          userId: 'mock-user-id',
          testPassword
        })
      });
      const result = await response.json();
      addResult('Definir Senha de Teste', result);
    } catch (error) {
      addResult('Erro ao Definir Senha', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testPasswordChange = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword: 'nova123',
          userId: 'mock-user-id'
        })
      });
      const result = await response.json();
      addResult('Teste Mudança de Senha', result);
    } catch (error) {
      addResult('Erro na Mudança', { error: error.message });
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
            <h1 className="text-2xl font-bold">🧪 Teste da Tabela user_profiles</h1>
            <p className="text-gray-600">Verificar se a persistência de senhas está funcionando</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Button onClick={testConnection} disabled={loading}>
                1️⃣ Testar Conexão
              </Button>
              <Button onClick={checkUser} disabled={loading}>
                2️⃣ Verificar Usuário
              </Button>
              
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Senha de teste"
                  className="flex-1"
                />
                <Button onClick={setTestPasswordFunc} disabled={loading}>
                  3️⃣ Definir Senha
                </Button>
              </div>
              
              <Button onClick={testPasswordChange} disabled={loading}>
                4️⃣ Testar Mudança
              </Button>
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
                  Nenhum teste executado ainda. Clique nos botões acima para começar.
                </p>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{result.title}</h4>
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
            <h2 className="text-lg font-semibold">📋 Como Usar</h2>
          </CardHeader>
          <CardBody>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li><strong>Testar Conexão:</strong> Verifica se consegue acessar a tabela user_profiles</li>
              <li><strong>Verificar Usuário:</strong> Busca o usuário mock-user-id e verifica se tem senha</li>
              <li><strong>Definir Senha:</strong> Define uma senha de teste para o usuário (padrão: senha123)</li>
              <li><strong>Testar Mudança:</strong> Tenta alterar a senha usando a API real</li>
            </ol>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
