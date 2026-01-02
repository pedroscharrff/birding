"use client"

import { CotacaoItemsSection, CotacaoItem } from "./CotacaoItemsSection"

interface CotacaoTransportesSectionProps {
  items: CotacaoItem[]
  onChange: (items: CotacaoItem[]) => void
}

export function CotacaoTransportesSection({ items, onChange }: CotacaoTransportesSectionProps) {
  return (
    <CotacaoItemsSection
      items={items}
      onChange={onChange}
      sectionTitle="Transportes"
      quantityLabel="Quantidade"
      quantityPlaceholder="Ex: 1"
      tipoFornecedor="transporte"
    />
  )
}
