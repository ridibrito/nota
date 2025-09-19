'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function StatusPage() {
  const [status, setStatus] = useState({
    supabaseUrl: '',
    supabaseKey: '',
    envLoaded: false,
    error: null as string | null
  });

  useEffect(() => {
    setStatus({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Não configurado',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado',
      envLoaded: true,
      error: null
    });
  }, []);

  const testConnection = async () => {
    try {
      const response = await fetch('/api/test-db');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ API funcionando!\n\nVariáveis de ambiente:\n${JSON.stringify(result.environment, null, 2)}`);
      } else {
        alert(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Erro de conexão: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Status do Sistema</h1>
          <p className="text-gray-600">Verificação das configurações</p>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Variáveis de Ambiente</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Supabase URL:</span>
                <span className={status.supabaseUrl.includes('supabase.co') ? 'text-green-600' : 'text-red-600'}>
                  {status.supabaseUrl.includes('supabase.co') ? '✅ Configurado' : '❌ Não configurado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Supabase Key:</span>
                <span className={status.supabaseKey === 'Configurado' ? 'text-green-600' : 'text-red-600'}>
                  {status.supabaseKey === 'Configurado' ? '✅ Configurado' : '❌ Não configurado'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                URL: {status.supabaseUrl}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Ações</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <Button onClick={testConnection} className="w-full">
                Testar Conexão com API
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <a href="/login">
                  <Button variant="secondary" className="w-full">
                    Ir para Login
                  </Button>
                </a>
                <a href="/dashboard">
                  <Button variant="secondary" className="w-full">
                    Ir para Dashboard
                  </Button>
                </a>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Instruções</h3>
          </CardHeader>
          <CardBody>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>1.</strong> Execute as migrations no Supabase SQL Editor</p>
              <p><strong>2.</strong> Crie os dados de teste (empresa e usuário)</p>
              <p><strong>3.</strong> Teste o login com admin@empresa.com / 123456</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
