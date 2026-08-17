import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ListChecks, Plus, Sparkle, Timer } from 'lucide-react'
import { useDados } from '@/dados/loja'
import { useCronometro } from '@/dados/cronometro'
import { MedidorPrumo } from '@/componentes/MedidorPrumo'
import { ColunasDiarias, Indicador, Legenda, SemDados } from '@/componentes/graficos'
import { DialogoQuestao, DialogoSessao } from '@/componentes/dialogos'
import { Botao, CabecalhoCartao, Cartao, Etiqueta, Vazio, cn } from '@/componentes/ui'
import { agoraEmMinutos, diaDaSemana, formatarCompleto, hoje, horaParaMinutos, ultimosDias } from '@/lib/datas'
import { duracao, numero, porcento, primeiroNome, saudacao, taxa } from '@/lib/formato'
import { diaDaSessao, diagnosticar, sequencia, serieDiaria, sessoesNoIntervalo, somaMinutos } from '@/lib/metricas'
import { nomeDaAtividade } from '@/lib/constantes'
import { TelaCarregando } from '@/componentes/Casca'

const CORES_GRAVIDADE = {
  critico: { fundo: 'var(--ferrugem-fraco)', borda: 'var(--ferrugem)', texto: 'var(--ferrugem)' },
  atencao: { fundo: 'var(--latao-fraco)', borda: 'var(--latao)', texto: 'var(--latao-forte)' },
  bom: { fundo: 'var(--acento-fraco)', borda: 'var(--acento)', texto: 'var(--acento)' },
} as const

export function Hoje() {
  const { dados, carregando, erro, salvar, materiaPorId } = useDados()
  const { rodando } = useCronometro()
  const [abrirSessao, setAbrirSessao] = useState(false)
  const [abrirQuestao, setAbrirQuestao] = useState(false)

  const dia = hoje()

  const painel = useMemo(() => {
    const sessoesHoje = dados.sessoes.filter((s) => diaDaSessao(s) === dia)
    const questoesHoje = dados.questoes.filter((q) => q.data === dia)
    const totalQ = questoesHoje.reduce((t, q) => t + q.total, 0)
    const acertosQ = questoesHoje.reduce((t, q) => t + q.acertos, 0)
    const minutos = somaMinutos(sessoesHoje)
    const ativo = somaMinutos(sessoesHoje, 'ativo')

    const dias14 = ultimosDias(14)
    const pontos = serieDiaria(sessoesNoIntervalo(dados.sessoes, dias14[0], dia), dias14)

    const hojeSemana = diaDaSemana(dia)
    const agora = agoraEmMinutos()
    const aulasHoje = dados.aulas
      .filter((a) => a.dia === hojeSemana)
      .sort((a, b) => a.inicio.localeCompare(b.inicio))

    const tarefasHoje = dados.tarefas.filter((t) => !t.data || t.data <= dia)
    const proximaProva = dados.provas.find((p) => p.data >= dia)

    return {
      sessoesHoje,
      minutos,
      ativo,
      totalQ,
      acertosQ,
      pontos,
      aulasHoje,
      agora,
      tarefasHoje,
      proximaProva,
      seq: sequencia(dados.sessoes),
      diagnosticos: diagnosticar(dados),
    }
  }, [dados, dia])

  if (carregando) return <TelaCarregando mensagem="Buscando seus dados" />

  if (erro) {
    return (
      <Cartao className="p-6">
        <h1 className="display text-lg text-tinta">Não consegui carregar seus dados</h1>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-tinta-2">{erro}</p>
        <p className="mt-3 text-[0.8125rem] text-tinta-3">
          Se o navegador estiver em janela anônima ou com armazenamento bloqueado, o app não consegue
          guardar nada. Abra numa janela normal.
        </p>
      </Cartao>
    )
  }

  const meta = dados.perfil.meta_min_dia
  const nome = primeiroNome(dados.perfil.nome)
  const pctAtivo = painel.minutos ? (painel.ativo / painel.minutos) * 100 : null
  const taxaHoje = taxa(painel.acertosQ, painel.totalQ)

  return (
    <div className="space-y-5">
      {/* ------------------------------- cabeçalho ------------------------------- */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rotulo">{formatarCompleto(dia)}</p>
          <h1 className="display mt-1.5 text-[1.75rem] leading-tight text-tinta md:text-[2rem]">
            {saudacao()}
            {nome && <>, {nome}</>}.
          </h1>
        </div>
        {painel.seq.atual > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-latao/30 bg-latao-fraco px-3.5 py-1.5">
            <Sparkle size={14} className="text-latao" />
            <span className="text-[0.8125rem] font-medium text-latao-forte">
              <span className="num">{painel.seq.atual}</span> {painel.seq.atual === 1 ? 'dia' : 'dias'} seguidos
            </span>
          </div>
        )}
      </header>

      {/* ------------------------- prumo + ações do dia ------------------------- */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
        <Cartao className="flex flex-col items-center px-5 pt-6 pb-6">
          <p className="rotulo mb-1">O prumo de hoje</p>
          <MedidorPrumo feito={painel.minutos} meta={meta} />
        </Cartao>

        <div className="flex flex-col gap-4">
          <Cartao className="p-4 sm:p-5">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              <Botao
                aparencia="solido"
                tamanho="g"
                onClick={() => setAbrirSessao(true)}
                className="w-full whitespace-nowrap sm:w-auto"
              >
                <Plus size={17} /> Registrar estudo
              </Botao>
              <div className="grid grid-cols-2 gap-2.5 sm:contents">
                <Link to="/estudar" className="min-w-0">
                  <Botao
                    aparencia={rodando ? 'latao' : 'contorno'}
                    tamanho="g"
                    className="w-full whitespace-nowrap"
                  >
                    <Timer size={17} /> {rodando ? 'Rodando' : 'Cronômetro'}
                  </Botao>
                </Link>
                <Botao
                  aparencia="contorno"
                  tamanho="g"
                  onClick={() => setAbrirQuestao(true)}
                  className="w-full whitespace-nowrap sm:w-auto"
                >
                  <ListChecks size={17} /> Questões
                </Botao>
              </div>
            </div>
          </Cartao>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador
              rotulo="Estudo hoje"
              valor={duracao(painel.minutos)}
              apoio={
                meta > 0 ? (
                  <>meta de {duracao(meta)}</>
                ) : (
                  <>sem meta definida</>
                )
              }
            />
            <Indicador
              rotulo="Ativo"
              valor={pctAtivo === null ? '—' : porcento(pctAtivo)}
              cor={
                pctAtivo === null
                  ? undefined
                  : pctAtivo >= dados.perfil.meta_ativo_pct
                    ? 'var(--broto)'
                    : 'var(--ferrugem)'
              }
              apoio={<>de {duracao(painel.minutos)} no total</>}
            />
            <Indicador
              rotulo="Questões"
              valor={numero(painel.totalQ)}
              apoio={taxaHoje === null ? <>nenhuma hoje</> : <>{porcento(taxaHoje)} de acerto</>}
            />
            <Indicador
              rotulo="Próxima prova"
              valor={
                painel.proximaProva
                  ? `${Math.max(0, Math.ceil((new Date(painel.proximaProva.data + 'T00:00:00').getTime() - new Date(dia + 'T00:00:00').getTime()) / 86400000))}d`
                  : '—'
              }
              apoio={
                painel.proximaProva ? (
                  <>{painel.proximaProva.nome}</>
                ) : (
                  <Link to="/ajustes" className="underline underline-offset-2">
                    cadastrar datas
                  </Link>
                )
              }
            />
          </div>
        </div>
      </div>

      {/* ----------------------------- diagnóstico ----------------------------- */}
      {painel.diagnosticos.length > 0 && (
        <Cartao>
          <CabecalhoCartao
            titulo="O que os números estão dizendo"
            descricao="Leitura dos últimos 28 dias, atualizada a cada registro."
            acao={
              <Link to="/desempenho">
                <Botao tamanho="p" aparencia="fantasma">
                  Ver tudo <ArrowRight size={14} />
                </Botao>
              </Link>
            }
          />
          <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">
            {painel.diagnosticos.slice(0, 2).map((d) => {
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

      {/* --------------------------- tarefas + agenda --------------------------- */}
      <div className="grid gap-5 md:grid-cols-2">
        <Cartao className="flex flex-col">
          <CabecalhoCartao
            titulo="A fazer"
            descricao={`${painel.tarefasHoje.filter((t) => !t.concluida).length} em aberto`}
            acao={
              <Link to="/rotina">
                <Botao tamanho="p" aparencia="fantasma">
                  Abrir
                </Botao>
              </Link>
            }
          />
          <div className="flex-1 px-2 pb-3">
            {painel.tarefasHoje.length === 0 ? (
              <Vazio
                titulo="Nada na lista"
                descricao="Escreva as três coisas que precisam sair hoje. Três, não dez."
                acao={
                  <Link to="/rotina">
                    <Botao tamanho="p">
                      <Plus size={14} /> Adicionar
                    </Botao>
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-0.5">
                {painel.tarefasHoje.slice(0, 6).map((t) => {
                  const materia = materiaPorId(t.materia_id)
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => void salvar('tarefas', { id: t.id, concluida: !t.concluida })}
                        className="flex w-full items-start gap-3 rounded-[10px] px-3 py-2 text-left transition-colors hover:bg-superficie-2"
                      >
                        <span
                          className={cn(
                            'mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] border transition-colors',
                            t.concluida ? 'border-acento bg-acento text-acento-tinta' : 'border-borda-forte',
                          )}
                        >
                          {t.concluida && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              'block text-[0.875rem] leading-snug',
                              t.concluida ? 'text-tinta-3 line-through' : 'text-tinta',
                            )}
                          >
                            {t.titulo}
                          </span>
                          {materia && (
                            <span className="mt-1 inline-flex">
                              <Etiqueta cor={materia.cor}>{materia.nome}</Etiqueta>
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Cartao>

        <Cartao className="flex flex-col">
          <CabecalhoCartao
            titulo="Cursinho hoje"
            descricao={painel.aulasHoje.length ? `${painel.aulasHoje.length} aulas` : 'sem aula marcada'}
            acao={
              <Link to="/rotina">
                <Botao tamanho="p" aparencia="fantasma">
                  Grade
                </Botao>
              </Link>
            }
          />
          <div className="flex-1 px-5 pb-5">
            {painel.aulasHoje.length === 0 ? (
              <Vazio
                titulo="Dia livre de aula"
                descricao="Se a grade do cursinho ainda não está no app, cadastre uma vez e ela se repete toda semana."
                acao={
                  <Link to="/rotina">
                    <Botao tamanho="p">
                      <Plus size={14} /> Montar grade
                    </Botao>
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-1">
                {painel.aulasHoje.map((a) => {
                  const materia = materiaPorId(a.materia_id)
                  const fim = horaParaMinutos(a.fim)
                  const inicio = horaParaMinutos(a.inicio)
                  const agora = painel.agora >= inicio && painel.agora < fim
                  const passou = painel.agora >= fim
                  return (
                    <li
                      key={a.id}
                      className={cn(
                        'flex items-center gap-3 rounded-[10px] px-3 py-2',
                        agora && 'bg-latao-fraco',
                        passou && 'opacity-45',
                      )}
                    >
                      <span className="num w-[3.25rem] shrink-0 text-[0.8125rem] font-medium text-tinta-2">
                        {a.inicio}
                      </span>
                      <span
                        className="h-8 w-[3px] shrink-0 rounded-full"
                        style={{ background: materia?.cor ?? 'var(--borda-forte)' }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.875rem] text-tinta">
                          {a.titulo || materia?.nome || 'Aula'}
                        </span>
                        {a.professor && <span className="block truncate text-xs text-tinta-3">{a.professor}</span>}
                      </span>
                      {agora && <span className="text-[0.6875rem] font-semibold text-latao-forte">agora</span>}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Cartao>
      </div>

      {/* ---------------------------- últimos 14 dias ---------------------------- */}
      <Cartao>
        <CabecalhoCartao
          titulo="Últimos 14 dias"
          descricao="A coluna inteira é o tempo do dia; a parte de baixo é a que rende."
          acao={<Legenda itens={[{ cor: 'var(--serie-ativo)', nome: 'Ativo' }, { cor: 'var(--serie-passivo)', nome: 'Passivo' }]} />}
        />
        <div className="px-4 pb-5 md:px-5">
          {dados.sessoes.length === 0 ? (
            <SemDados>
              Ainda não há nada para desenhar. Registre a primeira sessão de estudo e o gráfico começa a
              existir a partir de hoje.
            </SemDados>
          ) : (
            <ColunasDiarias pontos={painel.pontos} meta={meta} />
          )}
        </div>
      </Cartao>

      {/* ---------------------------- sessões de hoje ---------------------------- */}
      {painel.sessoesHoje.length > 0 && (
        <Cartao>
          <CabecalhoCartao titulo="O que você fez hoje" descricao={`${duracao(painel.minutos)} em ${painel.sessoesHoje.length} sessões`} />
          <ul className="divide-y divide-borda border-t border-borda">
            {painel.sessoesHoje.map((s) => {
              const materia = materiaPorId(s.materia_id)
              return (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: materia?.cor ?? 'var(--borda-forte)' }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.875rem] text-tinta">
                      {materia?.nome ?? 'Matéria removida'}
                      {s.assunto && <span className="text-tinta-3"> · {s.assunto}</span>}
                    </span>
                    <span className="text-xs text-tinta-3">{nomeDaAtividade(s.atividade)}</span>
                  </span>
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: s.tipo === 'ativo' ? 'var(--serie-ativo)' : 'var(--serie-passivo)' }}
                    title={s.tipo}
                  />
                  <span className="num shrink-0 text-[0.8125rem] font-medium text-tinta">{duracao(s.minutos)}</span>
                </li>
              )
            })}
          </ul>
        </Cartao>
      )}

      <DialogoSessao aberto={abrirSessao} aoFechar={() => setAbrirSessao(false)} />
      <DialogoQuestao aberto={abrirQuestao} aoFechar={() => setAbrirQuestao(false)} />
    </div>
  )
}
