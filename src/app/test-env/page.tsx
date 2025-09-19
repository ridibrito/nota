'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { supabase } from '@/lib/db/supabase';

export default function TestEnvPage() {
  const [supabaseStatus, setSupabaseStatus] = useState<{
    url: string | undefined;
    keyConfigured: boolean;
    connectionTest: string;
  }>({
    url: '',
    keyConfigured: false,
    connectionTest: 'Testando...'
  });

  useEffect(() => {
    const testSupabase = async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      setSupabaseStatus({
        url,
        keyConfigured: !!(key && key !== 'your_supabase_anon_key_here'),
        connectionTest: 'Testando...'
      });

      // Testa conexão
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setSupabaseStatus(prev => ({
            ...prev,
            connectionTest: `Erro: ${error.message}`
          }));
        } else {
          setSupabaseStatus(prev => ({
            ...prev,
            connectionTest: 'Conexão OK!'
          }));
        }
      } catch (error) {
        setSupabaseStatus(prev => ({
          ...prev,
          connectionTest: `Erro de conexão: ${error instanceof Error ? error.message : String(error)}`
        }));
      }
    };

    testSupabase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Teste de Configuração
        </h1>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Status do Supabase</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <strong>URL:</strong> {supabaseStatus.url || 'Não configurado'}
              </div>
              <div>
                <strong>Chave configurada:</strong> {supabaseStatus.keyConfigured ? '✅ Sim' : '❌ Não'}
              </div>
              <div>
                <strong>Teste de conexão:</strong> {supabaseStatus.connectionTest}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="mt-6 text-center">
          <a href="/login" className="text-blue-600 hover:underline">
            Ir para Login
          </a>
          {' | '}
          <a href="/dashboard" className="text-blue-600 hover:underline">
            Ir para Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
