/**
 * A marca é o próprio instrumento: um ponto fixo, um fio e um peso.
 * Nada gira, nada brilha — um prumo parado é exatamente o que se quer ver.
 */
export function Prumo({
  tamanho = 24,
  className,
  style,
}: {
  tamanho?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      className={className}
      style={style}
      role="img"
      aria-label="Aprumo"
      fill="none"
    >
      {/* ponto fixo */}
      <path d="M7.5 2.6h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.55" />
      {/* fio */}
      <path d="M12 2.6v8.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      {/* peso */}
      <path
        d="M12 10.4 15.9 14.2 12 22.1 8.1 14.2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Marca({
  tamanho = 'm',
  className,
}: {
  tamanho?: 'p' | 'm' | 'g'
  className?: string
}) {
  const medidas = {
    p: { icone: 18, texto: 'text-[0.9375rem]' },
    m: { icone: 23, texto: 'text-xl' },
    g: { icone: 34, texto: 'text-3xl' },
  }[tamanho]

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <Prumo tamanho={medidas.icone} className="text-latao" />
      <span
        className={`display ${medidas.texto} leading-none text-tinta`}
        style={{ letterSpacing: '-0.02em' }}
      >
        Aprumo
      </span>
    </span>
  )
}
