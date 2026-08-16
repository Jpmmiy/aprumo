import { useSyncExternalStore, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  House,
  Moon,
  NotebookPen,
  Settings,
  Sun,
  Timer,
} from 'lucide-react'
import { Marca, Prumo } from './Marca'
import { cn } from './ui'
import { useCronometro } from '@/dados/cronometro'
import { relogio } from '@/lib/formato'

const NAVEGACAO = [
  { para: '/', nome: 'Hoje', Icone: House },
  { para: '/estudar', nome: 'Estudar', Icone: Timer },
  { para: '/desempenho', nome: 'Desempenho', Icone: BarChart3 },
  { para: '/rotina', nome: 'Rotina', Icone: CalendarDays },
  { para: '/anotacoes', nome: 'Anotações', Icone: NotebookPen },
]

type Tema = 'sistema' | 'claro' | 'escuro'

/**
 * O botão de tema existe duas vezes na tela (barra lateral e topo do celular).
 * Com estado local, um não sabia do outro e os dois passavam a mostrar ícones
 * contraditórios — por isso o tema mora fora do React, num store minúsculo.
 */
const CHAVE_TEMA = 'aprumo:tema'
const ouvintes = new Set<() => void>()

function lerTema(): Tema {
  const salvo = localStorage.getItem(CHAVE_TEMA)
  return salvo === 'claro' || salvo === 'escuro' ? salvo : 'sistema'
}

function definirTema(tema: Tema) {
  if (tema === 'sistema') {
    delete document.documentElement.dataset.tema
    localStorage.removeItem(CHAVE_TEMA)
  } else {
    document.documentElement.dataset.tema = tema
    localStorage.setItem(CHAVE_TEMA, tema)
  }
  ouvintes.forEach((avisar) => avisar())
}

function inscrever(avisar: () => void) {
  ouvintes.add(avisar)
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', avisar)
  return () => {
    ouvintes.delete(avisar)
    media.removeEventListener('change', avisar)
  }
}

function useTema() {
  const tema = useSyncExternalStore(inscrever, lerTema, () => 'sistema' as Tema)
  const escuroAtivo =
    tema === 'escuro' ||
    (tema === 'sistema' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return { tema, setTema: definirTema, escuroAtivo }
}

function BotaoTema() {
  const { escuroAtivo, setTema } = useTema()
  return (
    <button
      type="button"
      onClick={() => setTema(escuroAtivo ? 'claro' : 'escuro')}
      aria-label={escuroAtivo ? 'Usar tema claro' : 'Usar tema escuro'}
      title={escuroAtivo ? 'Usar tema claro' : 'Usar tema escuro'}
      className="inline-grid h-9 w-9 place-items-center rounded-[10px] text-tinta-3 transition-colors hover:bg-superficie-2 hover:text-tinta"
    >
      {escuroAtivo ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

/** Pílula do cronômetro: some quando não há sessão, para não virar ruído. */
function PilulaCronometro() {
  const { rodando, segundos } = useCronometro()
  const local = useLocation()
  if (!rodando || local.pathname === '/estudar') return null

  return (
    <NavLink
      to="/estudar"
      className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 inline-flex items-center gap-2 rounded-full border border-latao/40 bg-superficie px-3.5 py-2 shadow-alto md:bottom-6"
    >
      <span className="h-2 w-2 rounded-full bg-latao" style={{ animation: 'pulso-brando 2s ease-in-out infinite' }} />
      <span className="num text-[0.8125rem] font-medium text-tinta">{relogio(segundos)}</span>
    </NavLink>
  )
}

export function Casca({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-fundo">
      {/* ---------------- barra lateral (computador) ---------------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[228px] flex-col border-r border-borda bg-superficie md:flex">
        <div className="px-5 pt-6 pb-5">
          <Marca tamanho="m" />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAVEGACAO.map(({ para, nome, Icone }) => (
            <NavLink
              key={para}
              to={para}
              end={para === '/'}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-acento-fraco text-tinta' : 'text-tinta-3 hover:bg-superficie-2 hover:text-tinta',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* o fio de prumo marca a página atual */}
                  <span
                    className={cn(
                      'absolute top-2 bottom-2 -left-3 w-[2px] rounded-full bg-latao transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden="true"
                  />
                  <Icone size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  {nome}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 border-t border-borda px-3 py-3">
          <NavLink
            to="/ajustes"
            className={({ isActive }) =>
              cn(
                'flex flex-1 items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-acento-fraco text-tinta' : 'text-tinta-3 hover:bg-superficie-2 hover:text-tinta',
              )
            }
          >
            <Settings size={17} strokeWidth={1.8} />
            Ajustes
          </NavLink>
          <BotaoTema />
        </div>
      </aside>

      {/* ---------------- barra superior (celular) ---------------- */}
      <header className="area-segura-topo sticky top-0 z-30 flex items-center justify-between border-b border-borda bg-fundo/85 px-4 py-3 backdrop-blur-md md:hidden">
        <Marca tamanho="p" />
        <div className="flex items-center gap-1">
          <BotaoTema />
          <NavLink
            to="/ajustes"
            aria-label="Ajustes"
            className="inline-grid h-9 w-9 place-items-center rounded-[10px] text-tinta-3 transition-colors hover:bg-superficie-2 hover:text-tinta"
          >
            <Settings size={17} />
          </NavLink>
        </div>
      </header>

      <main className="pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-10 md:pl-[228px]">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-5 md:px-8 md:py-8">{children}</div>
      </main>

      <PilulaCronometro />

      {/* ---------------- navegação inferior (celular) ---------------- */}
      <nav className="area-segura-baixo fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-borda bg-superficie/95 backdrop-blur-md md:hidden">
        {NAVEGACAO.map(({ para, nome, Icone }) => (
          <NavLink
            key={para}
            to={para}
            end={para === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-[0.625rem] font-medium transition-colors',
                isActive ? 'text-tinta' : 'text-tinta-3',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icone size={20} strokeWidth={isActive ? 2.2 : 1.7} />
                  {isActive && (
                    <span
                      className="absolute -top-2.5 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-latao"
                      aria-hidden="true"
                    />
                  )}
                </span>
                {nome}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function TelaCarregando({ mensagem = 'Carregando' }: { mensagem?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-fundo px-6">
      <div className="flex flex-col items-center gap-4">
        <Prumo tamanho={40} className="text-latao" style={{ animation: 'pulso-brando 1.8s ease-in-out infinite' }} />
        <p className="text-sm text-tinta-3">{mensagem}…</p>
      </div>
    </div>
  )
}
