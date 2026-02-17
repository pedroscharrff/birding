"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"

interface OSExtensionTabsProps {
  extensoes: any[]
  selectedExtensionId: string | null
  onSelect: (extensionId: string | null) => void
  onAddExtension: () => void
}

export function OSExtensionTabs({
  extensoes,
  selectedExtensionId,
  onSelect,
  onAddExtension
}: OSExtensionTabsProps) {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
      <Tabs
        value={selectedExtensionId ?? 'geral'}
        onValueChange={(val) => onSelect(val === 'geral' ? null : val)}
        className="w-full"
      >
        <TabsList className="bg-transparent border-b w-full justify-start h-auto p-0 rounded-none space-x-6">
          <TabsTrigger
            value="geral"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
          >
            Viagem Principal
          </TabsTrigger>

          {extensoes.map((ext) => (
            <TabsTrigger
              key={ext.id}
              value={ext.id}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
            >
              Extensão: {ext.nome}
            </TabsTrigger>
          ))}

          <button
            onClick={onAddExtension}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary px-4 py-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Extensão
          </button>
        </TabsList>
      </Tabs>
    </div>
  )
}
