"use client"

import { CotacaoItemsSection, CotacaoItem } from "./CotacaoItemsSection"

interface CotacaoHospedagensSectionProps {
  items: CotacaoItem[]
  onChange: (items: CotacaoItem[]) => void
}

export function CotacaoHospedagensSection({ items, onChange }: CotacaoHospedagensSectionProps) {
  return (
    <CotacaoItemsSection
      items={items}
      onChange={onChange}
      sectionTitle="Hospedagens"
      quantityLabel="Noites"
      quantityPlaceholder="Ex: 3"
      tipoFornecedor="hotelaria"
    />
  )
}
