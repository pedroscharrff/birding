"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { Building2, Mail, Phone, FileText, MapPin, Save, X } from 'lucide-react'

type TipoFornecedor = 'hotelaria' | 'guiamento' | 'transporte' | 'alimentacao' | 'atividade' | 'outros'

interface Fornecedor {
  id: string
  nomeFantasia: string
  razaoSocial?: string | null
  tipo: TipoFornecedor
  email?: string | null
  telefone?: string | null
  documento?: string | null
  endereco?: {
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
  } | null
  obs?: string | null
}

interface FornecedorFormDialogProps {
  open: boolean
  onClose: () => void
  fornecedor?: Fornecedor | null
}

const tipoOptions: { value: TipoFornecedor; label: string }[] = [
  { value: 'hotelaria', label: 'Hotelaria' },
  { value: 'guiamento', label: 'Guiamento' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'atividade', label: 'Atividade' },
  { value: 'outros', label: 'Outros' },
]

export function FornecedorFormDialog({ open, onClose, fornecedor }: FornecedorFormDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    nomeFantasia: '',
    razaoSocial: '',
    tipo: 'hotelaria' as TipoFornecedor,
    email: '',
    telefone: '',
    documento: '',
    obs: '',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    }
  })

  useEffect(() => {
    if (fornecedor) {
      setFormData({
        nomeFantasia: fornecedor.nomeFantasia || '',
        razaoSocial: fornecedor.razaoSocial || '',
        tipo: fornecedor.tipo,
        email: fornecedor.email || '',
        telefone: fornecedor.telefone || '',
        documento: fornecedor.documento || '',
        obs: fornecedor.obs || '',
        endereco: {
          logradouro: fornecedor.endereco?.logradouro || '',
          numero: fornecedor.endereco?.numero || '',
          complemento: fornecedor.endereco?.complemento || '',
          bairro: fornecedor.endereco?.bairro || '',
          cidade: fornecedor.endereco?.cidade || '',
          estado: fornecedor.endereco?.estado || '',
          cep: fornecedor.endereco?.cep || '',
        }
      })
    } else {
      setFormData({
        nomeFantasia: '',
        razaoSocial: '',
        tipo: 'hotelaria',
        email: '',
        telefone: '',
        documento: '',
        obs: '',
        endereco: {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: '',
        }
      })
    }
  }, [fornecedor, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nomeFantasia.trim()) {
      toast({ title: 'Atenção', description: 'Nome fantasia é obrigatório', variant: 'destructive' })
      return
    }

    setLoading(true)
    
    try {
      const payload = {
        ...formData,
        razaoSocial: formData.razaoSocial.trim() || undefined,
        email: formData.email.trim() || undefined,
        telefone: formData.telefone.trim() || undefined,
        documento: formData.documento.trim() || undefined,
        obs: formData.obs.trim() || undefined,
        endereco: Object.values(formData.endereco).some(v => v.trim())
          ? formData.endereco
          : undefined
      }

      const url = fornecedor 
        ? `/api/fornecedores/${fornecedor.id}`
        : '/api/fornecedores'
      
      const method = fornecedor ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar fornecedor')
      }
      
      toast({ 
        title: 'Sucesso', 
        description: fornecedor ? 'Fornecedor atualizado!' : 'Fornecedor criado com sucesso!' 
      })
      
      onClose()
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao salvar fornecedor', 
        variant: 'destructive' 
      })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateEndereco = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      endereco: { ...prev.endereco, [field]: value }
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </DialogTitle>
          <DialogDescription>
            {fornecedor 
              ? 'Atualize as informações do fornecedor' 
              : 'Preencha os dados do novo fornecedor'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
                <Input
                  id="nomeFantasia"
                  value={formData.nomeFantasia}
                  onChange={(e) => updateField('nomeFantasia', e.target.value)}
                  placeholder="Ex: Hotel Paradise"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razaoSocial">Razão Social</Label>
                <Input
                  id="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={(e) => updateField('razaoSocial', e.target.value)}
                  placeholder="Ex: Paradise Hotéis Ltda"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => updateField('tipo', e.target.value as TipoFornecedor)}
                  className="w-full border rounded-md h-10 px-3 bg-white"
                  required
                >
                  {tipoOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento">CPF/CNPJ</Label>
                <Input
                  id="documento"
                  value={formData.documento}
                  onChange={(e) => updateField('documento', e.target.value)}
                  placeholder="Ex: 00.000.000/0000-00"
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contato
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="contato@fornecedor.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => updateField('telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  value={formData.endereco.logradouro}
                  onChange={(e) => updateEndereco('logradouro', e.target.value)}
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.endereco.numero}
                  onChange={(e) => updateEndereco('numero', e.target.value)}
                  placeholder="123"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.endereco.complemento}
                  onChange={(e) => updateEndereco('complemento', e.target.value)}
                  placeholder="Apto, Sala, etc."
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.endereco.bairro}
                  onChange={(e) => updateEndereco('bairro', e.target.value)}
                  placeholder="Centro"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.endereco.cidade}
                  onChange={(e) => updateEndereco('cidade', e.target.value)}
                  placeholder="São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.endereco.estado}
                  onChange={(e) => updateEndereco('estado', e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.endereco.cep}
                  onChange={(e) => updateEndereco('cep', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observações
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="obs">Observações adicionais</Label>
              <Textarea
                id="obs"
                value={formData.obs}
                onChange={(e) => updateField('obs', e.target.value)}
                placeholder="Informações adicionais sobre o fornecedor..."
                rows={4}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : fornecedor ? 'Atualizar' : 'Criar Fornecedor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
