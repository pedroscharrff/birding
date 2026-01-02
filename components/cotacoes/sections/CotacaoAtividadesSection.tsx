"use client"

import { CotacaoItemsSection, CotacaoItem } from "./CotacaoItemsSection"

interface CotacaoAtividadesSectionProps {
  items: CotacaoItem[]
  onChange: (items: CotacaoItem[]) => void
}

export function CotacaoAtividadesSection({ items, onChange }: CotacaoAtividadesSectionProps) {
  return (
    <CotacaoItemsSection
      items={items}
      onChange={onChange}
      sectionTitle="Atividades"
      quantityLabel="Pax"
      quantityPlaceholder="Ex: 4"
      tipoFornecedor="atividade"
    />
  )
}
