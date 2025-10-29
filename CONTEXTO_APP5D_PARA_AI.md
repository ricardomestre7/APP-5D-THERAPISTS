# 📚 Contexto Completo do APP 5D - Para Gemini AI

## 🎯 Sobre o APP 5D

**APP 5D** é uma plataforma completa de gestão para terapeutas quânticos/holísticos que trabalham com terapias energéticas, cristais, ervas medicinais e óleos essenciais.

**Objetivo Principal:** Facilitar o acompanhamento detalhado de pacientes, sessões terapêuticas e evolução através de relatórios inteligentes com análise de dados.

---

## 🏗️ Arquitetura e Tecnologia

### Stack Tecnológico
- **Frontend:** React 18 + Vite
- **UI:** Tailwind CSS + shadcn/ui + Radix UI
- **Animações:** Framer Motion
- **Routing:** React Router DOM
- **Backend/Storage:** Firebase (Firestore + Auth + Storage)
- **PDF:** jsPDF + html2canvas
- **Gráficos:** Recharts
- **Chatbot AI:** Google Gemini AI

### Estrutura do Projeto
```
APP5D/
├── src/
│   ├── api/           # Integrações Firebase e APIs externas
│   ├── components/    # Componentes React reutilizáveis
│   ├── pages/         # Páginas/rotas da aplicação
│   ├── utils/         # Funções utilitárias
│   └── hooks/         # Custom React hooks
```

---

## 👥 SISTEMA DE USUÁRIOS

### Autenticação
- **Demo Mode:** Sistema de autenticação demo com localStorage
- **Firebase Auth:** Preparado para integração futura
- **Usuário Padrão:** `demo-user-001` (ID fixo para consistência)
- **Perfil:** Terapeuta com informações pessoais

### Informações do Terapeuta
```javascript
{
  id: 'demo-user-001',
  full_name: 'Usuário Demo',
  email: 'demo@example.com',
  profile_picture_url: null,
  especialidade: '',
  registro: '',
  formacao: '',
  bio: ''
}
```

---

## 👨‍⚕️ GESTÃO DE PACIENTES

### Cadastro de Pacientes
**Campos Obrigatórios:**
- Nome completo
- Email
- Data de nascimento
- Gênero

**Campos Opcionais:**
- Telefone
- Endereço (rua, cidade, estado, CEP)
- Queixa principal/intenção

### Características
- **Associação ao terapeuta:** Cada paciente é vinculado ao terapeuta que o cadastra via `terapeuta_id`
- **Conexão persistente:** Dados salvos em Firestore + localStorage (backup)
- **ID único:** Gerado automaticamente
- **Timestamps:** created_at e updated_at automáticos

### Filtros e Busca
- Filtra automaticamente pacientes do terapeuta logado
- Ordenação por data de criação (mais recentes primeiro)

---

## 📝 SESSÕES TERAPÊUTICAS

### Informações da Sessão
```javascript
{
  id: 'sessao-xxx',
  paciente_id: 'paciente-xxx',
  terapeuta_id: 'demo-user-001',
  data_sessao: '2025-01-XX',
  modalidades_aplicadas: ['Terapia A', 'Terapia B'],
  observacoes_gerais: 'texto...',
  resultados: [
    { campo: 'Mental', valor: 7 },
    { campo: 'Emocional', valor: 8 },
    { campo: 'Físico', valor: 6 }
  ],
  anexos: []
}
```

### Campos de Resultado (0-10)
1. **Mental** - Estado mental, clareza, foco
2. **Emocional** - Equilíbrio emocional, bem-estar
3. **Físico** - Vitalidade, energia física
4. **Energético** - Campos energéticos, chakras
5. **Espiritual** - Conexão espiritual, propósito

### Funcionalidades
- Criar nova sessão
- Editar sessão existente
- Deletar sessão
- Visualizar histórico completo
- Adicionar múltiplas terapias por sessão
- Avaliar campos energéticos (0-10 cada)

---

## ✨ CATÁLOGO DE TERAPIAS

### Tipos de Terapias

#### 1. Práticas Quânticas
- Meditação guiada
- Visualização criativa
- Respiração quântica
- Reprogramação celular
- Limpeza energética
- Ativação de DNA

#### 2. Biblioteca de Cristais
- **Propriedades:** Energia, chakras afetados, sinais, elemento
- **Características:** Cor, composição química, dureza, origem
- **Uso terapêutico:** Condições físicas, emocionais, espirituais
- Exemplos: Quartzo rosa, Ametista, Citrino, etc.

#### 3. Biblioteca de Ervas
- **Propriedades:** Medicinais, energéticas, vibracionais
- **Aplicação:** Chás, compressas, banhos, inalações
- **Ritualística:** Folklore, práticas ancestrais
- Exemplos: Erva-cidreira, Camomila, Alecrim, etc.

#### 4. Biblioteca de Óleos Essenciais
- **Composição:** Componentes principais (%), método de extração
- **Uso terapêutico:** Físico, psicológico, espiritual
- **Propriedades:** Antimicrobiano, relaxante, estimulante
- **Notas:** Nota de topo/coração/base
- **Chakras:** Associação com centros energéticos
- Exemplos: Lavanda, Eucalipto, Tea Tree, etc.

### Funcionalidades
- Visualizar todas as terapias
- Filtros por tipo
- Busca por nome
- Detalhes completos de cada terapia
- Frequências vibracionais
- Compatibilidade entre terapias

---

## 📊 RELATÓRIOS E ANÁLISES

### Analisador Quântico
**Localização:** `src/components/AnalisadorQuantico.jsx`

#### Funcionalidades
1. **Análise de Evolução**
   - Score geral de 0-100 baseado em todas as sessões
   - Análise de tendências (melhorando/piorando/estável)
   - Identificação de campos críticos (<5/10)

2. **Gráficos Visuais**
   - Gráficos de barras por campo energético
   - Códigos de cores: Verde (7-10), Amarelo (5-6), Vermelho (1-4)
   - Histórico ao longo das sessões

3. **Previsão Matemática**
   - Regressão linear para prever próxima sessão
   - Baseado no histórico de evolução

4. **Ranking de Terapias**
   - Eficácia de cada terapia para o paciente
   - Ordenado por melhores resultados

5. **Conclusões**
   - Pontos fortes identificados
   - Campos que precisam atenção
   - Recomendações terapêuticas

#### Métricas Calculadas
- **Score Geral:** Média ponderada de todos os campos
- **Campos Críticos:** Valores < 5/10
- **Tendência:** Ascendente/Descendente/Estável/Fluctuante
- **Eficácia Terapêutica:** % de melhora por terapia

### Geração de PDF
- **Biblioteca:** jsPDF
- **Funcionalidade:** Conversão de HTML para PDF
- **Conteúdo:** Todos os gráficos, tabelas e análises
- **Personalização:** Logo, cabeçalho, rodapé

---

## 🤖 CHATBOT AI (Agente 5D)

### Localização
- Componente: `src/components/ChatbotFloating.jsx`
- Integração: `src/api/gemini.js`

### Funcionalidades
1. **Botão Flutuante**
   - Posição fixa no canto inferior direito
   - Gradiente roxo-rosa
   - Ícone de Sparkles
   - Animações com Framer Motion

2. **Interface de Chat**
   - Mensagens do usuário (direita, fundo roxo)
   - Mensagens do bot (esquerda, fundo branco)
   - Loading animado enquanto processa
   - Scroll automático para nova mensagem

3. **Respostas Inteligentes**
   - **Com Gemini:** Respostas contextuais e naturais
   - **Sem Gemini:** Respostas baseadas em palavras-chave

### Contexto para o Gemini
- Sistema de gestão para terapeutas quânticos
- Trabalha com: pacientes, sessões, terapias, relatórios
- Foco em: terapias holísticas, energéticas, cristais, ervas, óleos
- Público: Terapeutas, profissionais holísticos
- Tom: Profissional, empático, quântico

### Palavras-Chave Comuns
- Paciente
- Sessão
- Terapia
- Relatório
- Cristal
- Erva
- Óleo
- Chakra
- Energia
- Quântico

---

## 📍 PÁGINAS E ROTAS

### 1. Welcome (/Welcome)
- Tela de login/boas-vindas
- Botão para entrar
- Gradiente com animações
- Primeira página que aparece

### 2. Dashboard (/Dashboard)
- Visão geral do sistema
- Estatísticas rápidas
- Gráficos de resumo
- Atalhos para ações

### 3. Pacientes (/Pacientes)
- Lista de pacientes do terapeuta
- Cards com informações
- Botão "Novo Paciente"
- Edição e exclusão
- Link para detalhes

### 4. Detalhes do Paciente (/DetalhesPaciente?id=xxx)
- Informações pessoais completas
- Histórico de sessões
- Análise quântica do paciente
- Botão "Nova Sessão"
- Geração de relatório PDF
- Portal do paciente (convite)

### 5. Terapias (/Terapias)
- Catálogo completo
- Filtros por tipo
- Busca por nome
- Detalhes de cada terapia

### 6. Base de Conhecimento (/PraticasQuanticas)
- Práticas quânticas detalhadas
- Visualização criativa
- Meditação
- Respiração quântica

### 7. Biblioteca de Cristais (/BibliotecaCristais)
- Catálogo de cristais
- Propriedades energéticas
- Chakras associados
- Uso terapêutico

### 8. Biblioteca de Óleos (/BibliotecaOleos)
- Catálogo de óleos essenciais
- Propriedades aromáticas
- Notas (Topo/Base/Coração)
- Usos terapêuticos

### 9. Biblioteca de Ervas (/BibliotecaErvas)
- Catálogo de ervas
- Propriedades medicinais
- Métodos de uso
- Informações botânicas

### 10. Relatórios (/Relatorios)
- Seleção de paciente
- Análise quântica completa
- Gráficos de evolução
- Gerar PDF

### 11. Minha Conta (/MinhaConta)
- Perfil do terapeuta
- Configurações
- Dados pessoais

### 12. Manual do Terapeuta (/ManualTerapeuta)
- Guia completo do sistema
- Instruções de uso
- Boas práticas

---

## 🎨 DESIGN E UX

### Paleta de Cores
- **Primário:** Roxo (#9333ea, #a855f7)
- **Secundário:** Rosa (#ec4899, #f472b6)
- **Azul:** #3b82f6 (links, informações)
- **Verde:** #10b981 (sucesso, positivos)
- **Amarelo:** #f59e0b (atenção, médio)
- **Vermelho:** #ef4444 (erro, crítico)
- **Fundo:** Branco/cinza claro

### Componentes UI (shadcn/ui)
- Button, Card, Dialog, Select
- Input, Textarea, Calendar
- Toast, Alert, Badge
- Tabs, Accordion, Sheet
- E mais 30+ componentes

### Animações
- **Framer Motion:** Transições suaves
- **Fade in/out:** Aparição de elementos
- **Slide:** Navegação entre estados
- **Scale:** Interações com botões

### Responsividade
- Mobile-first design
- Breakpoints: sm, md, lg, xl
- Grid adaptável
- Menu lateral colapsável em mobile

---

## 💾 PERSISTÊNCIA DE DADOS

### Firebase Firestore
- **Coleções:**
  - `pacientes` - Dados dos pacientes
  - `sessoes` - Registros de sessões
  - `usuarios` - Perfis de terapeutas
  - `terapias` - Catálogo de terapias

### Backup LocalStorage
- Dados salvos também em localStorage
- Prefixo: `5d_`
- Chaves: `5d_pacientes`, `5d_sessoes`, `5d_user_profile`
- **Funciona offline** com backup local

### Estrutura de IDs
- Pacientes: `paciente-{timestamp}`
- Sessões: `sessao-{timestamp}`
- Terapeuta: `demo-user-001` (fixo)

---

## 🔐 SEGURANÇA E PRIVACIDADE

### Variáveis de Ambiente Protegidas
- `.env.local` → NÃO vai para GitHub
- `.env` → NÃO vai para GitHub
- Firebase credentials
- Gemini API key

### Dados Sensíveis
- Informações de pacientes
- Terapeuta ID sempre validado
- Dados de sessões privados
- Apenas o terapeuta vê seus pacientes

---

## 🚀 DEPLOY E PRODUÇÃO

### Vercel
- Deploy automático via GitHub
- Branch: `master`
- Build command: `npm run build`
- Environment variables configuráveis

### Variáveis Necessárias (Produção)
```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_GEMINI_API_KEY=xxx (opcional)
```

---

## 🎯 CASOS DE USO PRINCIPAIS

### 1. Cadastrar Novo Paciente
- Terapeuta vai em "Pacientes"
- Clica "Novo Paciente"
- Preenche formulário
- Salva e paciente fica vinculado ao terapeuta

### 2. Registrar Sessão
- Acessa paciente específico
- Clica "Nova Sessão"
- Seleciona terapias aplicadas
- Avalia campos energéticos (0-10)
- Adiciona observações
- Salva

### 3. Gerar Relatório
- Vá em "Relatórios"
- Selecione paciente
- Aguarde análise quântica
- Visualize gráficos e métricas
- Gere PDF

### 4. Consultar Terapias
- Acesse bibliotecas (cristais, ervas, óleos)
- Busque por nome ou propriedade
- Veja detalhes completos
- Use nas sessões

---

## 💡 TERMINOLOGIA ESPECÍFICA

### Campos Energéticos (0-10)
1. **Mental** - Estado mental, clareza, foco
2. **Emocional** - Equilíbrio emocional
3. **Físico** - Vitalidade, energia física
4. **Energético** - Campos de energia, aura
5. **Espiritual** - Conexão espiritual, propósito

### Notas Aromáticas
- **Topo:** Primeira impressão (5-10 min)
- **Coração:** Corpo da fragrância (2-4h)
- **Base:** Duração final (várias horas)

### Chakras
- 7 centros energéticos do corpo
- Associados a cores, emoções, órgãos
- Podem ser equilibrados com cristais/terapias

### Frequência Vibratória
- Cada óleo/cristal/erva tem sua frequência em MHz
- Trabalho em níveis sutis de energia

---

## 🔄 FLUXOS DE TRABALHO

### Fluxo de Atendimento
1. Terapeuta recebe novo paciente
2. Cadastra no sistema
3. Agenda sessões
4. Registra cada sessão
5. Monitora evolução via relatórios
6. Ajusta protocolo conforme análise

### Fluxo de Análise
1. Sistema coleta dados de sessões
2. Calcula scores e tendências
3. Identifica campos críticos
4. Gera gráficos visuais
5. Previsões via regressão linear
6. Ranking de eficácia terapêutica

---

## 📈 MÉTRICAS E KPIs

### Do Sistema
- Total de pacientes
- Total de sessões
- Score médio de evolução
- Campos críticos mais frequentes
- Terapias mais eficazes

### Do Paciente
- Score geral de evolução (0-100)
- Número de sessões
- Campos em boa evolução
- Campos que precisam atenção
- Terapias que mais ajudam

---

## 🎓 EDUCACIONAL

### Termos Quânticos
- Energia sutil, vibração, frequência
- Ressonância, sincronicidade
- Campo morfogenético
- Reprogramação celular
- Limpeza energética

### Práticas Holísticas
- Medicina integrativa
- Terapias complementares
- PNL (Programação Neurolinguística)
- Constelação familiar quântica
- Cura emocional

---

## 🌟 VISÃO GERAL DO SISTEMA

**APP 5D** é uma ferramenta completa para terapeutas que trabalham com:
- Terapias quânticas e energéticas
- Cristais terapêuticos
- Aromaterapia (óleos essenciais)
- Fitoterapia (ervas medicinais)
- Acompanhamento holístico de pacientes

O sistema permite:
✅ Gestão completa de pacientes e históricos
✅ Análise de evolução com IA
✅ Relatórios profissionais em PDF
✅ Catálogo amplo de terapias
✅ Chatbot inteligente (Gemini AI)
✅ Interface moderna e intuitiva

---

**Este contexto deve ser usado pelo Gemini AI para entender completamente o APP 5D e fornecer assistência especializada aos terapeutas quânticos!** ✨


