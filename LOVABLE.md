# Aprumo no Lovable

O projeto importa e **funciona na hora**, sem configurar nada. Depois, um único
pedido no chat liga o Lovable Cloud e resolve a sincronização entre aparelhos.

Stack: Vite + React 19 + TypeScript + Tailwind v4 + React Router. É a stack
nativa do Lovable, então ele entende e consegue editar o projeto inteiro.

---

## 1. Importar

1. **lovable.dev** → entrar com o GitHub
2. Novo projeto → importar do GitHub → `Jpmmiy/aprumo`
3. O repositório é privado: autorize o app do Lovable a enxergar ele
4. Aguardar o build

Não há variável de ambiente, chave nem banco para configurar. Não existe nenhum.

Ao abrir, o app pede **usuário e senha** (`jpmed` + a senha em
`src/lib/acesso.ts`). É uma trava simples, conferida no próprio navegador — o
passo 2 troca ela por login de verdade.

---

## 2. Ligar o Lovable Cloud

Cole esta mensagem no chat do Lovable:

> Ative o Lovable Cloud neste projeto.
>
> **Onde mexer.** Todo o armazenamento está isolado em `src/dados/loja.tsx`, que
> hoje grava em localStorage. Ele expõe um contexto React com esta interface, que
> as telas consomem e **não pode mudar de forma**:
>
> - `dados` — objeto com `perfil` e as listas `materias`, `sessoes`, `questoes`,
>   `redacoes`, `aulas`, `tarefas`, `anotacoes`, `provas`
> - `salvar(chave, registro)` — insere quando não vem `id`, atualiza quando vem
> - `remover(chave, id)`
> - `salvarPerfil(mudancas)`
> - `materiaPorId(id)`, `importar(json)`, `recarregar()`, `carregando`, `erro`
>
> Troque a implementação interna por Lovable Cloud mantendo essa interface, e:
>
> 1. Crie uma tabela por lista, com os campos definidos em `src/lib/tipos.ts`,
>    mais uma coluna `user_id` ligada ao usuário. Atenção: em `sessoes` o campo
>    `materia_id` é **anulável** — sessão sem matéria é o bloco corrido do
>    cursinho, e isso precisa continuar valendo.
> 2. Ligue RLS em todas: cada conta só enxerga as próprias linhas.
> 3. Ao apagar uma matéria, apague em cascata as sessões e questões dela, e
>    limpe a referência (deixando nula) em aulas, tarefas e anotações.
> 4. Substitua a trava de `src/lib/acesso.ts` e a tela `src/telas/Entrada.tsx`
>    por login de verdade, com e-mail e senha conferidos no servidor. Mantenha o
>    visual da tela como está e o usuário `jpmed`. Apague `src/lib/acesso.ts`
>    quando terminar — ele guarda a senha em texto puro e não pode sobreviver à
>    migração.
> 5. Na primeira entrada de uma conta nova, crie o perfil e semeie as nove
>    matérias de `MATERIAS_INICIAIS`, em `src/lib/constantes.ts`.
> 6. Se o aparelho já tiver dados em localStorage na primeira entrada, **ofereça
>    enviar esses dados para a nuvem** em vez de descartar.
>
> Não altere nada em `src/lib/` além do que está pedido acima, nem as telas, nem
> os gráficos.

O ponto 6 importa: sem ele você perde o que já tiver registrado no aparelho.
O ponto 4 também: sem ele a senha continua legível no código do site.

---

## 3. Enquanto o Cloud não estiver ligado

Os dados vivem **naquele aparelho, naquele navegador**. O que você registrar no
computador não aparece sozinho no celular.

Para levar de um para o outro, use **Ajustes → Seus dados**: *Baixar uma cópia*
num aparelho e *Restaurar de um backup* no outro.

Limpar os dados de navegação apaga o histórico. Baixe uma cópia de vez em quando.

---

## Mapa do projeto

```
src/
  lib/          regras puras — datas, formatação, métricas, tipos, constantes
    acesso.ts     trava de entrada (sai quando o Cloud entrar)
  dados/
    loja.tsx      ← todo o armazenamento mora aqui (o que o Cloud substitui)
    cronometro.tsx  cronômetro que sobrevive a recarregar a página
  componentes/  interface, gráficos em SVG próprio, a marca e o medidor do prumo
  telas/        uma por aba da navegação
```

Duas regras que fazem a migração caber em um arquivo só, e que vale manter:
`src/lib/` não conhece React nem armazenamento, e `src/telas/` nunca fala com
armazenamento direto — sempre via `useDados()`.

Os gráficos são SVG escrito à mão, sem biblioteca. As cores de série passaram
por validação de contraste e daltonismo nos dois temas; se for mexer nelas,
mantenha ativo e passivo distinguíveis em protanopia e deuteranopia.
