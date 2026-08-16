/**
 * Datas do app são sempre "YYYY-MM-DD" no fuso local. Nunca `toISOString()`
 * para pegar o dia: depois das 21h no Brasil isso joga o registro pro dia
 * seguinte, e uma virada de estudo de madrugada apareceria no dia errado.
 */

export function paraDataLocal(d: Date): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function hoje(): string {
  return paraDataLocal(new Date())
}

export function deDataLocal(s: string): Date {
  const [ano, mes, dia] = s.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

export function somarDias(s: string, n: number): string {
  const d = deDataLocal(s)
  d.setDate(d.getDate() + n)
  return paraDataLocal(d)
}

export function diasEntre(de: string, ate: string): number {
  const ms = deDataLocal(ate).getTime() - deDataLocal(de).getTime()
  return Math.round(ms / 86400000)
}

/** Semana começa na segunda — é assim que a semana de estudo é vivida. */
export function inicioDaSemana(s: string): string {
  const d = deDataLocal(s)
  const dia = d.getDay()
  const recuo = dia === 0 ? 6 : dia - 1
  return somarDias(s, -recuo)
}

export function intervaloDeDias(de: string, ate: string): string[] {
  const dias: string[] = []
  let atual = de
  let guarda = 0
  while (atual <= ate && guarda++ < 4000) {
    dias.push(atual)
    atual = somarDias(atual, 1)
  }
  return dias
}

export function ultimosDias(n: number, fim = hoje()): string[] {
  return intervaloDeDias(somarDias(fim, -(n - 1)), fim)
}

export function diaDaSemana(s: string): number {
  return deDataLocal(s).getDay()
}

const fmtCurto = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const fmtMedio = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' })
const fmtCompleto = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const fmtMes = new Intl.DateTimeFormat('pt-BR', { month: 'short' })

export const formatarCurto = (s: string) => fmtCurto.format(deDataLocal(s))
export const formatarMedio = (s: string) => fmtMedio.format(deDataLocal(s))
export const formatarCompleto = (s: string) => fmtCompleto.format(deDataLocal(s))
export const formatarMes = (s: string) => fmtMes.format(deDataLocal(s)).replace('.', '')

export function rotuloRelativo(s: string): string | null {
  const d = diasEntre(hoje(), s)
  if (d === 0) return 'hoje'
  if (d === 1) return 'amanhã'
  if (d === -1) return 'ontem'
  if (d > 1 && d <= 6) return `em ${d} dias`
  if (d < -1 && d >= -6) return `há ${-d} dias`
  return null
}

/** "07:30" → 450 minutos desde a meia-noite. */
export function horaParaMinutos(h: string): number {
  const [hh, mm] = h.split(':').map(Number)
  return (hh || 0) * 60 + (mm || 0)
}

export function minutosParaHora(m: number): string {
  const mm = ((m % 1440) + 1440) % 1440
  return `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`
}

export function agoraEmMinutos(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}
