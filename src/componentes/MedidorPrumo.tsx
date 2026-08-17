import { useEffect, useState } from 'react'
import { duracao } from '@/lib/formato'

/**
 * O elemento-assinatura do app.
 *
 * Não é uma barra de progresso. É um prumo: a vertical é a meta do dia, e o
 * peso pende para a esquerda enquanto você está atrás dela. Quando o dia fecha
 * no alvo, o fio para de pender e fica reto — e é só isso que se comemora.
 */

const ANCORA_X = 140
const ANCORA_Y = 20
const R_INTERNO = 150
const R_EXTERNO = 161
const ABERTURA = 28

const rad = (g: number) => (g * Math.PI) / 180

/**
 * O eixo Y do SVG cresce para baixo, então `rotate` positivo joga um peso
 * pendurado para a ESQUERDA. É por isso que estar atrás da meta é ângulo
 * positivo aqui: esquerda é o lado do atraso, como dizem os rótulos.
 */
const ponto = (angulo: number, raio: number) => ({
  x: ANCORA_X - raio * Math.sin(rad(angulo)),
  y: ANCORA_Y + raio * Math.cos(rad(angulo)),
})

function anguloDaRazao(razao: number): number {
  if (!Number.isFinite(razao) || razao <= 0) return ABERTURA
  if (razao >= 1) return -Math.min(20, 28 * (razao - 1))
  return ABERTURA * (1 - razao)
}

function leitura(feito: number, meta: number): { estado: string; cor: string } {
  if (!meta) return { estado: 'Sem meta definida', cor: 'var(--tinta-3)' }
  if (feito === 0) return { estado: 'Parado', cor: 'var(--ferrugem)' }
  const razao = feito / meta
  if (razao >= 1) return { estado: 'No eixo', cor: 'var(--broto)' }
  if (razao >= 0.75) return { estado: 'Perto do eixo', cor: 'var(--latao)' }
  return { estado: 'Fora do eixo', cor: 'var(--ferrugem)' }
}

export function MedidorPrumo({ feito, meta }: { feito: number; meta: number }) {
  const razao = meta > 0 ? feito / meta : 0
  const alvo = anguloDaRazao(razao)
  const [angulo, setAngulo] = useState(0)

  // Sai da vertical e assenta no valor real: o movimento é a leitura acontecendo.
  useEffect(() => {
    const id = requestAnimationFrame(() => setAngulo(alvo))
    return () => cancelAnimationFrame(id)
  }, [alvo])

  const { estado, cor } = leitura(feito, meta)
  const faltam = Math.max(0, meta - feito)

  const ticks = Array.from({ length: 15 }, (_, i) => -ABERTURA + (i * (ABERTURA * 2)) / 14)
  // O arco é desenhado da esquerda para a direita, então parte do ângulo positivo.
  const inicioArco = ponto(ABERTURA, R_INTERNO)
  const fimArco = ponto(-ABERTURA, R_INTERNO)
  const bandaA = ponto(4, R_INTERNO)
  const bandaB = ponto(-4, R_INTERNO)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 280 202" className="w-full max-w-[280px]" role="img"
        aria-label={`${duracao(feito)} de ${duracao(meta)} — ${estado}`}>
        <defs>
          <linearGradient id="latao-peso" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--latao-forte)" />
            <stop offset="55%" stopColor="var(--latao)" />
            <stop offset="100%" stopColor="var(--latao-forte)" />
          </linearGradient>
        </defs>

        {/* escala */}
        <path
          d={`M ${inicioArco.x} ${inicioArco.y} A ${R_INTERNO} ${R_INTERNO} 0 0 1 ${fimArco.x} ${fimArco.y}`}
          fill="none"
          stroke="var(--borda)"
          strokeWidth="1"
        />
        <path
          d={`M ${bandaA.x} ${bandaA.y} A ${R_INTERNO} ${R_INTERNO} 0 0 1 ${bandaB.x} ${bandaB.y}`}
          fill="none"
          stroke="var(--acento)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {ticks.map((t, i) => {
          const maior = i % 7 === 0
          const a = ponto(t, R_INTERNO + (maior ? 0 : 3))
          const b = ponto(t, R_EXTERNO)
          return (
            <line
              key={t}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={maior ? 'var(--borda-forte)' : 'var(--borda)'}
              strokeWidth={maior ? 1.5 : 1}
              strokeLinecap="round"
            />
          )
        })}

        {/* Duas camadas de giro em torno da mesma âncora: a de fora é a leitura
            (vai até o ângulo do dia e fica lá), a de dentro é a inércia do peso,
            que nunca para. Separadas porque uma responde ao dado e a outra não. */}
        <g
          style={{
            transform: `rotate(${angulo}deg)`,
            transformOrigin: `${ANCORA_X}px ${ANCORA_Y}px`,
            transformBox: 'view-box',
            transition: 'transform 1100ms cubic-bezier(0.34, 1.4, 0.5, 1)',
          }}
        >
          <g
            className="prumo-vivo"
            style={{ transformOrigin: `${ANCORA_X}px ${ANCORA_Y}px`, transformBox: 'view-box' }}
          >
          <line
            x1={ANCORA_X}
            y1={ANCORA_Y}
            x2={ANCORA_X}
            y2={106}
            stroke="var(--tinta-3)"
            strokeWidth="1.25"
          />
          <path
            d={`M ${ANCORA_X} 102 L ${ANCORA_X + 12.5} 120 L ${ANCORA_X} 150 L ${ANCORA_X - 12.5} 120 Z`}
            fill="url(#latao-peso)"
          />
          <path
            d={`M ${ANCORA_X} 102 L ${ANCORA_X + 12.5} 120 L ${ANCORA_X} 150 L ${ANCORA_X - 12.5} 120 Z`}
            fill="none"
            stroke="var(--latao-forte)"
            strokeWidth="0.75"
            strokeLinejoin="round"
            opacity="0.7"
          />
          {/* brilho de metal, do lado esquerdo do peso */}
          <path
            d={`M ${ANCORA_X - 4} 112 L ${ANCORA_X - 1} 118 L ${ANCORA_X - 2.5} 140 Z`}
            fill="var(--superficie)"
            opacity="0.3"
          />
          </g>
        </g>

        {/* âncora por cima, para o fio nascer atrás dela */}
        <path
          d={`M ${ANCORA_X - 15} ${ANCORA_Y} h 30`}
          stroke="var(--tinta-2)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* rótulos ancorados nas pontas da escala, não nas bordas do cartão */}
        <text x={inicioArco.x} y="194" textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--tinta-3)">
          atrás
        </text>
        <text x={ANCORA_X} y="194" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--acento)">
          meta
        </text>
        <text x={fimArco.x} y="194" textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--tinta-3)">
          adiantado
        </text>
      </svg>

      <div className="mt-2 text-center">
        <p className="num text-[2.125rem] leading-none font-medium text-tinta">{duracao(feito)}</p>
        <p className="mt-1.5 text-[0.8125rem] text-tinta-3">
          de {duracao(meta)} hoje
          {faltam > 0 && meta > 0 && <> · faltam {duracao(faltam)}</>}
        </p>
        <p className="mt-2.5 text-[0.8125rem] font-semibold" style={{ color: cor }}>
          {estado}
        </p>
      </div>
    </div>
  )
}
