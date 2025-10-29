# 🚀 Deploy no Vercel - Passo a Passo Rápido

## ✅ Repositório atualizado no GitHub!

✅ Commits enviados: https://github.com/ricardomestre7/APP-5D-THERAPISTS.git

---

## 📋 Deploy no Vercel (3 minutos)

### Opção 1: Via Dashboard (Recomendado)

#### 1. Acesse o Vercel:
👉 https://vercel.com

#### 2. Faça Login:
- Use sua conta GitHub
- Autorize acesso aos repositórios

#### 3. Importar Projeto:
- Clique em **"Add New Project"**
- Procure: `ricardomestre7/APP-5D-THERAPISTS`
- Clique em **"Import"**

#### 4. Configurações (Vercel detecta automaticamente):
- ✅ Framework: **Vite**
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`
- ✅ Root Directory: `./`

#### 5. Variáveis de Ambiente:
Clique em **"Environment Variables"** e adicione:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_GEMINI_API_KEY=... (opcional - para chatbot inteligente)
```

**Importante:** Adicione para **Production**, **Preview** e **Development**

#### 6. Deploy:
- Clique em **"Deploy"**
- Aguarde ~2-3 minutos
- ✅ **Pronto!** Seu app estará online!

---

### Opção 2: Via CLI (Terminal)

```bash
# 1. Instalar Vercel CLI (se não tiver)
npm install -g vercel

# 2. Login
vercel login

# 3. Navegar para o projeto
cd "C:\Users\mestr\OneDrive\Área de Trabalho\APP5D"

# 4. Deploy
vercel

# Para produção:
vercel --prod
```

**Durante o deploy, você será perguntado:**
- Link projeto existente? → **N** (primeira vez)
- Nome do projeto? → **APP-5D-THERAPISTS**
- Diretório? → **./**
- Configurações? → **Enter** (usa padrões)

---

## ✅ Após o Deploy

### Você terá:
- **URL de Produção:** `https://app-5d-therapists.vercel.app`
- **URLs de Preview:** Para cada commit/PR
- **Deploy Automático:** Cada push no `master` faz deploy

### Verificar:
1. ✅ App carrega corretamente
2. ✅ Login funciona (Firebase Auth)
3. ✅ Dados carregam (Firestore)
4. ✅ Chatbot aparece (botão roxo)

---

## 🔄 Deploy Automático (Configurado)

Depois da primeira vez:
- ✅ Cada `git push` → Deploy automático
- ✅ Preview para Pull Requests
- ✅ Rollback fácil se necessário

---

## 🐛 Troubleshooting

### Build falhando:
1. Verifique logs no Vercel
2. Verifique variáveis de ambiente
3. Verifique se todas as dependências estão no `package.json`

### App não carrega:
1. Verifique console do navegador
2. Verifique variáveis do Firebase
3. Verifique domínios autorizados no Firebase Console

### Firebase não funciona:
1. Verifique variáveis de ambiente
2. Adicione domínio da Vercel no Firebase Console:
   - Authentication → Settings → Authorized domains
   - Adicione: `vercel.app` e seu domínio personalizado

---

## 📝 Checklist Rápido

- [ ] Código commitado e push feito ✅
- [ ] Vercel conectado ao GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy iniciado
- [ ] App funcionando online

---

## 🎉 Pronto!

**Tudo configurado e pronto para deploy!**

Acesse: https://vercel.com e faça o deploy agora! 🚀

