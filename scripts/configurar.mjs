/**
 * Cria o arquivo .env.local perguntando as duas chaves do Supabase.
 * Uso: npm run configurar
 *
 * Existe para ninguém precisar saber o que é um arquivo .env: você cola os dois
 * valores aqui no terminal e ele escreve o arquivo no lugar certo.
 *
 * Este arquivo só afeta o app rodando NO SEU COMPUTADOR (npm run dev). O site
 * publicado na Vercel lê as mesmas duas variáveis do painel dela, não daqui.
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

/**
 * Tira do texto colado tudo que não é o valor em si. As pessoas colam de tudo:
 * com aspas, com o nome da variável na frente, com espaço, com a linha inteira
 * copiada da documentação. Nada disso deveria virar erro.
 */
function limpar(bruto) {
  return String(bruto ?? '')
    .trim()
    .replace(/^(VITE_)?SUPABASE_(URL|ANON_KEY)\s*[:=]\s*/i, '')
    .replace(/^["'`]|["'`;,]+$/g, '')
    .trim()
}

/** Aceita a URL com ou sem https, com barra no fim, ou com caminho colado junto. */
function normalizarUrl(bruto) {
  let v = limpar(bruto)
  if (!v) return null
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`
  let host
  try {
    host = new URL(v).host.toLowerCase()
  } catch {
    return null
  }
  if (!/^[a-z0-9-]+\.supabase\.(co|in)$/.test(host)) return null
  return `https://${host}`
}

/** Devolve o papel da chave quando ela é um JWT; null quando não dá para saber. */
function papelDaChave(v) {
  try {
    const meio = JSON.parse(Buffer.from(v.split('.')[1] ?? '', 'base64').toString())
    return meio?.role ?? null
  } catch {
    // Chaves do formato novo (sb_publishable_… / sb_secret_…) não são JWT.
    return null
  }
}

console.log(`
${negrito('Aprumo — ligar o Supabase')}

Abra o painel do Supabase e vá em ${negrito('Project Settings → API')}.
Você vai copiar dois valores de lá. Cole cada um aqui e aperte Enter.

${apagado('Pode colar com aspas, com espaço ou com o nome da variável junto — eu limpo.')}
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
  const lido = await perguntar(
    `${negrito('1) Project URL')} ${apagado('(algo como https://abcdefg.supabase.co)')}\n> `,
  )
  if (lido === null) encerrarSemResposta()
  const texto = limpar(lido)
  if (!texto) continue

  const tentativa = normalizarUrl(texto)
  if (!tentativa) {
    if (/^(eyJ|sb_)/.test(texto)) {
      console.log(vermelho('\n   Isso é a chave, não a URL. A URL vem primeiro — ela termina em .supabase.co\n'))
    } else {
      console.log(vermelho('\n   Não reconheci como Project URL.'))
      console.log(apagado('   Ela fica em Project Settings → API, no topo, e parece com:'))
      console.log(apagado('   https://abcdefghijklm.supabase.co\n'))
    }
    continue
  }
  url = tentativa
  console.log(apagado(`   ✓ ${url}\n`))
}

// -------------------------------------------------------------- chave ------
let chave = ''
while (!chave) {
  const lido = await perguntar(
    `${negrito('2) Chave anon public')} ${apagado('(a longa, começa com eyJ ou sb_publishable_)')}\n> `,
  )
  if (lido === null) encerrarSemResposta()
  const texto = limpar(lido)
  if (!texto) continue

  // O erro caro aqui é colar a service_role: ela ignora as regras de acesso e
  // daria a qualquer visitante do site poder total sobre o banco.
  const papel = papelDaChave(texto)
  if (/service[_-]?role/i.test(texto) || papel === 'service_role' || /^sb_secret_/.test(texto)) {
    console.log(vermelho('\n   PARE. Essa é a chave secreta (service_role) — ela nunca pode ir para o navegador.'))
    console.log(vermelho('   Volte e copie a que está marcada como "anon" / "public" / "publishable".\n'))
    continue
  }
  if (papel && papel !== 'anon') {
    console.log(vermelho(`\n   Essa chave é da função "${papel}", não "anon". Copie a chave anon public.\n`))
    continue
  }
  if (/\.supabase\.(co|in)/.test(texto)) {
    console.log(vermelho('\n   Isso é a URL de novo. Agora eu preciso da chave, que é bem mais longa.\n'))
    continue
  }
  if (texto.length < 30) {
    console.log(vermelho('\n   Essa chave parece curta demais — copie o valor inteiro.\n'))
    continue
  }
  chave = texto
}

writeFileSync(destino, `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${chave}\n`)
rl.close()

console.log(`
${verde('Pronto.')} Arquivo criado em ${negrito('.env.local')}

Ele fica só no seu computador — o .gitignore impede que vá para o GitHub.
${apagado('O site na Vercel não usa este arquivo: lá as duas variáveis vão no painel dela.')}

Agora rode:

  ${negrito('npm run dev')}

e abra http://localhost:5173 para criar sua conta.
`)
