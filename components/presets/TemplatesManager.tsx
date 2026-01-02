"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import { Layers, Plus, Trash2, Check, X, TrendingUp } from 'lucide-react'

type PresetTipo = 'alergia' | 'restricao' | 'preferencia'

interface PresetItem {
  id: string
  label: string
  tipo: PresetTipo
  categoriaId?: string | null
  ativo: boolean
  usoCount?: number
}

interface PresetTemplateItem {
  id: string
  item: PresetItem
  ordem: number | null
}

interface PresetTemplate {
  id: string
  nome: string
  descricao?: string | null
  tipo: PresetTipo
  ativo: boolean
  usoCount: number
  items: PresetTemplateItem[]
}

interface TemplatesManagerProps {
  tipo: PresetTipo
}

export function TemplatesManager({ tipo }: TemplatesManagerProps) {
  const { toast } = useToast()
  const { data: templates, refetch: refetchTemplates } = useApi<PresetTemplate[]>(`/api/config/presets/templates?tipo=${tipo}&ativo=true`)
  const { data: allItems } = useApi<PresetItem[]>(`/api/config/presets/items?tipo=${tipo}&ativo=true`)

  const [isCreating, setIsCreating] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const activeTemplates = useMemo(() =>
    (templates || []).filter(t => t.ativo).sort((a, b) => b.usoCount - a.usoCount),
    [templates]
  )

  const toggleItem = (itemId: string) => {
    const newSet = new Set(selectedItems)
    if (newSet.has(itemId)) {
      newSet.delete(itemId)
    } else {
      newSet.add(itemId)
    }
    setSelectedItems(newSet)
  }

  const onCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: 'Atenção', description: 'Digite um nome para o template', variant: 'destructive' })
      return
    }
    if (selectedItems.size === 0) {
      toast({ title: 'Atenção', description: 'Selecione pelo menos um item', variant: 'destructive' })
      return
    }

    try {
      await fetch('/api/config/presets/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nome: templateName.trim(),
          descricao: templateDesc.trim() || undefined,
          tipo,
          itemIds: Array.from(selectedItems),
        }),
      })

      toast({ title: 'Sucesso', description: 'Template criado com sucesso!' })
      setTemplateName('')
      setTemplateDesc('')
      setSelectedItems(new Set())
      setIsCreating(false)
      await refetchTemplates()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao criar template', variant: 'destructive' })
    }
  }

  const onDeleteTemplate = async (templateId: string) => {
    if (!confirm('Deseja realmente excluir este template?')) return

    try {
      await fetch(`/api/config/presets/templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      toast({ title: 'Sucesso', description: 'Template excluído!' })
      await refetchTemplates()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao excluir template', variant: 'destructive' })
    }
  }

  const onApplyTemplate = async (template: PresetTemplate) => {
    try {
      const res = await fetch(`/api/config/presets/templates/${template.id}`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await res.json()

      if (data.success) {
        const itemsText = data.data.items.join(', ')
        navigator.clipboard.writeText(itemsText)
        toast({
          title: 'Template aplicado!',
          description: `Itens copiados para área de transferência: ${itemsText}`,
        })
        await refetchTemplates()
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao aplicar template', variant: 'destructive' })
    }
  }

  const getTipoLabel = (tipo: PresetTipo) => {
    switch(tipo) {
      case 'alergia': return 'Alergias'
      case 'restricao': return 'Restrições'
      case 'preferencia': return 'Preferências'
    }
  }

  const getTipoColor = (tipo: PresetTipo) => {
    switch(tipo) {
      case 'alergia': return 'bg-red-100 text-red-700'
      case 'restricao': return 'bg-orange-100 text-orange-700'
      case 'preferencia': return 'bg-blue-100 text-blue-700'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Templates - Combinações Comuns
            </CardTitle>
            <CardDescription>
              Crie templates com combinações frequentes para agilizar o cadastro
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsCreating(!isCreating)}
            variant={isCreating ? "outline" : "default"}
          >
            {isCreating ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCreating && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Nome do Template *</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ex: Alergia Frutos do Mar"
                />
              </div>
              <div>
                <Label htmlFor="template-desc">Descrição</Label>
                <Input
                  id="template-desc"
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div>
              <Label>Selecione os itens do template ({selectedItems.size} selecionados)</Label>
              <div className="mt-2 flex flex-wrap gap-2 p-3 border rounded-lg bg-white max-h-[200px] overflow-y-auto">
                {(allItems || []).map(item => (
                  <Badge
                    key={item.id}
                    variant={selectedItems.has(item.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleItem(item.id)}
                  >
                    {selectedItems.has(item.id) && <Check className="h-3 w-3 mr-1" />}
                    {item.label}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={onCreateTemplate} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar Template
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {activeTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum template cadastrado</p>
              <p className="text-sm mt-1">Crie um template para agilizar cadastros futuros</p>
            </div>
          ) : (
            activeTemplates.map(template => (
              <div
                key={template.id}
                className="border rounded-lg p-4 bg-white hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{template.nome}</h4>
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {template.usoCount} usos
                      </Badge>
                    </div>
                    {template.descricao && (
                      <p className="text-sm text-gray-600 mb-2">{template.descricao}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onApplyTemplate(template)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Usar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteTemplate(template.id)}
                      className="hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.items
                    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                    .map(ti => (
                      <Badge key={ti.id} className={getTipoColor(tipo)}>
                        {ti.item.label}
                      </Badge>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
