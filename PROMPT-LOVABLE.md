# Prompt para reconstruir o Aprumo dentro do Lovable

O Lovable não importa repositório existente — a integração dele só exporta, de
dentro para fora. Então a única forma de ter o Aprumo lá é pedir que ele
construa a partir desta especificação, que descreve o app como ele está hoje.

Cole o bloco abaixo num projeto novo do Lovable. Depois de pronto, ative o
Lovable Cloud pelo painel dele.

O que sair não vai ser idêntico — é outra IA construindo. Mas os pontos que dão
identidade ao app (o prumo, a divisão ativo/passivo, as cores, as regras de
diagnóstico) estão todos descritos com valor exato, então o miolo se mantém.

---

```
Construa um aplicativo web chamado APRUMO: um painel de estudos para vestibular
de medicina (PUCRS, UFRGS e ENEM), de uso diário no celular e no computador.
Tudo em português do Brasil. Use Lovable Cloud para os dados, com login.

## A IDEIA

"Prumo" é o peso pendurado num fio que mostra se algo está no eixo. O app é um
instrumento de leitura, não um jogo de recompensas: mostra o número sem enfeite,
sem confete, sem "parabéns". A recompensa é ver a linha reta.

## IDENTIDADE VISUAL

Tema claro e escuro, seguindo o sistema, com botão de troca.

Tema claro:  fundo #EDF0E6 · superfície #F7F9F3 · borda #D5DEC6 · texto #161C12
             texto secundário #4A5744 · acento #3E5C33 · latão #8A6A1C
             verde positivo #43903F · vermelho #A3402C
Tema escuro: fundo #10150E · superfície #1A2117 · borda #2B3625 · texto #E9EFE1
             texto secundário #A8B69D · acento #7CB06A · latão #C79A34
             verde positivo #5EA751 · vermelho #D97A63

Regra: verde musgo é a superfície, latão é o instrumento. Latão nunca pinta
botão comum — só marca o peso do prumo, a meta e o "agora".

Fontes do Google: Fraunces nos títulos, Archivo no texto e na interface,
JetBrains Mono em todo número que se compara com outro número (com figuras
tabulares, senão a coluna dança a cada segundo do cronômetro).

Cantos de 14px nos cartões, 10px nos campos. Muito respiro. Sem gradiente
chamativo, sem sombra pesada.

Logo: um fio de prumo. Um traço horizontal no topo (o ponto fixo), um fio
vertical descendo, e um peso em forma de losango alongado terminando em ponta.
Em latão. Serve de favicon e de ícone do app.

## GRÁFICOS

Desenhe em SVG, sem biblioteca de gráficos. Cores de série já validadas para
daltonismo — use exatamente estas:

  claro:  ativo #43903F · passivo #2F6FB5
          PUCRS #2F6FB5 · UFRGS #9C7320 · ENEM #B4436E
  escuro: ativo #5EA751 · passivo #4A86C4
          PUCRS #5B8FCC · UFRGS #AE8523 · ENEM #CC5F86

Barras finas, topo arredondado em 4px e base fixada na linha de base, 2px de
respiro entre trechos empilhados, grade discreta, legenda sempre presente
quando houver duas séries, e dica ao passar o dedo/mouse.

Identidade de matéria vem do rótulo, nunca da cor: nos gráficos por matéria use
uma cor só e ordene por valor.

## DADOS (Lovable Cloud, com RLS por usuário)

matérias    nome, cor, ordem, arquivada
sessões     materia_id (PODE SER NULO), início (data e hora), minutos,
            atividade, tipo ('ativo'|'passivo'), assunto, anotação
questões    materia_id, data, total, acertos, origem, assunto
redações    data, banca ('PUCRS'|'UFRGS'|'ENEM'), nota, nota_max, tema,
            competências (5 números, só ENEM), observações
aulas       dia da semana (0-6), início, fim, materia_id, título, professor, sala
tarefas     título, detalhe, data, prioridade, concluída, materia_id, ordem
anotações   título, corpo, categoria, materia_id, fixada
provas      nome, data
perfil      nome, meta_min_dia (240), meta_questoes_semana (300),
            meta_ativo_pct (60), escalas das redações

Sessão com materia_id nulo é o bloco corrido do cursinho: conta no tempo total e
na constância, mas fica fora dos gráficos por matéria.

Apagar uma matéria apaga em cascata as sessões e questões dela, e deixa nula a
referência em aulas, tarefas e anotações.

Semeie na primeira entrada as nove matérias: Matemática, Física, Biologia,
Química, Português, Literatura, Filosofia/Sociologia, Inglês, História.

Escalas iniciais de redação: PUCRS 0-100, UFRGS 0-30, ENEM 0-1000 (editáveis).
Comparação entre bancas só em porcentagem, porque as escalas são diferentes.

## ATIVO x PASSIVO — a tese do app

Ativo (você produz a resposta): Exercícios, Simulado, Revisão ativa, Flashcards,
Redação, Correção de erros.
Passivo (a informação vem pronta): Aula no cursinho, Videoaula, Leitura teórica,
Resumo/esquema.

O tipo é derivado da atividade, não escolhido à parte.

## TELAS (navegação: barra lateral no computador, barra inferior no celular)

1. HOJE — saudação com a data por extenso; selo de dias seguidos de estudo;
   O PRUMO DE HOJE (descrito abaixo); botões de registrar estudo, cronômetro e
   questões; quatro indicadores (tempo hoje, % ativo, questões, dias até a
   próxima prova); cartões de diagnóstico; tarefas de hoje; aulas de hoje com
   destaque na que está acontecendo; colunas dos últimos 14 dias.

2. ESTUDAR — cronômetro grande em mono, que continua contando com a aba fechada
   ou a tela do celular travada (calcule pelo relógio, nunca somando ticks);
   alvo de 25/50/90 minutos ou livre; escolha de matéria (podendo ser "Cursinho,
   sem separar matéria") e atividade; ao encerrar, abre o registro preenchido.
   Abaixo, histórico agrupado por dia, com editar e apagar.

3. DESEMPENHO — três abas.
   Visão geral: seletor de 7/28/90 dias; indicadores; colunas por dia empilhando
   ativo e passivo com linha pontilhada na meta; tempo por matéria; acerto por
   matéria com marca na média geral; MAPA ESFORÇO x RESULTADO (dispersão com
   horas no eixo X e % de acerto no Y, matérias rotuladas, medianas dividindo em
   quadrantes — o canto "muito tempo, pouco acerto" marcado como "precisa de
   método"); calendário de constância das últimas 16 semanas.
   Questões: registro e taxa de acerto por matéria.
   Redação: as três bancas no mesmo gráfico de linha em porcentagem, com rótulo
   na ponta de cada linha; ENEM aceita as cinco competências de 0 a 200.

4. ROTINA — duas abas. Grade do cursinho como tabela semanal de verdade no
   computador (colunas = dias, eixo de horas, blocos posicionados pelo horário)
   e lista por dia no celular. A fazer: tarefas agrupadas em Atrasadas, Hoje,
   Amanhã, Mais para frente, Sem data e Concluídas.

5. ANOTAÇÕES — o caderno de erros. Cartões com busca e filtro por categoria
   (A melhorar, Erro recorrente, Ideia, Geral), com opção de fixar no topo.

6. AJUSTES — nome, metas, escalas de redação, matérias (criar, cor, arquivar,
   apagar), datas das provas, baixar e restaurar backup em JSON.

## O PRUMO DE HOJE — o elemento que dá nome ao app

Não é barra de progresso. É um instrumento:

- uma âncora fixa no topo, um fio descendo e um peso de latão em losango
- atrás, um arco com marcas de escala, rotulado "atrás", "meta", "adiantado",
  com a faixa central destacada na cor de acento
- o conjunto gira em torno da âncora conforme (minutos feitos ÷ meta do dia):
  razão 0 pende todo para a esquerda (-28°), razão 1 fica na vertical, acima
  disso inclina até 20° para a direita
- ao abrir, sai da vertical e assenta no ângulo do dia, com leve ultrapassagem
- ALÉM DISSO, o peso oscila de leve o tempo todo, para sempre, uns 1,2° para
  cada lado num ciclo de 3,6s — um peso pendurado nunca fica parado. Faça isso
  como uma camada de rotação separada, por dentro da rotação da leitura: uma
  responde ao dado e a outra não.
- abaixo: o tempo feito em número grande, "de Xh hoje · faltam Y", e o estado
  em uma palavra: Parado / Fora do eixo / Perto do eixo / No eixo

Respeite prefers-reduced-motion: com ele ligado, nada anima.

## DIAGNÓSTICO — o que responde "onde estou errando"

Analise os últimos 28 dias e mostre cartões ordenados por gravidade. Cada um
tem título com o número, uma explicação curta e uma ação concreta. Só apareça
quando houver dado suficiente:

- % de estudo ativo abaixo da meta
- matéria que consome tempo acima da média e tem acerto bem abaixo da média
  (título no espírito de "X consome tempo e não devolve acerto")
- matéria há 10 dias ou mais sem nenhum registro
- poucos dias com estudo nos últimos 14
- volume de questões da semana abaixo do esperado
- última redação há mais de 21 dias

Quando estiver bem, diga também — mas sem euforia.

## OUTRAS ANIMAÇÕES

Cartões entram em cascata curta ao abrir a tela (uns 45ms entre eles). Colunas
dos gráficos nascem da linha de base. Nada além disso.

## LOGIN

Tela de entrada com o painel da marca à esquerda (fundo verde escuro, o fio de
prumo grande balançando, e a frase "Um prumo não te elogia. Ele só mostra o
eixo.") e o formulário à direita. No celular, só o formulário. Usuário: jpmed.
Senha conferida no servidor, pelo Lovable Cloud.

## TEXTO

Direto, em português, sem entusiasmo forçado. Erros dizem o que aconteceu e
como resolver. Telas vazias convidam à ação em vez de só informar que está
vazio. Duração no formato "3h12", nunca "192 min".

Rodapé: "Aprumo · feito para João Pedro Terra Mainardi"
```
