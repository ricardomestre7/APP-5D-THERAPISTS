# 🐳 Guia Docker - APP 5D Therapists

## 📋 Pré-requisitos

- Docker instalado ([Docker Desktop](https://www.docker.com/products/docker-desktop))
- Docker Compose (incluído no Docker Desktop)

## 🚀 Início Rápido

### Desenvolvimento

1. **Criar arquivo `.env`** (se ainda não tiver):
```bash
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-dominio
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
VITE_FIREBASE_APP_ID=seu-app-id
VITE_GEMINI_API_KEY=sua-gemini-key
```

2. **Iniciar ambiente de desenvolvimento**:
```bash
docker-compose up app-dev
```

A aplicação estará disponível em: http://localhost:5173

### Produção

1. **Build e iniciar**:
```bash
docker-compose up app-prod --build
```

A aplicação estará disponível em: http://localhost:80

## 📝 Comandos Úteis

### Desenvolvimento

```bash
# Iniciar em background
docker-compose up -d app-dev

# Ver logs
docker-compose logs -f app-dev

# Parar
docker-compose stop app-dev

# Rebuild após mudanças no Dockerfile
docker-compose up app-dev --build

# Executar comandos dentro do container
docker-compose exec app-dev npm run lint
```

### Produção

```bash
# Build da imagem
docker-compose build app-prod

# Iniciar produção
docker-compose up -d app-prod

# Ver logs
docker-compose logs -f app-prod

# Parar
docker-compose stop app-prod
```

## 🏗️ Build Manual

### Desenvolvimento
```bash
docker build -t 5d-app-dev --target development .
docker run -p 5173:5173 -v $(pwd):/app 5d-app-dev
```

### Produção
```bash
docker build -t 5d-app-prod --target production .
docker run -p 80:80 5d-app-prod
```

## 🔧 Estrutura dos Arquivos Docker

- **Dockerfile**: Multi-stage build (development e production)
- **docker-compose.yml**: Configuração de serviços
- **.dockerignore**: Arquivos excluídos do build
- **nginx.conf**: Configuração do servidor web para produção

## 🌐 Variáveis de Ambiente

As variáveis de ambiente do Firebase e Gemini devem ser configuradas no arquivo `.env` na raiz do projeto. O Docker Compose carrega automaticamente esse arquivo.

## 📦 Otimizações

- **Multi-stage build**: Imagens menores para produção
- **Cache de dependências**: `npm ci` usa package-lock.json
- **Volume mounting**: Hot reload em desenvolvimento
- **nginx**: Servidor otimizado para servir arquivos estáticos

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Alterar porta no docker-compose.yml
ports:
  - "5174:5173"  # Usar porta 5174 ao invés de 5173
```

### Permissões no Linux
```bash
# Se tiver problemas de permissão
sudo docker-compose up app-dev
```

### Limpar containers antigos
```bash
docker-compose down
docker system prune -a
```

## 🔒 Segurança

- Variáveis sensíveis via `.env` (não commitar no git)
- Headers de segurança no nginx
- Imagem Alpine Linux (menor superfície de ataque)

## 📚 Recursos

- [Documentação Docker](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

