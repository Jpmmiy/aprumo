/**
 * Trava de entrada do Aprumo.
 *
 * O que isto é: uma porta fechada. Impede que alguém que pegue o seu celular
 * destravado, ou que esbarre no endereço, entre e mexa nos seus registros.
 *
 * O que isto não é: um cofre. O app roda inteiro no navegador, então estas duas
 * linhas viajam junto com a página — quem abrir o código-fonte do site consegue
 * lê-las. Só uma conferência feita num servidor resolveria isso, e ela chega
 * junto com a sincronização na nuvem (ver LOVABLE.md).
 */

const USUARIO = 'jpmed'
const SENHA = 'senha-removida-do-historico'

const CHAVE = 'aprumo:acesso'
const SELO = 'liberado-v1'

export function confere(usuario: string, senha: string): boolean {
  return usuario.trim().toLowerCase() === USUARIO && senha === SENHA
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
