# Estrutura de Entidades - Refatoração Modular

## 📋 Visão Geral

O arquivo `entities.js` original (3110 linhas) está sendo refatorado para uma estrutura modular onde cada entidade tem seu próprio arquivo. Isso melhora:

- ✅ **Manutenibilidade**: Código mais fácil de encontrar e editar
- ✅ **Organização**: Cada entidade em seu próprio módulo
- ✅ **Tree-shaking**: Bundler pode importar apenas o que precisa
- ✅ **Colaboração**: Múltiplos devs podem trabalhar sem conflitos

## 📁 Estrutura Proposta

```
src/api/entities/
├── index.js              # Reexporta todas as entidades (compatibilidade)
├── paciente.js           # Entidade Paciente
├── terapia.js            # Entidade Terapia
├── sessao.js             # Entidade Sessao
├── praticaQuantica.js    # Entidade PraticaQuantica
├── oleoEssencial.js      # Entidade OleoEssencial
├── cristal.js            # Entidade Cristal
├── ervaPlanta.js         # Entidade ErvaPlanta
├── praticaRecomendada.js # Entidade PraticaRecomendada
└── user.js               # Entidade User (autenticação)
```

## 🔄 Compatibilidade Retroativa

O arquivo `index.js` reexporta todas as entidades, então os imports existentes continuam funcionando:

```javascript
// Continua funcionando exatamente igual
import { Paciente, Terapia, Sessao } from '@/api/entities';
```

## 📝 Status da Refatoração

- ✅ Estrutura criada
- ✅ `index.js` configurado
- ⏳ Migração das entidades individuais (pode ser feita gradualmente)

## 🚀 Próximos Passos

1. Extrair cada entidade para seu arquivo individual
2. Atualizar o `index.js` para importar dos arquivos individuais
3. Testar para garantir que tudo funciona
4. Remover o arquivo `entities.js` original (ou manter como backup)

## 💡 Exemplo de Entidade Refatorada

Veja `paciente.js` como exemplo de como cada entidade deve ser estruturada.

