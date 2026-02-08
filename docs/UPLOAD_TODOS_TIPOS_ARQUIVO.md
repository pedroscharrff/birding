# Alterações: Upload de Todos os Tipos de Arquivo (Exceto Executáveis)

## Resumo
Implementada a funcionalidade para permitir o upload de todos os tipos de arquivo, exceto arquivos executáveis (.exe, .bat, .cmd, .sh, .msi, etc.) por motivos de segurança.

## Alterações Realizadas

### 1. Backend - Serviço de Storage (`lib/storage/storage-service.ts`)

#### Tipos de Arquivo Permitidos Expandidos
- **Documentos**: pdf, doc, docx, txt, odt, rtf, pages
- **Imagens**: jpg, jpeg, png, gif, webp, svg, bmp, tiff, tif, ico, heic, heif
- **Planilhas**: xls, xlsx, csv, ods, numbers
- **Apresentações**: ppt, pptx, odp, key
- **Áudio**: mp3, wav, ogg, flac, m4a, aac, wma
- **Vídeo**: mp4, avi, mov, wmv, flv, mkv, webm, m4v
- **Arquivos Compactados**: zip, rar, 7z, tar, gz, bz2, xz
- **Código Fonte**: ts, tsx, jsx, py, java, cpp, c, h, cs, php, rb, go, rs, swift, kt, html, css, scss, sass, less, xml, yaml, yml, md, sql
- **Dados**: json, tsv

#### Tipos Bloqueados (Executáveis)
- exe, bat, cmd, sh, msi, app, deb, rpm, dmg, pkg, run, bin, com, scr, vbs, js, jar

#### Validação Aprimorada
A função `validateFileType` foi modificada para:
1. Primeiro verificar se o arquivo está na lista de bloqueados
2. Depois verificar se está na lista de permitidos

### 2. Backend - API de Upload (`app/api/storage/upload/route.ts`)

Adicionada validação específica para arquivos executáveis com mensagem de erro clara:
```typescript
if (fileExtension && ALLOWED_FILE_TYPES.blocked.includes(fileExtension)) {
  return NextResponse.json(
    { error: 'Arquivos executáveis não são permitidos por motivos de segurança' },
    { status: 400 }
  )
}
```

### 3. Frontend - Componente FileUpload (`components/ui/file-upload.tsx`)

#### Ícones Expandidos
Adicionados novos ícones do lucide-react:
- `Video` - para arquivos de vídeo
- `Music` - para arquivos de áudio
- `Archive` - para arquivos compactados
- `Code` - para código fonte

#### Função getFileIcon Melhorada
Agora detecta e exibe ícones apropriados para:
- Vídeos (video/*)
- Áudio (audio/*)
- Arquivos compactados (zip, rar, compressed, archive)
- Código fonte (text/*, json, xml, javascript, typescript)
- Documentos Word (word, document)
- Planilhas (sheet, excel, csv)
- Apresentações (presentation, powerpoint)

#### Valor Padrão Atualizado
`acceptedTypes` agora aceita `['*/*']` por padrão (todos os tipos), com validação no backend.

### 4. Frontend - Componentes de Formulário

Removidas as restrições de tipo de arquivo dos seguintes componentes:

#### `DespesaPagarDialog.tsx`
- **Antes**: `acceptedTypes={['application/pdf', 'image/*']}`
- **Depois**: Sem restrição (usa o padrão)

#### `FornecedorFormDialog.tsx`
- **Antes**: `acceptedTypes={['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}`
- **Depois**: Sem restrição (usa o padrão)

#### `ParticipanteFormDialog.tsx`
- **Antes**: `acceptedTypes={['application/pdf', 'image/*']}`
- **Depois**: Sem restrição (usa o padrão)

#### `PagamentoForm.tsx`
- **Antes**: `accept="image/*,.pdf,.doc,.docx"`
- **Depois**: Sem restrição
- **Mensagem atualizada**: "Qualquer tipo de arquivo (máx. 10MB), exceto executáveis"

## Segurança

### Proteção Contra Executáveis
A aplicação agora bloqueia os seguintes tipos de arquivo executável:
- `.exe` - Executáveis Windows
- `.bat`, `.cmd` - Scripts de lote Windows
- `.sh` - Scripts shell Unix/Linux
- `.msi` - Instaladores Windows
- `.app` - Aplicativos macOS
- `.deb`, `.rpm` - Pacotes Linux
- `.dmg`, `.pkg` - Instaladores macOS
- `.run`, `.bin` - Executáveis genéricos
- `.com`, `.scr` - Executáveis legados Windows
- `.vbs` - Visual Basic Scripts
- `.jar` - Java Archives (podem conter código executável)

### Validação em Camadas
1. **Frontend**: Aceita todos os tipos (melhor UX)
2. **Backend**: Valida e bloqueia executáveis
3. **Mensagens de Erro**: Feedback claro ao usuário

## Benefícios

1. **Flexibilidade**: Usuários podem fazer upload de praticamente qualquer tipo de arquivo necessário
2. **Segurança**: Arquivos executáveis são bloqueados para prevenir riscos de segurança
3. **UX Melhorada**: Ícones apropriados para cada tipo de arquivo
4. **Feedback Claro**: Mensagens de erro específicas quando arquivos são bloqueados

## Testes Recomendados

1. Testar upload de diferentes tipos de arquivo (PDF, imagens, vídeos, áudio, etc.)
2. Verificar que arquivos .exe são bloqueados com mensagem apropriada
3. Confirmar que os ícones corretos são exibidos para cada tipo de arquivo
4. Validar que o tamanho máximo de arquivo ainda é respeitado
