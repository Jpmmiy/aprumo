import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function cn(...partes: (string | false | null | undefined)[]) {
  return partes.filter(Boolean).join(' ')
}

// ------------------------------------------------------------------ Botão ---

type Aparencia = 'solido' | 'contorno' | 'fantasma' | 'perigo' | 'latao'
type Tamanho = 'p' | 'm' | 'g'

const APARENCIAS: Record<Aparencia, string> = {
  solido: 'bg-acento text-acento-tinta hover:bg-acento-forte border border-transparent',
  contorno: 'bg-superficie text-tinta border border-borda-forte hover:bg-superficie-2',
  fantasma: 'bg-transparent text-tinta-2 border border-transparent hover:bg-superficie-2 hover:text-tinta',
  perigo: 'bg-transparent text-ferrugem border border-borda hover:bg-ferrugem-fraco',
  latao: 'bg-latao-fraco text-latao-forte border border-latao/30 hover:border-latao/60',
}

const TAMANHOS: Record<Tamanho, string> = {
  p: 'h-8 px-3 text-[0.8125rem] gap-1.5 rounded-[8px]',
  m: 'h-10 px-4 text-sm gap-2 rounded-[10px]',
  g: 'h-12 px-5 text-[0.9375rem] gap-2 rounded-[12px]',
}

interface PropsBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  aparencia?: Aparencia
  tamanho?: Tamanho
  children?: ReactNode
}

export function Botao({ aparencia = 'contorno', tamanho = 'm', className, ...props }: PropsBotao) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors select-none',
        'disabled:opacity-40 disabled:pointer-events-none',
        'active:translate-y-px',
        APARENCIAS[aparencia],
        TAMANHOS[tamanho],
        className,
      )}
    />
  )
}

export function BotaoIcone({
  rotulo,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { rotulo: string }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      {...props}
      className={cn(
        'inline-grid h-8 w-8 place-items-center rounded-[8px] text-tinta-3 transition-colors',
        'hover:bg-superficie-2 hover:text-tinta disabled:opacity-40',
        className,
      )}
    />
  )
}

// ----------------------------------------------------------------- Cartão ---

export function Cartao({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      {...props}
      className={cn('rounded-cartao border border-borda bg-superficie shadow-baixo', className)}
    >
      {children}
    </div>
  )
}

export function CabecalhoCartao({
  titulo,
  descricao,
  acao,
  className,
}: {
  titulo: ReactNode
  descricao?: ReactNode
  acao?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-4 pb-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[0.9375rem] leading-tight font-semibold text-tinta">{titulo}</h2>
        {descricao && <p className="mt-1 text-[0.8125rem] leading-snug text-tinta-3">{descricao}</p>}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  )
}

// ------------------------------------------------------------------ Campos ---

export function Rotulo({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[0.8125rem] font-medium text-tinta-2">
      {children}
    </label>
  )
}

const BASE_CAMPO =
  'w-full rounded-campo border border-borda-forte bg-superficie px-3 py-2 text-sm text-tinta ' +
  'placeholder:text-tinta-3/70 transition-colors focus:border-acento focus:outline-none ' +
  'disabled:opacity-50'

export function Campo({
  rotulo,
  dica,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { rotulo?: string; dica?: string }) {
  const id = useId()
  const idFinal = props.id ?? id
  return (
    <div className="min-w-0">
      {rotulo && <Rotulo htmlFor={idFinal}>{rotulo}</Rotulo>}
      <input {...props} id={idFinal} className={cn(BASE_CAMPO, className)} />
      {dica && <p className="mt-1 text-xs text-tinta-3">{dica}</p>}
    </div>
  )
}

export function AreaTexto({
  rotulo,
  dica,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { rotulo?: string; dica?: string }) {
  const id = useId()
  const idFinal = props.id ?? id
  return (
    <div className="min-w-0">
      {rotulo && <Rotulo htmlFor={idFinal}>{rotulo}</Rotulo>}
      <textarea {...props} id={idFinal} className={cn(BASE_CAMPO, 'resize-y leading-relaxed', className)} />
      {dica && <p className="mt-1 text-xs text-tinta-3">{dica}</p>}
    </div>
  )
}

export function Selecao({
  rotulo,
  dica,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { rotulo?: string; dica?: string }) {
  const id = useId()
  const idFinal = props.id ?? id
  return (
    <div className="min-w-0">
      {rotulo && <Rotulo htmlFor={idFinal}>{rotulo}</Rotulo>}
      <div className="relative">
        <select
          {...props}
          id={idFinal}
          className={cn(
            BASE_CAMPO,
            'cursor-pointer appearance-none bg-none pr-9',
            // A seta é desenhada pelo ::after do wrapper; o select fica limpo.
            className,
          )}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="pointer-events-none absolute top-1/2 right-3 h-3 w-3 -translate-y-1/2 text-tinta-3"
        >
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      {dica && <p className="mt-1 text-xs text-tinta-3">{dica}</p>}
    </div>
  )
}

// ------------------------------------------------------------------ Modal ----

export function Modal({
  aberto,
  aoFechar,
  titulo,
  descricao,
  children,
  rodape,
  largura = 'md',
}: {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  descricao?: string
  children: ReactNode
  rodape?: ReactNode
  largura?: 'sm' | 'md' | 'lg'
}) {
  const caixa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Foca o primeiro campo para o teclado do celular já subir no lugar certo.
    const alvo = caixa.current?.querySelector<HTMLElement>('input, textarea, select, button')
    alvo?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflow
    }
  }, [aberto, aoFechar])

  if (!aberto) return null

  const larguras = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-[rgb(10_14_8/0.55)] backdrop-blur-[2px]"
        onClick={aoFechar}
        aria-hidden="true"
      />
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={cn(
          'animar-surgir relative flex max-h-[92dvh] w-full flex-col overflow-hidden border border-borda bg-superficie shadow-alto',
          'rounded-t-[20px] sm:rounded-[18px]',
          larguras[largura],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-borda px-5 py-4">
          <div className="min-w-0">
            <h2 className="display text-lg leading-tight text-tinta">{titulo}</h2>
            {descricao && <p className="mt-1 text-[0.8125rem] text-tinta-3">{descricao}</p>}
          </div>
          <BotaoIcone rotulo="Fechar" onClick={aoFechar} className="-mt-1 -mr-1">
            <X size={17} />
          </BotaoIcone>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {rodape && (
          <div className="area-segura-baixo flex items-center justify-end gap-2 border-t border-borda bg-superficie-2 px-5 py-3">
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

// ------------------------------------------------------------- Diversos ----

export function Etiqueta({
  children,
  cor,
  className,
}: {
  children: ReactNode
  cor?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-borda bg-superficie-2 px-2 py-0.5 text-[0.6875rem] font-medium text-tinta-2',
        className,
      )}
    >
      {cor && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cor }} aria-hidden="true" />}
      {children}
    </span>
  )
}

export function Vazio({
  titulo,
  descricao,
  acao,
  icone,
}: {
  titulo: string
  descricao: string
  acao?: ReactNode
  icone?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icone && <div className="mb-3 text-tinta-3/60">{icone}</div>}
      <p className="text-sm font-semibold text-tinta">{titulo}</p>
      <p className="mt-1 max-w-xs text-[0.8125rem] leading-relaxed text-tinta-3">{descricao}</p>
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}

export function Abas<T extends string>({
  valor,
  aoTrocar,
  opcoes,
  className,
}: {
  valor: T
  aoTrocar: (v: T) => void
  opcoes: { id: T; nome: string }[]
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex max-w-full gap-1 overflow-x-auto rounded-[11px] border border-borda bg-superficie-2 p-1',
        className,
      )}
    >
      {opcoes.map((o) => (
        <button
          key={o.id}
          role="tab"
          type="button"
          aria-selected={valor === o.id}
          onClick={() => aoTrocar(o.id)}
          className={cn(
            'shrink-0 rounded-[8px] px-3 py-1.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors',
            valor === o.id
              ? 'bg-superficie text-tinta shadow-baixo'
              : 'text-tinta-3 hover:text-tinta',
          )}
        >
          {o.nome}
        </button>
      ))}
    </div>
  )
}

export function Alternador({
  ligado,
  aoTrocar,
  rotulo,
}: {
  ligado: boolean
  aoTrocar: (v: boolean) => void
  rotulo: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={() => aoTrocar(!ligado)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
        ligado ? 'border-acento bg-acento' : 'border-borda-forte bg-superficie-2',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-superficie shadow-baixo transition-[left]',
          ligado ? 'left-[calc(100%-1.25rem)]' : 'left-1',
        )}
        style={ligado ? { background: 'var(--acento-tinta)' } : undefined}
      />
    </button>
  )
}

/** Confirmação de exclusão: sempre nomeia o que some, nunca "tem certeza?". */
export function ConfirmarExclusao({
  aberto,
  aoFechar,
  aoConfirmar,
  oQue,
}: {
  aberto: boolean
  aoFechar: () => void
  aoConfirmar: () => void
  oQue: string
}) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Apagar para sempre"
      largura="sm"
      rodape={
        <>
          <Botao aparencia="fantasma" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao
            aparencia="perigo"
            onClick={() => {
              aoConfirmar()
              aoFechar()
            }}
          >
            Apagar
          </Botao>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-tinta-2">
        {oQue} vai sumir do seu histórico e das métricas. Isso não tem como desfazer.
      </p>
    </Modal>
  )
}
