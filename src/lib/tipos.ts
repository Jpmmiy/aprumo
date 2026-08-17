export type TipoEstudo = 'ativo' | 'passivo'

export type Banca = 'PUCRS' | 'UFRGS' | 'ENEM'

export type Prioridade = 'alta' | 'media' | 'baixa'

export type CategoriaNota = 'melhorar' | 'erro' | 'ideia' | 'geral'

export interface Materia {
  id: string
  nome: string
  cor: string
  ordem: number
  arquivada: boolean
}

export interface Sessao {
  id: string
  /** null = estudo bruto do cursinho, sem separar por matéria. */
  materia_id: string | null
  /** ISO completo: guarda o instante de início para reconstruir o dia local. */
  inicio: string
  minutos: number
  atividade: string
  tipo: TipoEstudo
  assunto: string | null
  anotacao: string | null
}

export interface Questao {
  id: string
  data: string
  materia_id: string
  total: number
  acertos: number
  origem: string | null
  assunto: string | null
}

export interface Redacao {
  id: string
  data: string
  banca: Banca
  nota: number
  /** A escala vale no momento do registro, para o histórico não mudar de sentido. */
  nota_max: number
  tema: string | null
  competencias: number[] | null
  observacoes: string | null
}

export interface Aula {
  id: string
  /** 0 = domingo, 6 = sábado */
  dia: number
  inicio: string
  fim: string
  materia_id: string | null
  titulo: string
  professor: string | null
  local: string | null
}

export interface Tarefa {
  id: string
  titulo: string
  detalhe: string | null
  data: string | null
  prioridade: Prioridade
  concluida: boolean
  materia_id: string | null
  ordem: number
  criada_em: string
}

export interface Anotacao {
  id: string
  titulo: string
  corpo: string
  categoria: CategoriaNota
  materia_id: string | null
  fixada: boolean
  criada_em: string
  atualizada_em: string
}

export interface Prova {
  id: string
  nome: string
  data: string
}

export interface Perfil {
  nome: string
  meta_min_dia: number
  meta_questoes_semana: number
  meta_ativo_pct: number
  escalas: Record<Banca, number>
}

export interface Dados {
  perfil: Perfil
  materias: Materia[]
  sessoes: Sessao[]
  questoes: Questao[]
  redacoes: Redacao[]
  aulas: Aula[]
  tarefas: Tarefa[]
  anotacoes: Anotacao[]
  provas: Prova[]
}
