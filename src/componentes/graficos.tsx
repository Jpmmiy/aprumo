import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { formatarCurto, formatarMedio, formatarMes } from '@/lib/datas'
import { duracao, numero, porcento } from '@/lib/formato'
import type { PontoDiario } from '@/lib/metricas'

/** Mede o container para o gráfico caber no celular sem esticar texto. */
function useLargura<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [largura, setLargura] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width))
    obs.observe(el)
    setLargura(el.clientWidth)
    return () => obs.disconnect()
  }, [])

  return { ref, largura }
}

function Dica({ x, y, largura, children }: { x: number; y: number; largura: number; children: ReactNode }) {
  // Gruda nas bordas em vez de vazar para fora do cartão.
  const L = 150
  const esquerda = Math.min(Math.max(x - L / 2, 4), Math.max(4, largura - L - 4))
  return (
    <div
      className="pointer-events-none absolute z-20 rounded-[10px] border border-borda-forte bg-superficie px-2.5 py-2 shadow-alto"
      style={{ left: esquerda, top: Math.max(4, y - 8), width: L, transform: 'translateY(-100%)' }}
    >
      {children}
    </div>
  )
}

function LinhaDica({ cor, nome, valor }: { cor?: string; nome: string; valor: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[0.6875rem] leading-relaxed">
      {cor && <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: cor }} />}
      <span className="text-tinta-3">{nome}</span>
      <span className="num ml-auto font-medium text-tinta">{valor}</span>
    </div>
  )
}

export function Legenda({ itens }: { itens: { cor: string; nome: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {itens.map((i) => (
        <span key={i.nome} className="inline-flex items-center gap-1.5 text-[0.6875rem] font-medium text-tinta-2">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.cor }} aria-hidden="true" />
          {i.nome}
        </span>
      ))}
    </div>
  )
}

/** Retângulo com o topo arredondado e a base viva, ancorada na linha de base. */
function caminhoBarra(x: number, y: number, l: number, a: number, r: number, arredondarTopo: boolean) {
  if (a <= 0.5) return ''
  const raio = arredondarTopo ? Math.min(r, l / 2, a) : 0
  return [
    `M ${x} ${y + a}`,
    `V ${y + raio}`,
    raio ? `Q ${x} ${y} ${x + raio} ${y}` : '',
    `H ${x + l - raio}`,
    raio ? `Q ${x + l} ${y} ${x + l} ${y + raio}` : '',
    `V ${y + a}`,
    'Z',
  ]
    .filter(Boolean)
    .join(' ')
}

// ============================================================ colunas =======

export function ColunasDiarias({
  pontos,
  meta,
  altura = 210,
}: {
  pontos: PontoDiario[]
  meta?: number
  altura?: number
}) {
  const { ref, largura } = useLargura<HTMLDivElement>()
  const [ativoIdx, setAtivoIdx] = useState<number | null>(null)

  const margem = { topo: 14, direita: 6, baixo: 22, esquerda: 34 }
  const l = Math.max(0, largura - margem.esquerda - margem.direita)
  const a = altura - margem.topo - margem.baixo

  // A grade só marca horas inteiras: "1h30" no eixo é ruído, e a dízima de
  // dividir o teto em partes iguais imprimia coisas como "1,333h".
  const maximo = Math.max(meta ?? 0, ...pontos.map((p) => p.total), 60)
  const horasTeto = Math.max(1, Math.ceil(maximo / 60))
  const passoHora = Math.max(1, Math.ceil(horasTeto / 4))
  const teto = Math.ceil(horasTeto / passoHora) * passoHora * 60
  const escalaY = (v: number) => a - (v / teto) * a

  const passo = pontos.length ? l / pontos.length : 0
  const larguraBarra = Math.max(3, Math.min(26, passo - Math.max(2, passo * 0.28)))

  // Rótulos do eixo x rareiam conforme a tela encolhe, para não colidirem.
  const saltoX = Math.max(1, Math.ceil((pontos.length * 34) / Math.max(l, 1)))
  const linhasGrade = Array.from({ length: teto / 60 / passoHora + 1 }, (_, i) => i * passoHora * 60)

  return (
    <div ref={ref} className="relative w-full">
      {largura > 0 && (
        <svg width={largura} height={altura} className="block overflow-visible">
          <g transform={`translate(${margem.esquerda},${margem.topo})`}>
            {linhasGrade.map((v) => (
              <g key={v}>
                <line x1={0} y1={escalaY(v)} x2={l} y2={escalaY(v)} stroke="var(--borda)" strokeWidth="1" />
                <text
                  x={-8}
                  y={escalaY(v)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="num"
                  fontSize="10"
                  fill="var(--tinta-3)"
                >
                  {v / 60}h
                </text>
              </g>
            ))}

            {meta ? (
              <g>
                <line
                  x1={0}
                  y1={escalaY(meta)}
                  x2={l}
                  y2={escalaY(meta)}
                  stroke="var(--latao)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text x={l} y={escalaY(meta) - 5} textAnchor="end" fontSize="9.5" fill="var(--latao)" fontWeight="600">
                  meta
                </text>
              </g>
            ) : null}

            {pontos.map((p, i) => {
              const x = i * passo + (passo - larguraBarra) / 2
              const hAtivo = (p.ativo / teto) * a
              const hPassivo = (p.passivo / teto) * a
              const temPassivo = hPassivo > 0.5
              const yAtivo = a - hAtivo
              // 2px de superfície entre os dois trechos, para a divisa ser lida.
              const yPassivo = yAtivo - hPassivo - (temPassivo && hAtivo > 0.5 ? 2 : 0)

              return (
                <g
                  key={p.data}
                  onPointerEnter={() => setAtivoIdx(i)}
                  onPointerLeave={() => setAtivoIdx(null)}
                >
                  <rect x={i * passo} y={0} width={passo} height={a} fill="transparent" />
                  {ativoIdx === i && (
                    <rect x={i * passo} y={-6} width={passo} height={a + 6} fill="var(--superficie-2)" rx="5" />
                  )}
                  <path
                    d={caminhoBarra(x, yAtivo, larguraBarra, hAtivo, 4, !temPassivo)}
                    fill="var(--serie-ativo)"
                  />
                  <path
                    d={caminhoBarra(x, yPassivo, larguraBarra, hPassivo, 4, true)}
                    fill="var(--serie-passivo)"
                  />
                </g>
              )
            })}

            <line x1={0} y1={a} x2={l} y2={a} stroke="var(--borda-forte)" strokeWidth="1" />

            {pontos.map((p, i) =>
              i % saltoX === 0 ? (
                <text
                  key={p.data}
                  x={i * passo + passo / 2}
                  y={a + 14}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="var(--tinta-3)"
                >
                  {formatarCurto(p.data).slice(0, 5)}
                </text>
              ) : null,
            )}
          </g>
        </svg>
      )}

      {ativoIdx !== null && pontos[ativoIdx] && (
        <Dica
          x={margem.esquerda + ativoIdx * passo + passo / 2}
          y={margem.topo + escalaY(pontos[ativoIdx].total)}
          largura={largura}
        >
          <p className="mb-1 text-[0.6875rem] font-semibold text-tinta">{formatarMedio(pontos[ativoIdx].data)}</p>
          <LinhaDica cor="var(--serie-ativo)" nome="Ativo" valor={duracao(pontos[ativoIdx].ativo)} />
          <LinhaDica cor="var(--serie-passivo)" nome="Passivo" valor={duracao(pontos[ativoIdx].passivo)} />
          <div className="mt-1 border-t border-borda pt-1">
            <LinhaDica nome="Total" valor={duracao(pontos[ativoIdx].total)} />
          </div>
        </Dica>
      )}
    </div>
  )
}

// ================================================ barras horizontais ========

export interface BarraItem {
  id: string
  nome: string
  valor: number
  /** Texto que aparece à direita; se faltar, usa o próprio valor. */
  rotulo?: string
  cor?: string
  /** Marca de referência (ex.: média geral), em unidade de valor. */
  referencia?: number
}

export function BarrasHorizontais({
  itens,
  formatar = (v: number) => numero(v),
  maximo,
}: {
  itens: BarraItem[]
  formatar?: (v: number) => string
  maximo?: number
}) {
  const teto = maximo ?? Math.max(1, ...itens.map((i) => i.valor))

  return (
    <div className="flex flex-col gap-2.5">
      {itens.map((i) => (
        <div key={i.id} className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3">
          <span className="truncate text-[0.8125rem] text-tinta-2" title={i.nome}>
            {i.nome}
          </span>
          <div className="relative h-[18px] overflow-hidden rounded-[5px] bg-superficie-2">
            <div
              className="h-full rounded-[5px] transition-[width] duration-500"
              style={{
                width: `${Math.max(i.valor > 0 ? 2 : 0, (i.valor / teto) * 100)}%`,
                background: i.cor ?? 'var(--acento)',
              }}
            />
            {i.referencia !== undefined && (
              <span
                className="absolute inset-y-0 w-[2px] bg-latao"
                style={{ left: `${Math.min(100, (i.referencia / teto) * 100)}%` }}
                aria-hidden="true"
              />
            )}
          </div>
          <span className="num w-14 text-right text-[0.8125rem] font-medium text-tinta">{i.rotulo ?? formatar(i.valor)}</span>
        </div>
      ))}
    </div>
  )
}

// ================================================= barra de proporção =======

export function BarraProporcao({
  partes,
  altura = 12,
}: {
  partes: { nome: string; valor: number; cor: string }[]
  altura?: number
}) {
  const total = partes.reduce((t, p) => t + p.valor, 0)
  if (!total) return <div className="rounded-full bg-superficie-2" style={{ height: altura }} />

  return (
    <div className="flex w-full gap-[2px] overflow-hidden rounded-full" style={{ height: altura }}>
      {partes.map((p) =>
        p.valor > 0 ? (
          <div
            key={p.nome}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(p.valor / total) * 100}%`, background: p.cor }}
            title={`${p.nome}: ${duracao(p.valor)}`}
          />
        ) : null,
      )}
    </div>
  )
}

// ========================================================= linha do tempo ===

export interface SerieLinha {
  id: string
  nome: string
  cor: string
  pontos: { data: string; valor: number; bruto: number; escala: number }[]
}

export function LinhasEvolucao({ series, altura = 230 }: { series: SerieLinha[]; altura?: number }) {
  const { ref, largura } = useLargura<HTMLDivElement>()
  const [foco, setFoco] = useState<{ serie: number; ponto: number } | null>(null)

  const margem = { topo: 16, direita: 58, baixo: 24, esquerda: 34 }
  const l = Math.max(0, largura - margem.esquerda - margem.direita)
  const a = altura - margem.topo - margem.baixo

  const todas = series.flatMap((s) => s.pontos)
  const datas = [...new Set(todas.map((p) => p.data))].sort()
  const escalaX = (d: string) =>
    datas.length <= 1 ? l / 2 : (datas.indexOf(d) / (datas.length - 1)) * l
  const escalaY = (v: number) => a - (v / 100) * a

  const grade = [0, 25, 50, 75, 100]

  // Quando as três bancas terminam com aproveitamento parecido, os nomes na
  // ponta se sobrepõem. Aqui eles são afastados na vertical, mantendo a ordem.
  const rotulosFinais = new Map<string, number>()
  const finais = series
    .filter((s) => s.pontos.length)
    .map((s) => ({ id: s.id, y: escalaY(s.pontos[s.pontos.length - 1].valor) }))
    .sort((a, b) => a.y - b.y)
  const ESPACO = 13
  finais.forEach((f, i) => {
    if (i > 0 && f.y - finais[i - 1].y < ESPACO) f.y = finais[i - 1].y + ESPACO
    rotulosFinais.set(f.id, f.y)
  })

  return (
    <div ref={ref} className="relative w-full">
      {largura > 0 && (
        <svg width={largura} height={altura} className="block overflow-visible">
          <g transform={`translate(${margem.esquerda},${margem.topo})`}>
            {grade.map((v) => (
              <g key={v}>
                <line x1={0} y1={escalaY(v)} x2={l} y2={escalaY(v)} stroke="var(--borda)" strokeWidth="1" />
                <text x={-8} y={escalaY(v)} textAnchor="end" dominantBaseline="middle" className="num" fontSize="10" fill="var(--tinta-3)">
                  {v}%
                </text>
              </g>
            ))}

            {series.map((s) => {
              if (!s.pontos.length) return null
              const d = s.pontos
                .map((p, i) => `${i === 0 ? 'M' : 'L'} ${escalaX(p.data)} ${escalaY(p.valor)}`)
                .join(' ')
              const ultimo = s.pontos[s.pontos.length - 1]
              return (
                <g key={s.id}>
                  <path d={d} fill="none" stroke={s.cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {/* rótulo direto na ponta: a identidade não depende só da cor */}
                  <text
                    x={escalaX(ultimo.data) + 9}
                    y={rotulosFinais.get(s.id) ?? escalaY(ultimo.valor)}
                    dominantBaseline="middle"
                    fontSize="10.5"
                    fontWeight="600"
                    fill={s.cor}
                    stroke="var(--superficie)"
                    strokeWidth="3"
                    paintOrder="stroke"
                  >
                    {s.nome}
                  </text>
                </g>
              )
            })}

            {series.map((s, si) =>
              s.pontos.map((p, pi) => (
                <g
                  key={`${s.id}-${p.data}-${pi}`}
                  onPointerEnter={() => setFoco({ serie: si, ponto: pi })}
                  onPointerLeave={() => setFoco(null)}
                >
                  <circle cx={escalaX(p.data)} cy={escalaY(p.valor)} r={12} fill="transparent" />
                  <circle
                    cx={escalaX(p.data)}
                    cy={escalaY(p.valor)}
                    r={foco?.serie === si && foco.ponto === pi ? 6 : 4.5}
                    fill={s.cor}
                    stroke="var(--superficie)"
                    strokeWidth="2"
                  />
                </g>
              )),
            )}

            <line x1={0} y1={a} x2={l} y2={a} stroke="var(--borda-forte)" strokeWidth="1" />
            {datas.map((d, i) =>
              i === 0 || i === datas.length - 1 || (datas.length > 4 && i === Math.floor(datas.length / 2)) ? (
                <text key={d} x={escalaX(d)} y={a + 15} textAnchor="middle" fontSize="9.5" fill="var(--tinta-3)">
                  {formatarCurto(d)}
                </text>
              ) : null,
            )}
          </g>
        </svg>
      )}

      {foco && series[foco.serie]?.pontos[foco.ponto] && (
        <Dica
          x={margem.esquerda + escalaX(series[foco.serie].pontos[foco.ponto].data)}
          y={margem.topo + escalaY(series[foco.serie].pontos[foco.ponto].valor)}
          largura={largura}
        >
          <p className="mb-1 text-[0.6875rem] font-semibold text-tinta">
            {formatarMedio(series[foco.serie].pontos[foco.ponto].data)}
          </p>
          <LinhaDica
            cor={series[foco.serie].cor}
            nome={series[foco.serie].nome}
            valor={`${numero(series[foco.serie].pontos[foco.ponto].bruto, 0)}/${numero(series[foco.serie].pontos[foco.ponto].escala, 0)}`}
          />
          <LinhaDica nome="Aproveitamento" valor={porcento(series[foco.serie].pontos[foco.ponto].valor)} />
        </Dica>
      )}
    </div>
  )
}

// ============================================================ calendário ====

export function CalendarioConstancia({
  dias,
  meta,
}: {
  dias: { data: string; minutos: number }[]
  meta: number
}) {
  const [foco, setFoco] = useState<number | null>(null)
  const CELULA = 13
  const GAP = 3

  const nivel = (min: number) => {
    if (min <= 0) return 0
    const r = meta > 0 ? min / meta : min / 240
    if (r < 0.34) return 1
    if (r < 0.67) return 2
    if (r < 1) return 3
    return 4
  }

  // Colunas são semanas; a primeira é preenchida até cair na segunda-feira.
  const primeiro = dias[0]
  const deslocamento = primeiro ? (new Date(primeiro.data + 'T00:00:00').getDay() + 6) % 7 : 0
  const celulas: ({ data: string; minutos: number } | null)[] = [
    ...Array.from({ length: deslocamento }, () => null),
    ...dias,
  ]
  const semanas = Math.ceil(celulas.length / 7)

  const rotulosMes: { coluna: number; texto: string }[] = []
  let mesAnterior = ''
  celulas.forEach((c, i) => {
    if (!c) return
    const mes = c.data.slice(0, 7)
    if (mes !== mesAnterior && i % 7 <= 3) {
      rotulosMes.push({ coluna: Math.floor(i / 7), texto: formatarMes(c.data) })
      mesAnterior = mes
    }
  })

  const largura = semanas * (CELULA + GAP)
  const altura = 7 * (CELULA + GAP)

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-1">
        <svg width={largura} height={altura + 16} className="block">
          {rotulosMes.map((r) => (
            <text key={`${r.coluna}-${r.texto}`} x={r.coluna * (CELULA + GAP)} y={9} fontSize="9.5" fill="var(--tinta-3)">
              {r.texto}
            </text>
          ))}
          <g transform="translate(0,16)">
            {celulas.map((c, i) =>
              c ? (
                <rect
                  key={c.data}
                  x={Math.floor(i / 7) * (CELULA + GAP)}
                  y={(i % 7) * (CELULA + GAP)}
                  width={CELULA}
                  height={CELULA}
                  rx={3.5}
                  fill={`var(--calor-${nivel(c.minutos)})`}
                  stroke={foco === i ? 'var(--tinta-2)' : 'transparent'}
                  strokeWidth="1.5"
                  onPointerEnter={() => setFoco(i)}
                  onPointerLeave={() => setFoco(null)}
                />
              ) : null,
            )}
          </g>
        </svg>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[0.6875rem] text-tinta-3">menos</span>
        {[0, 1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className="h-[11px] w-[11px] rounded-[3px]"
            style={{ background: `var(--calor-${n})` }}
            aria-hidden="true"
          />
        ))}
        <span className="text-[0.6875rem] text-tinta-3">mais</span>
        {foco !== null && celulas[foco] && (
          <span className="ml-auto text-[0.6875rem] text-tinta-2">
            {formatarMedio(celulas[foco]!.data)} · <span className="num">{duracao(celulas[foco]!.minutos)}</span>
          </span>
        )}
      </div>
    </div>
  )
}

// ================================================= mapa esforço x acerto ====

export function MapaEsforco({
  pontos,
  altura = 260,
}: {
  pontos: { id: string; nome: string; x: number; y: number; peso: number }[]
  altura?: number
}) {
  const { ref, largura } = useLargura<HTMLDivElement>()
  const [foco, setFoco] = useState<number | null>(null)

  const margem = { topo: 18, direita: 16, baixo: 34, esquerda: 38 }
  const l = Math.max(0, largura - margem.esquerda - margem.direita)
  const a = altura - margem.topo - margem.baixo

  const maxX = Math.max(1, ...pontos.map((p) => p.x)) * 1.15
  const escalaX = (v: number) => (v / maxX) * l
  const escalaY = (v: number) => a - (v / 100) * a

  const mediaY = pontos.length ? pontos.reduce((t, p) => t + p.y, 0) / pontos.length : 50
  const mediaX = pontos.length ? pontos.reduce((t, p) => t + p.x, 0) / pontos.length : maxX / 2

  // Duas matérias com tempo e acerto parecidos empilhavam os nomes um sobre o
  // outro. Quando isso acontece, o segundo rótulo desce para baixo do ponto.
  const colocados: { x: number; y: number }[] = []
  const posicaoRotulo = pontos.map((p) => {
    const px = escalaX(p.x)
    const py = escalaY(p.y)
    const acima = { x: px, y: py - 12 }
    const colide = colocados.some((c) => Math.abs(c.x - acima.x) < 62 && Math.abs(c.y - acima.y) < 13)
    const escolhido = colide ? { x: px, y: py + 19 } : acima
    colocados.push(escolhido)
    return escolhido
  })

  return (
    <div ref={ref} className="relative w-full">
      {largura > 0 && (
        <svg width={largura} height={altura} className="block overflow-visible">
          <g transform={`translate(${margem.esquerda},${margem.topo})`}>
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v}>
                <line x1={0} y1={escalaY(v)} x2={l} y2={escalaY(v)} stroke="var(--borda)" strokeWidth="1" />
                <text x={-8} y={escalaY(v)} textAnchor="end" dominantBaseline="middle" className="num" fontSize="10" fill="var(--tinta-3)">
                  {v}%
                </text>
              </g>
            ))}

            {/* as duas medianas dividem o campo nos quatro casos que interessam */}
            <line x1={escalaX(mediaX)} y1={0} x2={escalaX(mediaX)} y2={a} stroke="var(--borda-forte)" strokeWidth="1" strokeDasharray="3 4" />
            <line x1={0} y1={escalaY(mediaY)} x2={l} y2={escalaY(mediaY)} stroke="var(--borda-forte)" strokeWidth="1" strokeDasharray="3 4" />

            <text x={4} y={12} fontSize="9.5" fill="var(--tinta-3)">pouco tempo, indo bem</text>
            <text x={l - 4} y={12} textAnchor="end" fontSize="9.5" fill="var(--tinta-3)">muito tempo, indo bem</text>
            <text x={4} y={a - 6} fontSize="9.5" fill="var(--ferrugem)" fontWeight="600">precisa de tempo</text>
            <text x={l - 4} y={a - 6} textAnchor="end" fontSize="9.5" fill="var(--ferrugem)" fontWeight="600">precisa de método</text>

            {pontos.map((p, i) => (
              <g key={p.id} onPointerEnter={() => setFoco(i)} onPointerLeave={() => setFoco(null)}>
                <circle cx={escalaX(p.x)} cy={escalaY(p.y)} r={14} fill="transparent" />
                <circle
                  cx={escalaX(p.x)}
                  cy={escalaY(p.y)}
                  r={foco === i ? 8 : 6}
                  fill="var(--acento)"
                  stroke="var(--superficie)"
                  strokeWidth="2"
                />
                <text
                  x={posicaoRotulo[i].x}
                  y={posicaoRotulo[i].y}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--tinta-2)"
                  stroke="var(--superficie)"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {p.nome.length > 12 ? p.nome.slice(0, 11) + '…' : p.nome}
                </text>
              </g>
            ))}

            <line x1={0} y1={a} x2={l} y2={a} stroke="var(--borda-forte)" strokeWidth="1" />
            <text x={l / 2} y={a + 26} textAnchor="middle" fontSize="10" fill="var(--tinta-3)">
              horas estudadas no período →
            </text>
          </g>
        </svg>
      )}

      {foco !== null && pontos[foco] && (
        <Dica x={margem.esquerda + escalaX(pontos[foco].x)} y={margem.topo + escalaY(pontos[foco].y)} largura={largura}>
          <p className="mb-1 text-[0.6875rem] font-semibold text-tinta">{pontos[foco].nome}</p>
          <LinhaDica nome="Tempo" valor={duracao(pontos[foco].x * 60)} />
          <LinhaDica nome="Acerto" valor={porcento(pontos[foco].y)} />
          <LinhaDica nome="Questões" valor={numero(pontos[foco].peso)} />
        </Dica>
      )}
    </div>
  )
}

/** Números grandes do topo das telas. */
export function Indicador({
  rotulo,
  valor,
  apoio,
  cor,
}: {
  rotulo: string
  valor: string
  apoio?: ReactNode
  cor?: string
}) {
  return (
    <div className="rounded-cartao border border-borda bg-superficie px-4 py-3.5">
      <p className="rotulo">{rotulo}</p>
      <p className="num mt-1.5 text-[1.5rem] leading-none font-medium" style={{ color: cor ?? 'var(--tinta)' }}>
        {valor}
      </p>
      {apoio && <div className="mt-1.5 text-[0.75rem] leading-snug text-tinta-3">{apoio}</div>}
    </div>
  )
}

/** Evita que o gráfico apareça vazio sem explicar o porquê. */
export function SemDados({ children }: { children: ReactNode }) {
  const [visivel, setVisivel] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setVisivel(true), 60)
    return () => clearTimeout(id)
  }, [])
  if (!visivel) return null
  return (
    <div className="flex min-h-[140px] items-center justify-center px-6 text-center text-[0.8125rem] leading-relaxed text-tinta-3">
      {children}
    </div>
  )
}
