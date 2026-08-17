# Aprumo

Painel de estudos para vestibular de medicina — PUCRS, UFRGS e ENEM.
Feito para João Pedro Terra Mainardi.

> Um prumo não te elogia. Ele só mostra o eixo.

Não é um app de recompensa: é um instrumento de leitura. Ele mede quanto tempo
você estudou, quanto desse tempo foi **ativo**, quanto você acerta em cada
matéria, e diz onde o esforço está indo embora.

---

## Rodar

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
npm run dev
```

Abra http://localhost:5173. **Não tem chave nem banco para configurar.** Os
dados ficam salvos no navegador e as nove matérias já vêm cadastradas.

O app pede usuário e senha ao abrir — a trava fica em `src/lib/acesso.ts`, é
conferida no próprio navegador e sai de cena quando entrar login de verdade.

Para publicar, veja [LOVABLE.md](LOVABLE.md).

---

## O que tem dentro

**Hoje** — o prumo do dia, atalhos de registro, tarefas, aulas de hoje e as
últimas duas semanas em colunas.

**Estudar** — cronômetro que continua contando com a aba fechada ou a tela do
celular travada, com alvo de 25/50/90 minutos. No fim, vira registro.

**Desempenho** — três abas:

- *Visão geral*: horas por dia (ativo x passivo), tempo e acerto por matéria,
  mapa de esforço contra resultado, calendário de constância
- *Questões*: taxa de acerto por matéria, com a média geral marcada
- *Redação*: PUCRS, UFRGS e ENEM no mesmo gráfico, comparadas em porcentagem
  porque as escalas são diferentes; ENEM aceita as cinco competências

**Rotina** — grade semanal do cursinho e lista de tarefas.

**Anotações** — o caderno de erros, com busca e categorias.

**Ajustes** — metas, matérias, escalas de redação, datas de prova e backup.

### As duas ideias que organizam o app

**Ativo x passivo.** Exercício, simulado, recordação e correção de erro contam
como ativo; aula, vídeo, leitura e resumo contam como passivo. É a métrica que
mais separa quem melhora de quem só acumula hora.

**Esforço contra resultado.** Um gráfico com as matérias posicionadas por tempo
investido e taxa de acerto. O canto de baixo à direita — muito tempo, pouco
acerto — é onde o problema é de método, não de dedicação.

---

## Onde os dados ficam

No próprio navegador (`localStorage`), sem servidor e sem conta.

Isso significa que **o computador e o celular têm históricos separados**. Para
juntar: *Ajustes → Seus dados → Baixar uma cópia*, e restaurar no outro aparelho.
Para sincronizar de verdade, [LOVABLE.md](LOVABLE.md) explica como ligar o
Lovable Cloud.

Limpar os dados de navegação apaga o histórico. Baixe uma cópia de vez em quando.

---

## Publicar

Funciona em qualquer hospedagem estática, de graça:

- **Lovable** — importa do GitHub e roda; veja [LOVABLE.md](LOVABLE.md)
- **Vercel / Netlify / Cloudflare Pages** — importe o repositório e aceite os
  padrões (`npm run build`, pasta `dist`). O `vercel.json` já cuida das rotas.

No celular, abra o site e use *Adicionar à tela de início*: ele instala como
aplicativo, abre sem barra de navegador e funciona offline.

---

## Estrutura

```
src/
  lib/          regras puras: datas, formatação, métricas, tipos, constantes
  dados/        estado: armazenamento (loja) e cronômetro
  componentes/  interface, gráficos em SVG próprio, a marca
  telas/        uma por aba
```

Gráficos são SVG escrito à mão, sem biblioteca. As cores de série passaram por
validação de contraste e daltonismo (protanopia e deuteranopia) nos dois temas.

**Comandos:** `npm run dev` · `npm run build` · `npm run lint`

---

## A marca

*Prumo* é o peso que pende de um fio para mostrar se algo está no eixo.
Daí o nome, a logo e o medidor do painel: quando o dia bate a meta, o fio para
de pender e fica reto.

Verde musgo nas superfícies, latão só no instrumento — o peso, a meta, o agora.
Tipografia: Fraunces nos títulos, Archivo no texto, JetBrains Mono nos números.
