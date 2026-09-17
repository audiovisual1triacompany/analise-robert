# Análise de Perfil — Método Robert Resende

App que dá uma nota ao perfil de Instagram (ou à beleza da pessoa) pela régua do
Robert Resende, a partir de prints/fotos. A IA (Google Gemini) só pontua os
critérios; a nota final, as travas e o texto saem de um motor calibrado — então
a nota é estável e auditável.

- **Modo Profissional** (dourado): o perfil como ativo de negócio — imagem,
  conteúdo, posicionamento, monetização.
- **Modo Beleza** (rosa / azul no masculino): rosto, shape, pele, cabelo,
  feminilidade, produção, estilo e padrão.

No ar: https://analise-robert.vercel.app

## Rodar local

Precisa de Node 18+ e uma chave do Google Gemini (grátis em
https://aistudio.google.com/apikey).

```bash
cp .env.example .env      # e cole sua chave em GEMINI_API_KEY
node server.js            # abre em http://localhost:8777
```

Sem a chave o site funciona (modos, cores, cálculo), só a leitura por IA fica
inativa.

## Deploy na Vercel

Projeto estático (`public/`) + uma função serverless (`api/analisar.js`). A
chave **não vai no repositório** — configure-a nas *Environment Variables* do
projeto na Vercel:

- `GEMINI_API_KEY` = sua chave
- `GEMINI_MODEL` = `gemini-2.5-flash` (opcional; é o padrão)

Depois, um novo deploy pega as variáveis.

## Onde se ajusta o método

Tudo em `public/criterios.js`: critérios, pesos, níveis, travas, pisos, textos
e os dois modos. `public/motor.js` faz o cálculo. `METODOLOGIA.md` e
`CALIBRACAO.md` explicam a régua e os perfis de referência.

> A chave gratuita do Gemini tem limite de ~20 análises/minuto. Para uso
> público de verdade, use uma chave paga.
