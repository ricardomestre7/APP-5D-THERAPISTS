# 🤖 Guia Completo - Integração Gemini AI no APP 5D

## ✅ Status Atual

- ✅ **SDK Instalado:** `@google/generative-ai` versão 0.24.1
- ✅ **Integração Completa:** `src/api/gemini.js`
- ✅ **Chatbot Funcional:** `src/components/ChatbotFloating.jsx`
- ✅ **Contexto Configurado:** System Instruction personalizada
- ✅ **Fallback Implementado:** Funciona sem API key

---

## 🚀 Instalação (Já Concluída)

```bash
npm install @google/generative-ai
```

**✅ Status:** Já instalado e funcionando!

---

## 🔑 Obter API Key

### Passo 1: Acesse o Google AI Studio
👉 **https://ai.google.dev/**

### Passo 2: Faça Login
- Use sua conta Google
- Clique em **"Get API Key"**

### Passo 3: Criar Nova API Key
- Clique em **"Create API Key"**
- Escolha: **"Create API key in new project"**
- **Copie a API key gerada**

---

## ⚙️ Configurar no Projeto

### Opção A: Local (.env.local)

1. **Criar arquivo `.env.local`** na raiz:
```bash
# Firebase
VITE_FIREBASE_API_KEY=AIzaSyA0TAi6othrUEuoGvsG1N3n61IE2bSSF5Q
VITE_FIREBASE_AUTH_DOMAIN=quantumleap-akwyh.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=quantumleap-akwyh
VITE_FIREBASE_STORAGE_BUCKET=quantumleap-akwyh.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=547569031304
VITE_FIREBASE_APP_ID=1:547569031304:web:13166b794e7c00b985673d

# Google Gemini AI
VITE_GEMINI_API_KEY=SUA_API_KEY_AQUI
```

2. **Substitua** `SUA_API_KEY_AQUI` pela chave copiada

3. **Reinicie o servidor:**
```bash
# Parar: Ctrl+C
npm run dev
```

### Opção B: Vercel (Produção)

1. Acesse: **https://vercel.com**
2. Seu projeto → **Settings** → **Environment Variables**
3. Adicione:
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** sua API key
   - **Environment:** Production
4. Click **Save**
5. Aguarde redeploy automático

---

## ✅ Verificar Funcionamento

### 1. Abra o Console do Navegador (F12)

**Com API Key:**
```
✅ Gemini AI inicializado com sucesso
```

**Sem API Key:**
```
⚠️ VITE_GEMINI_API_KEY não configurada. Usando modo demo.
```

### 2. Teste o Chatbot

1. Clique no **botão roxo flutuante** (canto inferior direito)
2. Digite uma pergunta: **"Como cadastrar um paciente?"**
3. Observe a resposta

**Com Gemini:**
- Resposta inteligente e contextualizada
- Entende linguagem natural
- Foca no APP 5D

**Sem Gemini (Demo):**
- Resposta baseada em palavras-chave
- Funciona para testes básicos

---

## 🎨 Como Funciona

### Arquitetura

```
ChatbotFloating.jsx
    ↓
gemini.js (src/api/)
    ↓
Google Gemini AI
```

### Fluxo de Mensagens

1. Usuário digita mensagem
2. `ChatbotFloating` captura
3. Chama `sendMessageToGemini()`
4. `gemini.js` envia para API Gemini
5. Gemini processa com contexto do APP 5D
6. Retorna resposta inteligente
7. Exibe no chat

### Fallback

Se API key não configurada:
- Usa respostas pré-programadas
- Funciona localmente sem custo
- Boa para desenvolvimento/testes

---

## 📊 Modelos Disponíveis

### Configurado Atualmente
```javascript
model: 'gemini-1.5-flash'
```

### Outros Modelos Disponíveis
- `gemini-1.5-pro` - Mais potente, paga
- `gemini-1.5-flash` - Rápido e gratuito ✅ (Usando este)
- `gemini-pro` - Versão anterior

**Recomendação:** Mantenha `gemini-1.5-flash` (rápido e gratuito)

---

## 💰 Custos (Gratuito até 15 req/min)

### Limite Gratuito
- **15 requisições por minuto** - GRÁTIS
- **Ideal para uso pessoal/pequeno**

### Depois do Limite
- **$0.0001 por requisição** (~$0.01 para 100 mensagens)
- **Uso típico:** $1-5/mês

### Ver Limites Atuais
👉 https://ai.google.dev/pricing

---

## 🛠️ Código de Integração

### Arquivo: `src/api/gemini.js`

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = new GoogleGenerativeAI(API_KEY);
let model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: '...contexto do APP 5D...'
});

export const sendMessageToGemini = async (message) => {
    const result = await model.generateContent(message);
    return result.response.text();
};
```

### Uso no Chatbot: `src/components/ChatbotFloating.jsx`

```javascript
import { sendMessageToGemini, isGeminiAvailable } from '@/api/gemini';

// No handler:
if (isGeminiAvailable()) {
    response = await sendMessageToGemini(message);
} else {
    // Fallback
}
```

---

## 🎯 Contexto Configurado

O Gemini recebe **system instruction** completa sobre:
- ✅ Funcionalidades do APP 5D
- ✅ Pacientes, sessões, terapias
- ✅ Terminologia quântica
- ✅ Campos energéticos
- ✅ Bibliotecas (cristais, ervas, óleos)
- ✅ Como ajudar o terapeuta

**Arquivo:** `CONTEXTO_APP5D_PARA_AI.md`

---

## 🐛 Troubleshooting

### "Gemini API não configurada"
**Solução:**
- Verifique `.env.local` existe
- Verifique chave está correta
- Reinicie servidor: `npm run dev`

### "Erro ao chamar Gemini"
**Solução:**
- Verifique chave está ativa em https://ai.google.dev/
- Verifique limites não excedidos
- Sistema usa fallback automaticamente

### Chatbot não responde
**Solução:**
- Verifique console (F12) para erros
- Teste sem Gemini (modo demo)
- Verifique conexão internet

---

## 📝 Checklist

- [ ] SDK instalado (`@google/generative-ai`)
- [ ] API key obtida em https://ai.google.dev/
- [ ] `.env.local` criado com chave
- [ ] Servidor reiniciado
- [ ] Chatbot testado
- [ ] Console verifica inicialização
- [ ] Respostas funcionando
- [ ] Produção configurada no Vercel

---

## 🎉 Pronto!

**Tudo configurado e funcionando!** 🚀

O chatbot está:
- ✅ Integrado no APP 5D
- ✅ Usando contexto completo
- ✅ Com fallback inteligente
- ✅ Pronto para produção

**Desenvolvido com ❤️ para terapeutas quânticos**

