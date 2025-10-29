# 🚀 Guia de Deploy no Vercel

## ✅ Repositório já configurado no GitHub!

Seu repositório está em: `https://github.com/ricardomestre7/APP-5D-THERAPISTS.git`

## 📋 Passos para Deploy no Vercel:

### Opção 1: Via Dashboard Vercel (Recomendado)

1. **Acesse o Vercel:**
   - Vá em: https://vercel.com
   - Faça login com sua conta GitHub

2. **Conecte o Repositório:**
   - Clique em "Add New Project"
   - Selecione o repositório: `APP-5D-THERAPISTS`
   - Clique em "Import"

3. **Configurações Automáticas:**
   - Framework Preset: **Vite** (já detectado)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `./`

4. **Variáveis de Ambiente:**
   - Adicione suas variáveis do Firebase:
     ```
     VITE_FIREBASE_API_KEY=...
     VITE_FIREBASE_AUTH_DOMAIN=...
     VITE_FIREBASE_PROJECT_ID=...
     VITE_FIREBASE_STORAGE_BUCKET=...
     VITE_FIREBASE_MESSAGING_SENDER_ID=...
     VITE_FIREBASE_APP_ID=...
     VITE_FIREBASE_MEASUREMENT_ID=...
     VITE_GEMINI_API_KEY=...
     ```

5. **Deploy:**
   - Clique em "Deploy"
   - Aguarde ~2-3 minutos
   - ✅ Pronto! Seu app estará online!

---

### Opção 2: Via Vercel CLI

```bash
# 1. Instalar Vercel CLI globalmente
npm install -g vercel

# 2. Login na Vercel
vercel login

# 3. Deploy
vercel

# Para produção:
vercel --prod
```

---

## 🔧 Configuração já Preparada:

✅ **vercel.json** criado com:
- Build command configurado
- Output directory: `dist`
- Framework: Vite
- Rewrites para SPA (Single Page Application)
- Cache headers otimizados

---

## 📝 Notas Importantes:

### Firebase Functions:
- As Cloud Functions **NÃO** são deployadas pelo Vercel
- Use `firebase deploy --only functions` separadamente
- O frontend pode chamar as Functions normalmente

### Build:
- Vercel detecta automaticamente o Vite
- Build command: `npm run build`
- Output: pasta `dist`

### Variáveis de Ambiente:
- Configure no dashboard da Vercel
- **NÃO** commite arquivos `.env` no GitHub
- Use variáveis no dashboard: Settings → Environment Variables

---

## 🔄 Deploy Automático:

Depois da primeira configuração:
- ✅ **Cada push no master** → Deploy automático
- ✅ Preview para PRs
- ✅ Deploy instantâneo

---

## 🌐 URL do Deploy:

Depois do deploy, você terá:
- **Produção:** `https://app-5d-therapists.vercel.app`
- **Preview:** URLs únicas para cada commit

---

## ✅ Próximos Passos:

1. ✅ Push feito no GitHub
2. ⏳ Conectar no Vercel
3. ⏳ Adicionar variáveis de ambiente
4. ⏳ Deploy automático ativado

**Tudo pronto para deploy!** 🎉

---

## 🐛 Troubleshooting:

### Build falhando:
- Verifique se todas as dependências estão no `package.json`
- Verifique variáveis de ambiente

### 404 nas rotas:
- Verifique se `vercel.json` está na raiz
- Verifique rewrites configurados

### Firebase não funciona:
- Verifique variáveis de ambiente
- Verifique domínio autorizado no Firebase Console

