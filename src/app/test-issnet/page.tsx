'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/lib/hooks/useCompany';

export default function TestISSNetPage() {
  const { company } = useCompany();
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const runDiagnostic = async () => {
    if (!company?.id) {
      alert('Empresa não encontrada');
      return;
    }

    setTesting(true);
    const results: any = {};

    try {
      // Teste 1: Verificar se empresa existe
      console.log('Teste 1: Verificando empresa...');
      results.company = {
        found: !!company,
        id: company.id,
        name: company.name,
        cnpj: company.cnpj,
        environment: company.environment
      };

      // Teste 2: Verificar certificado
      console.log('Teste 2: Verificando certificado...');
      try {
        const certResponse = await fetch(`/api/certificates/info?companyId=${company.id}`);
        const certResult = await certResponse.json();
        results.certificate = certResult;
      } catch (err) {
        results.certificate = { error: err.message };
      }

      // Teste 3: Testar descriptografia do certificado
      console.log('Teste 3: Testando descriptografia...');
      try {
        const decryptResponse = await fetch('/api/certificates/simple-decrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: company.id
          })
        });

        const decryptResult = await decryptResponse.json();
        results.decryption = decryptResult;
      } catch (err) {
        results.decryption = { error: err.message };
      }

      // Teste 4: Testar API de consulta diretamente
      console.log('Teste 4: Testando API de consulta...');
      try {
        const queryResponse = await fetch('/api/invoices/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: company.id,
            startDate: '2025-09-01',
            endDate: '2025-09-30'
          })
        });

        const queryResult = await queryResponse.json();
        results.apiQuery = {
          status: queryResponse.status,
          success: queryResult.success,
          error: queryResult.error,
          details: queryResult.details
        };
      } catch (err) {
        results.apiQuery = { error: err.message };
      }

      // Teste 4: Verificar variáveis de ambiente
      console.log('Teste 4: Verificando configuração...');
      try {
        const envResponse = await fetch('/api/debug');
        const envResult = await envResponse.json();
        results.environment = envResult;
      } catch (err) {
        results.environment = { error: err.message };
      }

      setTestResults(results);
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      setTestResults({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico ISSNet DF</h1>
      
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={runDiagnostic}
          disabled={testing || !company}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
        >
          {testing ? 'Executando diagnóstico...' : '🔍 Executar Diagnóstico Completo'}
        </button>
        
        <button
          onClick={async () => {
            setTesting(true);
            try {
              const response = await fetch('/api/test-issnet-urls');
              const result = await response.json();
              setTestResults({ urlTest: result });
            } catch (err) {
              setTestResults({ urlTest: { error: err.message } });
            } finally {
              setTesting(false);
            }
          }}
          disabled={testing}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400"
        >
          🌐 Testar URLs do ISSNet
        </button>
        
        <button
          onClick={async () => {
            if (!company?.id) return;
            
            setTesting(true);
            try {
              const response = await fetch('/api/test-query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  companyId: company.id,
                  startDate: '2025-09-01',
                  endDate: '2025-09-30'
                })
              });
              
              const result = await response.json();
              setTestResults({ testQuery: result });
            } catch (err) {
              setTestResults({ testQuery: { error: err.message } });
            } finally {
              setTesting(false);
            }
          }}
          disabled={testing || !company}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
        >
          🚀 Teste Direto da Consulta
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-6">
          {/* Resultado da Empresa */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">1. Status da Empresa</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(testResults.company, null, 2)}
            </pre>
          </div>

          {/* Resultado do Certificado */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">2. Status do Certificado</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(testResults.certificate, null, 2)}
            </pre>
          </div>

          {/* Resultado da Descriptografia */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">3. Teste de Descriptografia</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(testResults.decryption, null, 2)}
            </pre>
          </div>

          {/* Resultado da API */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">4. Teste da API de Consulta</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(testResults.apiQuery, null, 2)}
            </pre>
          </div>

          {/* Resultado do Teste de URLs */}
          {testResults.urlTest && (
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">3. Teste de URLs do ISSNet</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(testResults.urlTest, null, 2)}
              </pre>
            </div>
          )}

          {/* Resultado da Consulta Direta */}
          {testResults.testQuery && (
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">4. Teste Direto da Consulta</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(testResults.testQuery, null, 2)}
              </pre>
            </div>
          )}

          {/* Resultado do Ambiente */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">5. Configuração do Ambiente</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(testResults.environment, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Instruções */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Como interpretar:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Empresa:</strong> Deve mostrar dados da sua empresa</li>
          <li>• <strong>Certificado:</strong> Deve ter has_certificate: true</li>
          <li>• <strong>API:</strong> Deve conectar com ISSNet DF</li>
          <li>• <strong>Ambiente:</strong> Deve ter variáveis configuradas</li>
        </ul>
      </div>
    </div>
  );
}
