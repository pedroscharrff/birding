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
