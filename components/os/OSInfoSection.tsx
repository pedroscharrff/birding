"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Edit, Save, X, UserCog } from 'lucide-react'
import { useOptimisticUpdate } from '@/hooks/useOptimisticApi'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TransferResponsavelDialog } from './TransferResponsavelDialog'

interface OSInfoSectionProps {
  os: {
    id: string
    titulo: string
    destino: string
    dataInicio: string
    dataFim: string
    status: string
    descricao?: string
    agenteResponsavel: {
      id: string
      nome: string
      email: string
      telefone?: string
    }
  }
  onUpdate?: () => void
}

export function OSInfoSection({ os, onUpdate }: OSInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const router = useRouter()
  const { update, isUpdating } = useOptimisticUpdate()

  // Estado local otimista
  const [localOS, setLocalOS] = useState(os)

  // Sincronizar quando os dados da prop mudarem
  useEffect(() => {
    setLocalOS(os)
  }, [os])

  const [formData, setFormData] = useState({
    titulo: localOS.titulo,
    destino: localOS.destino,
    dataInicio: format(new Date(localOS.dataInicio), 'yyyy-MM-dd'),
    dataFim: format(new Date(localOS.dataFim), 'yyyy-MM-dd'),
    status: localOS.status,
    descricao: localOS.descricao || '',
  })

  const statusOptions = [
    { value: 'planejamento', label: 'Planejamento' },
    { value: 'cotacoes', label: 'Cotações' },
    { value: 'reservas_pendentes', label: 'Reservas Pendentes' },
    { value: 'reservas_confirmadas', label: 'Confirmadas' },
    { value: 'documentacao', label: 'Documentação' },
    { value: 'pronto_para_viagem', label: 'Pronto p/ Viagem' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'concluida', label: 'Concluída' },
    { value: 'pos_viagem', label: 'Pós-Viagem' },
    { value: 'cancelada', label: 'Cancelada' },
  ]

  const handleSave = async () => {
    const oldData = { ...localOS }
    const updatedData = {
      ...localOS,
      ...formData,
      dataInicio: formData.dataInicio,
      dataFim: formData.dataFim,
    }

    await update({
      endpoint: `/api/os/${os.id}`,
      optimisticData: updatedData,
      updateFn: (data) => {
        setLocalOS(data)
        setIsEditing(false)
      },
      rollbackFn: () => {
        setLocalOS(oldData)
        // Restaura o form também
        setFormData({
          titulo: oldData.titulo,
          destino: oldData.destino,
          dataInicio: format(new Date(oldData.dataInicio), 'yyyy-MM-dd'),
          dataFim: format(new Date(oldData.dataFim), 'yyyy-MM-dd'),
          status: oldData.status,
          descricao: oldData.descricao || '',
        })
      },
      payload: formData,
      successMessage: 'OS atualizada com sucesso',
      onSuccess: () => {
        router.refresh()
        // Opcional: chamar onUpdate se precisar atualizar dados externos
        if (onUpdate) {
          onUpdate()
        }
      },
    })
  }

  const handleCancel = () => {
    setFormData({
      titulo: localOS.titulo,
      destino: localOS.destino,
      dataInicio: format(new Date(localOS.dataInicio), 'yyyy-MM-dd'),
      dataFim: format(new Date(localOS.dataFim), 'yyyy-MM-dd'),
      status: localOS.status,
      descricao: localOS.descricao || '',
    })
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Informações Gerais</CardTitle>
            <CardDescription>Detalhes da ordem de serviço</CardDescription>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isUpdating}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEditing ? (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-600">Título</Label>
                <p className="text-lg font-medium mt-1">{localOS.titulo}</p>
              </div>
              <div>
                <Label className="text-gray-600">Destino</Label>
                <p className="text-lg font-medium mt-1">{localOS.destino}</p>
              </div>
              <div>
                <Label className="text-gray-600">Data de Início</Label>
                <p className="text-lg font-medium mt-1">
                  {format(new Date(localOS.dataInicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Data de Fim</Label>
                <p className="text-lg font-medium mt-1">
                  {format(new Date(localOS.dataFim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            {localOS.descricao && (
              <div>
                <Label className="text-gray-600">Descrição</Label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{localOS.descricao}</p>
              </div>
            )}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-600">Agente Responsável</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTransferDialog(true)}
                  className="text-xs"
                >
                  <UserCog className="h-3 w-3 mr-1" />
                  Transferir
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-lg font-medium">{localOS.agenteResponsavel.nome}</p>
                <p className="text-sm text-gray-600">{localOS.agenteResponsavel.email}</p>
                {localOS.agenteResponsavel.telefone && (
                  <p className="text-sm text-gray-600">{localOS.agenteResponsavel.telefone}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Título da OS"
                />
              </div>
              <div>
                <Label htmlFor="destino">Destino *</Label>
                <Input
                  id="destino"
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  placeholder="Destino"
                />
              </div>
              <div>
                <Label htmlFor="dataInicio">Data de Início *</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dataFim">Data de Fim *</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={formData.dataFim}
                  onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição da OS..."
                rows={4}
              />
            </div>
          </div>
        )}
      </CardContent>

      <TransferResponsavelDialog
        osId={os.id}
        agenteAtual={localOS.agenteResponsavel}
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        onSuccess={() => {
          router.refresh()
          if (onUpdate) {
            onUpdate()
          }
        }}
      />
    </Card>
  )
}
