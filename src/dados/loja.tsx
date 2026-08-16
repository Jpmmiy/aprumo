import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { ESCALAS_PADRAO, MATERIAS_INICIAIS } from '@/lib/constantes'
import type { Dados, Materia, Perfil } from '@/lib/tipos'
import { useAuth } from './auth'

export type ChaveLista =
  | 'materias'
  | 'sessoes'
  | 'questoes'
  | 'redacoes'
  | 'aulas'
  | 'tarefas'
  | 'anotacoes'
  | 'provas'

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

/** As listas vêm do PostgREST sem tipo; a ordenação é o único ponto que precisa disso. */
function ordenar<T>(chave: ChaveLista, lista: readonly T[]): T[] {
  return [...(lista as readonly Linha[])].sort(ORDENADORES[chave]) as unknown as T[]
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
}

const Ctx = createContext<ContextoDados | null>(null)

export function ProvedorDados({ children }: { children: ReactNode }) {
  const { sessao } = useAuth()
  const userId = sessao?.user.id ?? null
  const [dados, setDados] = useState<Dados>(DADOS_VAZIOS)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const semeando = useRef(false)

  const carregar = useCallback(async () => {
    if (!userId) {
      setDados(DADOS_VAZIOS)
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const listas: ChaveLista[] = [
        'materias',
        'sessoes',
        'questoes',
        'redacoes',
        'aulas',
        'tarefas',
        'anotacoes',
        'provas',
      ]
      const [perfilRes, ...respostas] = await Promise.all([
        supabase.from('perfis').select('*').eq('user_id', userId).maybeSingle(),
        ...listas.map((l) => supabase.from(l).select('*')),
      ])

      if (perfilRes.error) throw perfilRes.error
      for (const r of respostas) if (r.error) throw r.error

      const proximo: Dados = { ...DADOS_VAZIOS }
      listas.forEach((chave, i) => {
        const linhas = (respostas[i].data ?? []) as Linha[]
        ;(proximo as unknown as Record<string, unknown>)[chave] = ordenar(chave, linhas)
      })

      let perfil = perfilRes.data as Perfil | null

      // Primeira entrada: cria o perfil e semeia as matérias, para o app nunca
      // abrir numa tela vazia sem explicação.
      if (!perfil && !semeando.current) {
        semeando.current = true
        const nome = (sessao?.user.user_metadata?.nome as string) ?? ''
        const { data: novoPerfil, error: erroPerfil } = await supabase
          .from('perfis')
          .insert({ user_id: userId, nome, escalas: ESCALAS_PADRAO })
          .select()
          .single()
        if (erroPerfil) throw erroPerfil
        perfil = novoPerfil as Perfil

        if (!proximo.materias.length) {
          const { data: novas, error: erroMat } = await supabase
            .from('materias')
            .insert(
              MATERIAS_INICIAIS.map((m, i) => ({ user_id: userId, nome: m.nome, cor: m.cor, ordem: i })),
            )
            .select()
          if (erroMat) throw erroMat
          proximo.materias = ordenar('materias', (novas ?? []) as Materia[])
        }
        semeando.current = false
      }

      proximo.perfil = { ...PERFIL_VAZIO, ...(perfil ?? {}), escalas: { ...ESCALAS_PADRAO, ...(perfil?.escalas ?? {}) } }
      setDados(proximo)
    } catch (e) {
      setErro((e as { message?: string }).message ?? 'Não consegui carregar seus dados.')
    } finally {
      setCarregando(false)
    }
  }, [userId, sessao?.user.user_metadata?.nome])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const salvar = useCallback(
    async <T extends Linha>(chave: ChaveLista, registro: Partial<T>): Promise<T> => {
      if (!userId) throw new Error('Sem sessão ativa.')
      setSalvando(true)
      try {
        const { id, ...campos } = registro as Partial<Linha>
        // Update parcial só toca as colunas enviadas; insert precisa do dono.
        const consulta = id
          ? supabase.from(chave).update(campos).eq('id', id).select().single()
          : supabase.from(chave).insert({ ...campos, user_id: userId }).select().single()

        const { data, error } = await consulta
        if (error) throw error

        const linha = data as T
        setDados((atual) => {
          const lista = (atual as unknown as Record<string, Linha[]>)[chave]
          const semAntiga = lista.filter((l) => l.id !== linha.id)
          return { ...atual, [chave]: ordenar(chave, [...semAntiga, linha]) }
        })
        return linha
      } finally {
        setSalvando(false)
      }
    },
    [userId],
  )

  const remover = useCallback(async (chave: ChaveLista, id: string) => {
    setSalvando(true)
    try {
      const { error } = await supabase.from(chave).delete().eq('id', id)
      if (error) throw error
      setDados((atual) => {
        const lista = (atual as unknown as Record<string, Linha[]>)[chave]
        return { ...atual, [chave]: lista.filter((l) => l.id !== id) }
      })
    } finally {
      setSalvando(false)
    }
  }, [])

  const salvarPerfil = useCallback(
    async (mudancas: Partial<Perfil>) => {
      if (!userId) throw new Error('Sem sessão ativa.')
      setSalvando(true)
      try {
        const { error } = await supabase.from('perfis').update(mudancas).eq('user_id', userId)
        if (error) throw error
        setDados((atual) => ({ ...atual, perfil: { ...atual.perfil, ...mudancas } }))
      } finally {
        setSalvando(false)
      }
    },
    [userId],
  )

  const indice = useMemo(() => new Map(dados.materias.map((m) => [m.id, m])), [dados.materias])
  const materiaPorId = useCallback((id: string | null | undefined) => (id ? indice.get(id) : undefined), [indice])

  const valor = useMemo<ContextoDados>(
    () => ({ dados, carregando, erro, salvando, recarregar: carregar, salvar, remover, salvarPerfil, materiaPorId }),
    [dados, carregando, erro, salvando, carregar, salvar, remover, salvarPerfil, materiaPorId],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useDados() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDados precisa estar dentro de ProvedorDados')
  return ctx
}
