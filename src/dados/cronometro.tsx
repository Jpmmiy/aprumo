import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { relogio } from '@/lib/formato'

const CHAVE = 'aprumo:cronometro'

interface EstadoCrono {
  materiaId: string | null
  atividade: string
  assunto: string
  /** Instante em que o trecho atual começou; null quando está pausado. */
  iniciadoEm: number | null
  /** Milissegundos já acumulados nos trechos anteriores. */
  acumulado: number
  /** Meta em minutos, quando ele define quanto quer estudar. */
  alvoMin: number | null
  /** Marca se o alvo já foi anunciado, para não avisar a cada segundo. */
  avisado: boolean
}

const INICIAL: EstadoCrono = {
  materiaId: null,
  atividade: 'exercicios',
  assunto: '',
  iniciadoEm: null,
  acumulado: 0,
  alvoMin: null,
  avisado: false,
}

function ler(): EstadoCrono {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return INICIAL
    return { ...INICIAL, ...(JSON.parse(bruto) as EstadoCrono) }
  } catch {
    return INICIAL
  }
}

interface ContextoCrono {
  estado: EstadoCrono
  /** Segundos decorridos — recalculado do relógio, nunca somado a cada tick. */
  segundos: number
  minutos: number
  rodando: boolean
  ativo: boolean
  progressoAlvo: number | null
  definir: (mudancas: Partial<EstadoCrono>) => void
  iniciar: () => void
  pausar: () => void
  zerar: () => void
}

const Ctx = createContext<ContextoCrono | null>(null)

/** Um tom curto e grave — aviso, não alarme. */
function tocarAviso() {
  try {
    const Contexto = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Contexto) return
    const ctx = new Contexto()
    const osc = ctx.createOscillator()
    const ganho = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 392
    ganho.gain.setValueAtTime(0.0001, ctx.currentTime)
    ganho.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.03)
    ganho.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1)
    osc.connect(ganho).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 1.2)
    osc.onended = () => void ctx.close()
  } catch {
    /* som é um extra; silêncio nunca deve quebrar o cronômetro */
  }
}

export function ProvedorCronometro({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoCrono>(ler)
  const [agora, setAgora] = useState(() => Date.now())
  const tituloOriginal = useRef<string>('')

  useEffect(() => {
    tituloOriginal.current = document.title
  }, [])

  useEffect(() => {
    localStorage.setItem(CHAVE, JSON.stringify(estado))
  }, [estado])

  // O relógio de parede é a fonte da verdade: se a aba dormir ou o celular
  // travar a tela, o tempo continua certo quando voltar.
  useEffect(() => {
    if (estado.iniciadoEm === null) return
    setAgora(Date.now())
    const id = window.setInterval(() => setAgora(Date.now()), 1000)
    const aoVoltar = () => setAgora(Date.now())
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('focus', aoVoltar)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('focus', aoVoltar)
    }
  }, [estado.iniciadoEm])

  const decorridoMs = estado.acumulado + (estado.iniciadoEm !== null ? Math.max(0, agora - estado.iniciadoEm) : 0)
  const segundos = Math.floor(decorridoMs / 1000)
  const minutos = Math.floor(segundos / 60)
  const rodando = estado.iniciadoEm !== null
  const ativo = rodando || decorridoMs > 0

  // Aviso de alvo atingido.
  useEffect(() => {
    if (!estado.alvoMin || estado.avisado || !rodando) return
    if (minutos >= estado.alvoMin) {
      tocarAviso()
      setEstado((e) => ({ ...e, avisado: true }))
    }
  }, [minutos, estado.alvoMin, estado.avisado, rodando])

  // Título da aba vira o cronômetro, para conferir sem trocar de janela.
  useEffect(() => {
    if (rodando) document.title = `${relogio(segundos)} · Aprumo`
    else document.title = tituloOriginal.current || 'Aprumo'
  }, [rodando, segundos])

  const definir = useCallback((mudancas: Partial<EstadoCrono>) => {
    setEstado((e) => ({ ...e, ...mudancas }))
  }, [])

  const iniciar = useCallback(() => {
    setEstado((e) => (e.iniciadoEm !== null ? e : { ...e, iniciadoEm: Date.now() }))
  }, [])

  const pausar = useCallback(() => {
    setEstado((e) =>
      e.iniciadoEm === null
        ? e
        : { ...e, acumulado: e.acumulado + Math.max(0, Date.now() - e.iniciadoEm), iniciadoEm: null },
    )
  }, [])

  const zerar = useCallback(() => {
    setEstado((e) => ({ ...INICIAL, materiaId: e.materiaId, atividade: e.atividade, alvoMin: e.alvoMin }))
  }, [])

  const valor = useMemo<ContextoCrono>(
    () => ({
      estado,
      segundos,
      minutos,
      rodando,
      ativo,
      progressoAlvo: estado.alvoMin ? Math.min(1, minutos / estado.alvoMin) : null,
      definir,
      iniciar,
      pausar,
      zerar,
    }),
    [estado, segundos, minutos, rodando, ativo, definir, iniciar, pausar, zerar],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useCronometro() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCronometro precisa estar dentro de ProvedorCronometro')
  return ctx
}
