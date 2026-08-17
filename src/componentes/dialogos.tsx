import { useEffect, useMemo, useState } from 'react'
import { ATIVIDADES, BANCAS, COMPETENCIAS_ENEM, OPCAO_SEM_MATERIA, tipoDaAtividade } from '@/lib/constantes'
import { hoje } from '@/lib/datas'
import { duracao } from '@/lib/formato'
import type { Banca, Questao, Redacao, Sessao } from '@/lib/tipos'
import { useDados } from '@/dados/loja'
import { AreaTexto, Botao, Campo, Modal, Selecao } from './ui'

function montarInicio(data: string, hora: string): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  const [h, m] = hora.split(':').map(Number)
  return new Date(ano, mes - 1, dia, h || 0, m || 0).toISOString()
}

function partesDoInicio(iso: string): { data: string; hora: string } {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return {
    data: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    hora: `${p(d.getHours())}:${p(d.getMinutes())}`,
  }
}

function agoraHora(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ======================================================= sessão de estudo ===

export function DialogoSessao({
  aberto,
  aoFechar,
  inicial,
  aoSalvar,
}: {
  aberto: boolean
  aoFechar: () => void
  inicial?: Partial<Sessao>
  aoSalvar?: () => void
}) {
  const { dados, salvar } = useDados()
  const ativas = dados.materias.filter((m) => !m.arquivada)

  const [materiaId, setMateriaId] = useState('')
  const [atividade, setAtividade] = useState('exercicios')
  const [minutos, setMinutos] = useState('60')
  const [data, setData] = useState(hoje())
  const [hora, setHora] = useState(agoraHora())
  const [assunto, setAssunto] = useState('')
  const [anotacao, setAnotacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    const partes = inicial?.inicio ? partesDoInicio(inicial.inicio) : { data: hoje(), hora: agoraHora() }
    setMateriaId(inicial?.materia_id ?? '')
    setAtividade(inicial?.atividade ?? 'exercicios')
    setMinutos(String(inicial?.minutos ?? 60))
    setData(partes.data)
    setHora(partes.hora)
    setAssunto(inicial?.assunto ?? '')
    setAnotacao(inicial?.anotacao ?? '')
    setErro(null)
    // ativas muda de identidade a cada render do pai; só o id importa aqui
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, inicial])

  const tipo = tipoDaAtividade(atividade)
  const min = Number(minutos)

  async function confirmar() {
    setErro(null)
    if (!Number.isFinite(min) || min <= 0) return setErro('Diga quantos minutos você estudou.')
    if (min > 1440) return setErro('Um registro cobre no máximo 24 horas.')

    setEnviando(true)
    try {
      await salvar('sessoes', {
        ...(inicial?.id ? { id: inicial.id } : {}),
        materia_id: materiaId || null,
        atividade,
        tipo,
        minutos: Math.round(min),
        inicio: montarInicio(data, hora),
        assunto: assunto.trim() || null,
        anotacao: anotacao.trim() || null,
      })
      aoSalvar?.()
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
      titulo={inicial?.id ? 'Editar sessão' : 'Registrar estudo'}
      descricao={inicial?.id ? undefined : 'O que você fez conta tanto quanto por quanto tempo.'}
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
        <Selecao
          rotulo="Matéria"
          value={materiaId}
          onChange={(e) => setMateriaId(e.target.value)}
          dica={materiaId ? undefined : 'Entra no tempo total, mas fica fora dos gráficos por matéria.'}
        >
          <option value="">{OPCAO_SEM_MATERIA}</option>
          {ativas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </Selecao>

        <div>
          <Selecao rotulo="O que você fez" value={atividade} onChange={(e) => setAtividade(e.target.value)}>
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
            Conta como <b className="font-semibold text-tinta-2">{tipo}</b> —{' '}
            {ATIVIDADES.find((a) => a.id === atividade)?.porque}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Campo
            rotulo="Minutos"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            value={minutos}
            onChange={(e) => setMinutos(e.target.value)}
          />
          <Campo rotulo="Dia" type="date" value={data} max={hoje()} onChange={(e) => setData(e.target.value)} />
          <Campo rotulo="Começou às" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>

        {min > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {[25, 50, 60, 90, 120].map((v) => (
              <Botao key={v} tamanho="p" onClick={() => setMinutos(String(v))}>
                {duracao(v)}
              </Botao>
            ))}
          </div>
        )}

        <Campo
          rotulo="Assunto"
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          placeholder="Ex.: Genética — 2ª lei de Mendel"
        />
        <AreaTexto
          rotulo="Anotação"
          rows={2}
          value={anotacao}
          onChange={(e) => setAnotacao(e.target.value)}
          placeholder="O que travou, o que ficou claro…"
        />

        {erro && <p className="text-[0.8125rem] text-ferrugem">{erro}</p>}
      </div>
    </Modal>
  )
}

// ============================================================== questões ====

export function DialogoQuestao({
  aberto,
  aoFechar,
  inicial,
}: {
  aberto: boolean
  aoFechar: () => void
  inicial?: Partial<Questao>
}) {
  const { dados, salvar } = useDados()
  const ativas = dados.materias.filter((m) => !m.arquivada)

  const [materiaId, setMateriaId] = useState('')
  const [total, setTotal] = useState('20')
  const [acertos, setAcertos] = useState('')
  const [data, setData] = useState(hoje())
  const [origem, setOrigem] = useState('')
  const [assunto, setAssunto] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setMateriaId(inicial?.materia_id ?? ativas[0]?.id ?? '')
    setTotal(String(inicial?.total ?? 20))
    setAcertos(inicial?.acertos !== undefined ? String(inicial.acertos) : '')
    setData(inicial?.data ?? hoje())
    setOrigem(inicial?.origem ?? '')
    setAssunto(inicial?.assunto ?? '')
    setErro(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, inicial])

  const t = Number(total)
  const a = Number(acertos)
  const taxa = t > 0 && acertos !== '' ? (a / t) * 100 : null

  async function confirmar() {
    setErro(null)
    if (!materiaId) return setErro('Escolha a matéria.')
    if (!Number.isFinite(t) || t <= 0) return setErro('Diga quantas questões você fez.')
    if (!Number.isFinite(a) || a < 0 || acertos === '') return setErro('Diga quantas você acertou.')
    if (a > t) return setErro('Os acertos não podem passar do total de questões.')

    setEnviando(true)
    try {
      await salvar('questoes', {
        ...(inicial?.id ? { id: inicial.id } : {}),
        materia_id: materiaId,
        total: Math.round(t),
        acertos: Math.round(a),
        data,
        origem: origem.trim() || null,
        assunto: assunto.trim() || null,
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
      titulo={inicial?.id ? 'Editar questões' : 'Registrar questões'}
      descricao={inicial?.id ? undefined : 'É aqui que o erro aparece antes da prova.'}
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
        <Selecao rotulo="Matéria" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
          {!ativas.length && <option value="">Nenhuma matéria cadastrada</option>}
          {ativas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </Selecao>

        <div className="grid grid-cols-3 gap-3">
          <Campo
            rotulo="Fez"
            type="number"
            inputMode="numeric"
            min={1}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
          <Campo
            rotulo="Acertou"
            type="number"
            inputMode="numeric"
            min={0}
            value={acertos}
            onChange={(e) => setAcertos(e.target.value)}
            placeholder="—"
          />
          <Campo rotulo="Dia" type="date" value={data} max={hoje()} onChange={(e) => setData(e.target.value)} />
        </div>

        {taxa !== null && (
          <div className="rounded-campo border border-borda bg-superficie-2 px-3 py-2.5">
            <p className="text-[0.8125rem] text-tinta-2">
              Aproveitamento:{' '}
              <b
                className="num font-semibold"
                style={{ color: taxa >= 70 ? 'var(--broto)' : taxa >= 50 ? 'var(--latao)' : 'var(--ferrugem)' }}
              >
                {taxa.toFixed(0)}%
              </b>
              <span className="text-tinta-3"> · errou {Math.max(0, t - a)}</span>
            </p>
          </div>
        )}

        <Campo
          rotulo="De onde vieram"
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
          placeholder="Ex.: PUCRS 2024, lista do cursinho, ENEM 2022"
        />
        <Campo
          rotulo="Assunto"
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          placeholder="Ex.: Estequiometria"
        />

        {erro && <p className="text-[0.8125rem] text-ferrugem">{erro}</p>}
      </div>
    </Modal>
  )
}

// =============================================================== redação ====

export function DialogoRedacao({
  aberto,
  aoFechar,
  inicial,
}: {
  aberto: boolean
  aoFechar: () => void
  inicial?: Partial<Redacao>
}) {
  const { dados, salvar } = useDados()

  const [banca, setBanca] = useState<Banca>('ENEM')
  const [nota, setNota] = useState('')
  const [data, setData] = useState(hoje())
  const [tema, setTema] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [competencias, setCompetencias] = useState<string[]>(['', '', '', '', ''])
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const escala = dados.perfil.escalas[banca] ?? 1000

  useEffect(() => {
    if (!aberto) return
    setBanca((inicial?.banca as Banca) ?? 'ENEM')
    setNota(inicial?.nota !== undefined ? String(inicial.nota) : '')
    setData(inicial?.data ?? hoje())
    setTema(inicial?.tema ?? '')
    setObservacoes(inicial?.observacoes ?? '')
    setCompetencias(
      inicial?.competencias?.length === 5 ? inicial.competencias.map(String) : ['', '', '', '', ''],
    )
    setErro(null)
  }, [aberto, inicial])

  const somaCompetencias = useMemo(
    () => competencias.reduce((t, c) => t + (Number(c) || 0), 0),
    [competencias],
  )
  const usaCompetencias = banca === 'ENEM'
  const notaFinal = usaCompetencias && competencias.some((c) => c !== '') ? somaCompetencias : Number(nota)

  async function confirmar() {
    setErro(null)
    if (!Number.isFinite(notaFinal) || notaFinal < 0) return setErro('Informe a nota.')
    if (notaFinal > escala) return setErro(`A escala da ${banca} vai até ${escala}. Ajuste em Ajustes se mudou.`)

    setEnviando(true)
    try {
      await salvar('redacoes', {
        ...(inicial?.id ? { id: inicial.id } : {}),
        banca,
        nota: notaFinal,
        nota_max: escala,
        data,
        tema: tema.trim() || null,
        observacoes: observacoes.trim() || null,
        competencias: usaCompetencias && competencias.some((c) => c !== '')
          ? competencias.map((c) => Number(c) || 0)
          : null,
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
      titulo={inicial?.id ? 'Editar redação' : 'Registrar redação'}
      descricao={`Escala da ${banca}: 0 a ${escala}.`}
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
        <div className="grid grid-cols-2 gap-3">
          <Selecao rotulo="Banca" value={banca} onChange={(e) => setBanca(e.target.value as Banca)}>
            {BANCAS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Selecao>
          <Campo rotulo="Dia" type="date" value={data} max={hoje()} onChange={(e) => setData(e.target.value)} />
        </div>

        {usaCompetencias ? (
          <div>
            <p className="mb-2 text-[0.8125rem] font-medium text-tinta-2">Competências (0 a 200 cada)</p>
            <div className="space-y-2">
              {COMPETENCIAS_ENEM.map((nome, i) => (
                <div key={nome} className="grid grid-cols-[1.5rem_1fr_4.5rem] items-center gap-3">
                  <span className="num text-[0.8125rem] text-tinta-3">C{i + 1}</span>
                  <span className="truncate text-[0.8125rem] text-tinta-2" title={nome}>
                    {nome}
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={200}
                    step={20}
                    value={competencias[i]}
                    onChange={(e) => {
                      const proximo = [...competencias]
                      proximo[i] = e.target.value
                      setCompetencias(proximo)
                    }}
                    placeholder="—"
                    className="num w-full rounded-campo border border-borda-forte bg-superficie px-2 py-1.5 text-right text-[0.8125rem] text-tinta focus:border-acento focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-campo border border-borda bg-superficie-2 px-3 py-2.5">
              <span className="text-[0.8125rem] text-tinta-2">Nota final</span>
              <span className="num text-[0.9375rem] font-semibold text-tinta">
                {somaCompetencias} <span className="text-tinta-3">/ {escala}</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-tinta-3">
              Se você só tem a nota fechada, deixe as competências em branco e use o campo abaixo.
            </p>
            <div className="mt-3">
              <Campo
                rotulo="Ou a nota fechada"
                type="number"
                inputMode="numeric"
                min={0}
                max={escala}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="—"
              />
            </div>
          </div>
        ) : (
          <Campo
            rotulo={`Nota (0 a ${escala})`}
            type="number"
            inputMode="decimal"
            min={0}
            max={escala}
            step="0.01"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="—"
          />
        )}

        <Campo rotulo="Tema" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex.: Saúde mental nas escolas" />
        <AreaTexto
          rotulo="O que o corretor apontou"
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Repetição de conectivos, proposta genérica…"
        />

        {erro && <p className="text-[0.8125rem] text-ferrugem">{erro}</p>}
      </div>
    </Modal>
  )
}
