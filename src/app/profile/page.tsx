'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCompany } from '@/lib/hooks/useCompany';
import { useToast } from '@/components/ui/Toast';
import { 
  UserCircleIcon,
  KeyIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { company } = useCompany();
  const { success, error, warning } = useToast();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validações
      if (!formData.name.trim()) {
        warning('Nome obrigatório', 'Por favor, preencha seu nome completo.');
        return;
      }

      if (!formData.email.trim()) {
        warning('Email obrigatório', 'Por favor, preencha seu email.');
        return;
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        warning('Email inválido', 'Por favor, digite um email válido.');
        return;
      }

      // Atualizar dados básicos
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      });

      const result = await response.json();

      if (result.success) {
        success('Perfil atualizado!', 'Seus dados foram salvos com sucesso.');
      } else {
        error('Erro ao atualizar', result.error || 'Erro desconhecido');
      }
    } catch (err) {
      error('Erro de conexão', 'Não foi possível conectar ao servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validações de senha
      if (!formData.currentPassword) {
        warning('Senha atual obrigatória', 'Digite sua senha atual para continuar.');
        return;
      }

      if (!formData.newPassword) {
        warning('Nova senha obrigatória', 'Digite a nova senha.');
        return;
      }

      if (formData.newPassword.length < 6) {
        warning('Senha muito curta', 'A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        warning('Senhas não conferem', 'A confirmação da senha não confere.');
        return;
      }

      if (formData.currentPassword === formData.newPassword) {
        warning('Senha igual', 'A nova senha deve ser diferente da atual.');
        return;
      }

      // Chamar API para trocar senha
      const response = await fetch('/api/profile/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        success('Senha alterada!', 'Sua senha foi atualizada com sucesso.');
        // Limpar campos de senha
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        error('Erro ao alterar senha', result.error || 'Erro desconhecido');
      }
    } catch (err) {
      error('Erro de conexão', 'Não foi possível conectar ao servidor.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <AppLayout user={user} company={company}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <UserCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Carregando perfil do usuário...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user} company={company}>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center space-x-3">
          <UserCircleIcon className="w-8 h-8 text-gray-400" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Meu Perfil</h1>
            <p className="text-gray-600">Gerencie seus dados pessoais e configurações de conta</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <UserCircleIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold">Dados Pessoais</h3>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email usado para login e notificações
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={saving}
                    loading={saving}
                  >
                    {saving ? 'Salvando...' : 'Salvar Dados'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Alterar Senha */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <KeyIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold">Alterar Senha</h3>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Senha Atual *</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      placeholder="Digite sua senha atual"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">Nova Senha *</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      placeholder="Digite a nova senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 6 caracteres
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Digite novamente a nova senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={saving}
                    loading={saving}
                  >
                    {saving ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Informações da Conta */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Informações da Conta</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Função:</span>
                <span className="ml-2 font-medium capitalize">{user.role}</span>
              </div>
              <div>
                <span className="text-gray-600">Empresa:</span>
                <span className="ml-2 font-medium">{company?.name || 'Não configurada'}</span>
              </div>
              <div>
                <span className="text-gray-600">Ambiente:</span>
                <span className={`ml-2 font-medium ${
                  company?.environment === 'prod' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {company?.environment === 'prod' ? 'Produção' : 'Homologação'}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
