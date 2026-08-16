/** "3h12" — a forma como ele fala das horas de estudo, não "192 min". */
export function duracao(minutos: number): string {
  const m = Math.max(0, Math.round(minutos))
  const h = Math.floor(m / 60)
  const resto = m % 60
  if (h === 0) return `${resto}min`
  if (resto === 0) return `${h}h`
  return `${h}h${String(resto).padStart(2, '0')}`
}

/** Versão longa, para leitura corrida. */
export function duracaoExtensa(minutos: number): string {
  const m = Math.max(0, Math.round(minutos))
  const h = Math.floor(m / 60)
  const resto = m % 60
  const partes: string[] = []
  if (h) partes.push(`${h} hora${h > 1 ? 's' : ''}`)
  if (resto) partes.push(`${resto} minuto${resto > 1 ? 's' : ''}`)
  return partes.join(' e ') || '0 minuto'
}

/** Cronômetro: sempre HH:MM:SS para a largura não pular. */
export function relogio(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const seg = s % 60
  return [h, m, seg].map((n) => String(n).padStart(2, '0')).join(':')
}

export function porcento(valor: number, casas = 0): string {
  if (!Number.isFinite(valor)) return '—'
  return `${valor.toFixed(casas).replace('.', ',')}%`
}

export function numero(valor: number, casas = 0): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

export function taxa(acertos: number, total: number): number | null {
  if (!total) return null
  return (acertos / total) * 100
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? ''
}

export function saudacao(d = new Date()): string {
  const h = d.getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}
