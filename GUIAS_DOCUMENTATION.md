# 🧭 Sistema de Guias - Documentação Completa

## Visão Geral

O sistema possui **duas formas distintas** de trabalhar com guias, cada uma com sua finalidade específica.

⚠️ **IMPORTANTE**: O sistema **reconhece automaticamente** ambas as formas para alertas, validações e controles. Se você adicionar um guia como fornecedor tipo "guiamento", o sistema considerará que a OS tem um guia!

---

## 1️⃣ Guias como Usuários (Designação)

### 📍 Finalidade
- Designar **guias internos** (funcionários/colaboradores) para acompanhar operações
- Controle de **equipe interna** da empresa
- **Não envolve custos/tarifas** - são colaboradores da empresa

### ✨ Funcionalidades
- ✅ Adicionar/remover guias de uma OS
- ✅ Definir função do guia (ex: "Guia principal", "Guia assistente")
- ✅ Visualizar guias designados em cada OS
- ✅ Auditoria completa de todas as operações

### 🔧 Como Usar

#### Criar um Guia (Usuário)
1. Acesse **Configurações → Usuários** (quando implementado)
2. Criar novo usuário com `roleGlobal = "guia"`
3. O guia ficará disponível para designação

#### Designar Guia a uma OS
1. Abra a OS desejada
2. Vá para a aba **"Guias"**
3. Clique em **"Adicionar Guia"**
4. Selecione o guia na lista
5. (Opcional) Defina a função
6. Clique em **"Adicionar"**

### 📁 Arquivos Relacionados
```
app/api/os/[id]/guias/route.ts                    # API para gerenciar guias na OS
app/api/os/[id]/guias/[guiaDesignacaoId]/route.ts # Editar/remover
app/api/usuarios/guias/route.ts                    # Listar guias disponíveis
components/os/OSGuiasSection.tsx                   # Interface de gerenciamento
components/forms/GuiaFormDialog.tsx                # Formulário
```

---

## 2️⃣ Guias como Fornecedores (Serviços de Guiamento)

### 📍 Finalidade
- Contratar **guias externos/freelancers**
- Gerenciar **custos de guiamento**
- Definir **tarifas e valores** de serviços
- **Controle financeiro** completo

### ✨ Funcionalidades
- ✅ Cadastrar guias como fornecedores tipo "guiamento"
- ✅ Definir tarifas (por dia, por pessoa, por grupo, etc.)
- ✅ Controlar vigência de tarifas
- ✅ Vincular a OS com custos
- ✅ Controle de pagamentos

### 🔧 Como Usar

#### Cadastrar Guia como Fornecedor
1. Acesse **Dashboard → Fornecedores**
2. Clique em **"Novo Fornecedor"**
3. Preencha:
   - **Nome Fantasia:** Nome do guia
   - **Tipo:** Selecione **"Guiamento"**
   - **Email, Telefone, Documento:** Dados do guia
   - **Observações:** Especialidades, idiomas, etc.
4. Clique em **"Salvar"**

#### Cadastrar Tarifas do Guia
1. Acesse **Fornecedores → [Nome do Guia]**
2. Vá para a seção **"Tarifas"**
3. Clique em **"Nova Tarifa"**
4. Preencha:
   - **Descrição:** "Guiamento de 1 dia", "Meio período", etc.
   - **Valor:** R$ 500,00 (exemplo)
   - **Moeda:** BRL, USD ou EUR
   - **Unidade:** "por dia", "por pessoa", "por grupo"
   - **Vigência:** Período de validade da tarifa
   - **Ativo:** Sim/Não
5. Clique em **"Salvar"**

#### Adicionar Guia-Fornecedor a uma OS
1. Abra a OS desejada
2. Vá para a aba **"Fornecedores"** ou **"Despesas"**
3. Adicione o fornecedor do tipo "Guiamento"
4. Selecione a tarifa aplicável
5. Sistema calculará os custos automaticamente

### 📊 Estrutura de Dados

```typescript
// Fornecedor tipo "guiamento"
{
  tipo: 'guiamento',
  nomeFantasia: 'João Silva - Guia',
  email: 'joao@email.com',
  telefone: '+55 11 98765-4321',
  documento: '123.456.789-00',
  obs: 'Especialista em observação de aves. Inglês fluente.'
}

// Tarifa do guia
{
  descricao: 'Guiamento 1 dia (até 8 pessoas)',
  valor: 600.00,
  moeda: 'BRL',
  unidade: 'por dia',
  vigenciaInicio: '2025-01-01',
  vigenciaFim: '2025-12-31',
  ativo: true,
  observacoes: 'Inclui equipamentos básicos'
}
```

### 📁 Arquivos Relacionados
```
app/api/fornecedores/route.ts              # CRUD de fornecedores
app/(dashboard)/dashboard/fornecedores/    # Interface de gerenciamento
prisma/schema.prisma                       # enum TipoFornecedor (linha 90-97)
```

---

## 🎯 Quando Usar Cada Abordagem?

### Use **Guias como Usuários** quando:
- ✅ São **funcionários fixos** da sua empresa
- ✅ Não precisa controlar **custos individuais** por OS
- ✅ Quer apenas saber **quem acompanhou** cada operação
- ✅ Precisa de **controle de acesso** ao sistema

### Use **Guias como Fornecedores** quando:
- ✅ São **freelancers/terceirizados**
- ✅ Precisa **pagar por serviço** (diárias/valores)
- ✅ Quer **controle financeiro** detalhado
- ✅ Precisa **gerenciar tarifas** e vigências
- ✅ Quer emitir **pagamentos** formais

---

## 💡 Cenário Híbrido (Recomendado)

Você pode usar **AMBOS**:

### Exemplo Prático:
```
OS: Observação de Aves no Pantanal - 5 dias

👤 Guias Internos (Designação):
   - Carlos (Guia Principal) - funcionário da empresa
   - Maria (Guia Assistente) - funcionária da empresa

💰 Guias Externos (Fornecedores):
   - José Silva Guiamento (R$ 600/dia) - freelancer local
   - Ana Costa Guiamento (R$ 500/dia) - freelancer especialista
```

**Resultado:**
- **Controle de equipe:** Sabe que Carlos e Maria acompanharam
- **Controle financeiro:** R$ 5.500 de custo com guias externos (5 dias × 2 guias)
- **Melhor gestão:** Visualização completa da operação

---

## 📋 Checklist de Implementação

### ✅ Já Implementado
- [x] Schema do banco de dados
- [x] API de guias (designação)
- [x] API de fornecedores (inclui tipo guiamento)
- [x] Interface de fornecedores
- [x] Interface de guias na OS
- [x] Sistema de tarifas
- [x] Auditoria completa

### 🔄 Próximos Passos Recomendados
- [ ] Página de gestão de usuários (para criar guias internos)
- [ ] Relatório de custos por guia-fornecedor
- [ ] Dashboard de disponibilidade de guias
- [ ] Integração de guias com calendário

---

## 🚀 Início Rápido

### Para Guias Internos:
```bash
# 1. Criar usuário guia no banco
# 2. Acessar OS → Aba Guias → Adicionar Guia
```

### Para Guias Externos:
```bash
# 1. Dashboard → Fornecedores → Novo Fornecedor
# 2. Tipo: "Guiamento"
# 3. Cadastrar tarifas
# 4. Adicionar à OS via fornecedores/despesas
```

---

## 📞 Suporte

Para dúvidas sobre a implementação, consulte:
- `prisma/schema.prisma` - Estrutura de dados
- `app/api/os/[id]/guias/` - Endpoints da API
- `components/os/OSGuiasSection.tsx` - Componente principal

---

**Última atualização:** 01/11/2025
**Versão:** 1.0.0
