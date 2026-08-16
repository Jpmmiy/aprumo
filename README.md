# Aprumo

Painel de estudos para vestibular de medicina — feito para **João Pedro Terra Mainardi**.

Prumo é o peso pendurado num fio que mostra se uma parede está reta. Ele não elogia
e não motiva: só mostra se a coisa está no eixo ou torta. O app funciona assim — o
número aparece sem enfeite, e a recompensa é ver a linha reta.

Funciona no computador e no celular, com os mesmos dados nos dois, e pode ser
instalado como aplicativo no celular.

---

## O que tem dentro

| | |
|---|---|
| **Cronômetro** | Continua contando se você trocar de aba ou travar a tela do celular. Tem alvo de 25/50/90 min e aviso sonoro quando bate. Ao encerrar, já abre o registro preenchido. |
| **Estudo ativo × passivo** | Toda sessão é classificada pelo que você fez. Exercício, simulado, recordação e redação contam como **ativo**; aula, vídeo, leitura e resumo contam como **passivo**. Essa divisão é o principal diagnóstico do app. |
| **Gráficos** | Horas por dia (colunas, com a meta marcada), tempo por matéria, acerto por matéria, mapa de esforço × resultado e calendário de constância de 16 semanas. |
| **Questões** | Total, acertos e origem por lançamento. Taxa de acerto por matéria comparada com a sua média geral. |
| **Redação** | PUCRS, UFRGS e ENEM, cada uma com a própria escala. O gráfico normaliza em porcentagem, que é o único jeito honesto de comparar as três. No ENEM dá para lançar as cinco competências. |
| **Grade do cursinho** | Tabela semanal de verdade, com blocos posicionados por horário. No celular vira lista por dia. |
| **A fazer** | Tarefas com data, prioridade e matéria, agrupadas em atrasadas / hoje / amanhã / depois. |
| **Anotações** | Caderno de erros, com busca, categorias e fixar no topo. |
| **Diagnóstico** | Lê os últimos 28 dias e aponta o que está custando caro: matéria que consome tempo e não devolve acerto, matéria abandonada, excesso de estudo passivo, queda de constância. Cada aviso termina numa ação concreta. |

---

## 1. Rodar no seu computador

Você precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
```

```bash
npm run dev
```

Abra <http://localhost:5173>. Na primeira vez vai aparecer a tela **"Falta ligar o
banco de dados"** — é o passo 2.

---

## 2. Ligar o Supabase (uma vez só)

O Supabase é onde seus dados ficam salvos. O plano gratuito sobra para um ano de
cursinho.

### 2.1 Criar o projeto

1. Entre em <https://supabase.com/dashboard> (dá para entrar com o GitHub).
2. Clique em **New project**.
3. Nome: `aprumo`. Crie uma senha de banco e guarde num lugar seguro.
4. Região: **South America (São Paulo)** — é a mais perto, o app fica mais rápido.
5. Espere uns dois minutos até o projeto ficar pronto.

### 2.2 Criar as tabelas

1. No menu da esquerda, abra **SQL Editor** → **New query**.
2. Cole o conteúdo inteiro de [`supabase/schema.sql`](supabase/schema.sql).
3. Clique em **Run**.

Se aparecer `Success. No rows returned`, deu certo. Pode rodar de novo quantas vezes
quiser: o arquivo não apaga nada.

### 2.3 Desligar a confirmação por e-mail

Vá em **Authentication → Sign In / Providers → Email** e desligue **Confirm email**.
Salve.

Isso deixa você criar a conta e entrar na hora, sem depender de e-mail chegar. Como a
conta é só sua, não muda nada de segurança.

### 2.4 Guardar as duas chaves no projeto

Abra **Project Settings → API** no Supabase. Lá tem dois valores que o app precisa:
a **Project URL** e a chave **anon public**.

Não precisa criar arquivo nenhum na mão. Na pasta do projeto, rode:

```bash
npm run configurar
```

Ele pergunta um valor de cada vez — você cola, aperta Enter, e ele escreve o arquivo
`.env.local` no lugar certo. Se você colar a chave errada, ele avisa e pergunta de novo.

> A chave **anon** pode ficar visível no navegador — cada tabela tem RLS ligada, então
> ela só consegue ler e escrever as linhas da sua própria conta. **Nunca** use a chave
> `service_role` aqui: essa ignora as regras e dá acesso a tudo. O comando acima recusa
> a `service_role` se você colar por engano.

O `.env.local` fica só no seu computador — o `.gitignore` impede que ele vá para o
GitHub.

### 2.5 Reiniciar

Pare o servidor (`Ctrl+C`) e rode `npm run dev` de novo. A tela de configuração some e
a de criar conta aparece. Crie a conta e pronto — as nove matérias já vêm cadastradas.

---

## 3. Publicar de graça na internet

### Pelo GitHub + Vercel (recomendado)

1. Crie um repositório novo no GitHub e suba este projeto:

```bash
git remote add origin https://github.com/SEU_USUARIO/aprumo.git
```

```bash
git push -u origin main
```

2. Entre em <https://vercel.com>, clique em **Add New → Project** e importe o
   repositório. A Vercel reconhece Vite sozinha — não precisa mexer em nada.

3. Antes de clicar em **Deploy**, abra **Environment Variables** e adicione as duas
   mesmas variáveis do `.env.local`:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. **Deploy**. Em cerca de um minuto você tem um endereço tipo
   `aprumo.vercel.app`, que abre no celular e no computador.

Toda vez que você der `git push`, a Vercel publica a versão nova sozinha.

### Sobre o Lovable

Este projeto usa exatamente a stack que o Lovable usa (Vite + React + TypeScript +
Tailwind + Supabase), então importar o repositório do GitHub lá funciona. Mas para
só hospedar e usar, a Vercel é mais direta — o Lovable só vale a pena se você quiser
editar o app por lá depois.

---

## 4. Instalar no celular

Abra o endereço da Vercel no celular:

- **Android (Chrome):** menu **⋮** → *Adicionar à tela inicial*.
- **iPhone (Safari):** botão de compartilhar → *Adicionar à Tela de Início*.

Ele passa a abrir em tela cheia, com ícone próprio, e a casca do app funciona mesmo
sem internet (os dados novos sincronizam quando a conexão voltar).

---

## 5. Coisas que só você pode conferir

- **As escalas de redação.** O app começa com PUCRS até 100, UFRGS até 30 e ENEM até
  1000. Esses valores são um chute razoável, **não são cópia de edital** — confira o
  edital do seu ano e corrija em **Ajustes**. As redações já registradas guardam a
  escala que valia na hora, então o histórico não se perde quando você mudar.
- **As datas das provas.** Não vêm preenchidas de propósito, para você não estudar
  contando uma data errada. Cadastre em **Ajustes → Datas das provas**.
- **As metas.** `Ajustes` define a meta de horas por dia, de questões por semana e o
  percentual mínimo de estudo ativo. São essas três que o prumo e os diagnósticos usam
  como régua.

---

## 6. Estrutura

```
src/
  componentes/
    Casca.tsx          navegação (barra lateral no PC, abas embaixo no celular)
    Marca.tsx          a logo do prumo
    MedidorPrumo.tsx   o instrumento do painel — a peça-assinatura
    graficos.tsx       todos os gráficos, em SVG próprio
    dialogos.tsx       registrar sessão, questões e redação
    ui.tsx             botões, campos, modal, abas
  dados/
    auth.tsx           login e cadastro
    loja.tsx           carga e escrita no Supabase
    cronometro.tsx     o cronômetro, guardado fora do React
  lib/
    metricas.ts        todo o cálculo e o diagnóstico
    constantes.ts      matérias, atividades, bancas
    datas.ts           datas sempre em fuso local
  telas/               uma por página
supabase/schema.sql    o banco inteiro
scripts/gerar-icones.mjs
```

Algumas decisões que valem saber, se você (ou uma IA) for mexer depois:

- **Datas nunca usam `toISOString()` para descobrir o dia.** Depois das 21h no Brasil
  isso joga o registro para o dia seguinte. Existe `paraDataLocal()` em `lib/datas.ts`.
- **O cronômetro guarda o instante de início, não um contador.** É por isso que ele
  não atrasa quando o celular trava a tela.
- **As cores dos gráficos foram validadas para daltonismo** (contraste e separação de
  matiz). As cores das matérias servem só para rótulo — nenhum gráfico depende delas
  para o dado ser lido.
- **As nove matérias não viram nove cores num gráfico.** Identidade de matéria vem do
  rótulo escrito; cor fica reservada para ativo × passivo e para as três bancas.

### Regerar os ícones

```bash
npm i -D sharp && node scripts/gerar-icones.mjs
```

---

## Comandos

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run preview
```
