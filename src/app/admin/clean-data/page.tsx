'use client';

import { useState } from 'react';

export default function CleanDataPage() {
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCleanData = async () => {
    setCleaning(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/clean-test-data', {
        method: 'POST'
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        alert('Dados de teste limpos com sucesso! Recarregando...');
        setTimeout(() => window.location.href = '/invoices', 2000);
      }
    } catch (err) {
      setResult({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro desconhecido' 
      });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Limpar Dados de Teste</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Atenção</h2>
        <p className="text-yellow-700">
          Esta ação vai remover TODOS os dados de teste do banco, incluindo:
        </p>
        <ul className="list-disc list-inside text-yellow-700 mt-2 space-y-1">
          <li>Invoices de teste</li>
          <li>Clientes de teste</li>
          <li>Certificados de teste</li>
          <li>Empresa de teste (CNPJ: 12.345.678/0001-90)</li>
          <li>Usuário admin de teste</li>
        </ul>
      </div>

      <button
        onClick={handleCleanData}
        disabled={cleaning}
        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400"
      >
        {cleaning ? 'Limpando dados...' : '🗑️ Limpar Dados de Teste'}
      </button>

      {result && (
        <div className={`mt-6 p-4 rounded-lg ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.success ? '✅ Sucesso' : '❌ Erro'}
          </h3>
          <p className={`mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message || result.error}
          </p>
          {result.data && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Dados restantes:</p>
              <ul className="list-disc list-inside">
                <li>Empresas: {result.data.remaining?.companies || 0}</li>
                <li>Invoices: {result.data.remaining?.invoices || 0}</li>
                <li>Clientes: {result.data.remaining?.customers || 0}</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
