# 🚀 Setup Firebase Functions + Puppeteer

## 📋 Pré-requisitos

1. **Firebase CLI instalado**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login no Firebase**
   ```bash
   firebase login
   ```

3. **Node.js 18+ instalado**

---

## 🔧 INSTALAÇÃO

### Passo 1: Instalar Dependências das Functions

```bash
cd functions
npm install
cd ..
```

### Passo 2: Configurar Projeto Firebase

O arquivo `.firebaserc` já está configurado com:
- Projeto: `quantumleap-akwyh`

Se precisar mudar:
```bash
firebase use --add
# Selecionar ou criar projeto
```

### Passo 3: Deploy das Functions

```bash
firebase deploy --only functions
```

Isso vai:
- ✅ Instalar Puppeteer (inclui Chromium)
- ✅ Criar Cloud Function `gerarPDFRelatorio`
- ✅ Configurar permissões

**Tempo:** ~5-10 minutos na primeira vez (baixa Chromium)

---

## 🧪 TESTAR LOCALMENTE (Opcional)

### Instalar Emuladores
```bash
firebase init emulators
# Selecionar Functions
```

### Executar Emuladores
```bash
firebase emulators:start --only functions
```

### Testar no App
O app vai usar o emulador local automaticamente.

---

## 💰 CUSTOS

### Firebase Functions
- **Invocações:** Primeiro 2 milhões/mês: **GRÁTIS**
- **Tempo de execução:** 2-5 segundos por PDF
- **Custo estimado:** Praticamente **ZERO** para uso médio

### Puppeteer
- **Bundle:** ~170MB (inclui Chromium)
- **Memória:** ~100-200MB por execução
- **Timeout:** Até 60 segundos (suficiente)

---

## ✅ DEPLOY RÁPIDO

Depois de configurar tudo:

```bash
# Uma vez só
cd functions && npm install && cd ..

# Deploy
firebase deploy --only functions:gerarPDFRelatorio
```

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

1. Vá em: https://console.firebase.google.com/
2. Functions → Ver `gerarPDFRelatorio`
3. Teste o app → Gerar PDF
4. Verifique logs na aba "Logs" das Functions

---

## 🐛 TROUBLESHOOTING

### Erro: "Functions directory not found"
```bash
# Verifique se existe functions/package.json
ls functions/
```

### Erro: "Puppeteer timeout"
- Aumente timeout nas Functions
- Verifique se há dados suficientes

### Erro: "Permission denied"
- Verifique se está logado: `firebase login`
- Verifique projeto: `firebase use`

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Instalar dependências: `cd functions && npm install`
2. ✅ Fazer deploy: `firebase deploy --only functions`
3. ✅ Testar no app
4. ✅ Aproveitar PDFs de alta qualidade! 🎉

