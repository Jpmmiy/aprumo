import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { configurado, supabase } from '@/lib/supabase'

interface ContextoAuth {
  sessao: Session | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  cadastrar: (email: string, senha: string, nome: string) => Promise<{ precisaConfirmar: boolean }>
  sair: () => Promise<void>
}

const Ctx = createContext<ContextoAuth | null>(null)

export function ProvedorAuth({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(configurado)

  useEffect(() => {
    if (!configurado) return
    let vivo = true

    supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return
      setSessao(data.session)
      setCarregando(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nova) => {
      setSessao(nova)
      setCarregando(false)
    })

    return () => {
      vivo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const valor = useMemo<ContextoAuth>(
    () => ({
      sessao,
      carregando,
      async entrar(email, senha) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
        if (error) throw error
      },
      async cadastrar(email, senha, nome) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { data: { nome } },
        })
        if (error) throw error
        // Sem sessão de volta significa que o Supabase está esperando confirmação por e-mail.
        return { precisaConfirmar: !data.session }
      },
      async sair() {
        await supabase.auth.signOut()
      },
    }),
    [sessao, carregando],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth precisa estar dentro de ProvedorAuth')
  return ctx
}
