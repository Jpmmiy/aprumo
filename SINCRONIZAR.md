# Sincronizar entre celular e computador

Hoje o Aprumo guarda os dados no próprio aparelho. Cada aparelho tem o seu
histórico, e eles não conversam. Este arquivo explica como ligar a nuvem.

## Por que não dá para usar o Lovable

O Lovable **não importa repositório existente**. A documentação oficial é
explícita:

> "Importing existing GitHub repositories into Lovable. You can only export from
> Lovable to GitHub."

A integração dele funciona só no sentido contrário: um projeto criado dentro do
Lovable pode ser exportado para o GitHub, e a partir daí sincroniza nos dois
sentidos. Um projeto que nasceu fora, como este, não tem como entrar.

Ou seja: o Lovable Cloud não é uma opção para este código. Levar o Aprumo para
lá significaria mandar o Lovable construir um app do zero e jogar este fora.

## O caminho que funciona: Supabase

O app já está publicado na Vercel e funcionando. Falta só o banco.

**1. Criar o projeto no Supabase**

Em [supabase.com/dashboard](https://supabase.com/dashboard), *New project*.
Região **South America (São Paulo)**. O plano gratuito sobra para um ciclo
inteiro de cursinho.

**2. Criar as tabelas**

*SQL Editor* → *New query* → colar o conteúdo de
[`supabase/schema.sql`](supabase/schema.sql) → *Run*.

**3. Desligar a confirmação por e-mail**

*Authentication → Sign In / Providers → Email* → desligar **Confirm email**.
Assim a conta é criada e já entra, sem depender de e-mail chegar.

**4. Pegar as duas chaves**

*Project Settings → API*: a **Project URL** e a chave **anon public**.

Essas duas vão para `src/lib/nuvem.ts`. A chave `anon` é feita para ser pública
— ela viaja no navegador de qualquer jeito, e quem protege os dados é a RLS que
o `schema.sql` liga em toda tabela. A chave `service_role` **nunca** entra aqui.

## O que muda no app quando a nuvem entrar

- a trava de `src/lib/acesso.ts` sai, e o login passa a ser conferido no
  servidor — a senha deixa de ficar legível no código do site
- o que estiver salvo no aparelho é enviado para a nuvem na primeira entrada,
  em vez de ser descartado
- registrou no celular, aparece no computador

Enquanto isso não acontece, **Ajustes → Seus dados** faz a ponte na mão:
*Baixar uma cópia* num aparelho, *Restaurar de um backup* no outro.
