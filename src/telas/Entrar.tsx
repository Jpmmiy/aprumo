import { useState, type FormEvent } from 'react'
import { Prumo } from '@/componentes/Marca'
import { Botao, Campo } from '@/componentes/ui'
import { useAuth } from '@/dados/auth'
import { mensagemDeErro } from '@/lib/supabase'

export function Entrar() {
  const { entrar, cadastrar } = useAuth()
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setAviso(null)
    setEnviando(true)
    try {
      if (modo === 'entrar') {
        await entrar(email, senha)
      } else {
        const { precisaConfirmar } = await cadastrar(email, senha, nome)
        if (precisaConfirmar) {
          setAviso(
            'Conta criada. O Supabase está pedindo confirmação por e-mail — confirme pelo link que chegou, ou desligue "Confirm email" no painel do Supabase para entrar direto.',
          )
          setModo('entrar')
        }
      }
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* --------- painel da marca: o prumo em tamanho grande --------- */}
      <section className="relative hidden overflow-hidden bg-[var(--musgo-900)] px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2.5">
            <Prumo tamanho={26} className="text-[var(--latao)]" />
            <span className="display text-2xl text-[var(--musgo-025)]">Aprumo</span>
          </span>
        </div>

        {/* o fio desce a página inteira, e o peso fica na altura da frase */}
        <svg
          className="absolute top-0 left-[42%] h-full w-[220px] -translate-x-1/2"
          viewBox="0 0 220 900"
          preserveAspectRatio="xMidYMin slice"
          aria-hidden="true"
        >
          <line x1="110" y1="0" x2="110" y2="470" stroke="var(--musgo-700)" strokeWidth="1.5" />
          <path d="M110 466 L134 500 L110 566 L86 500 Z" fill="var(--latao)" opacity="0.9" />
          <path d="M103 478 L108 490 L105 546 Z" fill="var(--musgo-025)" opacity="0.22" />
          <circle cx="110" cy="640" r="150" fill="var(--musgo-850)" opacity="0.55" />
        </svg>

        <div className="relative z-10 max-w-md">
          <p className="display text-[2.5rem] leading-[1.1] text-[var(--musgo-025)]">
            Um prumo não te elogia.
          </p>
          <p className="display text-[2.5rem] leading-[1.1] text-[var(--latao)]">
            Ele só mostra o eixo.
          </p>
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-[var(--musgo-200)]">
            Cronômetro, horas por matéria, taxa de acerto, redação e a rotina do cursinho — num
            painel só, que diz onde o esforço está indo embora.
          </p>
          <p className="mt-8 text-[0.8125rem] text-[var(--musgo-400)]">
            Feito para João Pedro Terra Mainardi · Medicina
          </p>
        </div>
      </section>

      {/* --------------------------- formulário --------------------------- */}
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[26rem]">
          <span className="mb-10 inline-flex items-center gap-2 lg:hidden">
            <Prumo tamanho={22} className="text-latao" />
            <span className="display text-xl text-tinta">Aprumo</span>
          </span>

          <h1 className="display text-[1.75rem] leading-tight text-tinta">
            {modo === 'entrar' ? 'Bom te ver de novo.' : 'Vamos começar.'}
          </h1>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-tinta-3">
            {modo === 'entrar'
              ? 'Entre para continuar de onde parou.'
              : 'Uma conta só sua. Os dados ficam salvos na nuvem e abrem no computador e no celular.'}
          </p>

          <form onSubmit={enviar} className="mt-8 space-y-4">
            {modo === 'criar' && (
              <Campo
                rotulo="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="João Pedro"
                autoComplete="name"
                required
              />
            )}
            <Campo
              rotulo="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              required
            />
            <Campo
              rotulo="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="mínimo de 6 caracteres"
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />

            {erro && (
              <p className="rounded-campo border border-ferrugem/30 bg-ferrugem-fraco px-3 py-2.5 text-[0.8125rem] leading-relaxed text-ferrugem">
                {erro}
              </p>
            )}
            {aviso && (
              <p className="rounded-campo border border-latao/30 bg-latao-fraco px-3 py-2.5 text-[0.8125rem] leading-relaxed text-latao-forte">
                {aviso}
              </p>
            )}

            <Botao type="submit" aparencia="solido" tamanho="g" className="w-full" disabled={enviando}>
              {enviando ? 'Um instante…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
            </Botao>
          </form>

          <p className="mt-6 text-center text-[0.8125rem] text-tinta-3">
            {modo === 'entrar' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setModo(modo === 'entrar' ? 'criar' : 'entrar')
                setErro(null)
                setAviso(null)
              }}
              className="font-medium text-acento underline underline-offset-2"
            >
              {modo === 'entrar' ? 'Criar agora' : 'Entrar'}
            </button>
          </p>
        </div>
      </section>
    </div>
  )
}
