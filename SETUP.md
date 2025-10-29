# 🚀 Guia de Instalação e Configuração - APP 5D

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18 ou superior ([Download](https://nodejs.org/))
- **npm** ou **yarn** (vem com Node.js)
- **Git** ([Download](https://git-scm.com/))
- Conta no **Google** para Firebase

---

## 🛠️ Instalação Passo a Passo

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/APP5D.git
cd APP5D
```

### 2. Instale as Dependências

```bash
npm install
```

Isso vai instalar todas as dependências do projeto (React, Firebase, Tailwind, etc.).

### 3. Configure o Firebase

#### 3.1 Criar Projeto no Firebase

1. Acesse: https://console.firebase.google.com/
2. Clique em "Adicionar projeto"
3. Insira o nome: `quantumleap` (ou outro de sua escolha)
4. Siga os passos do assistente

#### 3.2 Configurar Authentication

1. No menu lateral, vá em **Authentication**
2. Clique em **Começar**
3. Vá na aba **Sign-in method**
4. Habilite:
   - ✅ **Email/Password** → Clique em "Email/Password" e ative
   - ✅ **Google** → Clique em "Google" e ative

#### 3.3 Configurar Firestore

1. No menu lateral, vá em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Selecione **Modo de produção** (pode mudar depois)
4. Escolha a localização: **us-central** (ou mais próxima)
5. Clique em **Ativar**

#### 3.4 Configurar Storage

1. No menu lateral, vá em **Storage**
2. Clique em **Começar**
3. Aceite as regras de segurança
4. Escolha a localização
5. Clique em **Concluir**

#### 3.5 Obter Credenciais

1. No menu lateral, vá em **⚙️ Configurações do projeto**
2. Role até **Seus apps**
3. Se não houver app web, clique em **</>** (ícone web)
4. Copie as credenciais:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abc123"
};
```

### 4. Configurar Credenciais no Projeto

Edite o arquivo `src/api/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJECT.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abc123"
};
```

### 5. Configurar Regras de Segurança

No Firebase Console, vá em **Firestore Database** > **Regras**, e coloque:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever seus próprios dados
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Pacientes podem ser lidos por terapeutas autenticados
    match /pacientes/{pacienteId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Sessões podem ser lidas por terapeutas autenticados
    match /sessoes/{sessaoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

Clique em **Publicar**.

---

## 🚀 Executando o Projeto

### Modo Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:5173

### Build de Produção

```bash
npm run build
```

Os arquivos estarão em `dist/`.

### Preview da Build

```bash
npm run preview
```

---

## ✅ Verificar Instalação

### 1. Teste o Servidor

```bash
npm run dev
```

Se tudo estiver correto, você verá:
```
VITE ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 2. Teste o Login

1. Abra o navegador em `http://localhost:5173`
2. Faça login com Google
3. Você deve ser redirecionado para o Dashboard

### 3. Teste Criação de Paciente

1. Vá em **Pacientes**
2. Clique em **Novo Paciente**
3. Preencha os dados
4. Salve
5. Verifique no console do navegador (F12):
   ```
   💾 Salvando paciente para terapeuta: demo-user-001
   ✅ Paciente criado com sucesso
   🔗 Conexão terapeuta-paciente estabelecida
   ```

### 4. Teste Persistência

1. Recarregue a página (F5)
2. Os pacientes devem permanecer na lista
3. A conexão terapeuta-paciente deve ser mantida

---

## 🐛 Troubleshooting

### Erro: Firebase não configurado

**Problema:** App não consegue se conectar ao Firebase

**Solução:**
1. Verifique as credenciais em `src/api/firebase.js`
2. Certifique-se de que o Firestore está ativo
3. Verifique as regras de segurança

### Erro: Pacientes não aparecem

**Problema:** Pacientes criados não são exibidos

**Solução:**
1. Abra o Console do navegador (F12)
2. Verifique se há erros
3. Verifique se o localStorage tem os dados: `localStorage.getItem('5d_pacientes')`
4. Verifique se o terapeuta_id está correto

### Erro: Build falha

**Problema:** `npm run build` retorna erro

**Solução:**
```bash
# Limpar cache
rm -rf node_modules dist
npm install
npm run build
```

### Erro: Porta já em uso

**Problema:** "Port 5173 is already in use"

**Solução:**
```bash
# Encontrar processo
npx kill-port 5173

# Ou usar outra porta
npm run dev -- --port 3000
```

---

## 📚 Comandos Úteis

### Desenvolvimento
```bash
npm run dev              # Inicia servidor
npm run dev -- --host    # Expor na rede local
npm run dev -- --port 3000  # Usar porta específica
```

### Build
```bash
npm run build            # Criar build de produção
npm run preview          # Preview da build
```

### Lint e Qualidade
```bash
npm run lint             # Verificar erros
npm run lint -- --fix    # Corrigir automaticamente
```

### Limpeza
```bash
rm -rf node_modules      # Remover node_modules
rm -rf dist              # Remover build
npm install              # Reinstalar
```

---

## 🔧 Configurações Avançadas

### Alterar Porta do Dev Server

Edite `vite.config.js`:
```javascript
export default defineConfig({
  server: {
    port: 3000
  }
})
```

### Adicionar Variáveis de Ambiente

Crie arquivo `.env.local`:
```
VITE_FIREBASE_API_KEY=sua_key
VITE_FIREBASE_AUTH_DOMAIN=seu_domain
```

Use no código:
```javascript
import.meta.env.VITE_FIREBASE_API_KEY
```

---

## 📞 Suporte

Se encontrar problemas:

1. ✅ Verifique o Console do navegador (F12)
2. ✅ Verifique o terminal onde o servidor está rodando
3. ✅ Certifique-se de que todas as dependências foram instaladas
4. ✅ Verifique a configuração do Firebase

---

## 🎉 Pronto!

Agora você está pronto para usar o APP 5D!

**Próximos passos:**
1. ✅ Faça login
2. ✅ Cadastre um paciente
3. ✅ Crie uma sessão
4. ✅ Teste a geração de PDF
5. ✅ Explore todas as features!

**Desenvolvido com ❤️ para terapeutas quânticos**

