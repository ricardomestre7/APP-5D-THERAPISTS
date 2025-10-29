# 🔐 CONFIGURAR REGRAS DO FIRESTORE (ATUALIZADO)

## ✅ VOCÊ JÁ TEM REGRAS CONFIGURADAS!

As regras atuais estão usando as coleções antigas (`users`, `patients`), mas o código agora usa:
- `terapeutas` (ao invés de `users`)
- `pacientes` (ao invés de `patients`)
- `sessoes` (nova coleção)

## 🚀 SOLUÇÃO: ADICIONAR AS REGRAS NOVAS

### Passo 1: Acessar Firebase Console
1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto (`quantumleap-akwyh`)

### Passo 2: Ir para Firestore Rules
1. No menu lateral, clique em **"Firestore Database"**
2. Clique na aba **"Regras"** (Rules)

### Passo 3: SUBSTITUIR TUDO pelo arquivo `firestore.rules`

**COPIE TODO O CONTEÚDO DO ARQUIVO `firestore.rules` e COLE nas regras do Firebase**

O arquivo `firestore.rules` contém:
- ✅ Todas as regras antigas (mantém compatibilidade)
- ✅ Regras novas para `terapeutas`, `pacientes`, `sessoes`

### Passo 4: Publicar
1. Clique em **"Publicar"** (Publish)
2. Aguarde a confirmação

### Passo 5: Testar
1. Recarregue o app no navegador
2. O erro deve desaparecer!

---

## 📋 ESTRUTURA DAS COLECÕES

### Novas Coleções (sistema atual):
- **`terapeutas/{uid}`** - Perfil do terapeuta (ID = uid do Firebase Auth)
- **`pacientes/{pacienteId}`** - Pacientes (contém `terapeuta_id`)
- **`sessoes/{sessaoId}`** - Sessões terapêuticas (contém `paciente_id`)
- **`praticas_recomendadas/{praticaId}`** - Práticas recomendadas

### Coleções Antigas (mantidas para compatibilidade):
- **`users/{userId}`** - Sistema antigo
- **`patients/{patientId}`** - Sistema antigo  
- **`reports/{reportId}`** - Relatórios
- **`invites/{inviteId}`** - Convites
- **`config/{docId}`** - Configurações

---

## 🔍 O QUE AS REGRAS FAZEM:

### Novas Regras:
- ✅ **Terapeutas**: Podem ler/escrever apenas seu próprio perfil (`terapeutas/{seuUid}`)
- ✅ **Pacientes**: Terapeutas só veem/escrevem pacientes onde `terapeuta_id` = seu `uid`
- ✅ **Sessões**: Terapeutas autenticados podem criar/ler sessões
- ✅ **Segurança**: Ninguém pode acessar dados de outros terapeutas

### Regras Antigas (mantidas):
- ✅ Tudo continua funcionando como antes
- ✅ Compatibilidade total mantida

---

## ⚠️ IMPORTANTE

**NÃO DELETE as regras antigas!** O arquivo `firestore.rules` mantém ambas funcionando.
