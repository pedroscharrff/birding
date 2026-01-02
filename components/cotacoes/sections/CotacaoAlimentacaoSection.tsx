"use client"

import { CotacaoItemsSection, CotacaoItem } from "./CotacaoItemsSection"

interface CotacaoAlimentacaoSectionProps {
  items: CotacaoItem[]
  onChange: (items: CotacaoItem[]) => void
}

export function CotacaoAlimentacaoSection({ items, onChange }: CotacaoAlimentacaoSectionProps) {
  return (
    <CotacaoItemsSection
      items={items}
      onChange={onChange}
      sectionTitle="Alimentação"
      quantityLabel="Refeições"
      quantityPlaceholder="Ex: 6"
    />
  )
}
