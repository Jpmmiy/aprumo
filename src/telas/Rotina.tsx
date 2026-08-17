import { useEffect, useMemo, useState } from 'react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { useDados } from '@/dados/loja'
import {
  Abas,
  AreaTexto,
  Botao,
  BotaoIcone,
  CabecalhoCartao,
  Cartao,
  Campo,
  ConfirmarExclusao,
  Etiqueta,
  Modal,
  Selecao,
  Vazio,
  cn,
} from '@/componentes/ui'
import { DIAS_CURTOS, DIAS_SEMANA, PRIORIDADES } from '@/lib/constantes'
import { diaDaSemana, formatarMedio, hoje, horaParaMinutos, minutosParaHora, rotuloRelativo, somarDias } from '@/lib/datas'
import { duracao } from '@/lib/formato'
import type { Aula, Prioridade, Tarefa } from '@/lib/tipos'

const DIAS_UTEIS = [1, 2, 3, 4, 5, 6, 0]

// ============================================================ diálogo aula ==

function DialogoAula({
  aberto,
  aoFechar,
  inicial,
  aoApagar,
}: {
  aberto: boolean
  aoFechar: () => void
  inicial?: Partial<Aula>
  aoApagar?: () => void
}) {
  const { dados, salvar } = useDados()
  const ativas = dados.materias.filter((m) => !m.arquivada)

  const [dia, setDia] = useState(1)
  const [inicio, setInicio] = useState('07:30')
  const [fim, setFim] = useState('09:10')
  const [materiaId, setMateriaId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [professor, setProfessor] = useState('')
  const [local, setLocal] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setDia(inicial?.dia ?? 1)
    setInicio(inicial?.inicio ?? '07:30')
    setFim(inicial?.fim ?? '09:10')
    setMateriaId(inicial?.materia_id ?? '')
    setTitulo(inicial?.titulo ?? '')
    setProfessor(inicial?.professor ?? '')
    setLocal(inicial?.local ?? '')
    setErro(null)
  }, [aberto, inicial])

  async function confirmar() {
    setErro(null)
    if (horaParaMinutos(fim) <= horaParaMinutos(inicio)) return setErro('O fim precisa vir depois do começo.')
    const nome = titulo.trim() || ativas.find((m) => m.id === materiaId)?.nome || ''
    if (!nome) return setErro('Dê um nome à aula ou escolha a matéria.')

    setEnviando(true)
    try {
      await salvar('aulas', {
        ...(inicial?.id ? { id: inicial.id } : {}),
        dia,
        inicio,
        fim,
        materia_id: materiaId || null,
        titulo: nome,
        professor: professor.trim() || null,
        local: local.trim() || null,
      })
      aoFechar()
    } catch (e) {
      setErro((e as { message?: string }).message ?? 'Não consegui salvar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={inicial?.id ? 'Editar aula' : 'Nova aula'}
      descricao="A aula se repete toda semana neste dia e horário."
      rodape={
        <>
          {inicial?.id && aoApagar && (
            <Botao aparencia="perigo" onClick={aoApagar} className="mr-auto">
              <Trash2 size={14} /> Apagar
            </Botao>
          )}
          <Botao aparencia="fantasma" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao aparencia="solido" onClick={confirmar} disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar'}
          </Botao>
        </>
      }
    >
      <div className="space-y-4">
        <Selecao rotulo="Dia da semana" value={dia} onChange={(e) => setDia(Number(e.target.value))}>
          {DIAS_UTEIS.map((d) => (
            <option key={d} value={d}>
              {DIAS_SEMANA[d]}
            </option>
          ))}
        </Selecao>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Começa" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          <Campo rotulo="Termina" type="time" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>

        <Selecao rotulo="Matéria" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
          <option value="">Sem matéria (ex.: plantão, monitoria)</option>
          {ativas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </Selecao>

        <Campo
          rotulo="Nome da aula"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder={ativas.find((m) => m.id === materiaId)?.nome ?? 'Ex.: Biologia — Citologia'}
          dica="Deixe em branco para usar o nome da matéria."
        />

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Professor" value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="opcional" />
          <Campo rotulo="Sala" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="opcional" />
        </div>

        {erro && <p className="text-[0.8125rem] text-ferrugem">{erro}</p>}
      </div>
    </Modal>
  )
}

// ============================================================== grade =======

function Grade() {
  const { dados, remover, materiaPorId } = useDados()
  const [editando, setEditando] = useState<Partial<Aula> | null>(null)
  const [apagando, setApagando] = useState<Aula | null>(null)

  const diaHoje = diaDaSemana(hoje())

  const { limites, porDia, totalSemana } = useMemo(() => {
    const inicios = dados.aulas.map((a) => horaParaMinutos(a.inicio))
    const fins = dados.aulas.map((a) => horaParaMinutos(a.fim))
    const min = inicios.length ? Math.floor(Math.min(...inicios) / 60) * 60 : 420
    const max = fins.length ? Math.ceil(Math.max(...fins) / 60) * 60 : 1320
    const mapa = new Map<number, Aula[]>()
    for (const a of dados.aulas) {
      const lista = mapa.get(a.dia)
      if (lista) lista.push(a)
      else mapa.set(a.dia, [a])
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.inicio.localeCompare(b.inicio))
    return {
      limites: { min: Math.min(min, max - 120), max },
      porDia: mapa,
      totalSemana: dados.aulas.reduce((t, a) => t + (horaParaMinutos(a.fim) - horaParaMinutos(a.inicio)), 0),
    }
  }, [dados.aulas])

  const span = limites.max - limites.min
  const ALTURA = Math.max(420, (span / 60) * 56)
  const horas = Array.from({ length: Math.floor(span / 60) + 1 }, (_, i) => limites.min + i * 60)
  const diasVisiveis = DIAS_UTEIS.filter((d) => d !== 0 || porDia.has(0))

  return (
    <>
      <Cartao>
        <CabecalhoCartao
          titulo="Grade do cursinho"
          descricao={
            dados.aulas.length
              ? `${dados.aulas.length} aulas por semana · ${duracao(totalSemana)} em sala`
              : 'Monte uma vez e ela vale para todas as semanas.'
          }
          acao={
            <Botao tamanho="p" onClick={() => setEditando({})}>
              <Plus size={14} /> Nova aula
            </Botao>
          }
        />

        {dados.aulas.length === 0 ? (
          <Vazio
            titulo="Grade vazia"
            descricao="Coloque os horários do cursinho aqui. Depois o app mostra as aulas do dia no painel e conta quanto tempo de sala você tem por semana."
            acao={
              <Botao tamanho="p" onClick={() => setEditando({})}>
                <Plus size={14} /> Adicionar a primeira aula
              </Botao>
            }
          />
        ) : (
          <>
            {/* ------- tabela de verdade, para telas grandes ------- */}
            <div className="hidden overflow-x-auto px-5 pb-5 md:block">
              <div className="min-w-[640px]">
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `3.25rem repeat(${diasVisiveis.length}, minmax(0,1fr))` }}
                >
                  <div />
                  {diasVisiveis.map((d) => (
                    <div
                      key={d}
                      className={cn(
                        'rounded-[8px] py-1.5 text-center text-[0.8125rem] font-semibold',
                        d === diaHoje ? 'bg-acento-fraco text-tinta' : 'text-tinta-3',
                      )}
                    >
                      {DIAS_CURTOS[d]}
                    </div>
                  ))}
                </div>

                <div
                  className="relative mt-1 grid gap-1"
                  style={{
                    gridTemplateColumns: `3.25rem repeat(${diasVisiveis.length}, minmax(0,1fr))`,
                    height: ALTURA,
                  }}
                >
                  {/* eixo das horas */}
                  <div className="relative">
                    {horas.map((h) => (
                      <span
                        key={h}
                        className="num absolute right-2 -translate-y-1/2 text-[0.6875rem] text-tinta-3"
                        style={{ top: `${((h - limites.min) / span) * 100}%` }}
                      >
                        {minutosParaHora(h)}
                      </span>
                    ))}
                  </div>

                  {diasVisiveis.map((d) => (
                    <div
                      key={d}
                      className={cn(
                        'relative rounded-[10px] border border-borda',
                        d === diaHoje ? 'bg-superficie-2' : 'bg-superficie',
                      )}
                    >
                      {horas.map((h) => (
                        <span
                          key={h}
                          className="absolute inset-x-0 border-t border-borda/70"
                          style={{ top: `${((h - limites.min) / span) * 100}%` }}
                          aria-hidden="true"
                        />
                      ))}

                      {(porDia.get(d) ?? []).map((a) => {
                        const ini = horaParaMinutos(a.inicio)
                        const fim = horaParaMinutos(a.fim)
                        const materia = materiaPorId(a.materia_id)
                        const cor = materia?.cor ?? 'var(--acento)'
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setEditando(a)}
                            className="absolute inset-x-1 overflow-hidden rounded-[8px] border-l-[3px] px-2 py-1.5 text-left transition-shadow hover:shadow-medio"
                            style={{
                              top: `${((ini - limites.min) / span) * 100}%`,
                              height: `${((fim - ini) / span) * 100}%`,
                              borderLeftColor: cor,
                              background: `color-mix(in oklab, ${cor} 14%, var(--superficie))`,
                            }}
                          >
                            <span className="block truncate text-[0.75rem] leading-tight font-semibold text-tinta">
                              {a.titulo}
                            </span>
                            <span className="num block truncate text-[0.6875rem] text-tinta-3">
                              {a.inicio}–{a.fim}
                            </span>
                            {a.professor && (
                              <span className="block truncate text-[0.6875rem] text-tinta-3">{a.professor}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ------- lista por dia, no celular ------- */}
            <div className="divide-y divide-borda border-t border-borda md:hidden">
              {diasVisiveis
                .filter((d) => porDia.has(d))
                .map((d) => (
                  <section key={d}>
                    <h3
                      className={cn(
                        'px-5 py-2 text-[0.8125rem] font-semibold',
                        d === diaHoje ? 'bg-acento-fraco text-tinta' : 'bg-superficie-2 text-tinta-2',
                      )}
                    >
                      {DIAS_SEMANA[d]}
                      {d === diaHoje && <span className="ml-2 text-[0.6875rem] font-medium text-acento">hoje</span>}
                    </h3>
                    <ul>
                      {(porDia.get(d) ?? []).map((a) => {
                        const materia = materiaPorId(a.materia_id)
                        return (
                          <li key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                            <span className="num w-[3.25rem] shrink-0 text-[0.8125rem] text-tinta-2">{a.inicio}</span>
                            <span
                              className="h-9 w-[3px] shrink-0 rounded-full"
                              style={{ background: materia?.cor ?? 'var(--acento)' }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[0.875rem] text-tinta">{a.titulo}</p>
                              <p className="num truncate text-xs text-tinta-3">
                                até {a.fim}
                                {a.professor && ` · ${a.professor}`}
                                {a.local && ` · ${a.local}`}
                              </p>
                            </div>
                            <BotaoIcone rotulo="Editar aula" onClick={() => setEditando(a)}>
                              <Pencil size={14} />
                            </BotaoIcone>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))}
            </div>
          </>
        )}
      </Cartao>

      <DialogoAula
        aberto={editando !== null}
        aoFechar={() => setEditando(null)}
        inicial={editando ?? undefined}
        aoApagar={() => setApagando(editando as Aula)}
      />
      <ConfirmarExclusao
        aberto={apagando !== null}
        aoFechar={() => setApagando(null)}
        aoConfirmar={() => {
          if (apagando) void remover('aulas', apagando.id)
          setEditando(null)
        }}
        oQue={apagando ? `A aula "${apagando.titulo}"` : ''}
      />
    </>
  )
}

// ========================================================= diálogo tarefa ===

function DialogoTarefa({
  aberto,
  aoFechar,
  inicial,
}: {
  aberto: boolean
  aoFechar: () => void
  inicial?: Partial<Tarefa>
}) {
  const { dados, salvar } = useDados()
  const ativas = dados.materias.filter((m) => !m.arquivada)

  const [titulo, setTitulo] = useState('')
  const [detalhe, setDetalhe] = useState('')
  const [data, setData] = useState<string>(hoje())
  const [prioridade, setPrioridade] = useState<Prioridade>('media')
  const [materiaId, setMateriaId] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setTitulo(inicial?.titulo ?? '')
    setDetalhe(inicial?.detalhe ?? '')
    setData(inicial?.data ?? hoje())
    setPrioridade((inicial?.prioridade as Prioridade) ?? 'media')
    setMateriaId(inicial?.materia_id ?? '')
    setErro(null)
  }, [aberto, inicial])

  async function confirmar() {
    setErro(null)
    if (!titulo.trim()) return setErro('Escreva o que precisa ser feito.')
    setEnviando(true)
    try {
      await salvar('tarefas', {
        ...(inicial?.id ? { id: inicial.id } : {}),
        titulo: titulo.trim(),
        detalhe: detalhe.trim() || null,
        data: data || null,
        prioridade,
        materia_id: materiaId || null,
        ...(inicial?.id ? {} : { ordem: Date.now() % 2147483647, concluida: false }),
      })
      aoFechar()
    } catch (e) {
      setErro((e as { message?: string }).message ?? 'Não consegui salvar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={inicial?.id ? 'Editar tarefa' : 'Nova tarefa'}
      rodape={
        <>
          <Botao aparencia="fantasma" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao aparencia="solido" onClick={confirmar} disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar'}
          </Botao>
        </>
      }
    >
      <div className="space-y-4">
        <Campo
          rotulo="O que precisa ser feito"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Terminar a lista de Química orgânica"
        />
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Para quando" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <Selecao
            rotulo="Prioridade"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as Prioridade)}
          >
            {PRIORIDADES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Selecao>
        </div>
        <Selecao rotulo="Matéria" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
          <option value="">Nenhuma</option>
          {ativas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </Selecao>
        <AreaTexto
          rotulo="Detalhe"
          rows={2}
          value={detalhe}
          onChange={(e) => setDetalhe(e.target.value)}
          placeholder="opcional"
        />
        {erro && <p className="text-[0.8125rem] text-ferrugem">{erro}</p>}
      </div>
    </Modal>
  )
}

// ============================================================== a fazer =====

function AFazer() {
  const { dados, salvar, remover, materiaPorId } = useDados()
  const [editando, setEditando] = useState<Partial<Tarefa> | null>(null)
  const [apagando, setApagando] = useState<Tarefa | null>(null)

  const grupos = useMemo(() => {
    const dia = hoje()
    const amanha = somarDias(dia, 1)
    const abertas = dados.tarefas.filter((t) => !t.concluida)
    const feitas = dados.tarefas.filter((t) => t.concluida)

    return [
      { id: 'atrasadas', nome: 'Atrasadas', itens: abertas.filter((t) => t.data && t.data < dia) },
      { id: 'hoje', nome: 'Hoje', itens: abertas.filter((t) => t.data === dia) },
      { id: 'amanha', nome: 'Amanhã', itens: abertas.filter((t) => t.data === amanha) },
      { id: 'depois', nome: 'Mais para frente', itens: abertas.filter((t) => t.data && t.data > amanha) },
      { id: 'semdata', nome: 'Sem data', itens: abertas.filter((t) => !t.data) },
      { id: 'feitas', nome: 'Concluídas', itens: feitas.slice(0, 20) },
    ].filter((g) => g.itens.length)
  }, [dados.tarefas])

  const abertas = dados.tarefas.filter((t) => !t.concluida).length

  return (
    <>
      <Cartao>
        <CabecalhoCartao
          titulo="A fazer"
          descricao={abertas ? `${abertas} em aberto` : 'nada pendente'}
          acao={
            <Botao tamanho="p" onClick={() => setEditando({})}>
              <Plus size={14} /> Nova tarefa
            </Botao>
          }
        />

        {grupos.length === 0 ? (
          <Vazio
            titulo="Lista limpa"
            descricao="Escreva as tarefas do dia aqui. Poucas e concretas funcionam melhor que uma lista comprida que ninguém termina."
            acao={
              <Botao tamanho="p" onClick={() => setEditando({})}>
                <Plus size={14} /> Adicionar tarefa
              </Botao>
            }
          />
        ) : (
          <div className="border-t border-borda">
            {grupos.map((g) => (
              <section key={g.id}>
                <h3
                  className={cn(
                    'flex items-baseline justify-between px-5 py-2 text-[0.8125rem] font-semibold',
                    g.id === 'atrasadas' ? 'bg-ferrugem-fraco text-ferrugem' : 'bg-superficie-2 text-tinta-2',
                  )}
                >
                  {g.nome}
                  <span className="num text-xs font-normal text-tinta-3">{g.itens.length}</span>
                </h3>
                <ul className="divide-y divide-borda">
                  {g.itens.map((t) => {
                    const materia = materiaPorId(t.materia_id)
                    const p = PRIORIDADES.find((x) => x.id === t.prioridade)
                    const relativo = t.data ? rotuloRelativo(t.data) : null
                    return (
                      <li key={t.id} className="group flex items-start gap-3 px-5 py-3">
                        <button
                          type="button"
                          aria-label={t.concluida ? 'Reabrir tarefa' : 'Concluir tarefa'}
                          onClick={() => void salvar('tarefas', { id: t.id, concluida: !t.concluida })}
                          className={cn(
                            'mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] border transition-colors',
                            t.concluida
                              ? 'border-acento bg-acento text-acento-tinta'
                              : 'border-borda-forte hover:border-acento',
                          )}
                        >
                          {t.concluida && <Check size={12} strokeWidth={3} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-[0.875rem] leading-snug',
                              t.concluida ? 'text-tinta-3 line-through' : 'text-tinta',
                            )}
                          >
                            {t.titulo}
                          </p>
                          {t.detalhe && <p className="mt-0.5 text-[0.8125rem] text-tinta-3">{t.detalhe}</p>}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {materia && <Etiqueta cor={materia.cor}>{materia.nome}</Etiqueta>}
                            {!t.concluida && t.prioridade !== 'baixa' && p && <Etiqueta cor={p.cor}>{p.nome}</Etiqueta>}
                            {t.data && (
                              <span className="text-[0.6875rem] text-tinta-3">
                                {relativo ?? formatarMedio(t.data)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <BotaoIcone rotulo="Editar tarefa" onClick={() => setEditando(t)}>
                            <Pencil size={14} />
                          </BotaoIcone>
                          <BotaoIcone rotulo="Apagar tarefa" onClick={() => setApagando(t)}>
                            <Trash2 size={14} />
                          </BotaoIcone>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Cartao>

      <DialogoTarefa aberto={editando !== null} aoFechar={() => setEditando(null)} inicial={editando ?? undefined} />
      <ConfirmarExclusao
        aberto={apagando !== null}
        aoFechar={() => setApagando(null)}
        aoConfirmar={() => apagando && void remover('tarefas', apagando.id)}
        oQue={apagando ? `A tarefa "${apagando.titulo}"` : ''}
      />
    </>
  )
}

// ==================================================================== tela ==

export function Rotina() {
  const [aba, setAba] = useState<'grade' | 'fazer'>('grade')

  return (
    <div className="space-y-5 pilha-entrada">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[1.75rem] leading-tight text-tinta md:text-[2rem]">Rotina</h1>
          <p className="mt-1.5 text-[0.875rem] text-tinta-3">
            A grade fixa do cursinho e o que precisa sair do papel hoje.
          </p>
        </div>
        <Abas
          valor={aba}
          aoTrocar={setAba}
          opcoes={[
            { id: 'grade', nome: 'Grade' },
            { id: 'fazer', nome: 'A fazer' },
          ]}
        />
      </header>

      {aba === 'grade' ? <Grade /> : <AFazer />}
    </div>
  )
}
