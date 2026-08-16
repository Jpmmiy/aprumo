import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/** Sem as duas chaves o app abre direto no guia de configuração, em vez de quebrar. */
export const configurado = Boolean(url && chave && url.startsWith('http'))

export const supabase: SupabaseClient = configurado
  ? createClient(url!, chave!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'aprumo:sessao',
      },
    })
  : // Cliente inerte: mantém os tipos de pé enquanto a tela de configuração
    // é exibida, sem nunca chegar a fazer uma requisição.
    (new Proxy(
      {},
      {
        get() {
          throw new Error('Supabase ainda não configurado')
        },
      },
    ) as SupabaseClient)

export function mensagemDeErro(erro: unknown): string {
  if (!erro) return 'Algo deu errado.'
  const msg = typeof erro === 'string' ? erro : ((erro as { message?: string }).message ?? '')

  const traducoes: [RegExp, string][] = [
    [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
    [/email not confirmed/i, 'Confirme o e-mail antes de entrar (ou desligue a confirmação no Supabase).'],
    [/user already registered/i, 'Esse e-mail já tem conta. Use "Entrar".'],
    [/password should be at least/i, 'A senha precisa de pelo menos 6 caracteres.'],
    [/rate limit|too many requests/i, 'Muitas tentativas seguidas. Espere um minuto.'],
    [/failed to fetch|networkerror/i, 'Sem conexão com o servidor. Verifique a internet.'],
    [/relation .* does not exist/i, 'As tabelas ainda não foram criadas. Rode o schema.sql no Supabase.'],
    [/jwt|invalid api key/i, 'A chave do Supabase parece inválida. Confira o arquivo .env.local.'],
  ]
  for (const [re, texto] of traducoes) if (re.test(msg)) return texto
  return msg || 'Algo deu errado.'
}
