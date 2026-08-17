import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ESCALAS_PADRAO, MATERIAS_INICIAIS } from '@/lib/constantes'
import type { Dados, Materia, Perfil } from '@/lib/tipos'

/**
 * Onde os dados moram.
 *
 * Hoje: no próprio aparelho, em localStorage. Sem conta, sem senha, sem
 * servidor — o app abre e funciona. Todas as telas falam com esta camada e
 * nunca com o armazenamento direto, então trocar isto por um banco na nuvem
 * (Lovable Cloud) é mexer só neste arquivo. Ver LOVABLE.md.
 */

const CHAVE = 'aprumo:dados:v1'

export type ChaveLista =
  | 'materias'
  | 'sessoes'
  | 'questoes'
  | 'redacoes'
  | 'aulas'
  | 'tarefas'
  | 'anotacoes'
  | 'provas'

const LISTAS: ChaveLista[] = [
  'materias',
  'sessoes',
  'questoes',
  'redacoes',
  'aulas',
  'tarefas',
  'anotacoes',
  'provas',
]

type Linha = Record<string, unknown> & { id: string }

const PERFIL_VAZIO: Perfil = {
  nome: '',
  meta_min_dia: 240,
  meta_questoes_semana: 300,
  meta_ativo_pct: 60,
  escalas: { ...ESCALAS_PADRAO },
}

const DADOS_VAZIOS: Dados = {
  perfil: PERFIL_VAZIO,
  materias: [],
  sessoes: [],
  questoes: [],
  redacoes: [],
  aulas: [],
  tarefas: [],
  anotacoes: [],
  provas: [],
}

const num = (v: unknown) => Number(v ?? 0)
const txt = (v: unknown) => String(v ?? '')

/** Cada lista tem uma ordem canônica, aplicada de novo depois de toda escrita. */
const ORDENADORES: Record<ChaveLista, (a: Linha, b: Linha) => number> = {
  materias: (a, b) => num(a.ordem) - num(b.ordem) || txt(a.nome).localeCompare(txt(b.nome), 'pt-BR'),
  sessoes: (a, b) => txt(b.inicio).localeCompare(txt(a.inicio)),
  questoes: (a, b) => txt(b.data).localeCompare(txt(a.data)),
  redacoes: (a, b) => txt(b.data).localeCompare(txt(a.data)),
  aulas: (a, b) => num(a.dia) - num(b.dia) || txt(a.inicio).localeCompare(txt(b.inicio)),
  tarefas: (a, b) => Number(!!a.concluida) - Number(!!b.concluida) || num(a.ordem) - num(b.ordem),
  anotacoes: (a, b) =>
    Number(!!b.fixada) - Number(!!a.fixada) || txt(b.atualizada_em).localeCompare(txt(a.atualizada_em)),
  provas: (a, b) => txt(a.data).localeCompare(txt(b.data)),
}

function ordenar<T>(chave: ChaveLista, lista: readonly T[]): T[] {
  return [...(lista as readonly Linha[])].sort(ORDENADORES[chave]) as unknown as T[]
}

function novoId(): string {
  // randomUUID só existe em contexto seguro; o fallback cobre http://localhost
  // em navegador antigo e qualquer webview mais pobre.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Aceita qualquer objeto e devolve um Dados completo, descartando o que não
 * reconhece. Serve para o que veio do localStorage e para o que veio de um
 * arquivo de backup — os dois podem estar velhos ou corrompidos.
 */
function normalizar(bruto: unknown): Dados {
  const cru = (bruto ?? {}) as Partial<Record<string, unknown>>
  const saida: Dados = { ...DADOS_VAZIOS }

  for (const chave of LISTAS) {
    const lista = Array.isArray(cru[chave]) ? (cru[chave] as Linha[]) : []
    const validas = lista.filter((l) => l && typeof l === 'object' && typeof l.id === 'string')
    ;(saida as unknown as Record<string, unknown>)[chave] = ordenar(chave, validas)
  }

  const perfil = (cru.perfil ?? {}) as Partial<Perfil>
  saida.perfil = {
    ...PERFIL_VAZIO,
    ...perfil,
    escalas: { ...ESCALAS_PADRAO, ...(perfil.escalas ?? {}) },
  }
  return saida
}

function ler(): { dados: Dados; primeiraVez: boolean } {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return { dados: DADOS_VAZIOS, primeiraVez: true }
    return { dados: normalizar(JSON.parse(bruto)), primeiraVez: false }
  } catch {
    // Dado ilegível não pode virar tela branca: começa limpo e segue.
    return { dados: DADOS_VAZIOS, primeiraVez: true }
  }
}

/** Primeira abertura: as nove matérias já vêm prontas, para nada começar vazio. */
function semear(): Dados {
  return {
    ...DADOS_VAZIOS,
    materias: MATERIAS_INICIAIS.map((m, i) => ({
      id: novoId(),
      nome: m.nome,
      cor: m.cor,
      ordem: i,
      arquivada: false,
    })),
  }
}

interface ContextoDados {
  dados: Dados
  carregando: boolean
  erro: string | null
  salvando: boolean
  recarregar: () => Promise<void>
  salvar: <T extends Linha>(chave: ChaveLista, registro: Partial<T>) => Promise<T>
  remover: (chave: ChaveLista, id: string) => Promise<void>
  salvarPerfil: (mudancas: Partial<Perfil>) => Promise<void>
  materiaPorId: (id: string | null | undefined) => Materia | undefined
  /** Restaura um backup por cima do que existe hoje. */
  importar: (bruto: unknown) => void
}

const Ctx = createContext<ContextoDados | null>(null)

export function ProvedorDados({ children }: { children: ReactNode }) {
  // Inicialização preguiçosa: os dados já existem no primeiro render, então não
  // há um instante de estado vazio. Isso não é só elegância — carregar dentro
  // de um efeito fazia a gravação salvar o vazio antes da leitura terminar, e a
  // releitura seguinte apagava as matérias que acabaram de ser semeadas.
  const [dados, setDados] = useState<Dados>(() => {
    const { dados: guardados, primeiraVez } = ler()
    return primeiraVez ? semear() : guardados
  })
  const [erro, setErro] = useState<string | null>(null)

  // Grava a cada mudança, inclusive na montagem — é o que registra a semeadura.
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(dados))
      setErro(null)
    } catch {
      setErro('O navegador recusou salvar — o armazenamento local pode estar cheio ou bloqueado.')
    }
  }, [dados])

  // Duas abas abertas no mesmo navegador continuam mostrando a mesma coisa.
  useEffect(() => {
    const aoMudar = (e: StorageEvent) => {
      if (e.key !== CHAVE || !e.newValue) return
      try {
        setDados(normalizar(JSON.parse(e.newValue)))
      } catch {
        /* aba irmã gravou algo ilegível; melhor manter o que está na tela */
      }
    }
    window.addEventListener('storage', aoMudar)
    return () => window.removeEventListener('storage', aoMudar)
  }, [])

  const salvar = useCallback(async <T extends Linha>(chave: ChaveLista, registro: Partial<T>): Promise<T> => {
    const agora = new Date().toISOString()
    let salva!: T

    setDados((atual) => {
      const lista = (atual as unknown as Record<string, Linha[]>)[chave]
      const existente = registro.id ? lista.find((l) => l.id === registro.id) : undefined

      // Sem id é registro novo; com id, o update só toca os campos enviados.
      const linha = existente
        ? { ...existente, ...registro }
        : {
            ...(chave === 'tarefas' ? { criada_em: agora, concluida: false, ordem: 0 } : {}),
            ...(chave === 'anotacoes' ? { criada_em: agora, atualizada_em: agora, fixada: false } : {}),
            ...registro,
            id: registro.id ?? novoId(),
          }

      salva = linha as T
      const semAntiga = lista.filter((l) => l.id !== salva.id)
      return { ...atual, [chave]: ordenar(chave, [...semAntiga, salva]) }
    })

    return salva
  }, [])

  const remover = useCallback(async (chave: ChaveLista, id: string) => {
    setDados((atual) => {
      const lista = (atual as unknown as Record<string, Linha[]>)[chave]
      const proximo = { ...atual, [chave]: lista.filter((l) => l.id !== id) }

      // O banco fazia isso com chave estrangeira: apagar a matéria levava junto
      // as sessões e questões dela, e soltava as referências das outras listas.
      if (chave === 'materias') {
        proximo.sessoes = proximo.sessoes.filter((s) => s.materia_id !== id)
        proximo.questoes = proximo.questoes.filter((q) => q.materia_id !== id)
        proximo.aulas = proximo.aulas.map((a) => (a.materia_id === id ? { ...a, materia_id: null } : a))
        proximo.tarefas = proximo.tarefas.map((t) => (t.materia_id === id ? { ...t, materia_id: null } : t))
        proximo.anotacoes = proximo.anotacoes.map((a) => (a.materia_id === id ? { ...a, materia_id: null } : a))
      }
      return proximo
    })
  }, [])

  const salvarPerfil = useCallback(async (mudancas: Partial<Perfil>) => {
    setDados((atual) => ({ ...atual, perfil: { ...atual.perfil, ...mudancas } }))
  }, [])

  const recarregar = useCallback(async () => {
    setDados(ler().dados)
  }, [])

  const importar = useCallback((bruto: unknown) => {
    setDados(normalizar(bruto))
  }, [])

  const indice = useMemo(() => new Map(dados.materias.map((m) => [m.id, m])), [dados.materias])
  const materiaPorId = useCallback((id: string | null | undefined) => (id ? indice.get(id) : undefined), [indice])

  const valor = useMemo<ContextoDados>(
    () => ({
      dados,
      carregando: false,
      erro,
      salvando: false,
      recarregar,
      salvar,
      remover,
      salvarPerfil,
      materiaPorId,
      importar,
    }),
    [dados, erro, recarregar, salvar, remover, salvarPerfil, materiaPorId, importar],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useDados() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDados precisa estar dentro de ProvedorDados')
  return ctx
}
