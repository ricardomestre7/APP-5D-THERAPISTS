# 🤖 Configuração da API do Gemini

## ✅ Status Atual

A API do Gemini **está implementada e funcionando** no sistema!

### Onde está sendo usada:
- ✅ Chatbot flutuante (botão roxo no canto inferior direito)
- ✅ Respostas inteligentes contextualizadas no APP 5D
- ✅ Fallback automático se a API não estiver configurada

---

## 🔑 Como Configurar a API Key

### Opção 1: Para Desenvolvimento Local

1. **Obter API Key:**
   - Acesse: https://ai.google.dev/
   - Faça login com sua conta Google
   - Clique em "Get API Key" → "Create API Key"
   - Copie a chave gerada

2. **Criar arquivo `.env.local` na raiz do projeto:**
   ```env
   VITE_GEMINI_API_KEY=sua-api-key-aqui
   ```

3. **Reiniciar o servidor:**
   ```bash
   npm run dev
   ```

### Opção 2: Para Produção (Vercel)

1. **No Dashboard da Vercel:**
   - Vá em: Settings → Environment Variables
   - Clique em "Add New"
   - **Name:** `VITE_GEMINI_API_KEY`
   - **Value:** sua API key do Gemini
   - **Environment:** Production, Preview, Development
   - Clique em "Save"

2. **Fazer novo deploy** (ou aguardar deploy automático)

---

## ✅ Verificar se Está Funcionando

### No Console do Navegador:

**Com API Key configurada:**
```
✅ Gemini AI inicializado com sucesso
```

**Sem API Key:**
```
⚠️ VITE_GEMINI_API_KEY não configurada. Usando modo demo.
```

### Testar o Chatbot:

1. Clique no **botão roxo flutuante** (canto inferior direito)
2. Digite: "Como cadastrar um paciente?"
3. **Com Gemini:** Resposta inteligente e contextualizada
4. **Sem Gemini:** Resposta baseada em palavras-chave (fallback)

---

## 📋 Modelo Configurado

```javascript
model: 'gemini-1.5-flash'
```

### Características:
- ✅ **Gratuito** (até 15 requisições/minuto)
- ✅ **Rápido** - resposta em ~1-2 segundos
- ✅ **Contextualizado** - conhece o APP 5D
- ✅ **Ideal** para chatbot de suporte

### Outros Modelos Disponíveis:
- `gemini-1.5-pro` - Mais potente, paga
- `gemini-1.5-flash` - Rápido e gratuito ✅ (atual)
- `gemini-pro` - Versão anterior

---

## 💰 Custos

### Limite Gratuito:
- **15 requisições por minuto** - GRÁTIS
- **Ideal para uso pessoal/pequeno**

### Depois do Limite:
- **$0.0001 por requisição** (~$0.01 para 100 mensagens)
- **Uso típico:** $1-5/mês

👉 Ver preços atualizados: https://ai.google.dev/pricing

---

## 🔒 Segurança

✅ API Key armazenada apenas em variáveis de ambiente  
✅ **NUNCA** commitada no Git (já está no `.gitignore`)  
✅ Vercel protege variáveis de ambiente automaticamente  

---

## 📝 Arquivos Relacionados

- `src/api/gemini.js` - Integração com Gemini AI
- `src/components/ChatbotFloating.jsx` - Componente do chatbot
- `.gitignore` - API keys já estão ignoradas

---

## 🎯 Prompt do Sistema

O Gemini está configurado com um prompt especializado que:
- ✅ Conhece todas as funcionalidades do APP 5D
- ✅ Entende terminologia terapêutica
- ✅ Responde em português brasileiro
- ✅ Usa tom empático e profissional
- ✅ Foca no contexto do APP 5D

---

## 🐛 Troubleshooting

### Gemini não inicializa:
1. Verificar se `VITE_GEMINI_API_KEY` está definida
2. Verificar console do navegador
3. Verificar se API key é válida

### Erro ao chamar API:
- Verificar limite de requisições (15/min)
- Verificar conexão com internet
- Sistema usa fallback automaticamente

### Respostas genéricas:
- Verificar se prompt do sistema está sendo aplicado
- Verificar logs no console

---

## ✅ Pronto Para Usar!

Após configurar a API key:
1. ✅ Chatbot funciona automaticamente
2. ✅ Respostas inteligentes e contextuais
3. ✅ Fallback se API falhar
4. ✅ Tudo integrado e funcionando!

---

## 📚 Documentação Oficial

👉 Google AI Studio: https://ai.google.dev/  
👉 Documentação Gemini: https://ai.google.dev/docs  

**Tudo pronto!** 🚀✨

