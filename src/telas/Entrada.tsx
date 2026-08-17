import { useState, type FormEvent } from 'react'
import { Prumo } from '@/componentes/Marca'
import { Botao, Campo } from '@/componentes/ui'
import { confere, liberar } from '@/lib/acesso'

export function Entrada({ aoLiberar }: { aoLiberar: () => void }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [tremendo, setTremendo] = useState(false)
  const [conferindo, setConferindo] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (conferindo) return
    setConferindo(true)
    try {
      // A derivação leva uns 200ms de propósito — é o que torna caro tentar
      // senha atrás de senha.
      if (await confere(usuario, senha)) {
        liberar()
        aoLiberar()
        return
      }
      setErro('Usuário ou senha incorretos.')
      setTremendo(true)
      setTimeout(() => setTremendo(false), 420)
    } finally {
      setConferindo(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* ----------- painel da marca: o prumo em tamanho grande ----------- */}
      <section className="relative hidden overflow-hidden bg-[var(--musgo-900)] px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        <span className="relative z-10 inline-flex items-center gap-2.5">
          <Prumo tamanho={26} className="text-[var(--latao)]" />
          <span className="display text-2xl text-[var(--musgo-025)]">Aprumo</span>
        </span>

        <svg
          className="absolute top-0 left-[42%] h-full w-[220px] -translate-x-1/2"
          viewBox="0 0 220 900"
          preserveAspectRatio="xMidYMin slice"
          aria-hidden="true"
        >
          <circle cx="110" cy="640" r="150" fill="var(--musgo-850)" opacity="0.55" />
          <line x1="110" y1="0" x2="110" y2="470" stroke="var(--musgo-700)" strokeWidth="1.5" />
          <g
            className="prumo-vivo"
            style={{ transformOrigin: '110px 0px', transformBox: 'view-box' }}
          >
            <line x1="110" y1="0" x2="110" y2="470" stroke="var(--musgo-600)" strokeWidth="1.5" />
            <path d="M110 466 L134 500 L110 566 L86 500 Z" fill="var(--latao)" opacity="0.9" />
            <path d="M103 478 L108 490 L105 546 Z" fill="var(--musgo-025)" opacity="0.22" />
          </g>
        </svg>

        <div className="relative z-10 max-w-md">
          <p className="display text-[2.5rem] leading-[1.1] text-[var(--musgo-025)]">
            Um prumo não te elogia.
          </p>
          <p className="display text-[2.5rem] leading-[1.1] text-[var(--latao)]">Ele só mostra o eixo.</p>
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-[var(--musgo-200)]">
            Cronômetro, horas por matéria, taxa de acerto, redação e a rotina do cursinho — num painel
            só, que diz onde o esforço está indo embora.
          </p>
          <p className="mt-8 text-[0.8125rem] text-[var(--musgo-400)]">
            João Pedro Terra Mainardi · Medicina
          </p>
        </div>
      </section>

      {/* ------------------------------ formulário ------------------------------ */}
      <section className="flex items-center justify-center px-5 py-12">
        <div
          className="w-full max-w-[24rem]"
          style={tremendo ? { animation: 'tremer 0.4s ease-in-out' } : undefined}
        >
          <span className="mb-10 inline-flex items-center gap-2 lg:hidden">
            <Prumo tamanho={22} className="text-latao" />
            <span className="display text-xl text-tinta">Aprumo</span>
          </span>

          <h1 className="display text-[1.75rem] leading-tight text-tinta">Entrar</h1>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-tinta-3">
            Continue de onde você parou.
          </p>

          <form onSubmit={enviar} className="mt-8 space-y-4">
            <Campo
              rotulo="Usuário"
              disabled={conferindo}
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value)
                setErro(null)
              }}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <Campo
              rotulo="Senha"
              type="password"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value)
                setErro(null)
              }}
              autoComplete="current-password"
              required
            />

            {erro && (
              <p className="rounded-campo border border-ferrugem/30 bg-ferrugem-fraco px-3 py-2.5 text-[0.8125rem] text-ferrugem">
                {erro}
              </p>
            )}

            <Botao type="submit" aparencia="solido" tamanho="g" className="w-full" disabled={conferindo}>
              {conferindo ? 'Conferindo…' : 'Entrar'}
            </Botao>
          </form>

          <p className="mt-6 text-[0.8125rem] leading-relaxed text-tinta-3">
            Só é pedido uma vez por aparelho — depois o app abre direto.
          </p>
        </div>
      </section>
    </div>
  )
}
