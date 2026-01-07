# Implementação: Campos de Hotelaria nas Tarifas de Fornecedores

## 📋 Resumo da Implementação

Foi implementado um sistema completo para incluir informações específicas de hotelaria diretamente nas tarifas dos fornecedores, eliminando a necessidade de preencher esses dados manualmente ao cadastrar hospedagens em uma OS.

## ✅ Alterações Realizadas

### 1. Schema do Banco de Dados

**Arquivo:** `prisma/schema.prisma`

Adicionados 3 novos campos na tabela `FornecedorTarifa`:
- `tipoQuarto` (String, opcional): Tipo de quarto (single, duplo, triplo, suite, etc)
- `regime` (String, opcional): Regime de alimentação (sem_cafe, cafe, meia_pensao, pensao_completa, all_inclusive)
- `quartos` (Int, opcional): Número de quartos incluídos na tarifa

**Migration:** `prisma/migrations/20260105_add_hotelaria_fields_to_tarifas/migration.sql`

### 2. Componente TarifaSelect

**Arquivo:** `components/forms/TarifaSelect.tsx`

**Melhorias:**
- Interface `Tarifa` atualizada com os novos campos
- Exibição visual dos campos de hotelaria no card de tarifa selecionada
- Novo callback `onTarifaDataChange` para propagar dados de hotelaria
- Ícones específicos (Building2 para quartos, Utensils para regime)
- Labels traduzidos para português

### 3. Componente OSHospedagensSection

**Arquivo:** `components/os/OSHospedagensSection.tsx`

**Melhorias:**
- Integração com `onTarifaDataChange` do TarifaSelect
- Preenchimento automático de tipo de quarto, regime e número de quartos ao selecionar uma tarifa
- Usuário ainda pode editar manualmente se necessário

### 4. APIs de Tarifas

**Arquivos atualizados:**
- `app/api/fornecedores/[id]/tarifas/route.ts` (POST)
- `app/api/fornecedores/[id]/tarifas/[tarifaId]/route.ts` (PATCH)

**Melhorias:**
- Suporte para receber e salvar os novos campos
- Validação mantida apenas para campos obrigatórios (descrição e valor)

## 🚀 Próximos Passos Necessários

### 1. Regenerar Prisma Client (OBRIGATÓRIO)

```bash
npx prisma generate
```

Isso irá atualizar o Prisma Client com os novos campos e eliminar os erros de TypeScript.

### 2. Aplicar Migration no Banco de Dados

```bash
npx prisma migrate dev --name add_hotelaria_fields_to_tarifas
```

Ou se já estiver em produção:

```bash
npx prisma migrate deploy
```

### 3. Criar/Atualizar Formulário de Tarifas

É necessário criar ou atualizar o formulário de cadastro/edição de tarifas para incluir os novos campos. Sugestão de localização:
- `components/forms/TarifaFormDialog.tsx` (novo)
- Ou adicionar na página de detalhes do fornecedor

**Campos a adicionar no formulário:**

```tsx
// Tipo de Quarto (apenas para fornecedores de hotelaria)
<PresetSelect
  id="tipoQuarto"
  label="Tipo de Quarto"
  value={formData.tipoQuarto}
  onChange={(value) => setFormData({ ...formData, tipoQuarto: value })}
  options={[
    { value: 'single', label: 'Single' },
    { value: 'duplo', label: 'Duplo' },
    { value: 'duplo_solteiro', label: 'Duplo (2 camas de solteiro)' },
    { value: 'triplo', label: 'Triplo' },
    { value: 'quadruplo', label: 'Quádruplo' },
    { value: 'suite', label: 'Suíte' },
    { value: 'suite_master', label: 'Suíte Master' },
    { value: 'chalé', label: 'Chalé' },
    { value: 'apartamento', label: 'Apartamento' },
  ]}
  placeholder="Selecione o tipo..."
/>

// Regime de Alimentação
<PresetSelect
  id="regime"
  label="Regime de Alimentação"
  value={formData.regime}
  onChange={(value) => setFormData({ ...formData, regime: value })}
  options={[
    { value: 'sem_cafe', label: 'Sem Café da Manhã' },
    { value: 'cafe', label: 'Café da Manhã' },
    { value: 'meia_pensao', label: 'Meia Pensão' },
    { value: 'pensao_completa', label: 'Pensão Completa' },
    { value: 'all_inclusive', label: 'All Inclusive' },
  ]}
  placeholder="Selecione o regime..."
/>

// Número de Quartos
<Input
  id="quartos"
  type="number"
  label="Número de Quartos"
  value={formData.quartos}
  onChange={(e) => setFormData({ ...formData, quartos: e.target.value })}
  placeholder="Ex: 1, 2, 3..."
/>
```

### 4. Atualizar Interface de Gerenciamento de Fornecedores

Adicionar seção para gerenciar tarifas na página de detalhes do fornecedor, permitindo:
- Listar tarifas existentes
- Criar novas tarifas (com os campos de hotelaria)
- Editar tarifas existentes
- Ativar/desativar tarifas
- Definir vigência

## 🎯 Benefícios da Implementação

### Para o Usuário
1. **Agilidade**: Ao selecionar uma tarifa, os campos são preenchidos automaticamente
2. **Consistência**: Dados padronizados reduzem erros de digitação
3. **Clareza**: Visualização completa das informações da tarifa antes de aplicar

### Para o Sistema
1. **Centralização**: Dados de hotelaria definidos uma única vez na tarifa
2. **Manutenção**: Alterações nas tarifas refletem automaticamente
3. **Rastreabilidade**: Histórico de qual tarifa foi usada em cada hospedagem

## 📊 Fluxo de Uso

### Cadastro de Tarifa (Fornecedor de Hotelaria)
1. Acessar fornecedor de hotelaria
2. Criar nova tarifa
3. Preencher: descrição, valor, moeda, unidade
4. **Preencher campos específicos**: tipo de quarto, regime, número de quartos
5. Definir vigência (opcional)
6. Salvar

### Cadastro de Hospedagem na OS
1. Abrir OS
2. Ir para seção de Hospedagens
3. Clicar em "Adicionar Hospedagem"
4. Selecionar fornecedor (hotel/pousada)
5. **Selecionar tarifa** → Campos preenchidos automaticamente:
   - Valor
   - Moeda
   - Tipo de quarto
   - Regime de alimentação
   - Número de quartos
6. Preencher datas (check-in/check-out)
7. Ajustar campos se necessário
8. Salvar

## 🔄 Compatibilidade

- **Backward Compatible**: Campos são opcionais, tarifas antigas continuam funcionando
- **Flexibilidade**: Usuário pode editar manualmente mesmo após selecionar tarifa
- **Tipo-específico**: Campos de hotelaria só aparecem para fornecedores do tipo "hotelaria"

## 📝 Notas Técnicas

- Campos são opcionais no banco de dados (nullable)
- APIs validam apenas campos obrigatórios (descrição e valor)
- Frontend exibe campos apenas quando preenchidos
- TypeScript garante type-safety em toda a aplicação
- Migration é reversível se necessário

## 🐛 Troubleshooting

### Erros de TypeScript após alterações
**Solução:** Execute `npx prisma generate` para regenerar o Prisma Client

### Campos não aparecem no formulário
**Solução:** Verifique se o fornecedor é do tipo "hotelaria"

### Valores não preenchem automaticamente
**Solução:** Verifique se o callback `onTarifaDataChange` está implementado no componente pai

## 📚 Referências

- Schema: `prisma/schema.prisma` (linhas 271-297)
- Migration: `prisma/migrations/20260105_add_hotelaria_fields_to_tarifas/`
- Componentes: 
  - `components/forms/TarifaSelect.tsx`
  - `components/os/OSHospedagensSection.tsx`
- APIs:
  - `app/api/fornecedores/[id]/tarifas/route.ts`
  - `app/api/fornecedores/[id]/tarifas/[tarifaId]/route.ts`
