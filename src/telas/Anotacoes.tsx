import { useEffect, useMemo, useState } from 'react'
import { Pencil, Pin, Plus, Search, Trash2 } from 'lucide-react'
import { useDados } from '@/dados/loja'
import {
  Abas,
  AreaTexto,
  Botao,
  BotaoIcone,
  Cartao,
  Campo,
  ConfirmarExclusao,
  Etiqueta,
  Modal,
  Selecao,
  Vazio,
  cn,
} from '@/componentes/ui'
import { CATEGORIAS_NOTA } from '@/lib/constantes'
import { formatarMedio } from '@/lib/datas'
import type { Anotacao, CategoriaNota } from '@/lib/tipos'

const CORES_CATEGORIA: Record<CategoriaNota, string> = {
  melhorar: 'var(--latao)',
  erro: 'var(--ferrugem)',
  ideia: 'var(--serie-passivo)',
  geral: 'var(--tinta-3)',
}

function DialogoAnotacao({
  aberto,
  aoFechar,
  inicial,
}: {
  aberto: boolean
  aoFechar: () => void
  inicial?: Partial<Anotacao>
}) {
  const { dados, salvar } = useDados()
  const ativas = dados.materias.filter((m) => !m.arquivada)

  const [titulo, setTitulo] = useState('')
  const [corpo, setCorpo] = useState('')
  const [categoria, setCategoria] = useState<CategoriaNota>('melhorar')
  const [materiaId, setMateriaId] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setTitulo(inicial?.titulo ?? '')
    setCorpo(inicial?.corpo ?? '')
    setCategoria((inicial?.categoria as CategoriaNota) ?? 'melhorar')
    setMateriaId(inicial?.materia_id ?? '')
    setErro(null)
  }, [aberto, inicial])

  async function confirmar() {
    setErro(null)
    if (!titulo.trim() && !corpo.trim()) return setErro('Escreva alguma coisa antes de salvar.')
    setEnviando(true)
    try {
      await salvar('anotacoes', {
        ...(inicial?.id ? { id: inicial.id } : {}),
        titulo: titulo.trim() || 'Sem título',
        corpo: corpo.trim(),
        categoria,
        materia_id: materiaId || null,
        atualizada_em: new Date().toISOString(),
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
      titulo={inicial?.id ? 'Editar anotação' : 'Nova anotação'}
      largura="lg"
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
          rotulo="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Erro que eu repito em estequiometria"
        />
        <div className="grid grid-cols-2 gap-3">
          <Selecao
            rotulo="Tipo"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaNota)}
          >
            {CATEGORIAS_NOTA.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Selecao>
          <Selecao rotulo="Matéria" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
            <option value="">Nenhuma</option>
            {ativas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </Selecao>
        </div>
        <AreaTexto
          rotulo="Anotação"
          rows={9}
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          placeholder="O que aconteceu, por que aconteceu e o que fazer diferente na próxima."
        />
        {erro && <p className="text-[0.8125rem] text-ferrugem">{erro}</p>}
      </div>
    </Modal>
  )
}

export function Anotacoes() {
  const { dados, salvar, remover, materiaPorId } = useDados()
  const [editando, setEditando] = useState<Partial<Anotacao> | null>(null)
  const [apagando, setApagando] = useState<Anotacao | null>(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todas' | CategoriaNota>('todas')

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return dados.anotacoes.filter((a) => {
      if (filtro !== 'todas' && a.categoria !== filtro) return false
      if (!termo) return true
      return (a.titulo + ' ' + a.corpo).toLowerCase().includes(termo)
    })
  }, [dados.anotacoes, busca, filtro])

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[1.75rem] leading-tight text-tinta md:text-[2rem]">Anotações</h1>
          <p className="mt-1.5 text-[0.875rem] text-tinta-3">
            O caderno de erros. O que você escreve aqui é o que não vai se repetir na prova.
          </p>
        </div>
        <Botao aparencia="solido" onClick={() => setEditando({})}>
          <Plus size={16} /> Nova anotação
        </Botao>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nas anotações"
            aria-label="Buscar nas anotações"
            className="w-full rounded-campo border border-borda-forte bg-superficie py-2 pr-3 pl-9 text-sm text-tinta placeholder:text-tinta-3/70 focus:border-acento focus:outline-none"
          />
        </div>
        <Abas
          valor={filtro}
          aoTrocar={setFiltro}
          opcoes={[{ id: 'todas' as const, nome: 'Todas' }, ...CATEGORIAS_NOTA]}
        />
      </div>

      {lista.length === 0 ? (
        <Cartao>
          <Vazio
            titulo={dados.anotacoes.length ? 'Nada encontrado' : 'Caderno em branco'}
            descricao={
              dados.anotacoes.length
                ? 'Nenhuma anotação bate com essa busca.'
                : 'Anote o erro logo depois de cometê-lo, enquanto você ainda lembra do raciocínio que te levou até ele.'
            }
            acao={
              !dados.anotacoes.length ? (
                <Botao tamanho="p" onClick={() => setEditando({})}>
                  <Plus size={14} /> Escrever a primeira
                </Botao>
              ) : undefined
            }
          />
        </Cartao>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((a) => {
            const materia = materiaPorId(a.materia_id)
            const categoria = CATEGORIAS_NOTA.find((c) => c.id === a.categoria)
            return (
              <Cartao key={a.id} className={cn('group flex flex-col', a.fixada && 'border-latao/40')}>
                <div className="flex items-start gap-2 px-4 pt-3.5 pb-2">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: CORES_CATEGORIA[a.categoria] }}
                    aria-hidden="true"
                  />
                  <h2 className="min-w-0 flex-1 text-[0.9375rem] leading-snug font-semibold text-tinta">
                    {a.titulo}
                  </h2>
                  <BotaoIcone
                    rotulo={a.fixada ? 'Desafixar' : 'Fixar no topo'}
                    onClick={() =>
                      void salvar('anotacoes', {
                        id: a.id,
                        fixada: !a.fixada,
                        atualizada_em: new Date().toISOString(),
                      })
                    }
                    className={cn('shrink-0', a.fixada ? 'text-latao' : 'opacity-0 group-hover:opacity-100')}
                  >
                    <Pin size={14} fill={a.fixada ? 'currentColor' : 'none'} />
                  </BotaoIcone>
                </div>

                {a.corpo && (
                  <p className="line-clamp-6 px-4 text-[0.8125rem] leading-relaxed whitespace-pre-wrap text-tinta-2">
                    {a.corpo}
                  </p>
                )}

                <div className="mt-auto flex items-center gap-1.5 px-4 pt-3 pb-3.5">
                  {categoria && <Etiqueta cor={CORES_CATEGORIA[a.categoria]}>{categoria.nome}</Etiqueta>}
                  {materia && <Etiqueta cor={materia.cor}>{materia.nome}</Etiqueta>}
                  <span className="ml-auto text-[0.6875rem] text-tinta-3">
                    {formatarMedio(a.atualizada_em.slice(0, 10))}
                  </span>
                  <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <BotaoIcone rotulo="Editar anotação" onClick={() => setEditando(a)}>
                      <Pencil size={14} />
                    </BotaoIcone>
                    <BotaoIcone rotulo="Apagar anotação" onClick={() => setApagando(a)}>
                      <Trash2 size={14} />
                    </BotaoIcone>
                  </div>
                </div>
              </Cartao>
            )
          })}
        </div>
      )}

      <DialogoAnotacao aberto={editando !== null} aoFechar={() => setEditando(null)} inicial={editando ?? undefined} />
      <ConfirmarExclusao
        aberto={apagando !== null}
        aoFechar={() => setApagando(null)}
        aoConfirmar={() => apagando && void remover('anotacoes', apagando.id)}
        oQue={apagando ? `A anotação "${apagando.titulo}"` : ''}
      />
    </div>
  )
}
