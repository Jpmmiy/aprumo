import type { Banca, CategoriaNota, Prioridade, TipoEstudo } from './tipos'

export interface Atividade {
  id: string
  nome: string
  tipo: TipoEstudo
  /** Frase curta que explica por que ela cai de um lado ou do outro. */
  porque: string
}

/**
 * A divisão ativo/passivo é a tese do app: o que te faz puxar a informação da
 * memória conta como ativo; o que só passa por você conta como passivo.
 */
export const ATIVIDADES: Atividade[] = [
  { id: 'exercicios', nome: 'Exercícios', tipo: 'ativo', porque: 'Você tem que produzir a resposta.' },
  { id: 'simulado', nome: 'Simulado', tipo: 'ativo', porque: 'Prova inteira, sob pressão de tempo.' },
  { id: 'revisao_ativa', nome: 'Revisão ativa', tipo: 'ativo', porque: 'Fecha o material e tenta lembrar.' },
  { id: 'flashcards', nome: 'Flashcards', tipo: 'ativo', porque: 'Recordação espaçada, pergunta a pergunta.' },
  { id: 'redacao', nome: 'Redação', tipo: 'ativo', porque: 'Você escreve do zero.' },
  { id: 'correcao', nome: 'Correção de erros', tipo: 'ativo', porque: 'Reprocessa o que você errou.' },
  { id: 'aula', nome: 'Aula no cursinho', tipo: 'passivo', porque: 'A informação vem pronta.' },
  { id: 'videoaula', nome: 'Videoaula', tipo: 'passivo', porque: 'A informação vem pronta.' },
  { id: 'leitura', nome: 'Leitura teórica', tipo: 'passivo', porque: 'Reconhecer não é lembrar.' },
  { id: 'resumo', nome: 'Resumo / esquema', tipo: 'passivo', porque: 'Copiar dá sensação de estudo sem cobrar memória.' },
]

export const MAPA_ATIVIDADES = new Map(ATIVIDADES.map((a) => [a.id, a]))

/**
 * Sessão sem matéria: o bloco corrido do cursinho, que passa por várias
 * matérias e não vale a pena separar. Conta no tempo total e na constância,
 * mas fica de fora dos gráficos por matéria — onde ele só faria barulho.
 */
export const ROTULO_SEM_MATERIA = 'Cursinho'
export const OPCAO_SEM_MATERIA = 'Cursinho (sem separar matéria)'

export function tipoDaAtividade(id: string): TipoEstudo {
  return MAPA_ATIVIDADES.get(id)?.tipo ?? 'passivo'
}

export function nomeDaAtividade(id: string): string {
  return MAPA_ATIVIDADES.get(id)?.nome ?? id
}

export const BANCAS: Banca[] = ['PUCRS', 'UFRGS', 'ENEM']

export const COR_BANCA: Record<Banca, string> = {
  PUCRS: 'var(--banca-pucrs)',
  UFRGS: 'var(--banca-ufrgs)',
  ENEM: 'var(--banca-enem)',
}

/**
 * Escalas de nota de redação. São o padrão inicial e ficam editáveis em Ajustes,
 * porque cada banca muda o próprio edital de um ano para o outro.
 */
export const ESCALAS_PADRAO: Record<Banca, number> = {
  PUCRS: 100,
  UFRGS: 30,
  ENEM: 1000,
}

export const COMPETENCIAS_ENEM = [
  'Domínio da norma culta',
  'Compreender o tema e o texto',
  'Selecionar e relacionar argumentos',
  'Mecanismos linguísticos (coesão)',
  'Proposta de intervenção',
]

export const PRIORIDADES: { id: Prioridade; nome: string; cor: string }[] = [
  { id: 'alta', nome: 'Alta', cor: 'var(--ferrugem)' },
  { id: 'media', nome: 'Média', cor: 'var(--latao)' },
  { id: 'baixa', nome: 'Baixa', cor: 'var(--tinta-3)' },
]

export const CATEGORIAS_NOTA: { id: CategoriaNota; nome: string }[] = [
  { id: 'melhorar', nome: 'A melhorar' },
  { id: 'erro', nome: 'Erro recorrente' },
  { id: 'ideia', nome: 'Ideia' },
  { id: 'geral', nome: 'Geral' },
]

export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const DIAS_MINIMOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

/** As nove matérias que ele listou, com cores que só rotulam — nunca codificam valor. */
export const MATERIAS_INICIAIS: { nome: string; cor: string }[] = [
  { nome: 'Matemática', cor: '#2F6FB5' },
  { nome: 'Física', cor: '#7A5AC4' },
  { nome: 'Biologia', cor: '#3F8F5B' },
  { nome: 'Química', cor: '#1E8C93' },
  { nome: 'Português', cor: '#B4436E' },
  { nome: 'Literatura', cor: '#9C7320' },
  { nome: 'Filosofia/Sociologia', cor: '#7C6A55' },
  { nome: 'Inglês', cor: '#C05A3E' },
  { nome: 'História', cor: '#5C7A2E' },
]

export const PALETA_MATERIAS = [
  '#2F6FB5',
  '#7A5AC4',
  '#3F8F5B',
  '#1E8C93',
  '#B4436E',
  '#9C7320',
  '#7C6A55',
  '#C05A3E',
  '#5C7A2E',
  '#396F8F',
  '#8A4FA0',
  '#4B7F3F',
]
