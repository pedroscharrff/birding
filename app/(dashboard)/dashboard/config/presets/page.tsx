"use client"

import { useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import { Plus, Pencil, Trash2, Search, X, FolderOpen, Tag } from 'lucide-react'
import { TemplatesManager } from '@/components/presets/TemplatesManager'
import { UsageHistory } from '@/components/presets/UsageHistory'

type PresetTipo = 'alergia' | 'restricao' | 'preferencia'

interface PresetCategory { id: string; nome: string; tipo: PresetTipo; parentId?: string | null; ativo: boolean }
interface PresetItem { id: string; label: string; tipo: PresetTipo; categoriaId?: string | null; ativo: boolean; descricao?: string | null }

function PresetsTab({ tipo }: { tipo: PresetTipo }) {
  const { data: categories, refetch: refetchCategories } = useApi<PresetCategory[]>(`/api/config/presets/categories?tipo=${tipo}`)
  const { data: items, refetch: refetchItems } = useApi<PresetItem[]>(`/api/config/presets/items?tipo=${tipo}`)
  const { execute: createCategory } = useApi(`/api/config/presets/categories`, { method: 'POST' })
  const { execute: createItem } = useApi(`/api/config/presets/items`, { method: 'POST' })
  const { toast } = useToast()

  const [catName, setCatName] = useState('')
  const [itemLabel, setItemLabel] = useState('')
  const [itemCat, setItemCat] = useState<string>('')
  const [itemDesc, setItemDesc] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCategory, setEditingCategory] = useState<PresetCategory | null>(null)
  const [editingItem, setEditingItem] = useState<PresetItem | null>(null)

  const categoriesSorted = useMemo(() => (categories || []).slice().sort((a,b) => (a.nome || '').localeCompare(b.nome || '')), [categories])

  const filteredItems = useMemo(() => {
    const allItems = items || []
    if (!searchQuery.trim()) return allItems
    const q = searchQuery.toLowerCase()
    return allItems.filter(it =>
      it.label.toLowerCase().includes(q) ||
      (it.descricao && it.descricao.toLowerCase().includes(q))
    )
  }, [items, searchQuery])

  const itemsByCat = useMemo(() => {
    const map: Record<string, PresetItem[]> = {}
    for (const it of filteredItems) {
      const key = it.categoriaId || 'Sem categoria'
      if (!map[key]) map[key] = []
      map[key].push(it)
    }
    Object.keys(map).forEach(k => map[k].sort((a,b) => a.label.localeCompare(b.label)))
    return map
  }, [filteredItems])

  const totalItems = useMemo(() => (items || []).length, [items])
  const totalCategories = useMemo(() => (categories || []).length, [categories])

  const onAddCategory = async () => {
    const nome = catName.trim()
    if (!nome) {
      toast({ title: 'Atenção', description: 'Digite um nome para a categoria', variant: 'destructive' })
      return
    }
    try {
      await createCategory({ nome, tipo })
      setCatName('')
      await refetchCategories()
      toast({ title: 'Sucesso', description: 'Categoria criada com sucesso!' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao criar categoria', variant: 'destructive' })
    }
  }

  const onEditCategory = async (cat: PresetCategory, newName: string) => {
    if (!newName.trim()) {
      toast({ title: 'Atenção', description: 'Digite um nome para a categoria', variant: 'destructive' })
      return
    }
    try {
      await fetch(`/api/config/presets/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nome: newName.trim() })
      })
      await refetchCategories()
      await refetchItems()
      setEditingCategory(null)
      toast({ title: 'Sucesso', description: 'Categoria atualizada!' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar categoria', variant: 'destructive' })
    }
  }

  const onDeleteCategory = async (catId: string) => {
    if (!confirm('Deseja realmente excluir esta categoria? Os itens não serão excluídos, apenas ficarão sem categoria.')) return
    try {
      await fetch(`/api/config/presets/categories/${catId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      await refetchCategories()
      await refetchItems()
      toast({ title: 'Sucesso', description: 'Categoria excluída!' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao excluir categoria', variant: 'destructive' })
    }
  }

  const onAddItem = async () => {
    const label = itemLabel.trim()
    if (!label) {
      toast({ title: 'Atenção', description: 'Digite um nome para o item', variant: 'destructive' })
      return
    }
    try {
      await createItem({ label, tipo, categoriaId: itemCat || undefined, descricao: itemDesc.trim() || undefined })
      setItemLabel('')
      setItemDesc('')
      await refetchItems()
      toast({ title: 'Sucesso', description: 'Item criado com sucesso!' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao criar item', variant: 'destructive' })
    }
  }

  const onEditItem = async (item: PresetItem, newLabel: string, newDesc: string, newCatId: string) => {
    if (!newLabel.trim()) {
      toast({ title: 'Atenção', description: 'Digite um nome para o item', variant: 'destructive' })
      return
    }
    try {
      await fetch(`/api/config/presets/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          label: newLabel.trim(),
          descricao: newDesc.trim() || undefined,
          categoriaId: newCatId || undefined
        })
      })
      await refetchItems()
      setEditingItem(null)
      toast({ title: 'Sucesso', description: 'Item atualizado!' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar item', variant: 'destructive' })
    }
  }

  const onDeleteItem = async (itemId: string) => {
    if (!confirm('Deseja realmente excluir este item?')) return
    try {
      await fetch(`/api/config/presets/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      await refetchItems()
      toast({ title: 'Sucesso', description: 'Item excluído!' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao excluir item', variant: 'destructive' })
    }
  }

  const getTipoLabel = (tipo: PresetTipo) => {
    switch(tipo) {
      case 'alergia': return 'Alergias'
      case 'restricao': return 'Restrições Alimentares'
      case 'preferencia': return 'Preferências'
    }
  }

  const getTipoColor = (tipo: PresetTipo) => {
    switch(tipo) {
      case 'alergia': return 'text-red-600'
      case 'restricao': return 'text-orange-600'
      case 'preferencia': return 'text-blue-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Templates e Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TemplatesManager tipo={tipo} />
        <UsageHistory tipo={tipo} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200`}>
                <FolderOpen className={`h-6 w-6 ${getTipoColor(tipo)}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Categorias</p>
                <p className="text-2xl font-bold">{totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200`}>
                <Tag className={`h-6 w-6 ${getTipoColor(tipo)}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Itens cadastrados</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200`}>
                <Search className={`h-6 w-6 ${getTipoColor(tipo)}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Filtrados</p>
                <p className="text-2xl font-bold">{filteredItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categorias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Categorias
            </CardTitle>
            <CardDescription>Organize seus itens em categorias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Category Form */}
            <div className="space-y-2">
              <Label htmlFor={`cat-${tipo}`}>Nova categoria</Label>
              <div className="flex gap-2">
                <Input
                  id={`cat-${tipo}`}
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ex: Frutos do mar, Medicamentos"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      onAddCategory()
                    }
                  }}
                />
                <Button onClick={onAddCategory} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Categories List */}
            <div className="border-t pt-4 space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-3">
                Categorias existentes ({totalCategories})
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {categoriesSorted.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Nenhuma categoria cadastrada</p>
                ) : (
                  categoriesSorted.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50 hover:bg-gray-100 transition">
                      {editingCategory?.id === cat.id ? (
                        <>
                          <Input
                            value={editingCategory.nome}
                            onChange={(e) => setEditingCategory({ ...editingCategory, nome: e.target.value })}
                            className="flex-1 h-8"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onEditCategory(cat, editingCategory.nome)
                              }
                              if (e.key === 'Escape') {
                                setEditingCategory(null)
                              }
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEditCategory(cat, editingCategory.nome)}>
                            <Plus className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingCategory(null)}>
                            <X className="h-4 w-4 text-gray-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <FolderOpen className="h-4 w-4 text-gray-600 flex-shrink-0" />
                          <span className="flex-1 text-sm font-medium">{cat.nome}</span>
                          <Badge variant="outline" className="text-xs">
                            {(items || []).filter(it => it.categoriaId === cat.id).length}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-blue-100"
                            onClick={() => setEditingCategory(cat)}
                          >
                            <Pencil className="h-3 w-3 text-blue-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-red-100"
                            onClick={() => onDeleteCategory(cat.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Novo Item + Lista */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Item Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Novo Item
              </CardTitle>
              <CardDescription>Adicione um novo item ao catálogo de {getTipoLabel(tipo).toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`item-${tipo}`}>Nome do item *</Label>
                  <Input
                    id={`item-${tipo}`}
                    value={itemLabel}
                    onChange={(e) => setItemLabel(e.target.value)}
                    placeholder="Ex: Amendoim, Lactose, Vegetariano"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        onAddItem()
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <select
                    className="w-full border rounded-md h-10 px-3 bg-white"
                    value={itemCat}
                    onChange={(e) => setItemCat(e.target.value)}
                  >
                    <option value="">Sem categoria</option>
                    {categoriesSorted.map(c => (
                      <option value={c.id} key={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor={`item-desc-${tipo}`}>Descrição (opcional)</Label>
                <Input
                  id={`item-desc-${tipo}`}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Ex: Alergia grave, evitar contato"
                />
              </div>
              <Button onClick={onAddItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Itens Cadastrados
              </CardTitle>
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar itens..."
                      className="pl-9 pr-9"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-h-[600px] overflow-y-auto">
                {Object.keys(itemsByCat).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum item encontrado</p>
                    <p className="text-sm mt-1">
                      {searchQuery ? 'Tente ajustar sua busca' : 'Adicione seu primeiro item acima'}
                    </p>
                  </div>
                ) : (
                  (categoriesSorted.length ? categoriesSorted : [{ id: 'Sem categoria', nome: 'Sem categoria' } as any]).map(cat => {
                    const key = cat.id === 'Sem categoria' ? 'Sem categoria' : cat.id
                    const list = itemsByCat[key] || []
                    if (!list.length) return null
                    return (
                      <div key={key} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                          <FolderOpen className="h-4 w-4 text-gray-600" />
                          <span className="font-semibold text-gray-800">{cat.nome}</span>
                          <Badge variant="outline" className="ml-auto">{list.length} {list.length === 1 ? 'item' : 'itens'}</Badge>
                        </div>
                        <div className="space-y-2">
                          {list.map(it => (
                            <div key={it.id}>
                              {editingItem?.id === it.id ? (
                                <div className="flex flex-col gap-2 p-3 border rounded-lg bg-white">
                                  <Input
                                    value={editingItem.label}
                                    onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                                    placeholder="Nome do item"
                                    className="h-8"
                                    autoFocus
                                  />
                                  <Input
                                    value={editingItem.descricao || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, descricao: e.target.value })}
                                    placeholder="Descrição (opcional)"
                                    className="h-8"
                                  />
                                  <select
                                    className="w-full border rounded-md h-8 px-2 text-sm"
                                    value={editingItem.categoriaId || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, categoriaId: e.target.value || null })}
                                  >
                                    <option value="">Sem categoria</option>
                                    {categoriesSorted.map(c => (
                                      <option value={c.id} key={c.id}>{c.nome}</option>
                                    ))}
                                  </select>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="flex-1"
                                      onClick={() => onEditItem(it, editingItem.label, editingItem.descricao || '', editingItem.categoriaId || '')}
                                    >
                                      Salvar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingItem(null)}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2 p-2 rounded-lg bg-white border hover:border-gray-400 transition group">
                                  <Tag className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-gray-900">{it.label}</div>
                                    {it.descricao && (
                                      <div className="text-xs text-gray-500 mt-0.5">{it.descricao}</div>
                                    )}
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 hover:bg-blue-100"
                                      onClick={() => setEditingItem(it)}
                                    >
                                      <Pencil className="h-3 w-3 text-blue-600" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 hover:bg-red-100"
                                      onClick={() => onDeleteItem(it.id)}
                                    >
                                      <Trash2 className="h-3 w-3 text-red-600" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function PresetsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pré-cadastros</h1>
        <p className="text-gray-600 mt-1">Gerencie alergias, restrições alimentares e preferências para agilizar o cadastro de participantes</p>
      </div>
      <Tabs defaultValue="alergia" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="alergia" className="flex items-center gap-2">
            <span className="hidden sm:inline">Alergias</span>
            <span className="sm:hidden">Alergias</span>
          </TabsTrigger>
          <TabsTrigger value="restricao" className="flex items-center gap-2">
            <span className="hidden sm:inline">Restrições</span>
            <span className="sm:hidden">Restrições</span>
          </TabsTrigger>
          <TabsTrigger value="preferencia" className="flex items-center gap-2">
            <span className="hidden sm:inline">Preferências</span>
            <span className="sm:hidden">Preferências</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="alergia" className="mt-6">
          <PresetsTab tipo="alergia" />
        </TabsContent>
        <TabsContent value="restricao" className="mt-6">
          <PresetsTab tipo="restricao" />
        </TabsContent>
        <TabsContent value="preferencia" className="mt-6">
          <PresetsTab tipo="preferencia" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
