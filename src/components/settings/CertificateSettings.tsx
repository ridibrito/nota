'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useCompany } from '@/lib/hooks/useCompany';
import { 
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

interface CertificateInfo {
  id: string;
  uploaded_at: string;
  file_size: number;
  valid_until?: string;
  subject?: string;
  issuer?: string;
}

export function CertificateSettings() {
  const { company } = useCompany();
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [uploading, setUploading] = useState(false);
  const [certificateInfo, setCertificateInfo] = useState<CertificateInfo | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Debug: log do estado (removido em produção)
  // console.log('CertificateSettings - Estado atual:', {
  //   hasCompany: !!company,
  //   companyId: company?.id,
  //   hasCertificateInfo: !!certificateInfo,
  //   certificateId: certificateInfo?.id
  // });

  useEffect(() => {
    if (company?.id) {
      console.log('Componente CertificateSettings montado, buscando certificado...');
      fetchCertificateInfo();
    }
  }, [company?.id]);

  const fetchCertificateInfo = async () => {
    if (!company) return;

    try {
      console.log('Buscando informações do certificado para empresa:', company.id);
      
      const response = await fetch(`/api/certificates/info?companyId=${company.id}`);
      const data = await response.json();
      
      console.log('Resposta da API de certificado:', data);
      
      if (response.ok && data.success) {
        if (data.data) {
          console.log('Certificado encontrado, atualizando estado');
          setCertificateInfo(data.data);
        } else {
          console.log('Nenhum certificado encontrado, limpando estado');
          setCertificateInfo(null);
        }
      } else {
        console.error('Erro na resposta da API:', data);
        setCertificateInfo(null);
      }
    } catch (error) {
      console.error('Erro ao buscar informações do certificado:', error);
      setCertificateInfo(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar se é um arquivo .pfx ou .p12
      const validExtensions = ['.pfx', '.p12'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        setMessage({
          type: 'error',
          text: 'Selecione um arquivo .pfx ou .p12'
        });
        return;
      }

      setCertificateFile(file);
      setMessage(null);
    }
  };


  const handleUpload = async () => {
    if (!certificateFile || !passphrase || !company) {
      setMessage({
        type: 'error',
        text: 'Selecione um arquivo e digite a senha'
      });
      return;
    }

    // Se há certificado existente, confirmar substituição
    if (certificateInfo) {
      const confirmReplace = confirm(
        'Tem certeza que deseja substituir o certificado atual? O certificado anterior será removido permanentemente.'
      );
      if (!confirmReplace) {
        return;
      }
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('certificate', certificateFile);
      formData.append('passphrase', passphrase);
      formData.append('companyId', company.id);

      const response = await fetch('/api/certificates/simple-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: certificateInfo ? 'Certificado substituído com sucesso!' : 'Certificado enviado com sucesso!'
        });
        setCertificateFile(null);
        setPassphrase('');
        
        // Aguardar um pouco antes de buscar as informações atualizadas
        setTimeout(() => {
          fetchCertificateInfo();
        }, 1000);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Erro ao enviar certificado'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro ao enviar certificado'
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <KeyIcon className="w-8 h-8 text-gray-400" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Configurações de Certificados</h2>
            <p className="text-gray-600">Configure os dados da empresa primeiro.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <KeyIcon className="w-8 h-8 text-gray-400" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Configurações de Certificados</h2>
            <p className="text-gray-600">Certificado A1 para assinatura digital de NFS-e</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {certificateInfo && (
            <Badge variant="success">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Certificado Ativo
            </Badge>
          )}
          <div className="flex space-x-2">
            <Button 
              onClick={fetchCertificateInfo} 
              variant="secondary" 
              size="sm"
            >
              Atualizar Status
            </Button>
            <Button 
              onClick={() => {
                console.log('Forçando limpeza e busca...');
                setCertificateInfo(null);
                setTimeout(fetchCertificateInfo, 100);
              }} 
              variant="secondary" 
              size="sm"
            >
              Forçar Atualização
            </Button>
          </div>
        </div>
      </div>

      {/* Certificado Ativo */}
      {certificateInfo && (
        <Card>
          <CardBody>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
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

            {/* Informações Detalhadas do Certificado */}
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Informações do Certificado</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data de Envio:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(certificateInfo.uploaded_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tamanho:</span>
                    <span className="font-medium text-gray-900">
                      {formatFileSize(certificateInfo.file_size)}
                      {certificateInfo.file_size === 2048 && (
                        <span className="text-gray-500 ml-1">(estimado)</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600 font-medium">Válido e Ativo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="font-mono text-xs text-gray-700">
                      {certificateInfo.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações do Certificado */}
            <div className="mt-4 flex space-x-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  // Implementar modal ou expandir formulário inline
                  alert('Funcionalidade de substituição será implementada em breve. Por enquanto, remova o certificado atual e faça upload de um novo.');
                }}
              >
                Substituir Certificado
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={async () => {
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

                  try {
                    const response = await fetch(`/api/certificates/upload?companyId=${company?.id}`, {
                      method: 'DELETE'
                    });

                    const result = await response.json();

                    if (result.success) {
                      setMessage({
                        type: 'success',
                        text: 'Certificado removido com sucesso!'
                      });
                      setCertificateInfo(null);
                    } else {
                      setMessage({
                        type: 'error',
                        text: `Erro ao remover certificado: ${result.error}`
                      });
                    }
                  } catch (error) {
                    setMessage({
                      type: 'error',
                      text: 'Erro ao remover certificado'
                    });
                  }
                }}
              >
                Remover Certificado
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Upload de Certificado - Apenas quando não há certificado */}
      {!certificateInfo && (
        <Card data-upload-section>
          <CardHeader>
            <h3 className="text-lg font-semibold">Incluir Certificado A1</h3>
            <p className="text-sm text-gray-600 mt-1">
              Faça upload do seu certificado digital para começar a emitir NFS-e
            </p>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Status sem Certificado integrado */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-orange-900">
                    Certificado Digital Necessário
                  </h4>
                  <p className="text-sm text-orange-700">
                    Faça upload do seu certificado A1 para emitir notas fiscais
                  </p>
                </div>
              </div>

              {/* Requisitos integrados */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h5 className="text-sm font-medium text-blue-900 mb-2">📋 Requisitos do Certificado</h5>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Formato: .pfx ou .p12</li>
                  <li>• Tipo: Certificado A1 válido</li>
                  <li>• Tamanho máximo: 5MB</li>
                  <li>• Senha obrigatória</li>
                </ul>
              </div>
            </div>

            <div>
              <Label htmlFor="certificate">Arquivo do Certificado (.pfx ou .p12) *</Label>
              <div className="mt-2">
                <input
                  id="certificate"
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
              {certificateFile && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                  <DocumentIcon className="w-4 h-4" />
                  <span>{certificateFile.name}</span>
                  <span>({formatFileSize(certificateFile.size)})</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="passphrase">Senha do Certificado *</Label>
              <Input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Digite a senha do certificado"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                A senha será criptografada e armazenada com segurança
              </p>
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

            {/* Botão de Upload */}
            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={!certificateFile || !passphrase || uploading}
              >
                <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                {uploading ? 'Enviando Certificado...' : 'Incluir Certificado'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Informações sobre Certificados A1 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">ℹ️ Sobre Certificados A1</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <strong>Formato:</strong> O certificado deve estar no formato .pfx ou .p12
            </div>
            <div>
              <strong>Validade:</strong> Certificados A1 são válidos por 1 ano
            </div>
            <div>
              <strong>Segurança:</strong> O certificado é criptografado antes do armazenamento
            </div>
            <div>
              <strong>Uso:</strong> Necessário para assinar digitalmente as NFS-e
            </div>
            <hr />
            <div className="text-xs">
              <strong>Importante:</strong> Mantenha sua senha segura. Sem ela, não será possível usar o certificado.
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

