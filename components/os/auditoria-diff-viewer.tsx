'use client'

import { formatarValorAuditoria } from '@/lib/utils/auditoria'
import { ArrowRight } from 'lucide-react'

interface Props {
  dadosAntigos: any
  dadosNovos: any
  campos: string[]
}

const camposIgnorados = ['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at']

const traduzirCampo = (campo: string): string => {
  const traducoes: Record<string, string> = {
    nome: 'Nome',
    email: 'E-mail',
    telefone: 'Telefone',
    titulo: 'Título',
    descricao: 'Descrição',
    status: 'Status',
    dataInicio: 'Data de Início',
    data_inicio: 'Data de Início',
    dataFim: 'Data de Fim',
    data_fim: 'Data de Fim',
    valor: 'Valor',
    custo: 'Custo',
    custoTotal: 'Custo Total',
    custo_total: 'Custo Total',
    observacoes: 'Observações',
    destino: 'Destino',
    origem: 'Origem',
    checkin: 'Check-in',
    checkout: 'Check-out',
    hotelNome: 'Hotel',
    hotel_nome: 'Hotel',
    passaporteNumero: 'Passaporte',
    passaporte_numero: 'Passaporte',
    alergias: 'Alergias',
    restricoes: 'Restrições',
    preferencias: 'Preferências',
    idade: 'Idade',
    tipo: 'Tipo',
    quartos: 'Quartos',
    tipoQuarto: 'Tipo de Quarto',
    tipo_quarto: 'Tipo de Quarto',
    regime: 'Regime',
    moeda: 'Moeda',
    fornecedorId: 'Fornecedor',
    fornecedor_id: 'Fornecedor',
    tarifaId: 'Tarifa',
    tarifa_id: 'Tarifa',
    localizacao: 'Localização',
    quantidadeMaxima: 'Quantidade Máxima',
    quantidade_maxima: 'Quantidade Máxima',
    data: 'Data',
    hora: 'Hora',
    notas: 'Notas',
    dataPartida: 'Data de Partida',
    data_partida: 'Data de Partida',
    dataChegada: 'Data de Chegada',
    data_chegada: 'Data de Chegada',
  }
  return traducoes[campo] || campo
}

export function AuditoriaDiffViewer({ dadosAntigos, dadosNovos, campos }: Props) {
  // Filtrar apenas campos que mudaram e não são ignorados
  const camposFiltrados = campos.filter((c) => !camposIgnorados.includes(c))

  if (camposFiltrados.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Nenhuma alteração significativa detectada
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Alterações:</h4>
      <div className="space-y-2">
        {camposFiltrados.map((campo) => {
          const valorAntigo = dadosAntigos?.[campo]
          const valorNovo = dadosNovos?.[campo]

          return (
            <div
              key={campo}
              className="grid grid-cols-[120px_1fr_40px_1fr] gap-2 items-center text-sm p-2 bg-gray-50 rounded"
            >
              {/* Nome do campo */}
              <div className="font-medium text-muted-foreground">
                {traduzirCampo(campo)}
              </div>

              {/* Valor antigo */}
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-red-50 border border-red-200 rounded flex-1">
                  <span className="text-red-700 line-through">
                    {formatarValorAuditoria(valorAntigo)}
                  </span>
                </div>
              </div>

              {/* Seta */}
              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Valor novo */}
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-green-50 border border-green-200 rounded flex-1">
                  <span className="text-green-700 font-medium">
                    {formatarValorAuditoria(valorNovo)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
