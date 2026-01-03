# Integração do FileUpload - Guia Rápido

## ✅ Componentes Atualizados

### 1. **ParticipanteFormDialog** ✅
- Nova aba "Arquivos" adicionada
- Upload de documentos (passaporte, identidade, certificados)
- Máximo: 5 arquivos, 10MB cada
- Tipos aceitos: PDF e imagens

## 📝 Como Integrar em Outros Formulários

### Passo 1: Importar o componente
```tsx
import { FileUpload, UploadedFile } from '@/components/ui/file-upload'
```

### Passo 2: Adicionar estado
```tsx
const [arquivos, setArquivos] = useState<UploadedFile[]>(initialData?.arquivos || [])
```

### Passo 3: Adicionar ao formulário
```tsx
<FileUpload
  folder="nome-da-pasta"  // Ex: "fornecedores", "hospedagens"
  entityId={entityId || 'temp'}
  existingFiles={arquivos}
  onFilesChange={setArquivos}
  maxFiles={5}
  maxSizeMB={10}
  acceptedTypes={['application/pdf', 'image/*']}
  disabled={loading}
/>
```

### Passo 4: Incluir no submit
```tsx
await onSubmit({
  ...formData,
  arquivos
})
```

## 🗂️ Folders por Entidade

| Entidade | Folder | Descrição |
|----------|--------|-----------|
| Participantes | `participantes` | Documentos pessoais |
| Fornecedores | `fornecedores` | Contratos, documentos fiscais |
| Hospedagens | `hospedagens` | Vouchers, confirmações |
| Atividades | `atividades` | Vouchers, confirmações |
| Transportes | `transportes` | Vouchers, confirmações |
| Pagamentos | `pagamentos` | Comprovantes, notas fiscais |
| OS | `os` | Contratos, propostas |

## 🎯 Próximas Integrações Necessárias

### Formulários:
- [ ] FornecedorFormDialog
- [ ] DespesaPagarDialog (Pagamentos)

### Seções de OS:
- [ ] OSHospedagensSection
- [ ] OSAtividadesSection
- [ ] OSTransportesSection
- [ ] OSPassagensAereasSection

## 💡 Dicas

1. **EntityId temporário**: Use `'temp'` para novos registros, será substituído após criação
2. **Tipos de arquivo**: Ajuste `acceptedTypes` conforme necessidade
3. **Limite de arquivos**: Ajuste `maxFiles` conforme caso de uso
4. **Tamanho máximo**: Ajuste `maxSizeMB` (padrão: 10MB para docs, 5MB para imagens)

## 🔄 Atualização de Registros Existentes

Ao editar um registro existente, os arquivos devem ser carregados do banco:

```tsx
useEffect(() => {
  if (initialData?.arquivos) {
    setArquivos(initialData.arquivos)
  }
}, [initialData])
```

## 📊 Estrutura de Dados

Os arquivos são salvos como JSON no banco:

```json
[
  {
    "url": "http://localhost:9100/birding-files/participantes/uuid/timestamp-file.pdf",
    "key": "participantes/uuid/timestamp-file.pdf",
    "fileName": "file.pdf",
    "contentType": "application/pdf",
    "size": 1024000,
    "uploadedAt": "2026-01-02T18:00:00.000Z"
  }
]
```
