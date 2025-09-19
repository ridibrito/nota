# Emissor NFS-e DF

Sistema completo para emissão, consulta e cancelamento de Notas Fiscais de Serviços Eletrônicas para o Distrito Federal, seguindo o padrão ABRASF 2.04 e integrado com ISSNet DF.

## 🚀 Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** 
- **Supabase** (Auth, Postgres, Storage)
- **Node.js Runtime** (para suporte completo a certificados digitais)

## 📋 Funcionalidades

### MVP Implementado
- ✅ Autenticação Supabase com perfis (Admin/Operador)
- ✅ Gestão de empresa e certificado A1
- ✅ CRUD de tomadores (clientes)
- ✅ Emissão de NFS-e com arredondamento ABNT 5891
- ✅ Consulta e cancelamento de NFS-e
- ✅ Logs completos de operações SOAP
- ✅ Dashboard com métricas
- ✅ Interface responsiva e moderna

### Características Técnicas
- 🔐 Certificados A1 criptografados com AES-256-GCM
- 📐 Arredondamento fiscal conforme ABNT 5891
- 🔏 Assinatura XML com certificado digital
- 🌐 Cliente SOAP com suporte a TLS mútua
- 📊 Cálculos fiscais precisos (6 casas → 2 casas decimais)
- 🔍 Logs mascarados para dados sensíveis
- 🏗️ Arquitetura preparada para multi-tenant

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <repo-url>
cd notas
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Copie o arquivo `env.local.example` para `.env.local` e configure:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Certificate Encryption (gere com: openssl rand -base64 32)
CERT_ENCRYPTION_KEY=your_32_byte_base64_key

# ISSNet DF
ISSNET_ENV=homolog
ISSNET_SOAP_URL_HOMOLOG=https://homologacao.issnetonline.com.br/abrasf204/nfse.asmx
ISSNET_SOAP_URL_PROD=https://www.issnetonline.com.br/abrasf204/nfse.asmx
ISSNET_SOAP_TIMEOUT_MS=30000
```

### 4. Configure o Supabase

#### 4.1. Crie um projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e as chaves

#### 4.2. Execute as migrations
```bash
# Se usando Supabase CLI
supabase db push

# Ou execute manualmente o SQL em supabase/migrations/001_initial_schema.sql
```

#### 4.3. Configure Storage (opcional)
Para armazenar certificados no Supabase Storage:
```sql
-- Criar bucket para certificados
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);

-- Política de acesso
CREATE POLICY "Users can access their company certificates" ON storage.objects
FOR ALL USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📖 Como Usar

### 1. Configuração Inicial

#### 1.1. Cadastre sua empresa
- Acesse "Empresa" no menu
- Preencha todos os dados fiscais (CNPJ, IM, CNAE, etc.)
- Configure ambiente (Homologação/Produção)

#### 1.2. Faça upload do certificado A1
- Na mesma tela, faça upload do arquivo .pfx/.p12
- Digite a senha do certificado
- O sistema valida e criptografa automaticamente

### 2. Gestão de Tomadores
- Acesse "Tomadores" 
- Cadastre clientes (CPF/CNPJ, nome, endereço)
- Importe via CSV se necessário

### 3. Emissão de NFS-e
- Acesse "NFS-e" → "Emitir Nova"
- Selecione o tomador
- Preencha dados do serviço
- O sistema calcula ISS automaticamente
- Clique em "Emitir" para enviar ao ISSNet

### 4. Consultas e Cancelamentos
- Liste todas as NFS-e em "NFS-e"
- Use filtros por período, status, cliente
- Consulte status no ISSNet
- Cancele com justificativa quando necessário

## 🧮 Arredondamento ABNT 5891

O sistema implementa as 4 regras oficiais:

```javascript
// Exemplos
86.064 → 86.06  // Regra 2.1: < 5, trunca
86.066 → 86.07  // Regra 2.2: > 5, arredonda
86.065 → 86.07  // Regra 2.3: = 5 + zeros + ímpar anterior
86.045 → 86.04  // Regra 2.4: = 5 + zeros + par anterior
```

## 🔐 Segurança

### Certificados Digitais
- Armazenamento criptografado com AES-256-GCM
- Chaves nunca expostas no client-side
- Validação automática de validade

### Dados Sensíveis
- Logs SOAP com dados mascarados
- CPF/CNPJ protegidos nos logs
- Auditoria completa de operações

## 🧪 Testes

```bash
# Testes unitários (arredondamento, criptografia, etc.)
npm test

# Testes do arredondamento ABNT
npm test src/lib/tax/__tests__/rounding.test.ts
```

## 📊 Monitoramento

### Dashboard
- Total de NFS-e por status
- Valores faturados e ISS
- Últimas emissões
- Métricas do mês atual

### Logs
- Todas as requisições SOAP
- Status HTTP das operações
- XMLs de request/response (mascarados)

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Configure as variáveis de ambiente no painel da Vercel
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🛣️ Roadmap

### Versão 2.0
- [ ] Multi-empresa (SaaS)
- [ ] Templates fiscais por atividade
- [ ] Geração de PDF DANFSe  
- [ ] API webhooks para integração
- [ ] Dashboard avançado com gráficos
- [ ] Backup automático de XMLs

### Integrações Futuras
- [ ] Outros municípios (ABRASF 2.04)
- [ ] NFCe (Nota Fiscal do Consumidor)
- [ ] Integração com ERPs
- [ ] App mobile para consultas

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📞 Suporte

- 📧 Email: [seu-email@empresa.com]
- 📱 WhatsApp: [seu-whatsapp]
- 🐛 Issues: [GitHub Issues](link-para-issues)

## 📚 Documentação Técnica

### APIs Implementadas
- `POST /api/invoices/issue` - Emitir NFS-e
- `POST /api/invoices/query` - Consultar NFS-e  
- `POST /api/invoices/cancel` - Cancelar NFS-e
- `POST /api/certificates/upload` - Upload certificado
- `GET /api/invoices/query` - Listar NFS-e

### Estrutura do Banco
Ver `supabase/migrations/001_initial_schema.sql` para schema completo.

### Padrões Implementados
- ABRASF 2.04 (Associação Brasileira das Secretarias de Finanças)
- ISSNet DF (Converge Tecnologia)
- SOAP 1.2 com assinatura XML
- Certificados A1 (PKCS#12)

---

**Emissor NFS-e DF** - Desenvolvido com ❤️ para simplificar a emissão de notas fiscais.