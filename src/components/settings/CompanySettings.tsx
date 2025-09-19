'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useCompany } from '@/lib/hooks/useCompany';
import { useAuth } from '@/lib/hooks/useAuth';
import { BuildingOfficeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface CompanyFormData {
  name: string;
  cnpj: string;
  im: string;
  cnae: string;
  item_lista_servico: string;
  cod_tributacao_municipio: string;
  environment: 'homolog' | 'prod';
}

export function CompanySettings() {
  const { user } = useAuth();
  const { company, loading, updateCompany, createCompany } = useCompany();
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    cnpj: '',
    im: '',
    cnae: '',
    item_lista_servico: '',
    cod_tributacao_municipio: '',
    environment: 'homolog'
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Carregar dados da empresa quando disponível
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        cnpj: company.cnpj || '',
        im: company.im || '',
        cnae: company.cnae || '',
        item_lista_servico: company.item_lista_servico || '',
        cod_tributacao_municipio: company.cod_tributacao_municipio || '',
        environment: company.environment || 'homolog'
      });
    }
  }, [company]);

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      let result;
      
      if (company) {
        // Atualizar empresa existente
        result = await updateCompany(formData);
      } else {
        // Criar nova empresa
        result = await createCompany(formData);
      }

      if (result.success) {
        setMessage({
          type: 'success',
          text: company ? 'Empresa atualizada com sucesso!' : 'Empresa criada com sucesso!'
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Erro ao salvar empresa'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Configurações da Empresa</h2>
            <p className="text-gray-600">Carregando dados da empresa...</p>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Configurações da Empresa</h2>
            <p className="text-gray-600">Dados fiscais e informações da empresa</p>
          </div>
        </div>
        {company && (
          <Badge variant="success">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Configurada
          </Badge>
        )}
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Dados da Empresa</h3>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="name">Razão Social *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="Nome completo da empresa"
                />
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  required
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>

              <div>
                <Label htmlFor="im">Inscrição Municipal *</Label>
                <Input
                  id="im"
                  type="text"
                  value={formData.im}
                  onChange={(e) => handleInputChange('im', e.target.value)}
                  required
                  placeholder="Inscrição Municipal"
                />
              </div>

              <div>
                <Label htmlFor="cnae">CNAE *</Label>
                <Input
                  id="cnae"
                  type="text"
                  value={formData.cnae}
                  onChange={(e) => handleInputChange('cnae', e.target.value)}
                  required
                  placeholder="0000-0/00"
                />
              </div>

              <div>
                <Label htmlFor="environment">Ambiente *</Label>
                <Select
                  id="environment"
                  value={formData.environment}
                  onChange={(e) => handleInputChange('environment', e.target.value as 'homolog' | 'prod')}
                  required
                >
                  <option value="homolog">Homologação</option>
                  <option value="prod">Produção</option>
                </Select>
              </div>
            </div>

            {/* Configurações Fiscais */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Configurações Fiscais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="item_lista_servico">Item Lista de Serviço *</Label>
                  <Input
                    id="item_lista_servico"
                    type="text"
                    value={formData.item_lista_servico}
                    onChange={(e) => handleInputChange('item_lista_servico', e.target.value)}
                    required
                    placeholder="01.05"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: 01.05 - Desenvolvimento de programas de computador
                  </p>
                </div>

                <div>
                  <Label htmlFor="cod_tributacao_municipio">Código Tributação Município *</Label>
                  <Input
                    id="cod_tributacao_municipio"
                    type="text"
                    value={formData.cod_tributacao_municipio}
                    onChange={(e) => handleInputChange('cod_tributacao_municipio', e.target.value)}
                    required
                    placeholder="Código de tributação"
                  />
                </div>
              </div>
            </div>

            {/* Mensagens */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                  )}
                  {message.text}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end space-x-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : (company ? 'Atualizar Empresa' : 'Criar Empresa')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Informações Adicionais */}
      {company && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Status da Configuração</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span>Empresa configurada</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  company.environment === 'prod' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span>Ambiente: {company.environment === 'prod' ? 'Produção' : 'Homologação'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">ID:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{company.id}</code>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
