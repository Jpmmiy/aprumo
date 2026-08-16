/**
 * Cria o arquivo .env.local perguntando as duas chaves do Supabase.
 * Uso: npm run configurar
 *
 * Existe para ninguém precisar saber o que é um arquivo .env: você cola os dois
 * valores aqui no terminal e ele escreve o arquivo no lugar certo.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'
import { stdin, stdout } from 'node:process'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destino = resolve(raiz, '.env.local')

const negrito = (t) => `[1m${t}[0m`
const verde = (t) => `[32m${t}[0m`
const vermelho = (t) => `[31m${t}[0m`
const apagado = (t) => `[2m${t}[0m`

const rl = createInterface({ input: stdin })

/**
 * Fila de linhas em vez de `readline/promises`: quando a entrada chega em lote
 * (um `printf | npm run configurar`, por exemplo), o readline entrega as linhas
 * todas de uma vez e a segunda pergunta ficava esperando para sempre.
 */
const pendentes = []
const aguardando = []
let fechado = false

rl.on('line', (linha) => {
  const resolver = aguardando.shift()
  if (resolver) resolver(linha)
  else pendentes.push(linha)
})
rl.on('close', () => {
  fechado = true
  while (aguardando.length) aguardando.shift()(null)
})

function perguntar(texto) {
  stdout.write(texto)
  if (pendentes.length) return Promise.resolve(pendentes.shift())
  if (fechado) return Promise.resolve(null)
  return new Promise((resolver) => aguardando.push(resolver))
}

function encerrarSemResposta() {
  console.log(vermelho('\n\nEntrada encerrada antes de eu receber os dois valores. Nada foi salvo.'))
  rl.close()
  process.exit(1)
}

console.log(`
${negrito('Aprumo — ligar o Supabase')}

Abra o painel do Supabase e vá em ${negrito('Project Settings → API')}.
Você vai copiar dois valores de lá. Cole cada um aqui e aperte Enter.
`)

if (existsSync(destino)) {
  const atual = readFileSync(destino, 'utf8')
  console.log(apagado('Já existe um .env.local. Conteúdo atual:\n'))
  console.log(apagado(atual.replace(/(=.{6}).*/g, '$1…')))
  const resposta = await perguntar('Sobrescrever? (s/N) ')
  if (resposta === null) encerrarSemResposta()
  if (resposta.trim().toLowerCase() !== 's') {
    console.log('\nNada mudou.')
    rl.close()
    process.exit(0)
  }
  console.log('')
}

// ---------------------------------------------------------------- URL ------
let url = ''
while (!url) {
  const lido = await perguntar(`${negrito('1) Project URL')} ${apagado('(algo como https://abcdefg.supabase.co)')}\n> `)
  if (lido === null) encerrarSemResposta()
  const bruto = lido.trim()
  if (!bruto) continue
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(bruto)) {
    console.log(vermelho('   Isso não parece a Project URL. Ela começa com https:// e termina em .supabase.co\n'))
    continue
  }
  url = bruto.replace(/\/$/, '')
}

// -------------------------------------------------------------- chave ------
let chave = ''
while (!chave) {
  const lido = await perguntar(`\n${negrito('2) Chave anon public')} ${apagado('(a longa, que começa com eyJ ou sb_publishable_)')}\n> `)
  if (lido === null) encerrarSemResposta()
  const bruto = lido.trim()
  if (!bruto) continue

  // O erro caro aqui é colar a service_role: ela ignora as regras de acesso e
  // daria a qualquer visitante do site poder total sobre o banco.
  if (/service[_-]?role/i.test(bruto)) {
    console.log(vermelho('\n   PARE. Essa é a chave service_role — ela nunca pode ir para o navegador.'))
    console.log(vermelho('   Volte e copie a que está marcada como "anon" / "public".\n'))
    continue
  }
  try {
    const meio = JSON.parse(Buffer.from(bruto.split('.')[1] ?? '', 'base64').toString())
    if (meio?.role && meio.role !== 'anon') {
      console.log(vermelho(`\n   Essa chave é da função "${meio.role}", não "anon". Copie a chave anon public.\n`))
      continue
    }
  } catch {
    /* chaves no formato novo (sb_publishable_…) não são JWT; segue o baile */
  }
  if (bruto.length < 30) {
    console.log(vermelho('   Essa chave parece curta demais. Copie o valor inteiro.\n'))
    continue
  }
  chave = bruto
}

writeFileSync(destino, `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${chave}\n`)
rl.close()

console.log(`
${verde('Pronto.')} Arquivo criado em ${negrito('.env.local')}

Ele fica só no seu computador — o .gitignore impede que vá para o GitHub.

Agora rode:

  ${negrito('npm run dev')}

e abra http://localhost:5173 para criar sua conta.
`)
