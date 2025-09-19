'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

interface CertificateUploadProps {
  companyId?: string;
  certificateInfo?: {
    has_certificate: boolean;
    certificate_id?: string;
    uploaded_at?: string;
  };
  onUploadSuccess?: () => void;
}

export function CertificateUpload({ 
  companyId, 
  certificateInfo, 
  onUploadSuccess 
}: CertificateUploadProps) {
  const { success, error: showError, warning } = useToast();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    certificate: null as File | null,
    passphrase: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar extensão
      const validExtensions = ['.pfx', '.p12'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Arquivo deve ser .pfx ou .p12');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      
      setFormData(prev => ({ ...prev, certificate: file }));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!companyId) {
      setError('ID da empresa não encontrado');
      return;
    }

    if (!formData.certificate) {
      setError('Selecione um arquivo de certificado');
      return;
    }

    if (!formData.passphrase.trim()) {
      setError('Digite a senha do certificado');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('companyId', companyId);
      formDataToSend.append('certificate', formData.certificate);
      formDataToSend.append('passphrase', formData.passphrase);

      
      const response = await fetch('/api/certificates/simple-upload', {
        method: 'POST',
        body: formDataToSend
      });


      const result = await response.json();

      if (result.success) {
        success('Certificado enviado!', 'Certificado A1 configurado com sucesso.');
        setFormData({ certificate: null, passphrase: '' });
        onUploadSuccess?.();
      } else {
        showError('Erro no upload', result.error || 'Erro ao enviar certificado');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setUploading(false);
    }
  };

  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!companyId) return;

    const confirmMessage = `
🚨 ATENÇÃO: Remover Certificado Digital

Tem certeza que deseja remover o certificado atual?

⚠️ Esta ação irá:
• Remover permanentemente o certificado A1
• Impedir a emissão de novas notas fiscais
• Não pode ser desfeita

Para continuar emitindo NFS-e, você precisará fazer upload de um novo certificado.

Deseja continuar?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setRemoving(true);
    setError(null);

    try {
      const response = await fetch(`/api/certificates/upload?companyId=${companyId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        // Sucesso: atualizar interface para mostrar que não há certificado
        onUploadSuccess?.();
        
        // Feedback visual de sucesso
        setError(null);
      } else {
        setError(`Erro ao remover certificado: ${result.error}`);
      }
    } catch (error) {
      setError(`Erro ao remover certificado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setRemoving(false);
    }
  };

  if (certificateInfo?.has_certificate) {
    return (
      <div className="space-y-4">
        {/* Status do Certificado - Verde e Destaque */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Certificado Digital Ativo
                </h3>
                <p className="text-sm text-green-700">
                  Certificado A1 instalado e pronto para uso
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Informações do Certificado */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Informações do Certificado</h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Data de Envio:</span>
              <span className="font-medium text-gray-900">
                {certificateInfo.uploaded_at ? 
                  new Date(certificateInfo.uploaded_at).toLocaleString('pt-BR') : 
                  'Data não disponível'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID do Certificado:</span>
              <span className="font-mono text-xs text-gray-700">
                {certificateInfo.certificate_id || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-medium">Válido e Ativo</span>
            </div>
          </div>
        </div>

        {/* Ações do Certificado */}
        <div className="flex space-x-3">
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              // Implementar modal ou funcionalidade inline
              alert('Para substituir o certificado, remova o atual e faça upload de um novo.');
            }}
          >
            Substituir Certificado
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            className="flex-1"
            onClick={handleRemove}
            loading={removing}
            disabled={removing}
          >
            {removing ? 'Removendo...' : 'Remover Certificado'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seção Única - Incluir Certificado */}
      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-orange-900">
              Certificado Digital Necessário
            </h3>
            <p className="text-sm text-orange-700">
              Faça upload do seu certificado A1 para emitir notas fiscais
            </p>
          </div>
        </div>

        {/* Requisitos */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Requisitos do Certificado</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Formato: .pfx ou .p12</li>
            <li>• Tipo: Certificado A1 válido</li>
            <li>• Tamanho máximo: 5MB</li>
            <li>• Senha obrigatória</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Formulário */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="certificate">Arquivo do Certificado *</Label>
            <Input
              id="certificate"
              type="file"
              accept=".pfx,.p12"
              onChange={handleFileChange}
              className="text-sm mt-1"
            />
            {formData.certificate && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                <CheckCircleIcon className="h-4 w-4" />
                <span>{formData.certificate.name}</span>
                <span className="text-xs">({(formData.certificate.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="passphrase">Senha do Certificado *</Label>
            <Input
              id="passphrase"
              type="password"
              value={formData.passphrase}
              onChange={(e) => setFormData(prev => ({ ...prev, passphrase: e.target.value }))}
              placeholder="Digite a senha do certificado"
              className="mt-1"
            />
          </div>

          <Button 
            variant="primary" 
            size="sm" 
            className="w-full"
            onClick={handleUpload}
            loading={uploading}
            disabled={uploading || !formData.certificate || !formData.passphrase}
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            {uploading ? 'Enviando Certificado...' : 'Incluir Certificado'}
          </Button>
        </div>
      </div>
    </div>
  );
}
