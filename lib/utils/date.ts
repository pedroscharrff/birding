/**
 * Converte uma string de data no formato "YYYY-MM-DD" (ou um objeto Date) para
 * um objeto Date sem o problema de timezone que ocorre com `new Date("YYYY-MM-DD")`.
 *
 * O problema: `new Date("2026-02-20")` é interpretado como UTC midnight
 * (`2026-02-20T00:00:00.000Z`). Em fusos negativos (ex: Brasil UTC-3/-4),
 * ao salvar no banco PostgreSQL (coluna @db.Date), isso pode virar o dia anterior.
 *
 * A solução: adicionar `T12:00:00Z` para usar o meio-dia UTC, que nunca cruza
 * a meia-noite de nenhum fuso horário entre UTC-12 e UTC+12.
 *
 * @param dateInput - String "YYYY-MM-DD" ou objeto Date
 */
export function parseLocalDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return dateInput

  if (!dateInput) throw new Error('Data inválida: valor vazio')

  // Se já tem informação de hora/timezone, use direto
  if (dateInput.includes('T') || dateInput.includes(' ')) {
    return new Date(dateInput)
  }

  // Formato YYYY-MM-DD: adiciona T12:00:00Z para evitar drift de fuso
  return new Date(`${dateInput}T12:00:00.000Z`)
}

/**
 * Formata uma data para uso em `<input type="date">` (formato YYYY-MM-DD),
 * usando sempre o UTC para extrair o dia correto.
 *
 * O problema: `new Date("2026-02-14T00:00:00.000Z")` em um browser UTC-4
 * representa "2026-02-13 às 20:00:00". Ao formatar com métodos locais
 * (getFullYear, getMonth, getDate ou date-fns format()), o resultado é
 * "2026-02-13" — um dia antes do correto.
 *
 * A solução: usar `.toISOString().substring(0, 10)` que sempre extrai
 * a data em UTC, garantindo o dia correto independente do fuso do browser.
 *
 * @param dateInput - ISO string ou objeto Date vindo da API
 * @returns string no formato "YYYY-MM-DD" para usar em value de input[type=date]
 */
export function formatDateForInput(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return ''
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return ''
  return d.toISOString().substring(0, 10)
}

/**
 * Formata uma data para exibição textual (ex: "14 de fevereiro de 2026"),
 * usando UTC para extrair o dia correto, evitando o mesmo drift de fuso.
 *
 * @param dateInput - ISO string ou objeto Date vindo da API
 * @returns Date object com a data correta em UTC (para usar com date-fns)
 */
export function parseDateUTC(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null
  // Extrai YYYY-MM-DD em UTC e reconstrói com meio-dia UTC para exibição estável
  const iso = typeof dateInput === 'string' ? dateInput : dateInput.toISOString()
  const datePart = iso.substring(0, 10) // "YYYY-MM-DD"
  return new Date(`${datePart}T12:00:00.000Z`)
}
