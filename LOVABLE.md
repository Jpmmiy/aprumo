# Aprumo no Lovable

O app importa e **funciona na hora**, sem configurar nada: os dados ficam salvos
no próprio navegador. Você já pode usar assim, e ligar a nuvem depois — ou nunca.

---

## Importar

1. **lovable.dev** → entrar com o GitHub
2. Novo projeto → importar do GitHub → escolher `Jpmmiy/aprumo`
3. Como o repositório é privado, autorize o app do Lovable a enxergar ele
4. Aguarde o build. Não precisa mexer em variável de ambiente, nem em chave, nem
   em banco de dados — não existe nenhuma.

Stack: Vite + React 19 + TypeScript + Tailwind v4 + React Router. É a stack
nativa do Lovable, então ele entende o projeto e consegue editar tudo.

---

## O que já funciona sem nuvem

Tudo. Cronômetro, registro de sessões, gráficos, questões, redação, grade do
cursinho, tarefas, anotações e ajustes.

A única limitação: os dados vivem **naquele aparelho, naquele navegador**. O que
você registrar no computador não aparece sozinho no celular.

Enquanto não ligar a nuvem, use **Ajustes → Seus dados**: *Baixar uma cópia* no
computador e *Restaurar de um backup* no celular. Funciona, mas é manual.

---

## Ligar o Lovable Cloud (quando quiser sincronizar)

O Cloud só pode ser ligado de dentro do Lovable. Depois de importar o projeto,
mande esta mensagem no chat dele:

> Ative o Lovable Cloud neste projeto.
>
> Hoje todos os dados ficam em localStorage, e toda a leitura e escrita passa por
> um único arquivo: `src/dados/loja.tsx`. Ele expõe um contexto React com esta
> interface, que **as telas usam e não pode mudar**:
>
> - `dados` — objeto com `perfil` e as listas `materias`, `sessoes`, `questoes`,
>   `redacoes`, `aulas`, `tarefas`, `anotacoes`, `provas`
> - `salvar(chave, registro)` — insere quando não vem `id`, atualiza quando vem
> - `remover(chave, id)`
> - `salvarPerfil(mudancas)`
> - `materiaPorId(id)`, `importar(json)`, `recarregar()`, `carregando`, `erro`
>
> Troque a implementação interna desse arquivo por Lovable Cloud, mantendo a
> interface idêntica, e:
>
> 1. Crie uma tabela para cada lista, com os campos que estão em `src/lib/tipos.ts`,
>    mais uma coluna `user_id` ligada ao usuário.
> 2. Ligue RLS em todas: cada conta só enxerga as próprias linhas.
> 3. Ao apagar uma matéria, apague em cascata as sessões e questões dela, e
>    limpe a referência em aulas, tarefas e anotações.
> 4. Adicione login por e-mail e senha, com uma tela de entrada em português.
> 5. Na primeira entrada de uma conta nova, crie o perfil e semeie as nove
>    matérias que estão em `MATERIAS_INICIAIS`, em `src/lib/constantes.ts`.
> 6. Ao entrar pela primeira vez num aparelho que já tinha dados locais, ofereça
>    enviar esses dados para a nuvem em vez de descartar.
>
> Não mexa em nenhuma tela, em nenhum gráfico e em nada dentro de `src/lib/`.

O ponto 6 importa: sem ele você perde o que já tiver registrado localmente.

---

## Mapa do projeto

```
src/
  lib/          regras puras — datas, formatação, métricas, tipos, constantes
  dados/        estado da aplicação
    loja.tsx      ← todo o armazenamento mora aqui (o que o Cloud substitui)
    cronometro.tsx  cronômetro que sobrevive a recarregar a página
  componentes/  interface reutilizável, gráficos em SVG próprio, a marca
  telas/        uma por aba da navegação
```

Regra que vale a pena manter: `src/lib/` não conhece React nem armazenamento, e
`src/telas/` nunca fala com armazenamento direto — sempre via `useDados()`.
É isso que faz a troca para o Cloud caber em um arquivo só.
