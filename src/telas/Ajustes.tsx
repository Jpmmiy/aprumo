import { useEffect, useRef, useState } from 'react'
import { Download, GripVertical, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useDados } from '@/dados/loja'
import {
  Alternador,
  Botao,
  BotaoIcone,
  CabecalhoCartao,
  Cartao,
  Campo,
  ConfirmarExclusao,
  Modal,
  Vazio,
  cn,
} from '@/componentes/ui'
import { BANCAS, PALETA_MATERIAS } from '@/lib/constantes'
import { formatarMedio, hoje } from '@/lib/datas'
import { duracao, numero } from '@/lib/formato'
import type { Banca, Materia, Prova } from '@/lib/tipos'

// ========================================================= diálogo matéria ==

function DialogoMateria({
  aberto,
  aoFechar,
  inicial,
}: {
  aberto: boolean
  aoFechar: () => void
  inicial?: Partial<Materia>
}) {
  const { dados, salvar } = useDados()
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(PALETA_MATERIAS[0])
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setNome(inicial?.nome ?? '')
    setCor(inicial?.cor ?? PALETA_MATERIAS[dados.materias.length % PALETA_MATERIAS.length])
    setErro(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, inicial])

  async function confirmar() {
    setErro(null)
    if (!nome.trim()) return setErro('Dê um nome à matéria.')
    setEnviando(true)
    try {
      await salvar('materias', {
        ...(inicial?.id ? { id: inicial.id } : {}),
        nome: nome.trim(),
        cor,
        ...(inicial?.id ? {} : { ordem: dados.materias.length, arquivada: false }),
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
      titulo={inicial?.id ? 'Editar matéria' : 'Nova matéria'}
      largura="sm"
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
        <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Geografia" />
        <div>
          <p className="mb-2 text-[0.8125rem] font-medium text-tinta-2">Cor</p>
          <div className="flex flex-wrap gap-2">
            {PALETA_MATERIAS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Cor ${c}`}
                onClick={() => setCor(c)}
                className={cn(
                  'h-8 w-8 rounded-full border-2 transition-transform',
                  cor === c ? 'scale-110 border-tinta' : 'border-transparent',
                )}
                style={{ background: c }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-tinta-3">
            A cor serve só para você reconhecer a matéria nas listas — os gráficos não dependem dela.
          </p>
        </div>
        {erro && <p className="text-[0.8125rem] text-ferrugem">{erro}</p>}
      </div>
    </Modal>
  )
}

// =========================================================== diálogo prova ==

function DialogoProva({
  aberto,
  aoFechar,
  inicial,
}: {
  aberto: boolean
  aoFechar: () => void
  inicial?: Partial<Prova>
}) {
  const { salvar } = useDados()
  const [nome, setNome] = useState('')
  const [data, setData] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    setNome(inicial?.nome ?? '')
    setData(inicial?.data ?? '')
    setErro(null)
  }, [aberto, inicial])

  async function confirmar() {
    setErro(null)
    if (!nome.trim()) return setErro('Dê um nome à prova.')
    if (!data) return setErro('Escolha a data.')
    try {
      await salvar('provas', { ...(inicial?.id ? { id: inicial.id } : {}), nome: nome.trim(), data })
      aoFechar()
    } catch (e) {
      setErro((e as { message?: string }).message ?? 'Não consegui salvar.')
    }
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={inicial?.id ? 'Editar prova' : 'Nova prova'}
      descricao="Confira a data no edital oficial — o app não busca isso sozinho."
      largura="sm"
      rodape={
        <>
          <Botao aparencia="fantasma" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao aparencia="solido" onClick={confirmar}>
            Salvar
          </Botao>
        </>
      }
    >
      <div className="space-y-4">
        <Campo rotulo="Prova" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: PUCRS — 1º dia" />
        <Campo rotulo="Data" type="date" value={data} min={hoje()} onChange={(e) => setData(e.target.value)} />
        {erro && <p className="text-[0.8125rem] text-ferrugem">{erro}</p>}
      </div>
    </Modal>
  )
}

// ==================================================================== tela ==

export function Ajustes() {
  const { dados, salvar, remover, salvarPerfil, salvando, importar } = useDados()
  const entradaArquivo = useRef<HTMLInputElement>(null)
  const [restauro, setRestauro] = useState<{ ok: boolean; texto: string } | null>(null)

  const [nome, setNome] = useState(dados.perfil.nome)
  const [metaDia, setMetaDia] = useState(String(dados.perfil.meta_min_dia))
  const [metaQ, setMetaQ] = useState(String(dados.perfil.meta_questoes_semana))
  const [metaAtivo, setMetaAtivo] = useState(String(dados.perfil.meta_ativo_pct))
  const [escalas, setEscalas] = useState(dados.perfil.escalas)
  const [salvo, setSalvo] = useState(false)

  const [materiaEdit, setMateriaEdit] = useState<Partial<Materia> | null>(null)
  const [materiaApagar, setMateriaApagar] = useState<Materia | null>(null)
  const [provaEdit, setProvaEdit] = useState<Partial<Prova> | null>(null)
  const [provaApagar, setProvaApagar] = useState<Prova | null>(null)

  useEffect(() => {
    setNome(dados.perfil.nome)
    setMetaDia(String(dados.perfil.meta_min_dia))
    setMetaQ(String(dados.perfil.meta_questoes_semana))
    setMetaAtivo(String(dados.perfil.meta_ativo_pct))
    setEscalas(dados.perfil.escalas)
  }, [dados.perfil])

  async function guardarPerfil() {
    await salvarPerfil({
      nome: nome.trim(),
      meta_min_dia: Math.max(0, Math.round(Number(metaDia) || 0)),
      meta_questoes_semana: Math.max(0, Math.round(Number(metaQ) || 0)),
      meta_ativo_pct: Math.min(100, Math.max(0, Math.round(Number(metaAtivo) || 0))),
      escalas,
    })
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2200)
  }

  function baixarBackup() {
    const conteudo = JSON.stringify({ exportado_em: new Date().toISOString(), ...dados }, null, 2)
    const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `aprumo-backup-${hoje()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function restaurarBackup(arquivo: File) {
    setRestauro(null)
    try {
      const bruto = JSON.parse(await arquivo.text())
      const listas = ['sessoes', 'questoes', 'materias', 'tarefas', 'anotacoes']
      if (!listas.some((l) => Array.isArray(bruto?.[l]))) {
        setRestauro({ ok: false, texto: 'Esse arquivo não parece um backup do Aprumo.' })
        return
      }
      importar(bruto)
      setRestauro({ ok: true, texto: 'Backup restaurado. Seus dados foram substituídos pelos do arquivo.' })
    } catch {
      setRestauro({ ok: false, texto: 'Não consegui ler esse arquivo. Ele precisa ser o .json que o botão acima gera.' })
    }
  }

  const usoMateria = (id: string) =>
    dados.sessoes.filter((s) => s.materia_id === id).length + dados.questoes.filter((q) => q.materia_id === id).length

  return (
    <div className="space-y-5">
      <header>
        <h1 className="display text-[1.75rem] leading-tight text-tinta md:text-[2rem]">Ajustes</h1>
        <p className="mt-1.5 text-[0.875rem] text-tinta-3">
          As metas daqui são a régua que o prumo e os diagnósticos usam.
        </p>
      </header>

      {/* --------------------------- perfil e metas --------------------------- */}
      <Cartao>
        <CabecalhoCartao titulo="Você e suas metas" descricao="Mexa nesses números até eles ficarem difíceis, mas possíveis." />
        <div className="space-y-4 px-5 pb-5">
          <Campo rotulo="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João Pedro Terra Mainardi" />

          <div className="grid gap-4 sm:grid-cols-3">
            <Campo
              rotulo="Meta de estudo por dia"
              type="number"
              inputMode="numeric"
              min={0}
              value={metaDia}
              onChange={(e) => setMetaDia(e.target.value)}
              dica={`= ${duracao(Number(metaDia) || 0)} por dia`}
            />
            <Campo
              rotulo="Questões por semana"
              type="number"
              inputMode="numeric"
              min={0}
              value={metaQ}
              onChange={(e) => setMetaQ(e.target.value)}
              dica={`≈ ${Math.round((Number(metaQ) || 0) / 7)} por dia`}
            />
            <Campo
              rotulo="Estudo ativo mínimo (%)"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={metaAtivo}
              onChange={(e) => setMetaAtivo(e.target.value)}
              dica="60% é um bom alvo"
            />
          </div>

          <div>
            <p className="mb-2 text-[0.8125rem] font-medium text-tinta-2">Escala das redações</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {BANCAS.map((b) => (
                <Campo
                  key={b}
                  rotulo={`${b} vai até`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={String(escalas[b] ?? '')}
                  onChange={(e) => setEscalas({ ...escalas, [b]: Number(e.target.value) || 0 } as Record<Banca, number>)}
                />
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-tinta-3">
              Os valores iniciais são um chute razoável (ENEM 1000, PUCRS 100, UFRGS 30). Confira no edital
              do seu ano e corrija aqui — as redações que você já registrou guardam a escala que valia na
              hora, então nada do histórico se perde.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Botao aparencia="solido" onClick={guardarPerfil} disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar alterações'}
            </Botao>
            {salvo && <span className="text-[0.8125rem] font-medium text-broto">Salvo.</span>}
          </div>
        </div>
      </Cartao>

      {/* ------------------------------- matérias ------------------------------- */}
      <Cartao>
        <CabecalhoCartao
          titulo="Matérias"
          descricao={`${dados.materias.filter((m) => !m.arquivada).length} ativas`}
          acao={
            <Botao tamanho="p" onClick={() => setMateriaEdit({})}>
              <Plus size={14} /> Nova
            </Botao>
          }
        />
        <ul className="divide-y divide-borda border-t border-borda">
          {dados.materias.map((m) => (
            <li key={m.id} className={cn('group flex items-center gap-3 px-5 py-3', m.arquivada && 'opacity-50')}>
              <GripVertical size={14} className="shrink-0 text-tinta-3/50" />
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: m.cor }} />
              <span className="min-w-0 flex-1 truncate text-[0.875rem] text-tinta">{m.nome}</span>
              <span className="num shrink-0 text-xs text-tinta-3">
                {numero(usoMateria(m.id))} {usoMateria(m.id) === 1 ? 'registro' : 'registros'}
              </span>
              <Alternador
                ligado={!m.arquivada}
                rotulo={m.arquivada ? `Reativar ${m.nome}` : `Arquivar ${m.nome}`}
                aoTrocar={(v) => void salvar('materias', { id: m.id, arquivada: !v })}
              />
              <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <BotaoIcone rotulo="Editar matéria" onClick={() => setMateriaEdit(m)}>
                  <Pencil size={14} />
                </BotaoIcone>
                <BotaoIcone rotulo="Apagar matéria" onClick={() => setMateriaApagar(m)}>
                  <Trash2 size={14} />
                </BotaoIcone>
              </div>
            </li>
          ))}
        </ul>
        <p className="px-5 py-3 text-xs leading-relaxed text-tinta-3">
          Arquivar tira a matéria das listas mas mantém o histórico nos gráficos. Apagar leva junto todas as
          sessões e questões dela.
        </p>
      </Cartao>

      {/* -------------------------------- provas -------------------------------- */}
      <Cartao>
        <CabecalhoCartao
          titulo="Datas das provas"
          descricao="A contagem regressiva do painel vem daqui."
          acao={
            <Botao tamanho="p" onClick={() => setProvaEdit({})}>
              <Plus size={14} /> Nova prova
            </Botao>
          }
        />
        {dados.provas.length === 0 ? (
          <Vazio
            titulo="Nenhuma data cadastrada"
            descricao="Coloque as datas de PUCRS, UFRGS e ENEM conforme o edital de cada uma. Eu não cadastro sozinho para não te dar uma data errada."
            acao={
              <Botao tamanho="p" onClick={() => setProvaEdit({})}>
                <Plus size={14} /> Cadastrar
              </Botao>
            }
          />
        ) : (
          <ul className="divide-y divide-borda border-t border-borda">
            {dados.provas.map((p) => {
              const dias = Math.ceil(
                (new Date(p.data + 'T00:00:00').getTime() - new Date(hoje() + 'T00:00:00').getTime()) / 86400000,
              )
              return (
                <li key={p.id} className="group flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.875rem] text-tinta">{p.nome}</p>
                    <p className="text-xs text-tinta-3">{formatarMedio(p.data)}</p>
                  </div>
                  <span
                    className="num shrink-0 text-[0.875rem] font-medium"
                    style={{ color: dias < 0 ? 'var(--tinta-3)' : dias <= 30 ? 'var(--ferrugem)' : 'var(--tinta)' }}
                  >
                    {dias < 0 ? 'passou' : dias === 0 ? 'é hoje' : `${dias} dias`}
                  </span>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <BotaoIcone rotulo="Editar prova" onClick={() => setProvaEdit(p)}>
                      <Pencil size={14} />
                    </BotaoIcone>
                    <BotaoIcone rotulo="Apagar prova" onClick={() => setProvaApagar(p)}>
                      <Trash2 size={14} />
                    </BotaoIcone>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Cartao>

      {/* --------------------------------- dados --------------------------------- */}
      <Cartao>
        <CabecalhoCartao
          titulo="Seus dados"
          descricao="Ficam guardados neste aparelho, neste navegador."
        />
        <div className="space-y-3 px-5 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-borda bg-superficie-2 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[0.875rem] font-medium text-tinta">Baixar uma cópia de tudo</p>
              <p className="text-[0.8125rem] text-tinta-3">
                Um arquivo com sessões, questões, redações, tarefas e anotações.
              </p>
            </div>
            <Botao tamanho="p" onClick={baixarBackup}>
              <Download size={14} /> Baixar
            </Botao>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-borda px-4 py-3">
            <div className="min-w-0">
              <p className="text-[0.875rem] font-medium text-tinta">Restaurar de um backup</p>
              <p className="text-[0.8125rem] text-tinta-3">
                É assim que você leva o que fez no computador para o celular, e o contrário.
              </p>
            </div>
            <input
              ref={entradaArquivo}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const arquivo = e.target.files?.[0]
                if (arquivo) void restaurarBackup(arquivo)
                e.target.value = ''
              }}
            />
            <Botao tamanho="p" onClick={() => entradaArquivo.current?.click()}>
              <Upload size={14} /> Escolher arquivo
            </Botao>
          </div>

          {restauro && (
            <p
              className="rounded-[10px] px-4 py-3 text-[0.8125rem] leading-relaxed"
              style={{
                background: restauro.ok ? 'var(--acento-fraco)' : 'var(--ferrugem-fraco)',
                color: restauro.ok ? 'var(--acento)' : 'var(--ferrugem)',
              }}
            >
              {restauro.texto}
            </p>
          )}

          <p className="px-1 text-xs leading-relaxed text-tinta-3">
            Como tudo mora neste navegador, limpar os dados de navegação apaga seu histórico de
            estudo. Baixe uma cópia de vez em quando.
          </p>
        </div>
      </Cartao>

      <p className="pb-2 text-center text-xs text-tinta-3">
        Aprumo · feito para João Pedro Terra Mainardi
      </p>

      <DialogoMateria
        aberto={materiaEdit !== null}
        aoFechar={() => setMateriaEdit(null)}
        inicial={materiaEdit ?? undefined}
      />
      <DialogoProva aberto={provaEdit !== null} aoFechar={() => setProvaEdit(null)} inicial={provaEdit ?? undefined} />
      <ConfirmarExclusao
        aberto={materiaApagar !== null}
        aoFechar={() => setMateriaApagar(null)}
        aoConfirmar={() => materiaApagar && void remover('materias', materiaApagar.id)}
        oQue={
          materiaApagar
            ? `A matéria "${materiaApagar.nome}" e ${usoMateria(materiaApagar.id) === 1 ? 'o registro ligado' : `os ${usoMateria(materiaApagar.id)} registros ligados`} a ela`
            : ''
        }
      />
      <ConfirmarExclusao
        aberto={provaApagar !== null}
        aoFechar={() => setProvaApagar(null)}
        aoConfirmar={() => provaApagar && void remover('provas', provaApagar.id)}
        oQue={provaApagar ? `A prova "${provaApagar.nome}"` : ''}
      />
    </div>
  )
}
