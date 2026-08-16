import { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import textoSchema from '../../supabase/schema.sql?raw'
import { Marca } from '@/componentes/Marca'
import { Botao, Cartao } from '@/componentes/ui'

function BotaoCopiar({ texto, rotulo = 'Copiar' }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false)

  return (
    <Botao
      tamanho="p"
      aparencia={copiado ? 'latao' : 'contorno'}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto)
          setCopiado(true)
          setTimeout(() => setCopiado(false), 2000)
        } catch {
          setCopiado(false)
        }
      }}
    >
      {copiado ? <Check size={14} /> : <Copy size={14} />}
      {copiado ? 'Copiado' : rotulo}
    </Botao>
  )
}

function Passo({
  n,
  titulo,
  children,
}: {
  n: number
  titulo: string
  children: React.ReactNode
}) {
  return (
    <li className="relative grid grid-cols-[2rem_1fr] gap-x-4 pb-8 last:pb-0">
      {/* O fio liga os passos: é a mesma vertical da marca. */}
      <span className="absolute top-8 bottom-0 left-4 w-px bg-borda" aria-hidden="true" />
      <span className="num relative z-10 grid h-8 w-8 place-items-center rounded-full border border-borda-forte bg-superficie text-[0.8125rem] font-medium text-tinta-2">
        {n}
      </span>
      <div className="min-w-0 pt-1">
        <h3 className="text-[0.9375rem] font-semibold text-tinta">{titulo}</h3>
        <div className="mt-2 space-y-3 text-[0.875rem] leading-relaxed text-tinta-2">{children}</div>
      </div>
    </li>
  )
}

const MODELO_ENV = `VITE_SUPABASE_URL=cole_aqui_a_project_url
VITE_SUPABASE_ANON_KEY=cole_aqui_a_chave_anon`

export function Configurar() {
  return (
    <div className="min-h-dvh bg-fundo px-4 py-10 md:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <Marca tamanho="g" />
        <h1 className="display mt-8 text-[2rem] leading-tight text-tinta md:text-[2.5rem]">
          Falta ligar o banco de dados.
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-tinta-2">
          São cinco passos, uma vez só. Depois disso seus dados ficam na nuvem e o mesmo estudo
          aparece no computador e no celular. É de graça — o plano gratuito do Supabase sobra para
          um ano inteiro de cursinho.
        </p>

        <Cartao className="mt-8 p-6">
          <ol className="list-none">
            <Passo n={1} titulo="Crie o projeto no Supabase">
              <p>
                Entre em{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-acento underline underline-offset-2"
                >
                  supabase.com/dashboard <ExternalLink size={13} />
                </a>{' '}
                e entre com o GitHub ou com e-mail. Clique em <b>New project</b>.
              </p>
              <p>
                Dê o nome <b>aprumo</b>, crie uma senha de banco (guarde num lugar seguro, você quase
                não vai usar) e escolha a região <b>South America (São Paulo)</b> — é a mais perto,
                o app fica mais rápido.
              </p>
              <p className="text-tinta-3">O projeto leva cerca de dois minutos para ficar pronto.</p>
            </Passo>

            <Passo n={2} titulo="Crie as tabelas">
              <p>
                No menu da esquerda, abra <b>SQL Editor</b> e clique em <b>New query</b>. Cole o
                conteúdo abaixo e clique em <b>Run</b>.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <BotaoCopiar texto={textoSchema} rotulo="Copiar o SQL inteiro" />
                <span className="text-[0.8125rem] text-tinta-3">
                  (também está no repositório, em <code className="num text-xs">supabase/schema.sql</code>)
                </span>
              </div>
              <p className="text-tinta-3">
                Se aparecer <b>Success. No rows returned</b>, deu certo.
              </p>
            </Passo>

            <Passo n={3} titulo="Desligue a confirmação por e-mail">
              <p>
                Vá em <b>Authentication → Sign In / Providers → Email</b> e desligue{' '}
                <b>Confirm email</b>. Salve.
              </p>
              <p className="text-tinta-3">
                Isso deixa você criar a conta e entrar na hora, sem depender de e-mail chegar. Como
                a conta é só sua, não faz diferença de segurança.
              </p>
            </Passo>

            <Passo n={4} titulo="Copie as duas chaves">
              <p>
                Abra <b>Project Settings → API</b>. Você precisa de dois valores: a <b>Project URL</b>{' '}
                e a chave <b>anon public</b>.
              </p>
              <p>
                Na pasta do projeto, crie um arquivo chamado <code className="num text-xs">.env.local</code>{' '}
                com estas duas linhas:
              </p>
              <div className="rounded-campo border border-borda bg-superficie-2 p-3">
                <pre className="num overflow-x-auto text-[0.75rem] leading-relaxed text-tinta-2">
                  {MODELO_ENV}
                </pre>
                <div className="mt-2">
                  <BotaoCopiar texto={MODELO_ENV} rotulo="Copiar modelo" />
                </div>
              </div>
              <p className="text-tinta-3">
                A chave <b>anon</b> pode ficar visível no navegador — ela só consegue ler e escrever
                as linhas da sua própria conta. Nunca use a chave <b>service_role</b> aqui.
              </p>
            </Passo>

            <Passo n={5} titulo="Reinicie o app">
              <p>
                Pare o servidor no terminal (Ctrl+C) e rode <code className="num text-xs">npm run dev</code>{' '}
                de novo. Esta tela some e a de criar conta aparece.
              </p>
              <p className="text-tinta-3">
                Quando publicar na Vercel, cole essas mesmas duas variáveis em{' '}
                <b>Settings → Environment Variables</b>.
              </p>
            </Passo>
          </ol>
        </Cartao>

        <p className="mt-6 text-center text-[0.8125rem] text-tinta-3">
          Travou em algum passo? O README do projeto tem as mesmas instruções com mais detalhe.
        </p>
      </div>
    </div>
  )
}
