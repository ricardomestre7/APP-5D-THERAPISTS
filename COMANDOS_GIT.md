# 🚀 Comandos Git - APP 5D

## 📋 Preparação para GitHub

Siga estes comandos na ordem para fazer o commit inicial:

### 1. Abrir Terminal na Pasta do Projeto

```bash
cd "C:\Users\mestr\OneDrive\Área de Trabalho\APP5D"
```

### 2. Inicializar Git (se ainda não foi feito dentro da pasta correta)

```bash
git init
```

### 3. Adicionar Todos os Arquivos

```bash
git add .
```

### 4. Fazer o Primeiro Commit

```bash
git commit -m "feat: APP 5D - Sistema completo de gestão para terapeutas quânticos

- Sistema de cadastro de pacientes com conexão persistente
- Registro de sessões terapêuticas
- Catálogo de terapias quânticas (práticas, cristais, ervas, óleos)
- Relatórios em PDF
- Chatbot de suporte
- Dashboard interativo
- Correção de conexão paciente-terapeuta (ID fixo)
- Correção de loading infinito
- Build de produção funcionando
- Documentação completa"
```

### 5. Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `APP5D`
3. Descrição: `Sistema completo de gestão para terapeutas quânticos`
4. Público ou Privado (escolha)
5. NÃO marque "Initialize with README" (já temos)
6. Clique em "Create repository"

### 6. Adicionar Remote e Fazer Push

```bash
# Adicione a URL do seu repositório (substitua 'seu-usuario' pelo seu username)
git remote add origin https://github.com/seu-usuario/APP5D.git

# Fazer push inicial
git push -u origin master
```

**OU se a branch principal for `main`:**

```bash
# Renomear branch
git branch -M main

# Fazer push
git push -u origin main
```

### 7. Verificar

Acesse: `https://github.com/seu-usuario/APP5D`

Você deve ver todos os arquivos do projeto lá!

---

## 🔄 Comandos Úteis para Futuro

### Fazer Push de Novas Alterações

```bash
git add .
git commit -m "descrição das alterações"
git push
```

### Ver Status

```bash
git status
```

### Ver Histórico

```bash
git log
```

---

## ⚠️ Importante

Se houver arquivos que NÃO devem ir para o GitHub, adicione-os ao `.gitignore` (já está criado).

Arquivos que NÃO vão para o GitHub (graças ao .gitignore):
- `node_modules/`
- `dist/`
- `.env`
- Arquivos temporários

---

## ✅ Checklist Antes de Fazer Push

- [ ] Código testado e funcionando
- [ ] Build sem erros: `npm run build`
- [ ] Sem erros de lint: `npm run lint`
- [ ] README.md criado
- [ ] .gitignore configurado
- [ ] Commit com mensagem clara
- [ ] Repositório criado no GitHub
- [ ] Remote adicionado
- [ ] Push bem-sucedido

---

**Agora você está pronto para fazer o push! 🚀**

