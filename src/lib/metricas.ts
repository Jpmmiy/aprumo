import { diasEntre, hoje, inicioDaSemana, intervaloDeDias, paraDataLocal, somarDias, ultimosDias } from './datas'
import type { Dados, Materia, Questao, Redacao, Sessao, TipoEstudo } from './tipos'

export const diaDaSessao = (s: Sessao) => paraDataLocal(new Date(s.inicio))

export function sessoesNoIntervalo(sessoes: Sessao[], de: string, ate: string): Sessao[] {
  return sessoes.filter((s) => {
    const d = diaDaSessao(s)
    return d >= de && d <= ate
  })
}

export function somaMinutos(sessoes: Sessao[], tipo?: TipoEstudo): number {
  return sessoes.reduce((t, s) => (tipo && s.tipo !== tipo ? t : t + s.minutos), 0)
}

export interface PontoDiario {
  data: string
  ativo: number
  passivo: number
  total: number
}

export function serieDiaria(sessoes: Sessao[], dias: string[]): PontoDiario[] {
  const mapa = new Map<string, PontoDiario>(
    dias.map((d) => [d, { data: d, ativo: 0, passivo: 0, total: 0 }]),
  )
  for (const s of sessoes) {
    const ponto = mapa.get(diaDaSessao(s))
    if (!ponto) continue
    ponto[s.tipo] += s.minutos
    ponto.total += s.minutos
  }
  return dias.map((d) => mapa.get(d)!)
}

export interface LinhaMateria {
  materia: Materia
  minutos: number
  ativo: number
  passivo: number
  sessoes: number
  questoes: number
  acertos: number
  /** null quando ele ainda não fez questão nenhuma da matéria. */
  taxa: number | null
  /** Dias desde o último estudo; null se nunca estudou. */
  diasSemEstudar: number | null
}

export function porMateria(
  materias: Materia[],
  sessoes: Sessao[],
  questoes: Questao[],
  todasAsSessoes: Sessao[] = sessoes,
): LinhaMateria[] {
  const ultimoEstudo = new Map<string, string>()
  for (const s of todasAsSessoes) {
    // Sessão de cursinho corrido não tem matéria: entra no total, mas não
    // conta como "estudei essa matéria hoje".
    if (!s.materia_id) continue
    const d = diaDaSessao(s)
    const atual = ultimoEstudo.get(s.materia_id)
    if (!atual || d > atual) ultimoEstudo.set(s.materia_id, d)
  }

  return materias.map((materia) => {
    const minhas = sessoes.filter((s) => s.materia_id === materia.id)
    const minhasQ = questoes.filter((q) => q.materia_id === materia.id)
    const total = minhasQ.reduce((t, q) => t + q.total, 0)
    const acertos = minhasQ.reduce((t, q) => t + q.acertos, 0)
    const ultimo = ultimoEstudo.get(materia.id)

    return {
      materia,
      minutos: somaMinutos(minhas),
      ativo: somaMinutos(minhas, 'ativo'),
      passivo: somaMinutos(minhas, 'passivo'),
      sessoes: minhas.length,
      questoes: total,
      acertos,
      taxa: total ? (acertos / total) * 100 : null,
      diasSemEstudar: ultimo ? diasEntre(ultimo, hoje()) : null,
    }
  })
}

/** Dias seguidos com pelo menos um minuto de estudo, contando de hoje para trás. */
export function sequencia(sessoes: Sessao[]): { atual: number; recorde: number } {
  const dias = new Set(sessoes.map(diaDaSessao))
  if (!dias.size) return { atual: 0, recorde: 0 }

  let atual = 0
  // Ainda é cedo hoje? A sequência não quebra até o dia virar.
  let cursor = dias.has(hoje()) ? hoje() : somarDias(hoje(), -1)
  while (dias.has(cursor)) {
    atual++
    cursor = somarDias(cursor, -1)
  }

  const ordenados = [...dias].sort()
  let recorde = 0
  let corrida = 0
  let anterior: string | null = null
  for (const d of ordenados) {
    corrida = anterior && diasEntre(anterior, d) === 1 ? corrida + 1 : 1
    recorde = Math.max(recorde, corrida)
    anterior = d
  }
  return { atual, recorde: Math.max(recorde, atual) }
}

export interface ResumoPeriodo {
  minutos: number
  ativo: number
  passivo: number
  pctAtivo: number | null
  questoes: number
  acertos: number
  taxa: number | null
  diasEstudados: number
  totalDeDias: number
  mediaDiaria: number
}

export function resumo(dados: Dados, de: string, ate: string): ResumoPeriodo {
  const sessoes = sessoesNoIntervalo(dados.sessoes, de, ate)
  const questoes = dados.questoes.filter((q) => q.data >= de && q.data <= ate)
  const minutos = somaMinutos(sessoes)
  const ativo = somaMinutos(sessoes, 'ativo')
  const total = questoes.reduce((t, q) => t + q.total, 0)
  const acertos = questoes.reduce((t, q) => t + q.acertos, 0)
  const totalDeDias = intervaloDeDias(de, ate).length

  return {
    minutos,
    ativo,
    passivo: minutos - ativo,
    pctAtivo: minutos ? (ativo / minutos) * 100 : null,
    questoes: total,
    acertos,
    taxa: total ? (acertos / total) * 100 : null,
    diasEstudados: new Set(sessoes.map(diaDaSessao)).size,
    totalDeDias,
    mediaDiaria: totalDeDias ? minutos / totalDeDias : 0,
  }
}

export interface EvolucaoRedacao {
  data: string
  nota: number
  /** Normalizado em % da escala da banca, que é o único jeito de comparar as três. */
  pct: number
}

export function evolucaoRedacoes(redacoes: Redacao[]): Record<string, EvolucaoRedacao[]> {
  const saida: Record<string, EvolucaoRedacao[]> = {}
  for (const r of [...redacoes].sort((a, b) => a.data.localeCompare(b.data))) {
    ;(saida[r.banca] ??= []).push({
      data: r.data,
      nota: r.nota,
      pct: r.nota_max ? (r.nota / r.nota_max) * 100 : 0,
    })
  }
  return saida
}

// ---------------------------------------------------------------------------
// Diagnóstico — a parte que responde "onde estou errado".
// A regra: só fala quando tem dado suficiente, e sempre termina com uma ação.
// ---------------------------------------------------------------------------

export type Gravidade = 'critico' | 'atencao' | 'bom'

export interface Diagnostico {
  id: string
  gravidade: Gravidade
  titulo: string
  detalhe: string
  acao: string
}

export function diagnosticar(dados: Dados): Diagnostico[] {
  const achados: Diagnostico[] = []
  const de = somarDias(hoje(), -27)
  const sessoes = sessoesNoIntervalo(dados.sessoes, de, hoje())
  const questoes = dados.questoes.filter((q) => q.data >= de)
  const ativas = dados.materias.filter((m) => !m.arquivada)
  const linhas = porMateria(ativas, sessoes, questoes, dados.sessoes)
  const totalMin = somaMinutos(sessoes)

  // 1. Estudo passivo demais.
  if (totalMin >= 240) {
    const pctAtivo = (somaMinutos(sessoes, 'ativo') / totalMin) * 100
    const meta = dados.perfil.meta_ativo_pct
    if (pctAtivo < meta - 10) {
      achados.push({
        id: 'passivo',
        gravidade: pctAtivo < meta - 25 ? 'critico' : 'atencao',
        titulo: `Só ${pctAtivo.toFixed(0)}% do seu tempo é estudo ativo`,
        detalhe: `Sua meta é ${meta}%. Assistir aula e ler dão a sensação de que o conteúdo entrou, mas quem fixa é a parte em que você tenta lembrar sem olhar.`,
        acao: 'Troque um bloco de leitura por exercícios da mesma matéria.',
      })
    } else if (pctAtivo >= meta) {
      achados.push({
        id: 'ativo-ok',
        gravidade: 'bom',
        titulo: `${pctAtivo.toFixed(0)}% do seu tempo é estudo ativo`,
        detalhe: `Está dentro da meta de ${meta}%. É o indicador que mais se correlaciona com nota subindo.`,
        acao: 'Mantenha o desenho da semana.',
      })
    }
  }

  // 2. Muito tempo investido com pouco retorno.
  const comDados = linhas.filter((l) => l.questoes >= 20 && l.minutos >= 60)
  if (comDados.length >= 2) {
    const taxaGeral =
      comDados.reduce((t, l) => t + l.acertos, 0) / comDados.reduce((t, l) => t + l.questoes, 0) * 100
    const pior = [...comDados].sort((a, b) => (a.taxa ?? 0) - (b.taxa ?? 0))[0]
    const mediaMin = comDados.reduce((t, l) => t + l.minutos, 0) / comDados.length

    if (pior.taxa !== null && pior.taxa < taxaGeral - 8 && pior.minutos >= mediaMin) {
      achados.push({
        id: `esforco-sem-retorno-${pior.materia.id}`,
        gravidade: 'critico',
        titulo: `${pior.materia.nome} consome tempo e não devolve acerto`,
        detalhe: `Você acerta ${pior.taxa.toFixed(0)}% em ${pior.materia.nome}, contra ${taxaGeral.toFixed(0)}% na média — mesmo dedicando tempo acima do normal. O problema costuma ser o método, não a quantidade.`,
        acao: 'Refaça as questões que errou antes de avançar no conteúdo novo.',
      })
    }
  }

  // 3. Matéria abandonada.
  const abandonadas = linhas
    .filter((l) => l.diasSemEstudar !== null && l.diasSemEstudar >= 10)
    .sort((a, b) => (b.diasSemEstudar ?? 0) - (a.diasSemEstudar ?? 0))
  if (abandonadas.length) {
    const pior = abandonadas[0]
    achados.push({
      id: `abandono-${pior.materia.id}`,
      gravidade: (pior.diasSemEstudar ?? 0) >= 21 ? 'critico' : 'atencao',
      titulo: `${pior.materia.nome} está há ${pior.diasSemEstudar} dias sem nenhum registro`,
      detalhe:
        abandonadas.length > 1
          ? `E não é a única: ${abandonadas.length} matérias passaram de dez dias parada.`
          : 'Matéria parada é a que mais custa caro na virada do ano, porque o esquecimento é silencioso.',
      acao: `Encaixe 30 minutos de ${pior.materia.nome} nos próximos dois dias.`,
    })
  }

  // 4. Constância.
  const ultimos14 = ultimosDias(14)
  const estudados = new Set(sessoesNoIntervalo(dados.sessoes, ultimos14[0], hoje()).map(diaDaSessao)).size
  if (dados.sessoes.length >= 5) {
    if (estudados <= 7) {
      achados.push({
        id: 'constancia',
        gravidade: estudados <= 4 ? 'critico' : 'atencao',
        titulo: `Você estudou em ${estudados} dos últimos 14 dias`,
        detalhe:
          'Sessões longas e espaçadas rendem menos que sessões curtas e diárias — a curva de esquecimento não tira fim de semana.',
        acao: 'Marque um piso baixo e inegociável: 25 minutos, todo dia, mesmo nos ruins.',
      })
    } else if (estudados >= 12) {
      achados.push({
        id: 'constancia-ok',
        gravidade: 'bom',
        titulo: `${estudados} dos últimos 14 dias com estudo registrado`,
        detalhe: 'Essa é a métrica que mais separa quem passa de quem repete o ciclo.',
        acao: 'Continue.',
      })
    }
  }

  // 5. Volume de questões na semana.
  const semana = inicioDaSemana(hoje())
  const qSemana = dados.questoes.filter((q) => q.data >= semana).reduce((t, q) => t + q.total, 0)
  const metaQ = dados.perfil.meta_questoes_semana
  if (metaQ > 0 && dados.questoes.length >= 3) {
    const diasCorridos = diasEntre(semana, hoje()) + 1
    const esperado = (metaQ / 7) * diasCorridos
    if (qSemana < esperado * 0.6) {
      achados.push({
        id: 'volume-questoes',
        gravidade: 'atencao',
        titulo: `${qSemana} questões nesta semana, contra ${Math.round(esperado)} esperadas até aqui`,
        detalhe: `Sua meta é ${metaQ} por semana. Questão é o único lugar onde o erro aparece antes da prova.`,
        acao: 'Feche o dia com um bloco fixo de questões, não com leitura.',
      })
    }
  }

  // 6. Redação esquecida.
  if (dados.redacoes.length) {
    const ultima = [...dados.redacoes].sort((a, b) => b.data.localeCompare(a.data))[0]
    const dias = diasEntre(ultima.data, hoje())
    if (dias >= 21) {
      achados.push({
        id: 'redacao-parada',
        gravidade: dias >= 45 ? 'critico' : 'atencao',
        titulo: `Sua última redação foi há ${dias} dias`,
        detalhe: 'Redação é a nota que mais pesa por hora estudada, e a que mais enferruja sem prática.',
        acao: 'Escreva uma nesta semana, cronometrada.',
      })
    }
  }

  const ordem: Record<Gravidade, number> = { critico: 0, atencao: 1, bom: 2 }
  return achados.sort((a, b) => ordem[a.gravidade] - ordem[b.gravidade])
}

/** Pontos do mapa esforço × resultado: horas na matéria contra taxa de acerto. */
export interface PontoEsforco {
  materia: Materia
  horas: number
  taxa: number
  questoes: number
}

export function mapaEsforcoResultado(linhas: LinhaMateria[]): PontoEsforco[] {
  return linhas
    .filter((l) => l.taxa !== null && l.questoes >= 10)
    .map((l) => ({ materia: l.materia, horas: l.minutos / 60, taxa: l.taxa!, questoes: l.questoes }))
}
