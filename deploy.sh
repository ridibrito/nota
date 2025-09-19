#!/bin/bash

echo "🚀 Deploy do Emissor NFS-e DF"
echo "================================="

# 1. Verificar se .env.production existe
if [ ! -f .env.production ]; then
    echo "❌ Arquivo .env.production não encontrado"
    echo "Copie .env.example para .env.production e configure as variáveis"
    exit 1
fi

# 2. Instalar dependências
echo "📦 Instalando dependências..."
npm ci --only=production

# 3. Build da aplicação
echo "🔨 Buildando aplicação..."
npm run build

# 4. Verificar se build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso"
else
    echo "❌ Erro no build"
    exit 1
fi

# 5. Opcional: Deploy via Docker
echo "🐳 Iniciando com Docker..."
docker-compose -f docker-compose.yml up -d --build

echo "🎉 Deploy concluído!"
echo "Acesse: http://localhost:3000"

