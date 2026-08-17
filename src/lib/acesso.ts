/**
 * Trava de entrada do Aprumo.
 *
 * A senha não está aqui. O que está é o resultado de passá-la por PBKDF2-SHA256
 * com 210 mil iterações e um sal fixo — dá para conferir se a senha digitada
 * bate, mas não dá para ler a senha a partir disto. Importa porque o
 * repositório é público: sem isso, a senha estaria indexada no Google.
 *
 * O que isto é: uma porta fechada. Impede que alguém que pegue o seu celular
 * destravado, ou esbarre no endereço, entre e mexa nos seus registros.
 *
 * O que isto não é: um cofre. A conferência acontece no navegador, então quem
 * souber mexer no código da página passa por ela sem saber a senha. Só uma
 * conferência feita num servidor resolve, e ela chega junto com a nuvem
 * (ver SINCRONIZAR.md).
 */

const USUARIO = 'jpmed'
const SAL = 'bf1cd6c709ed946f0d0c9b9e4036c832'
const ESPERADO = '6644e89db7fe0011f5e37308c312bfc0144aaac80f32bfbc3565c6ecb79f40ef'
const ITERACOES = 210_000

const CHAVE = 'aprumo:acesso'
const SELO = 'liberado-v2'

function hexParaBytes(hex: string): ArrayBuffer {
  const saida = new Uint8Array(hex.length / 2)
  for (let i = 0; i < saida.length; i++) saida[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return saida.buffer
}

function bytesParaHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function derivar(senha: string): Promise<string> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexParaBytes(SAL), iterations: ITERACOES, hash: 'SHA-256' },
    material,
    256,
  )
  return bytesParaHex(bits)
}

export async function confere(usuario: string, senha: string): Promise<boolean> {
  if (usuario.trim().toLowerCase() !== USUARIO) return false
  try {
    return (await derivar(senha)) === ESPERADO
  } catch {
    // crypto.subtle só existe em contexto seguro (https ou localhost). Se ele
    // faltar, é melhor não deixar entrar do que deixar entrar sem conferir.
    return false
  }
}

export function estaLiberado(): boolean {
  try {
    return localStorage.getItem(CHAVE) === SELO
  } catch {
    // Navegador com armazenamento bloqueado: pede a senha toda vez, em vez de
    // travar para fora de vez.
    return false
  }
}

export function liberar() {
  try {
    localStorage.setItem(CHAVE, SELO)
  } catch {
    /* sem persistir, a sessão vale só até fechar a aba */
  }
}

export function trancar() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    /* nada a fazer */
  }
}
