'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { KeyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/db/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log('Tentando fazer login com:', { email: formData.email });

    if (!formData.email || !formData.password) {
      setError('Email e senha são obrigatórios');
      setLoading(false);
      return;
    }

    try {
      console.log('Chamando Supabase auth...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password
      });

      console.log('Resposta do Supabase:', { data, error });

      if (error) {
        console.error('Erro de autenticação:', error);
        setError(`Erro: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('Login bem-sucedido, redirecionando...');
        
        // Busca o perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
          setError('Usuário autenticado, mas perfil não encontrado');
          setLoading(false);
          return;
        }

        console.log('Perfil encontrado:', profile);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Erro na função de login:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex flex-col items-center space-y-3">
            <img 
              src="/coruss_nfse.png" 
              alt="Coruss NFS-e" 
              className="h-16 w-auto"
            />
            
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <h2 className="text-center text-xl font-semibold text-gray-900">
              Faça login na sua conta
            </h2>
          </CardHeader>
          <CardBody>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Erro no login
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Digite seu email"
                />
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Digite sua senha"
                />
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              

              <div className="mt-6 text-center space-y-2">
              
                <p className="text-xs text-gray-500">
                  Problemas? <a href="/status" className="text-blue-600 hover:underline">Verificar configuração</a>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Coruss - Sistema de emissão de NFS-e para o Distrito Federal
            <br />
            Padrão ABRASF 2.04 - ISSNet DF
          </p>
        </div>
      </div>
    </div>
  );
}
