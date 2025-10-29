# 🤖 Instruções Rápidas - Gemini AI

## ✅ Status Atual

- ✅ **Gemini AI já instalado** (`@google/generative-ai`)
- ✅ **API protegida** (arquivos .env não vão para GitHub)
- ✅ **Fallback inteligente** (funciona sem API key também)
- ✅ **Pronto para usar!**

---

## 🚀 Configurar Sua API Key (2 minutos)

### Passo 1: Obter API Key

1. Acesse: https://ai.google.dev/
2. Clique em **"Get API Key"**
3. Faça login com sua conta Google
4. Clique em **"Create API Key"**
5. Escolha **"Create API key in new project"** (recomendado)
6. **Copie a API key** que aparece

### Passo 2: Configurar Localmente

1. Na pasta do projeto, crie arquivo `.env.local`:
```bash
VITE_FIREBASE_API_KEY=AIzaSyA0TAi6othrUEuoGvsG1N3n61IE2bSSF5Q
VITE_FIREBASE_AUTH_DOMAIN=quantumleap-akwyh.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=quantumleap-akwyh
VITE_FIREBASE_STORAGE_BUCKET=quantumleap-akwyh.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=547569031304
VITE_FIREBASE_APP_ID=1:547569031304:web:13166b794e7c00b985673d

# COLE AQUI SUA API KEY DO GEMINI:
VITE_GEMINI_API_KEY=AIzaSy... (cole aqui)
```

2. Reinicie o servidor:
```bash
npm run dev
```

3. **Teste o chatbot!**
   - Clique no botão roxo flutuante
   - Digite: "Olá"
   - Se aparecer no console: ✅ Gemini AI inicializado com sucesso → Está funcionando!

### Passo 3: Configurar no Vercel (para produção)

1. Acesse: https://vercel.com
2. Vá em seu projeto
3. **Settings** > **Environment Variables**
4. Adicione nova variável:
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** sua API key
   - **Environment:** Production
5. Clique em **Save**
6. **Redeploy** (ou aguarde deploy automático)

---

## 🔒 Proteção Garantida

### ✅ O que está protegido:
- `.env.local` → **NÃO vai para GitHub**
- `.env` → **NÃO vai para GitHub**
- Sua API key → **Protegida**

### ✅ O que está no GitHub:
- Código do chatbot
- Sistema de fallback
- Documentação

---

## 💡 Como Funciona

### Com API Key (Modo Inteligente):
- Chatbot usa **Gemini AI**
- Respostas contextuais e inteligentes
- Entende perguntas complexas
- Conversação natural

### Sem API Key (Modo Demo):
- Chatbot usa respostas pré-programadas
- Responde baseado em palavras-chave
- **Funciona perfeitamente** para testes

---

## 📊 Custos

- **Primeiras 15 req/min:** GRÁTIS
- **Depois:** ~$0.0001 por mensagem
- **Uso típico:** $1-5/mês

---

## ✅ Checklist

- [ ] API Key obtida em https://ai.google.dev/
- [ ] Arquivo `.env.local` criado
- [ ] `VITE_GEMINI_API_KEY` adicionado
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Chatbot testado e funcionando
- [ ] API key adicionada no Vercel
- [ ] Deploy em produção funcionando

---

**Tudo pronto! Agora é só configurar e usar! 🚀**

Para dúvidas: leia `CONFIG_GEMINI.md`

