import { useMemo, useState } from 'react'
import { Pause, Pencil, Play, Plus, RotateCcw, Square, Trash2 } from 'lucide-react'
import { useCronometro } from '@/dados/cronometro'
import { useDados } from '@/dados/loja'
import { DialogoSessao } from '@/componentes/dialogos'
import { Botao, BotaoIcone, CabecalhoCartao, Cartao, ConfirmarExclusao, Etiqueta, Selecao, Vazio, cn } from '@/componentes/ui'
import { ATIVIDADES, nomeDaAtividade, tipoDaAtividade } from '@/lib/constantes'
import { formatarMedio, hoje, inicioDaSemana } from '@/lib/datas'
import { duracao, relogio } from '@/lib/formato'
import { diaDaSessao, somaMinutos } from '@/lib/metricas'
import type { Sessao } from '@/lib/tipos'

const ALVOS = [
  { min: 25, nome: '25 min' },
  { min: 50, nome: '50 min' },
  { min: 90, nome: '90 min' },
]

export function Estudar() {
  const { dados, remover, materiaPorId } = useDados()
  const crono = useCronometro()
  const [registro, setRegistro] = useState<Partial<Sessao> | null>(null)
  const [editando, setEditando] = useState<Sessao | null>(null)
  const [apagando, setApagando] = useState<Sessao | null>(null)
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'tudo'>('semana')

  const ativas = dados.materias.filter((m) => !m.arquivada)
  const materiaAtual = crono.estado.materiaId ?? ativas[0]?.id ?? ''
  const tipo = tipoDaAtividade(crono.estado.atividade)

  const historico = useMemo(() => {
    const corte =
      periodo === 'semana' ? inicioDaSemana(hoje()) : periodo === 'mes' ? hoje().slice(0, 8) + '01' : '0000-01-01'
    return dados.sessoes.filter((s) => diaDaSessao(s) >= corte)
  }, [dados.sessoes, periodo])

  const porDia = useMemo(() => {
    const grupos = new Map<string, Sessao[]>()
    for (const s of historico) {
      const d = diaDaSessao(s)
      const lista = grupos.get(d)
      if (lista) lista.push(s)
      else grupos.set(d, [s])
    }
    return [...grupos.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [historico])

  function encerrar() {
    crono.pausar()
    const minutos = Math.max(1, Math.round(crono.segundos / 60))
    setRegistro({
      materia_id: materiaAtual,
      atividade: crono.estado.atividade,
      minutos,
      assunto: crono.estado.assunto || null,
      inicio: new Date(Date.now() - crono.segundos * 1000).toISOString(),
    })
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="display text-[1.75rem] leading-tight text-tinta md:text-[2rem]">Estudar</h1>
        <p className="mt-1.5 text-[0.875rem] text-tinta-3">
          O cronômetro continua contando se você trocar de aba ou travar a tela do celular.
        </p>
      </header>

      {/* --------------------------- o cronômetro --------------------------- */}
      <Cartao className="overflow-hidden">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_minmax(0,20rem)] md:p-7">
          <div className="flex flex-col justify-center">
            <p className="rotulo">{crono.rodando ? 'Rodando' : crono.ativo ? 'Pausado' : 'Pronto'}</p>
            <p
              className={cn(
                'num mt-2 text-[3.5rem] leading-none font-medium tracking-tight tabular-nums md:text-[4.5rem]',
                crono.rodando ? 'text-tinta' : 'text-tinta-2',
              )}
            >
              {relogio(crono.segundos)}
            </p>

            {crono.estado.alvoMin ? (
              <div className="mt-5 max-w-sm">
                <div className="h-[5px] w-full overflow-hidden rounded-full bg-superficie-2">
                  <div
                    className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                    style={{
                      width: `${(crono.progressoAlvo ?? 0) * 100}%`,
                      background: (crono.progressoAlvo ?? 0) >= 1 ? 'var(--broto)' : 'var(--latao)',
                    }}
                  />
                </div>
                <p className="mt-2 text-[0.8125rem] text-tinta-3">
                  {(crono.progressoAlvo ?? 0) >= 1 ? (
                    <span className="font-medium text-broto">Alvo de {duracao(crono.estado.alvoMin)} batido.</span>
                  ) : (
                    <>
                      faltam {duracao(Math.max(0, crono.estado.alvoMin - crono.minutos))} para o alvo de{' '}
                      {duracao(crono.estado.alvoMin)}
                    </>
                  )}
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {crono.rodando ? (
                <Botao aparencia="contorno" tamanho="g" onClick={crono.pausar}>
                  <Pause size={17} /> Pausar
                </Botao>
              ) : (
                <Botao aparencia="solido" tamanho="g" onClick={crono.iniciar} disabled={!ativas.length}>
                  <Play size={17} /> {crono.ativo ? 'Retomar' : 'Começar'}
                </Botao>
              )}
              <Botao aparencia="latao" tamanho="g" onClick={encerrar} disabled={crono.segundos < 30}>
                <Square size={16} /> Encerrar e registrar
              </Botao>
              {crono.ativo && (
                <BotaoIcone rotulo="Zerar o cronômetro" onClick={crono.zerar} className="h-10 w-10">
                  <RotateCcw size={16} />
                </BotaoIcone>
              )}
            </div>

            {crono.segundos < 30 && crono.ativo && (
              <p className="mt-3 text-xs text-tinta-3">Menos de 30 segundos não vira registro.</p>
            )}
            {!ativas.length && (
              <p className="mt-3 text-[0.8125rem] text-ferrugem">
                Cadastre pelo menos uma matéria em Ajustes para começar.
              </p>
            )}
          </div>

          <div className="space-y-3.5 rounded-[12px] border border-borda bg-superficie-2 p-4">
            <Selecao
              rotulo="Matéria"
              value={materiaAtual}
              onChange={(e) => crono.definir({ materiaId: e.target.value })}
            >
              {!ativas.length && <option value="">Nenhuma matéria</option>}
              {ativas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </Selecao>

            <div>
              <Selecao
                rotulo="O que vai fazer"
                value={crono.estado.atividade}
                onChange={(e) => crono.definir({ atividade: e.target.value })}
              >
                <optgroup label="Estudo ativo">
                  {ATIVIDADES.filter((a) => a.tipo === 'ativo').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Estudo passivo">
                  {ATIVIDADES.filter((a) => a.tipo === 'passivo').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </optgroup>
              </Selecao>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-tinta-3">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: tipo === 'ativo' ? 'var(--serie-ativo)' : 'var(--serie-passivo)' }}
                />
                conta como {tipo}
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-[0.8125rem] font-medium text-tinta-2">Alvo</p>
              <div className="flex flex-wrap gap-1.5">
                {ALVOS.map((a) => (
                  <Botao
                    key={a.min}
                    tamanho="p"
                    aparencia={crono.estado.alvoMin === a.min ? 'latao' : 'contorno'}
                    onClick={() =>
                      crono.definir({ alvoMin: crono.estado.alvoMin === a.min ? null : a.min, avisado: false })
                    }
                  >
                    {a.nome}
                  </Botao>
                ))}
                <Botao
                  tamanho="p"
                  aparencia={crono.estado.alvoMin === null ? 'latao' : 'contorno'}
                  onClick={() => crono.definir({ alvoMin: null, avisado: false })}
                >
                  Livre
                </Botao>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[0.8125rem] font-medium text-tinta-2" htmlFor="assunto-crono">
                Assunto
              </label>
              <input
                id="assunto-crono"
                value={crono.estado.assunto}
                onChange={(e) => crono.definir({ assunto: e.target.value })}
                placeholder="Ex.: Termoquímica"
                className="w-full rounded-campo border border-borda-forte bg-superficie px-3 py-2 text-sm text-tinta placeholder:text-tinta-3/70 focus:border-acento focus:outline-none"
              />
            </div>
          </div>
        </div>
      </Cartao>

      {/* ------------------------------ histórico ------------------------------ */}
      <Cartao>
        <CabecalhoCartao
          titulo="Histórico"
          descricao={`${duracao(somaMinutos(historico))} em ${historico.length} sessões`}
          acao={
            <div className="flex items-center gap-2">
              <Selecao
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as typeof periodo)}
                className="h-8 py-0 text-[0.8125rem]"
                aria-label="Período"
              >
                <option value="semana">Esta semana</option>
                <option value="mes">Este mês</option>
                <option value="tudo">Tudo</option>
              </Selecao>
              <Botao tamanho="p" onClick={() => setRegistro({})}>
                <Plus size={14} /> Registrar
              </Botao>
            </div>
          }
        />

        {porDia.length === 0 ? (
          <Vazio
            titulo="Nenhuma sessão no período"
            descricao="Use o cronômetro acima ou registre um estudo que você já fez."
            acao={
              <Botao tamanho="p" onClick={() => setRegistro({})}>
                <Plus size={14} /> Registrar estudo
              </Botao>
            }
          />
        ) : (
          <div className="border-t border-borda">
            {porDia.map(([data, sessoes]) => (
              <section key={data}>
                <div className="flex items-baseline justify-between bg-superficie-2 px-5 py-2">
                  <h3 className="text-[0.8125rem] font-semibold text-tinta-2">{formatarMedio(data)}</h3>
                  <span className="num text-[0.8125rem] text-tinta-3">{duracao(somaMinutos(sessoes))}</span>
                </div>
                <ul className="divide-y divide-borda">
                  {sessoes.map((s) => {
                    const materia = materiaPorId(s.materia_id)
                    return (
                      <li key={s.id} className="group flex items-center gap-3 px-5 py-3">
                        <span
                          className="h-8 w-[3px] shrink-0 rounded-full"
                          style={{ background: materia?.cor ?? 'var(--borda-forte)' }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.875rem] text-tinta">
                            {materia?.nome ?? 'Matéria removida'}
                            {s.assunto && <span className="text-tinta-3"> · {s.assunto}</span>}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Etiqueta
                              cor={s.tipo === 'ativo' ? 'var(--serie-ativo)' : 'var(--serie-passivo)'}
                            >
                              {nomeDaAtividade(s.atividade)}
                            </Etiqueta>
                            {s.anotacao && <span className="truncate text-xs text-tinta-3">{s.anotacao}</span>}
                          </div>
                        </div>
                        <span className="num shrink-0 text-[0.875rem] font-medium text-tinta">
                          {duracao(s.minutos)}
                        </span>
                        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <BotaoIcone rotulo="Editar sessão" onClick={() => setEditando(s)}>
                            <Pencil size={14} />
                          </BotaoIcone>
                          <BotaoIcone rotulo="Apagar sessão" onClick={() => setApagando(s)}>
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

      <DialogoSessao
        aberto={registro !== null}
        aoFechar={() => setRegistro(null)}
        inicial={registro ?? undefined}
        aoSalvar={() => crono.zerar()}
      />
      <DialogoSessao
        aberto={editando !== null}
        aoFechar={() => setEditando(null)}
        inicial={editando ?? undefined}
      />
      <ConfirmarExclusao
        aberto={apagando !== null}
        aoFechar={() => setApagando(null)}
        aoConfirmar={() => apagando && void remover('sessoes', apagando.id)}
        oQue={
          apagando
            ? `A sessão de ${duracao(apagando.minutos)} em ${materiaPorId(apagando.materia_id)?.nome ?? 'matéria removida'}`
            : ''
        }
      />
    </div>
  )
}
