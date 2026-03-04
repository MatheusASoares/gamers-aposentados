---
description: Guia de Ambientes do Gamers Aposentados (Local, Preview e Produção)
---

# Estrutura de Ambientes do Projeto Gamers Aposentados

Este documento serve como mapa do ecossistema de desenvolvimento da aplicação. Toda vez que formos testar, debugar ou publicar novas features, devemos respeitar e nos referir a estes 3 ambientes:

## 1. Local (O Laboratório)

- **Localização:** Máquina do Matheus (Localhost / VSCode).
- **Branch Associada:** Qualquer branch de trabalho atual.
- **Banco de Dados:** Conectado à conta oficial da Neon através de sua chave local, porém focado apenas em rodar a aplicação via `npm run dev`.
- **Objetivo:** Escrever código, quebrar coisas, investigar erros no terminal e construir as lógicas brutas das novas features (como Sorteios, Perfis etc). Só o Matheus vê esse ambiente.

## 2. Preview (A Taverna / Homologação)

- **Localização:** Nuvem da Vercel (URLs temporárias acabadas em `.vercel.app`).
- **Branch Associada:** `dev` (GitHub).
- **Banco de Dados:** Conectação **ISOLADA** usando a credencial exclusiva do "Preview" criada no painel Neon.
- **Objetivo:** Sempre que uma feature está "pronta" no Local, ela é enviada (`git push`) para a branch `dev`. A Vercel constrói um ambiente instantâneo na nuvem. _Este é o ambiente onde o Matheus e os amigos testam o site simulando o uso real, mas com um banco de dados falso e isolado (Sandbox)._ Se algo quebrar aqui ou dados idiotas forem gerados, o servidor principal não é afetado.

## 3. Produção (O Santuário / Oficial)

- **Localização:** Domínio principal fixo configurado na Vercel.
- **Branch Associada:** `main` (GitHub).
- **Banco de Dados:** Conectado à chave `Production` exclusiva da Neon.
- **Objetivo:** O ambiente sagrado. Somente código 100% testado no _Preview_ e aprovado chega aqui. As atualizações ocorrem via `git merge dev` na `main`. Aqui rolam as verdadeiras Main Quests, Side Quests e Reviews intocáveis da comunidade.

## Fluxo de Trabalho e Deploy (Comandos para a IA / Usuário)

Quando o usuário pedir deploy ou testes, o fluxo natural entre os três é:

1. Codar no **Local** e ver se funciona.
2. Comitar e fazer push para a branch `dev`, criando um Snapshot de **Preview**.
3. Compartilhar o link de **Preview** com os "jogadores" oficiais para testar a mecânica nova.
4. Mudar para a branch `main`, dar `git merge dev` e mandar o comando final pro ar, que atualizará a **Produção**.
