"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, MapPin, Globe, Edit2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { parseDateUTC } from "@/lib/utils/date"
import { cn } from "@/lib/utils"

interface OSExtensionTimelineProps {
  extensoes: any[]
  selectedExtensionId: string | null
  onSelect: (extensionId: string | null) => void
  onAddExtension: () => void
  onEditExtension?: (extension: any) => void
}

export function OSExtensionTimeline({
  extensoes,
  selectedExtensionId,
  onSelect,
  onAddExtension,
  onEditExtension
}: OSExtensionTimelineProps) {

  // Ordenar extensões por data
  const sortedExtensions = [...extensoes].sort((a, b) => 
    new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime()
  )

  return (
    <div className="w-full overflow-x-auto pb-4 pt-2 custom-scrollbar">
      <div className="relative min-w-max px-4">
        
        {/* Linha do tempo (Background) */}
        <div className="absolute top-[26px] left-0 right-0 h-0.5 bg-gray-200 -z-10" />

        <div className="flex items-start gap-4">
          
          {/* Nó: Viagem Principal */}
          <div className="flex flex-col items-center gap-3 group min-w-[140px]">
            <Button
              variant={selectedExtensionId === null ? "default" : "outline"}
              className={cn(
                "rounded-full w-14 h-14 p-0 border-4 transition-all z-10",
                selectedExtensionId === null 
                  ? "border-white shadow-lg ring-2 ring-primary bg-primary text-primary-foreground scale-110" 
                  : "border-white shadow bg-white hover:border-primary/20 hover:text-primary"
              )}
              onClick={() => onSelect(null)}
            >
              <Globe className="h-6 w-6" />
            </Button>
            
            <Card 
              className={cn(
                "w-full cursor-pointer transition-all border-2 group-hover:shadow-md",
                selectedExtensionId === null 
                  ? "border-primary/20 shadow-md bg-primary/5" 
                  : "border-transparent bg-white/50 hover:bg-white"
              )}
              onClick={() => onSelect(null)}
            >
              <CardContent className="p-3 text-center">
                <p className={cn(
                  "text-sm font-bold transition-colors mb-1",
                  selectedExtensionId === null ? "text-primary" : "text-gray-700"
                )}>
                  Viagem Principal
                </p>
                <p className="text-xs text-gray-500">
                  Tour Base
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Nós: Extensões */}
          {sortedExtensions.map((ext, index) => {
            const isSelected = selectedExtensionId === ext.id
            return (
              <div key={ext.id} className="flex flex-col items-center gap-3 group min-w-[200px]">
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "rounded-full w-14 h-14 p-0 border-4 transition-all z-10",
                    isSelected 
                      ? "border-white shadow-lg ring-2 ring-primary bg-primary text-primary-foreground scale-110" 
                      : "border-white shadow bg-white hover:border-primary/20 hover:text-primary"
                  )}
                  onClick={() => onSelect(ext.id)}
                >
                  <MapPin className="h-6 w-6" />
                  <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {index + 1}
                  </span>
                </Button>
                
                <Card 
                  className={cn(
                    "w-full transition-all border-2 relative group/card",
                    isSelected 
                      ? "border-primary/20 shadow-md bg-primary/5" 
                      : "border-transparent bg-white/50 hover:bg-white hover:shadow-md"
                  )}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="text-center">
                      <h4 
                        className={cn(
                          "font-semibold text-sm truncate px-1 cursor-pointer",
                          isSelected ? "text-primary" : "text-gray-800"
                        )} 
                        title={ext.nome}
                        onClick={() => onSelect(ext.id)}
                      >
                        {ext.nome}
                      </h4>
                    </div>
                    
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 bg-gray-100/50 py-1 rounded-md">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span>
                        {format(parseDateUTC(ext.dataInicio)!, 'dd/MM', { locale: ptBR })} 
                        <span className="mx-1 text-gray-300">|</span> 
                        {format(parseDateUTC(ext.dataFim)!, 'dd/MM', { locale: ptBR })}
                      </span>
                    </div>

                    {ext.descricao && (
                      <p className="text-[10px] text-gray-500 line-clamp-2 text-center h-8 leading-tight px-1">
                        {ext.descricao}
                      </p>
                    )}

                    {ext.status && (
                       <div className="flex justify-center mt-1">
                         <span className={cn(
                           "text-[9px] px-1.5 py-0.5 rounded-full border truncate max-w-full",
                           ext.status === 'planejamento' && "bg-gray-50 text-gray-600 border-gray-200",
                           ext.status === 'cotacoes' && "bg-blue-50 text-blue-600 border-blue-200",
                           ext.status === 'reservas_pendentes' && "bg-yellow-50 text-yellow-600 border-yellow-200",
                           ext.status === 'reservas_confirmadas' && "bg-green-50 text-green-600 border-green-200",
                           ext.status === 'documentacao' && "bg-indigo-50 text-indigo-600 border-indigo-200",
                           ext.status === 'pronto_para_viagem' && "bg-teal-50 text-teal-600 border-teal-200",
                           ext.status === 'em_andamento' && "bg-purple-50 text-purple-600 border-purple-200",
                           ext.status === 'concluida' && "bg-emerald-50 text-emerald-600 border-emerald-200",
                           ext.status === 'pos_viagem' && "bg-cyan-50 text-cyan-600 border-cyan-200",
                           ext.status === 'cancelada' && "bg-red-50 text-red-600 border-red-200"
                         )}>
                           {ext.status.replace(/_/g, ' ')}
                         </span>
                       </div>
                    )}

                    {/* Edit Button - aparece no hover */}
                    {onEditExtension && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditExtension(ext)
                          }}
                          title="Editar extensão"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}

          {/* Botão Adicionar (Final) */}
          <div className="flex flex-col items-center gap-3 min-w-[100px]">
             <Button
                variant="ghost"
                className="rounded-full w-14 h-14 p-0 border-2 border-dashed border-gray-300 hover:border-primary hover:text-primary transition-all z-10 bg-gray-50/50"
                onClick={onAddExtension}
                title="Adicionar nova extensão"
              >
                <Plus className="h-6 w-6" />
              </Button>
              <div className="h-[100px] flex items-center justify-center">
                <p className="text-xs text-center text-gray-400 font-medium w-20">
                  Nova<br/>Extensão
                </p>
              </div>
          </div>

        </div>
      </div>
    </div>
  )
}
