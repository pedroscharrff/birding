"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PresetsMultiSelect } from '@/components/presets/PresetsMultiSelect'
import { User, Mail, Phone, FileText, AlertCircle, CheckCircle2, ChevronRight, Heart, Utensils, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ParticipanteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ParticipanteFormData) => Promise<void>
  loading?: boolean
  mode?: 'create' | 'edit'
  initialData?: Partial<ParticipanteFormData>
}

export interface ParticipanteFormData {
  nome: string
  email: string
  telefone: string
  passaporteNumero: string
  passaporteValidade: string
  alergias: string
  restricoes: string
  preferencias: string
  idade: string
  observacoes: string
}

const initialFormData: ParticipanteFormData = {
  nome: '',
  email: '',
  telefone: '',
  passaporteNumero: '',
  passaporteValidade: '',
  alergias: '',
  restricoes: '',
  preferencias: '',
  idade: '',
  observacoes: '',
}

interface ValidationErrors {
  nome?: string
  email?: string
  telefone?: string
  idade?: string
}

export function ParticipanteFormDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  mode = 'create',
  initialData
}: ParticipanteFormDialogProps) {
  const [formData, setFormData] = useState<ParticipanteFormData>(initialFormData)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [activeTab, setActiveTab] = useState('dados-basicos')
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Reset form when dialog closes or load initial data in edit mode
  useEffect(() => {
    if (!open) {
      setFormData(initialFormData)
      setErrors({})
      setActiveTab('dados-basicos')
      setTouchedFields(new Set())
    } else if (mode === 'edit' && initialData) {
      setFormData({
        nome: initialData.nome || '',
        email: initialData.email || '',
        telefone: initialData.telefone || '',
        passaporteNumero: initialData.passaporteNumero || '',
        passaporteValidade: initialData.passaporteValidade || '',
        alergias: initialData.alergias || '',
        restricoes: initialData.restricoes || '',
        preferencias: initialData.preferencias || '',
        idade: initialData.idade || '',
        observacoes: initialData.observacoes || '',
      })
    }
  }, [open, mode, initialData])

  // Validação em tempo real
  const validateField = (name: keyof ValidationErrors, value: string): string | undefined => {
    switch (name) {
      case 'nome':
        if (!value.trim()) return 'Nome é obrigatório'
        if (value.trim().length < 2) return 'Nome deve ter no mínimo 2 caracteres'
        return undefined
      case 'email':
        if (!value.trim()) return 'Email é obrigatório'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Email inválido'
        return undefined
      case 'telefone':
        if (value && value.replace(/\D/g, '').length < 10) {
          return 'Telefone deve ter no mínimo 10 dígitos'
        }
        return undefined
      case 'idade':
        if (value && (parseInt(value) < 0 || parseInt(value) > 150)) {
          return 'Idade inválida'
        }
        return undefined
      default:
        return undefined
    }
  }

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Validar apenas se o campo já foi tocado
    if (touchedFields.has(name)) {
      const error = validateField(name as keyof ValidationErrors, value)
      setErrors(prev => ({
        ...prev,
        [name]: error
      }))
    }
  }

  const handleFieldBlur = (name: string) => {
    setTouchedFields(prev => new Set(prev).add(name))
    const error = validateField(name as keyof ValidationErrors, formData[name as keyof ParticipanteFormData])
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  // Máscara de telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    handleFieldChange('telefone', formatted)
  }

  // Validação completa do formulário
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    
    const nomeError = validateField('nome', formData.nome)
    if (nomeError) newErrors.nome = nomeError
    
    const emailError = validateField('email', formData.email)
    if (emailError) newErrors.email = emailError
    
    const telefoneError = validateField('telefone', formData.telefone)
    if (telefoneError) newErrors.telefone = telefoneError
    
    const idadeError = validateField('idade', formData.idade)
    if (idadeError) newErrors.idade = idadeError
    
    setErrors(newErrors)
    
    // Marcar todos os campos como tocados
    setTouchedFields(new Set(['nome', 'email', 'telefone', 'idade']))
    
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setActiveTab('dados-basicos') // Voltar para a primeira aba se houver erros
      return
    }
    
    await onSubmit(formData)
  }

  // Verificar se a aba de dados básicos está completa
  const isDadosBasicosComplete = !errors.nome && !errors.email && formData.nome && formData.email

  // Verificar se há informações adicionais preenchidas
  const hasDocumentos = formData.passaporteNumero || formData.passaporteValidade
  const hasAlergias = formData.alergias
  const hasRestricoesPreferencias = formData.restricoes || formData.preferencias

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === 'edit' ? 'Editar Participante' : 'Adicionar Participante'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Atualize as informações do participante. Campos com * são obrigatórios.'
              : 'Preencha as informações do participante. Campos com * são obrigatórios.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dados-basicos" className="relative">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Dados Básicos</span>
                <span className="sm:hidden">Dados</span>
                {isDadosBasicosComplete && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="documentos" className="relative">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Documentos</span>
                <span className="sm:hidden">Docs</span>
                {hasDocumentos && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="alergias" className="relative">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Alergias</span>
                <span className="sm:hidden">Alerg.</span>
                {hasAlergias && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="preferencias" className="relative">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Preferências</span>
                <span className="sm:hidden">Pref.</span>
                {hasRestricoesPreferencias && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="dados-basicos" className="space-y-5 m-0">
              <div className="space-y-5">
                <div>
                  <Label htmlFor="nome" className="flex items-center gap-1 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleFieldChange('nome', e.target.value)}
                    onBlur={() => handleFieldBlur('nome')}
                    placeholder="Digite o nome completo"
                    className={cn(
                      errors.nome && touchedFields.has('nome') && 'border-red-500 focus-visible:ring-red-500'
                    )}
                    autoFocus
                  />
                  {errors.nome && touchedFields.has('nome') && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.nome}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-1 mb-2">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        onBlur={() => handleFieldBlur('email')}
                        placeholder="email@exemplo.com"
                        className={cn(
                          'pl-10',
                          errors.email && touchedFields.has('email') && 'border-red-500 focus-visible:ring-red-500'
                        )}
                      />
                    </div>
                    {errors.email && touchedFields.has('email') && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="telefone" className="mb-2">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        onBlur={() => handleFieldBlur('telefone')}
                        placeholder="(00) 00000-0000"
                        className={cn(
                          'pl-10',
                          errors.telefone && touchedFields.has('telefone') && 'border-red-500 focus-visible:ring-red-500'
                        )}
                        maxLength={15}
                      />
                    </div>
                    {errors.telefone && touchedFields.has('telefone') && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.telefone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="idade" className="mb-2">Idade</Label>
                  <Input
                    id="idade"
                    type="number"
                    value={formData.idade}
                    onChange={(e) => handleFieldChange('idade', e.target.value)}
                    onBlur={() => handleFieldBlur('idade')}
                    placeholder="Idade do participante"
                    className={cn(
                      errors.idade && touchedFields.has('idade') && 'border-red-500 focus-visible:ring-red-500'
                    )}
                    min="0"
                    max="150"
                  />
                  {errors.idade && touchedFields.has('idade') && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.idade}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('documentos')}
                    variant="outline"
                    disabled={!isDadosBasicosComplete}
                  >
                    Próximo: Documentos
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="space-y-5 m-0">
              <div className="space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Informações de Documentos</strong> - Preencha os dados do passaporte se aplicável.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="passaporteNumero" className="mb-2">Número do Passaporte</Label>
                    <Input
                      id="passaporteNumero"
                      value={formData.passaporteNumero}
                      onChange={(e) => handleFieldChange('passaporteNumero', e.target.value.toUpperCase())}
                      placeholder="Ex: BR123456"
                      className="uppercase"
                    />
                  </div>

                  <div>
                    <Label htmlFor="passaporteValidade" className="mb-2">Validade do Passaporte</Label>
                    <Input
                      id="passaporteValidade"
                      type="date"
                      value={formData.passaporteValidade}
                      onChange={(e) => handleFieldChange('passaporteValidade', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes" className="mb-2">Observações Gerais</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleFieldChange('observacoes', e.target.value)}
                    placeholder="Outras informações relevantes sobre o participante..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('dados-basicos')}
                    variant="outline"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('alergias')}
                    variant="outline"
                  >
                    Próximo: Alergias
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="alergias" className="space-y-5 m-0">
              <div className="space-y-5">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">Informações de Saúde Importantes</p>
                      <p className="text-sm text-red-800 mt-1">
                        Registre todas as alergias do participante. Esta informação é crítica para garantir a segurança durante a viagem.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <PresetsMultiSelect
                    id="alergias"
                    label="Alergias"
                    placeholder="Buscar ou adicionar alergias..."
                    tipo="alergia"
                    value={formData.alergias}
                    onChange={(v) => handleFieldChange('alergias', v)}
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Exemplos:</strong> amendoim, frutos do mar, pólen, látex, medicamentos específicos, picadas de insetos
                    </span>
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('documentos')}
                    variant="outline"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('preferencias')}
                    variant="outline"
                  >
                    Próximo: Preferências
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferencias" className="space-y-5 m-0">
              <div className="space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Restrições e Preferências</p>
                      <p className="text-sm text-blue-800 mt-1">
                        Registre restrições alimentares e preferências para personalizar a experiência do participante.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <PresetsMultiSelect
                    id="restricoes"
                    label="Restrições Alimentares"
                    placeholder="Buscar ou adicionar restrições..."
                    tipo="restricao"
                    value={formData.restricoes}
                    onChange={(v) => handleFieldChange('restricoes', v)}
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-start gap-2">
                    <Utensils className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Exemplos:</strong> vegetariano, vegano, sem glúten, sem lactose, kosher, halal, sem açúcar
                    </span>
                  </p>
                </div>

                <div className="space-y-1">
                  <PresetsMultiSelect
                    id="preferencias"
                    label="Preferências Gerais"
                    placeholder="Buscar ou adicionar preferências..."
                    tipo="preferencia"
                    value={formData.preferencias}
                    onChange={(v) => handleFieldChange('preferencias', v)}
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Exemplos:</strong> quarto individual, andar baixo, vista para o mar, cama king size, ar-condicionado
                    </span>
                  </p>
                </div>

                <div className="flex justify-start pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('alergias')}
                    variant="outline"
                  >
                    Voltar
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="text-sm text-gray-500">
            {isDadosBasicosComplete ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Dados obrigatórios preenchidos
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Preencha os dados obrigatórios
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !isDadosBasicosComplete}
            >
              {loading ? 'Salvando...' : mode === 'edit' ? 'Atualizar Participante' : 'Salvar Participante'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
