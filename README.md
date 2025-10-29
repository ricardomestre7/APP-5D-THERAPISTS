# 🌟 APP 5D - Sistema de Gestão para Terapeutas Quânticos

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1.0-purple.svg)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.4.0-orange.svg)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8.svg)](https://tailwindcss.com/)

> **Sistema completo de gestão para terapeutas quânticos, com integração de pacientes, sessões, terapias e relatórios.**

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Features](#features)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Contribuindo](#contribuindo)
- [License](#license)

---

## 🎯 Sobre o Projeto

**APP 5D** é uma plataforma moderna e intuitiva para terapeutas quânticos gerenciarem:

- 👥 **Pacientes**: Cadastro completo com histórico
- 📝 **Sessões**: Registro detalhado de cada sessão terapêutica
- 🌿 **Terapias**: Catálogo de terapias quânticas
- 📊 **Relatórios**: Geração de relatórios em PDF
- 🧘 **Práticas Quânticas**: Biblioteca de práticas terapêuticas
- 📚 **Bibliotecas**: Cristais, ervas e óleos essenciais
- 🤖 **Chatbot**: Assistente IA para suporte

### 💡 Diferenciais

- ✨ Interface moderna e responsiva
- 🔐 Integração com Firebase
- 📱 Design mobile-first
- 🎨 UI components com shadcn/ui
- 📄 Geração de PDF para relatórios
- 🔄 Sistema de backup automático

---

## ✨ Features

### 👨‍⚕️ Gestão de Pacientes
- Cadastro completo de pacientes
- Histórico de sessões
- Anotações e observações
- Conexão persistente terapeuta-paciente

### 📝 Sessões Terapêuticas
- Registro detalhado de cada sessão
- Seleção de terapias aplicadas
- Observações e evoluções
- Data e horário automaticamente registrados

### 🌿 Catálogo de Terapias
- **Práticas Quânticas**: Meditação, Visualização, etc.
- **Cristais**: Biblioteca completa
- **Ervas**: Catálogo de plantas medicinais
- **Óleos Essenciais**: Lista detalhada

### 📊 Relatórios e Documentos
- Geração de PDF
- Histórico completo do paciente
- Relatórios personalizados

### 🤖 Chatbot de Suporte
- Assistente IA para dúvidas
- Suporte 24/7
- Base de conhecimento integrada

---

## 🚀 Tecnologias

### Core
- **React 18.2.0** - Biblioteca JavaScript
- **Vite 6.1.0** - Build tool
- **React Router DOM 7.2.0** - Roteamento

### UI/UX
- **Tailwind CSS 3.4.17** - Estilização
- **Framer Motion 12.4.7** - Animações
- **shadcn/ui** - Componentes UI
- **Lucide React** - Ícones
- **Radix UI** - Componentes acessíveis

### Backend & Storage
- **Firebase 12.4.0** - Backend as a Service
- **Firestore** - Banco de dados
- **Firebase Auth** - Autenticação
- **Firebase Storage** - Armazenamento

### Utilitários
- **jspdf 3.0.3** - Geração de PDF
- **html2canvas 1.4.1** - Conversão HTML para imagem
- **date-fns 3.6.0** - Manipulação de datas
- **Zod 3.24.2** - Validação de schemas
- **Sonner** - Sistema de notificações

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Git

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/APP5D.git
cd APP5D
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o Firebase** (veja seção de configuração)

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Acesse no navegador**
```
http://localhost:5173
```

---

## ⚙️ Configuração

### Firebase Setup

1. **Crie um projeto no Firebase Console**
   - Acesse: https://console.firebase.google.com/
   - Clique em "Add Project"
   - Siga os passos do assistente

2. **Configure a Authentication**
   - Vá em "Authentication" > "Sign-in method"
   - Habilite "Email/Password" e "Google"

3. **Configure o Firestore**
   - Vá em "Firestore Database"
   - Clique em "Create Database"
   - Escolha "Start in production mode"
   - Escolha a localização

4. **Configure as Credenciais**
   - Edite o arquivo `src/api/firebase.js`
   - Substitua as credenciais do Firebase:
   ```javascript
   const firebaseConfig = {
     apiKey: "SUA_API_KEY",
     authDomain: "SEU_PROJECT.firebaseapp.com",
     projectId: "SEU_PROJECT_ID",
     storageBucket: "SEU_PROJECT.appspot.com",
     messagingSenderId: "SEU_SENDER_ID",
     appId: "SEU_APP_ID"
   };
   ```

### Estrutura de Dados

O Firestore usa as seguintes coleções:

- `pacientes` - Cadastro de pacientes
- `sessoes` - Registro de sessões
- `usuarios` - Dados do terapeuta
- `terapias` - Catálogo de terapias

---

## 💻 Uso

### Iniciar o Projeto

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint
```

### Fluxo de Uso

1. **Login**
   - Faça login com Google (ou email/senha)
   - Sistema cria perfil automaticamente

2. **Cadastrar Paciente**
   - Vá em "Pacientes"
   - Clique em "Novo Paciente"
   - Preencha os dados
   - Salve

3. **Criar Sessão**
   - Acesse o paciente
   - Clique em "Nova Sessão"
   - Registre a terapia aplicada
   - Adicione observações

4. **Gerar Relatório**
   - Vá em "Relatórios"
   - Selecione o paciente
   - Clique em "Gerar PDF"

---

## 📁 Estrutura do Projeto

```
APP5D/
├── src/
│   ├── api/                 # Integrações com Firebase
│   │   ├── entities.js      # Modelos de dados
│   │   ├── firebase.js      # Configuração Firebase
│   │   └── firestoreHelpers.js
│   ├── components/          # Componentes React
│   │   ├── PacienteForm.jsx
│   │   ├── SessaoForm.jsx
│   │   └── ui/              # Componentes shadcn/ui
│   ├── pages/               # Páginas do app
│   │   ├── Dashboard.jsx
│   │   ├── Pacientes.jsx
│   │   ├── Terapias.jsx
│   │   └── ...
│   ├── utils/               # Utilitários
│   │   └── gerarPDF.js
│   └── main.jsx             # Entry point
├── dist/                    # Build de produção
├── node_modules/
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🛠️ Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Cria build de produção |
| `npm run preview` | Preview da build |
| `npm run lint` | Executa o linter |

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 📞 Suporte

- 📧 Email: suporte@app5d.com
- 🐛 Issues: https://github.com/seu-usuario/APP5D/issues
- 📖 Documentação: [Wiki do Projeto](https://github.com/seu-usuario/APP5D/wiki)

---

## 🌟 Agradecimentos

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

**Desenvolvido com ❤️ para terapeutas quânticos**

