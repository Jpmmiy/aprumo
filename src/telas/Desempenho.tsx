import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useDados } from '@/dados/loja'
import {
  BarraProporcao,
  BarrasHorizontais,
  CalendarioConstancia,
  ColunasDiarias,
  Indicador,
  Legenda,
  LinhasEvolucao,
  MapaEsforco,
  SemDados,
  type SerieLinha,
} from '@/componentes/graficos'
import { DialogoQuestao, DialogoRedacao } from '@/componentes/dialogos'
import { Abas, Botao, BotaoIcone, CabecalhoCartao, Cartao, ConfirmarExclusao, Etiqueta, Vazio } from '@/componentes/ui'
import { BANCAS, COMPETENCIAS_ENEM, COR_BANCA } from '@/lib/constantes'
import { formatarMedio, hoje, somarDias, ultimosDias } from '@/lib/datas'
import { duracao, numero, porcento, taxa } from '@/lib/formato'
import {
  diaDaSessao,
  diagnosticar,
  evolucaoRedacoes,
  mapaEsforcoResultado,
  porMateria,
  resumo,
  sequencia,
  serieDiaria,
  sessoesNoIntervalo,
} from '@/lib/metricas'
import type { Questao, Redacao } from '@/lib/tipos'

const PERIODOS = [
  { id: '7', nome: '7 dias' },
  { id: '28', nome: '28 dias' },
  { id: '90', nome: '90 dias' },
] as const

const CORES_GRAVIDADE = {
  critico: { fundo: 'var(--ferrugem-fraco)', borda: 'var(--ferrugem)', texto: 'var(--ferrugem)' },
  atencao: { fundo: 'var(--latao-fraco)', borda: 'var(--latao)', texto: 'var(--latao-forte)' },
  bom: { fundo: 'var(--acento-fraco)', borda: 'var(--acento)', texto: 'var(--acento)' },
} as const

function corDaTaxa(v: number) {
  return v >= 70 ? 'var(--broto)' : v >= 50 ? 'var(--latao)' : 'var(--ferrugem)'
}

// =========================================================== visão geral ====

function VisaoGeral() {
  const { dados } = useDados()
  const [dias, setDias] = useState<(typeof PERIODOS)[number]['id']>('28')

  const n = Number(dias)
  const de = somarDias(hoje(), -(n - 1))
  const info = useMemo(() => {
    const r = resumo(dados, de, hoje())
    const sessoes = sessoesNoIntervalo(dados.sessoes, de, hoje())
    const questoes = dados.questoes.filter((q) => q.data >= de)
    const ativas = dados.materias.filter((m) => !m.arquivada)
    const linhas = porMateria(ativas, sessoes, questoes, dados.sessoes)
    const listaDias = ultimosDias(n)

    return {
      r,
      pontos: serieDiaria(sessoes, listaDias),
      linhas: linhas.filter((l) => l.minutos > 0 || l.questoes > 0),
      mapa: mapaEsforcoResultado(linhas),
      seq: sequencia(dados.sessoes),
      diagnosticos: diagnosticar(dados),
      calendario: ultimosDias(112).map((d) => ({
        data: d,
        minutos: dados.sessoes.filter((s) => diaDaSessao(s) === d).reduce((t, s) => t + s.minutos, 0),
      })),
    }
  }, [dados, de, n])

  const { r } = info
  const semNada = dados.sessoes.length === 0 && dados.questoes.length === 0

  if (semNada) {
    return (
      <Cartao>
        <Vazio
          titulo="Sem dados ainda"
          descricao="Assim que você registrar estudos e questões, esta tela passa a mostrar onde o seu tempo está indo e o que ele está rendendo."
        />
      </Cartao>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Abas valor={dias} aoTrocar={setDias} opcoes={PERIODOS as unknown as { id: typeof dias; nome: string }[]} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          rotulo="Tempo total"
          valor={duracao(r.minutos)}
          apoio={<>média de {duracao(r.mediaDiaria)} por dia</>}
        />
        <Indicador
          rotulo="Estudo ativo"
          valor={r.pctAtivo === null ? '—' : porcento(r.pctAtivo)}
          cor={r.pctAtivo === null ? undefined : r.pctAtivo >= dados.perfil.meta_ativo_pct ? 'var(--broto)' : 'var(--ferrugem)'}
          apoio={<>meta de {dados.perfil.meta_ativo_pct}%</>}
        />
        <Indicador
          rotulo="Acerto geral"
          valor={r.taxa === null ? '—' : porcento(r.taxa)}
          cor={r.taxa === null ? undefined : corDaTaxa(r.taxa)}
          apoio={<>{numero(r.questoes)} questões</>}
        />
        <Indicador
          rotulo="Dias com estudo"
          valor={`${r.diasEstudados}/${r.totalDeDias}`}
          apoio={<>sequência de {info.seq.atual} · recorde {info.seq.recorde}</>}
        />
      </div>

      {info.diagnosticos.length > 0 && (
        <Cartao>
          <CabecalhoCartao
            titulo="Leitura do período"
            descricao="Ordenado pelo que mais custa caro se ficar como está."
          />
          <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">
            {info.diagnosticos.map((d) => {
              const c = CORES_GRAVIDADE[d.gravidade]
              return (
                <div
                  key={d.id}
                  className="rounded-[12px] border p-4"
                  style={{ background: c.fundo, borderColor: `color-mix(in oklab, ${c.borda} 35%, transparent)` }}
                >
                  <p className="text-[0.875rem] leading-snug font-semibold" style={{ color: c.texto }}>
                    {d.titulo}
                  </p>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-tinta-2">{d.detalhe}</p>
                  <p className="mt-2.5 text-[0.8125rem] font-medium text-tinta">→ {d.acao}</p>
                </div>
              )
            })}
          </div>
        </Cartao>
      )}

      <Cartao>
        <CabecalhoCartao
          titulo={`Horas por dia · ${n} dias`}
          descricao="A linha pontilhada é a sua meta diária."
          acao={<Legenda itens={[{ cor: 'var(--serie-ativo)', nome: 'Ativo' }, { cor: 'var(--serie-passivo)', nome: 'Passivo' }]} />}
        />
        <div className="px-4 pb-5 md:px-5">
          <ColunasDiarias pontos={info.pontos} meta={dados.perfil.meta_min_dia} altura={n > 30 ? 190 : 220} />
        </div>
      </Cartao>

      <div className="grid gap-5 lg:grid-cols-2">
        <Cartao>
          <CabecalhoCartao titulo="Tempo por matéria" descricao="Onde o seu período foi parar." />
          <div className="px-5 pb-5">
            {info.linhas.some((l) => l.minutos > 0) ? (
              <BarrasHorizontais
                itens={[...info.linhas]
                  .filter((l) => l.minutos > 0)
                  .sort((a, b) => b.minutos - a.minutos)
                  .map((l) => ({
                    id: l.materia.id,
                    nome: l.materia.nome,
                    valor: l.minutos,
                    rotulo: duracao(l.minutos),
                  }))}
              />
            ) : (
              <SemDados>Nenhum estudo registrado neste período.</SemDados>
            )}
          </div>
        </Cartao>

        <Cartao>
          <CabecalhoCartao titulo="Acerto por matéria" descricao="A marca dourada é a sua média geral." />
          <div className="px-5 pb-5">
            {info.linhas.some((l) => l.taxa !== null) ? (
              <BarrasHorizontais
                maximo={100}
                itens={[...info.linhas]
                  .filter((l) => l.taxa !== null)
                  .sort((a, b) => (b.taxa ?? 0) - (a.taxa ?? 0))
                  .map((l) => ({
                    id: l.materia.id,
                    nome: l.materia.nome,
                    valor: l.taxa!,
                    rotulo: porcento(l.taxa!),
                    cor: corDaTaxa(l.taxa!),
                    referencia: r.taxa ?? undefined,
                  }))}
              />
            ) : (
              <SemDados>Registre questões para ver a taxa de acerto por matéria.</SemDados>
            )}
          </div>
        </Cartao>
      </div>

      <Cartao>
        <CabecalhoCartao
          titulo="Esforço contra resultado"
          descricao="Cada ponto é uma matéria. O canto de baixo à direita é o que mais precisa de atenção: muito tempo investido, pouco acerto."
        />
        <div className="px-4 pb-5 md:px-5">
          {info.mapa.length >= 2 ? (
            <MapaEsforco
              pontos={info.mapa.map((p) => ({
                id: p.materia.id,
                nome: p.materia.nome,
                x: p.horas,
                y: p.taxa,
                peso: p.questoes,
              }))}
            />
          ) : (
            <SemDados>
              Este mapa aparece quando pelo menos duas matérias tiverem 10 questões ou mais registradas no
              período.
            </SemDados>
          )}
        </div>
      </Cartao>

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,20rem)]">
        <Cartao>
          <CabecalhoCartao titulo="Constância" descricao="Últimas 16 semanas. Cada quadrado é um dia." />
          <div className="px-5 pb-5">
            <CalendarioConstancia dias={info.calendario} meta={dados.perfil.meta_min_dia} />
          </div>
        </Cartao>

        <Cartao>
          <CabecalhoCartao titulo="Ativo x passivo" descricao="A divisão do período." />
          <div className="px-5 pb-5">
            <BarraProporcao
              partes={[
                { nome: 'Ativo', valor: r.ativo, cor: 'var(--serie-ativo)' },
                { nome: 'Passivo', valor: r.passivo, cor: 'var(--serie-passivo)' },
              ]}
              altura={14}
            />
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-[0.8125rem]">
                <span className="inline-flex items-center gap-2 text-tinta-2">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: 'var(--serie-ativo)' }} />
                  Ativo
                </span>
                <span className="num font-medium text-tinta">{duracao(r.ativo)}</span>
              </div>
              <div className="flex items-center justify-between text-[0.8125rem]">
                <span className="inline-flex items-center gap-2 text-tinta-2">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: 'var(--serie-passivo)' }} />
                  Passivo
                </span>
                <span className="num font-medium text-tinta">{duracao(r.passivo)}</span>
              </div>
            </div>
            <p className="mt-4 border-t border-borda pt-3 text-[0.8125rem] leading-relaxed text-tinta-3">
              Exercício, simulado e recordação contam como ativo. Aula, vídeo, leitura e resumo contam como
              passivo.
            </p>
          </div>
        </Cartao>
      </div>
    </div>
  )
}

// =============================================================== questões ===

function TelaQuestoes() {
  const { dados, remover, materiaPorId } = useDados()
  const [novo, setNovo] = useState<Partial<Questao> | null>(null)
  const [apagando, setApagando] = useState<Questao | null>(null)

  const geral = useMemo(() => {
    const total = dados.questoes.reduce((t, q) => t + q.total, 0)
    const acertos = dados.questoes.reduce((t, q) => t + q.acertos, 0)
    const ativas = dados.materias.filter((m) => !m.arquivada)
    const linhas = porMateria(ativas, dados.sessoes, dados.questoes)
    return { total, acertos, t: taxa(acertos, total), linhas: linhas.filter((l) => l.questoes > 0) }
  }, [dados])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Indicador rotulo="Questões feitas" valor={numero(geral.total)} apoio={<>desde o começo</>} />
        <Indicador rotulo="Acertos" valor={numero(geral.acertos)} apoio={<>erros: {numero(geral.total - geral.acertos)}</>} />
        <Indicador
          rotulo="Aproveitamento"
          valor={geral.t === null ? '—' : porcento(geral.t)}
          cor={geral.t === null ? undefined : corDaTaxa(geral.t)}
        />
      </div>

      <Cartao>
        <CabecalhoCartao
          titulo="Acerto por matéria"
          descricao="Histórico completo, não só o período selecionado."
          acao={
            <Botao tamanho="p" onClick={() => setNovo({})}>
              <Plus size={14} /> Registrar
            </Botao>
          }
        />
        <div className="px-5 pb-5">
          {geral.linhas.length ? (
            <BarrasHorizontais
              maximo={100}
              itens={[...geral.linhas]
                .sort((a, b) => (b.taxa ?? 0) - (a.taxa ?? 0))
                .map((l) => ({
                  id: l.materia.id,
                  nome: l.materia.nome,
                  valor: l.taxa ?? 0,
                  rotulo: `${porcento(l.taxa ?? 0)}`,
                  cor: corDaTaxa(l.taxa ?? 0),
                  referencia: geral.t ?? undefined,
                }))}
            />
          ) : (
            <SemDados>Nenhuma questão registrada ainda.</SemDados>
          )}
        </div>
      </Cartao>

      <Cartao>
        <CabecalhoCartao titulo="Registros" descricao={`${dados.questoes.length} lançamentos`} />
        {dados.questoes.length === 0 ? (
          <Vazio
            titulo="Nada registrado"
            descricao="Cada lista de exercícios que você fizer entra aqui, com o total, os acertos e de onde ela veio."
            acao={
              <Botao tamanho="p" onClick={() => setNovo({})}>
                <Plus size={14} /> Registrar questões
              </Botao>
            }
          />
        ) : (
          <ul className="divide-y divide-borda border-t border-borda">
            {dados.questoes.map((q) => {
              const materia = materiaPorId(q.materia_id)
              const t = (q.acertos / q.total) * 100
              return (
                <li key={q.id} className="group flex items-center gap-3 px-5 py-3">
                  <span
                    className="h-8 w-[3px] shrink-0 rounded-full"
                    style={{ background: materia?.cor ?? 'var(--borda-forte)' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.875rem] text-tinta">
                      {materia?.nome ?? 'Matéria removida'}
                      {q.assunto && <span className="text-tinta-3"> · {q.assunto}</span>}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-tinta-3">
                      <span>{formatarMedio(q.data)}</span>
                      {q.origem && <Etiqueta>{q.origem}</Etiqueta>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="num text-[0.875rem] font-medium" style={{ color: corDaTaxa(t) }}>
                      {t.toFixed(0)}%
                    </p>
                    <p className="num text-xs text-tinta-3">
                      {q.acertos}/{q.total}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <BotaoIcone rotulo="Editar registro" onClick={() => setNovo(q)}>
                      <Pencil size={14} />
                    </BotaoIcone>
                    <BotaoIcone rotulo="Apagar registro" onClick={() => setApagando(q)}>
                      <Trash2 size={14} />
                    </BotaoIcone>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Cartao>

      <DialogoQuestao aberto={novo !== null} aoFechar={() => setNovo(null)} inicial={novo ?? undefined} />
      <ConfirmarExclusao
        aberto={apagando !== null}
        aoFechar={() => setApagando(null)}
        aoConfirmar={() => apagando && void remover('questoes', apagando.id)}
        oQue={apagando ? `O registro de ${apagando.acertos}/${apagando.total} questões` : ''}
      />
    </div>
  )
}

// ================================================================ redação ===

function TelaRedacao() {
  const { dados, remover } = useDados()
  const [novo, setNovo] = useState<Partial<Redacao> | null>(null)
  const [apagando, setApagando] = useState<Redacao | null>(null)

  const series = useMemo<SerieLinha[]>(() => {
    const evolucao = evolucaoRedacoes(dados.redacoes)
    return BANCAS.filter((b) => evolucao[b]?.length).map((b) => ({
      id: b,
      nome: b,
      cor: COR_BANCA[b],
      pontos: evolucao[b].map((p) => ({
        data: p.data,
        valor: p.pct,
        bruto: p.nota,
        escala: dados.perfil.escalas[b] ?? 1000,
      })),
    }))
  }, [dados.redacoes, dados.perfil.escalas])

  const porBanca = useMemo(
    () =>
      BANCAS.map((b) => {
        const lista = dados.redacoes.filter((r) => r.banca === b)
        const ultima = lista[0]
        const media = lista.length ? lista.reduce((t, r) => t + r.nota, 0) / lista.length : null
        return { banca: b, lista, ultima, media, escala: dados.perfil.escalas[b] ?? 1000 }
      }),
    [dados.redacoes, dados.perfil.escalas],
  )

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {porBanca.map((b) => (
          <div key={b.banca} className="rounded-cartao border border-borda bg-superficie px-4 py-3.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: COR_BANCA[b.banca] }} />
              <p className="rotulo">{b.banca}</p>
            </div>
            <p className="num mt-1.5 text-[1.5rem] leading-none font-medium text-tinta">
              {b.ultima ? numero(b.ultima.nota, b.escala <= 100 ? 1 : 0) : '—'}
              <span className="text-[0.875rem] text-tinta-3"> / {numero(b.escala)}</span>
            </p>
            <p className="mt-1.5 text-[0.75rem] text-tinta-3">
              {b.lista.length
                ? `${b.lista.length} ${b.lista.length === 1 ? 'redação' : 'redações'} · média ${numero(b.media ?? 0, b.escala <= 100 ? 1 : 0)}`
                : 'nenhuma registrada'}
            </p>
          </div>
        ))}
      </div>

      <Cartao>
        <CabecalhoCartao
          titulo="Evolução"
          descricao="As três bancas usam escalas diferentes, então a linha mostra o aproveitamento em porcentagem — é o único jeito de comparar PUCRS, UFRGS e ENEM no mesmo gráfico."
          acao={
            <Botao tamanho="p" onClick={() => setNovo({})}>
              <Plus size={14} /> Registrar
            </Botao>
          }
        />
        <div className="px-4 pb-5 md:px-5">
          {series.length ? (
            <LinhasEvolucao series={series} />
          ) : (
            <SemDados>
              Registre a primeira redação e a linha começa aqui. Passe o dedo sobre um ponto para ver a nota
              real, não só a porcentagem.
            </SemDados>
          )}
        </div>
      </Cartao>

      <Cartao>
        <CabecalhoCartao titulo="Redações" descricao={`${dados.redacoes.length} registradas`} />
        {dados.redacoes.length === 0 ? (
          <Vazio
            titulo="Nenhuma redação"
            descricao="Guarde o tema, a nota e o que o corretor apontou. O padrão dos apontamentos é o que faz a nota subir."
            acao={
              <Botao tamanho="p" onClick={() => setNovo({})}>
                <Plus size={14} /> Registrar redação
              </Botao>
            }
          />
        ) : (
          <ul className="divide-y divide-borda border-t border-borda">
            {dados.redacoes.map((r) => (
              <li key={r.id} className="group px-5 py-3.5">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-[3px]"
                    style={{ background: COR_BANCA[r.banca] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.875rem] text-tinta">
                      {r.tema || <span className="text-tinta-3">Sem tema anotado</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-tinta-3">
                      {r.banca} · {formatarMedio(r.data)}
                    </p>
                    {r.competencias && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.competencias.map((c, i) => (
                          <span
                            key={i}
                            title={COMPETENCIAS_ENEM[i]}
                            className="num rounded-[6px] border border-borda bg-superficie-2 px-1.5 py-0.5 text-[0.6875rem] text-tinta-2"
                          >
                            C{i + 1} {c}
                          </span>
                        ))}
                      </div>
                    )}
                    {r.observacoes && (
                      <p className="mt-2 text-[0.8125rem] leading-relaxed text-tinta-3">{r.observacoes}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="num text-[1.0625rem] leading-none font-medium text-tinta">
                      {numero(r.nota, r.nota_max <= 100 ? 1 : 0)}
                    </p>
                    <p className="num mt-1 text-xs text-tinta-3">de {numero(r.nota_max)}</p>
                  </div>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <BotaoIcone rotulo="Editar redação" onClick={() => setNovo(r)}>
                      <Pencil size={14} />
                    </BotaoIcone>
                    <BotaoIcone rotulo="Apagar redação" onClick={() => setApagando(r)}>
                      <Trash2 size={14} />
                    </BotaoIcone>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      <DialogoRedacao aberto={novo !== null} aoFechar={() => setNovo(null)} inicial={novo ?? undefined} />
      <ConfirmarExclusao
        aberto={apagando !== null}
        aoFechar={() => setApagando(null)}
        aoConfirmar={() => apagando && void remover('redacoes', apagando.id)}
        oQue={apagando ? `A redação da ${apagando.banca} de ${formatarMedio(apagando.data)}` : ''}
      />
    </div>
  )
}

// ==================================================================== tela ==

export function Desempenho() {
  const [aba, setAba] = useState<'geral' | 'questoes' | 'redacao'>('geral')

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[1.75rem] leading-tight text-tinta md:text-[2rem]">Desempenho</h1>
          <p className="mt-1.5 text-[0.875rem] text-tinta-3">
            Onde o tempo foi, o que ele rendeu e o que ainda não fecha.
          </p>
        </div>
        <Abas
          valor={aba}
          aoTrocar={setAba}
          opcoes={[
            { id: 'geral', nome: 'Visão geral' },
            { id: 'questoes', nome: 'Questões' },
            { id: 'redacao', nome: 'Redação' },
          ]}
        />
      </header>

      {aba === 'geral' && <VisaoGeral />}
      {aba === 'questoes' && <TelaQuestoes />}
      {aba === 'redacao' && <TelaRedacao />}
    </div>
  )
}
