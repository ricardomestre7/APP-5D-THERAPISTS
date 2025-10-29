# 🤖 Configuração do Gemini AI (Chatbot Inteligente)

## 📋 Sobre

O APP 5D agora inclui integração com o **Google Gemini AI** para tornar o chatbot mais inteligente e conversacional!

## 🎯 Como Obter a API Key do Gemini

### 1. Acesse o Google AI Studio
👉 https://ai.google.dev/

### 2. Faça Login
- Use sua conta do Google
- Clique em "Get API Key"

### 3. Criar Nova API Key
- Clique em "Create API Key"
- Escolha entre:
  - **Criar para novo projeto** (recomendado)
  - **Usar projeto existente**
- Copie a API Key gerada

### 4. Configurar no Projeto

#### Opção A: Usando arquivo .env.local (Recomendado)

1. Copie o arquivo `.env.example`:
```bash
copy .env.example .env.local
```

2. Edite o arquivo `.env.local`:
```env
VITE_GEMINI_API_KEY=sua-api-key-aqui
```

3. Reinicie o servidor:
```bash
npm run dev
```

#### Opção B: Direto no Vercel

1. Vá em https://vercel.com
2. Acesse seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione:
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** sua API key
5. Faça deploy novamente

## ✅ Verificar se Está Funcionando

1. Abra o app no navegador
2. Clique no botão flutuante roxo (Agente 5D)
3. Envie uma mensagem
4. Se estiver usando Gemini, verá no console: `✅ Gemini AI inicializado com sucesso`
5. Respostas serão mais inteligentes e contextualizadas!

## 🎭 Modo Fallback

Se a API key não estiver configurada, o chatbot funciona em modo **fallback** com respostas baseadas em palavras-chave. Funciona perfeitamente, mas não é tão inteligente quanto com Gemini.

## 💰 Custos

- **Até 15 requisições por minuto** - GRÁTIS
- **Resto** - Preços baixos por chamada
- **Total para usar intensivamente** - Aproximadamente $1-5/mês

👉 Veja preços: https://ai.google.dev/pricing

## 🔒 Segurança

✅ A API Key é armazenada em variáveis de ambiente  
✅ **NUNCA** será enviada para o GitHub (já está no .gitignore)  
✅ Protegida pelo Vercel em produção  

## 📚 Recursos do Gemini AI

Com o Gemini ativado, o chatbot pode:
- ✅ Entender contexto da conversa
- ✅ Resolver dúvidas sobre terapias
- ✅ Ajudar com navegação
- ✅ Dar conselhos personalizados
- ✅ Entender perguntas complexas

## 🛠️ Troubleshooting

### "Gemini API não configurada"
- Verifique se a variável está em `.env.local`
- Reinicie o servidor (`npm run dev`)

### "Erro ao chamar Gemini"
- Verifique se a API key está correta
- Veja o console do navegador para detalhes
- O sistema usa fallback automaticamente

---

**Pronto para usar!** 🚀

Qualquer dúvida, consulte: https://ai.google.dev/docs

