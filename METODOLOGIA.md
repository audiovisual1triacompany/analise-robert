# Método SKIN — análise de perfil pela régua Robert Resende

Metodologia extraída de **996 reels transcritos** do Robert Resende e calibrada contra as **22 análises reais** já entregues na planilha *100 Primeiros — Instagram*.

## De onde vem a régua

Cada critério nasce de um princípio que o Robert repete ao longo da base:

| Critério | Peso | Princípio de origem |
|---|---|---|
| Estética & Cuidado Pessoal | 18 | "Quanto maior o ticket, mais bonito tem que ser quem está vendendo" · "Beleza abre portas que o diploma não abre" |
| Energia & Arquétipo | 15 | "A mulher feminina faz mais dinheiro" · "A elegância não grita, ela sussurra" · "Cliente alto padrão não gosta de vendedor com energia de mulambo" |
| Bandeira & Posicionamento | 13 | "Qual é a bandeira que o seu perfil defende? Perfil morno perde força" |
| Naturalidade (Anti-Personagem) | 12 | "As pessoas sentem o faro de um personagem" · "Falei com o coração, sem roteiro, e viralizei" |
| Estilo de Vida vs. Só Trabalho | 12 | "Ninguém gosta de acompanhar quem só fala do produto que vende" |
| Cenário & Sinal de Padrão | 10 | "Tá tudo bem ser pobre, você só não precisa parecer um" |
| Limpeza Visual | 10 | "Do jeito que sai daqui, sobe. Não coloco nem legenda" · "Raso com qualidade" |
| Prontidão pra Monetizar | 10 | "Se o cliente perceber que você precisa da venda, ele descredibiliza" |

A régua muda conforme o gênero: para mulheres pesa feminilidade, sorriso e elegância; para homens, postura firme, autoridade e apresentação.

## Como a nota é calculada

Cada critério recebe um de cinco níveis:

`Crítico 2,0 · Fraco 5,0 · Médio 6,5 · Bom 8,0 · Excelente 9,5`

A nota é a média ponderada pelos pesos acima. **Tudo em "Bom" dá exatamente 8,0** — que é o centro real das 22 análises já entregues.

## Travas

Certas condições limitam o teto da nota, exatamente como acontecia nas análises manuais:

## Piso por critério

Nenhum item desce abaixo do seu piso na conta da nota. Ninguém recebe "Crítico"
numa linha da própria imagem — esses são os descontos máximos que cada critério
pode aplicar.

| Critério | Piso |
|---|---|
| Estética & Cuidado Pessoal | 7,0 |
| Energia & Arquétipo | 6,0 |
| Cenário & Sinal de Padrão | 6,0 |
| Naturalidade | 6,0 |
| Limpeza Visual | 6,0 |
| Estilo de Vida vs. Só Trabalho | 6,0 |
| Bandeira & Posicionamento | 5,0 |
| Prontidão pra Monetizar | 5,0 |

**O piso mexe só no número.** O diagnóstico — quais melhorias aparecem e qual
fecho dispara — continua olhando a pontuação crua. Sem isso, os conselhos mais
importantes parariam de disparar: naturalidade com piso 6,0 nunca acionaria o
"ligue a câmera", que tem gatilho em 5,0.

Com os pisos, o pior perfil possível recebe **6,0** (homem) ou **7,0** (mulher,
por causa do piso global da régua feminina) — antes recebia 2,0.

## Bloqueio — quando não se avalia

**Perfil trancado e sem posts não recebe nota.** Não há o que avaliar; o app
devolve "Não avaliável" e a orientação de abrir o perfil e começar a postar.
Isso é diferente da trava de perfil trancado (teto 8,0), que vale quando ainda
dá pra ver foto, bio e contagem — foi o caso da Adara na planilha original.

## Travas

| Trava | Teto |
|---|---|
| Não aparece nos conteúdos (câmera desligada) | 6,5 |
| Muito vendedor / só fala da empresa | 7,5 |
| Ostentação barata | 7,5 |
| Perfil trancado / privado | 8,0 |
| Posta menos de 1x por semana | 8,5 |

*(A trava do perfil trancado reproduz o caso real da Adara — nota 8,0 com a observação de que o perfil fechado impediu a análise profunda.)*

## Faixas

| Nota | Faixa | Leitura |
|---|---|---|
| 9,0–10 | Skin modo easy | Perfil pronto. Não é imagem — é volume e monetização. |
| 8,0–8,9 | Perfil forte | Base muito boa, um ou dois ajustes finos. |
| 7,0–7,9 | Bom com trava | Perfil bom, mas com uma trava específica segurando. |
| 5,5–6,9 | Precisa reconstruir | Imagem ou conteúdo precisam ser refeitos antes de escalar. |
| < 5,5 | Recomeço de posicionamento | Reconstruir imagem, conteúdo e posicionamento do zero. |

## Determinismo — a mesma imagem tem que dar a mesma nota

O Gemini usa `temperature: 1` por padrão, o que fazia a **mesma imagem devolver
pontuações diferentes** a cada leitura. Corrigido no `server.js`:

```js
temperature: 0, topP: 1, seed: 42
```

Além disso, o prompt ganhou âncoras de calibração e uma regra de desempate:
**na dúvida entre dois níveis, escolher "Bom"** — é o centro da régua e a
resposta certa na maioria dos perfis.

## Escala de beleza

O critério de Estética usa a escala das próprias enquetes do Robert nos stories
— **Linda / Bonita / "sem beleza, seu caso é shape"**:

| Nível | Leitura |
|---|---|
| Excelente | **LINDA** — alto padrão, foto profissional. O público não hesita. Raro. |
| Bom | **BONITA** — cabelo e maquiagem em dia, roupa que valoriza, sorriso. **O centro da régua.** |
| Médio | Bonita às vezes — cuida numas fotos e larga em outras |
| Fraco | Descuidada: tem beleza, mas está jogada fora |
| Crítico | Sem beleza trabalhada — o caso é shape e cuidado básico antes de tudo |

As referências de nota 8 do `CALIBRACAO.md` ficaram entre 49% e 59% em "Linda",
o que ancora o nível "Bom" como o mais comum.

## Cota da API

A chave atual está no **plano gratuito** do Gemini (teto de 20 requisições). Ao
estourar, a API devolve 429 — o servidor tenta de novo 3 vezes com espera
crescente e, se persistir, avisa em português. **Para virar produto, a chave
precisa ser paga**, senão o app trava com poucos usuários simultâneos.

## Ajuste da leitura por IA

A IA pontua mais generosamente que o analista humano. Um perfil que o Luan
considera 8 vinha saindo 9. Por isso toda nota vinda da leitura automática leva
um desconto de **-1,0** (`AJUSTE_IA` no `criterios.js`), aplicado sobre a nota
bruta antes das travas e do piso. Pontuação feita à mão não leva desconto — a
régua manual continua ancorada nas 22 análises reais.

O app mostra o ajuste ("Leitura por IA: 9,5 ajustada em -1,0"), então dá pra ver
a nota bruta por trás e recalibrar o número conforme os testes.

## Fecho de monetização

Em vez de sempre empurrar TikTok Shop, o texto termina com **a alavanca que mais
destrava esse perfil agora**. A regra: perfil pronto (≥ 8,5 e sem travas) vai
pro TikTok Shop; o resto recebe o primeiro gatilho que bater, nesta ordem:

| Fecho | Dispara quando | Base |
|---|---|---|
| Ligar a câmera | Naturalidade ≤ Fraco | "As pessoas compram de gente, não de texto na tela" |
| Vender sem vender | Trava de perfil vendedor | "Sou especialista em vender sem vender" |
| Volume e repetição | Trava de perfil parado | "Ser comunicador é falar de uma coisa de mil formas diferentes" |
| Estilo de vida | Estilo de Vida ≤ Fraco | "As pessoas querem comprar a sua beleza além do seu conhecimento" |
| Bandeira | Bandeira ≤ Médio | "Perfil morno tende a perder força" |
| Simplificar | Limpeza ≤ Fraco | "Raso com qualidade" |
| Investir na imagem | Estética ≤ Médio | "Beleza abre portas que o diploma não abre" |
| Arrumar o padrão | Cenário ≤ Fraco | "Tá tudo bem ser pobre, você só não precisa parecer um" |
| Abrir o perfil | Trava de perfil trancado | "Quem te prejudica é o convívio presencial, não a internet" |
| Ficar relevante | Nenhum gatilho (perfil mediano) | "Quanto maior você fica, menos gente pechincha" |

Os textos vivem em `CTAS` no `criterios.js`.

## Estrutura do texto entregue

Toda análise sai no mesmo formato das reais:

> **Nota X.** *[1 a 2 elogios concretos]* → *[o que as travas apontam]* → *[até 3 direcionamentos práticos]* → *[chamada de monetização]*

## Leitura dos prints por IA

O analista sobe os prints do perfil e clica em **Analisar com IA**. A IA (Gemini 2.5 Flash, com visão) **não dá a nota** — ela só pontua os 8 critérios, como o analista faria. A conta, as travas e o texto continuam saindo do motor calibrado. Isso garante três coisas:

1. A nota nunca desvia da régua do Robert.
2. O analista revisa e corrige qualquer critério antes de copiar.
3. Dá pra auditar de onde veio cada ponto.

Quando os prints não mostram algo (ex.: nenhum reel aberto → não dá pra julgar naturalidade), a IA marca o critério como não avaliável e avisa no rodapé.

## Rodando

```bash
node "/Users/luanhenriquedosreis/Desktop/CLAUDE CODE/ANALISE DE PERFIL/server.js"
```

Abra `http://localhost:8777`. A chave do Gemini é lida automaticamente do `.env` da pasta CLAUDE CODE (`GEMINI_API_KEY` e `GEMINI_MODEL`) — não precisa exportar nada.

A chave fica no servidor e nunca vai pro navegador, então o cliente final não a vê. Sem a chave o app continua funcionando: só o botão de IA fica inativo, e o analista pontua à mão com os prints fixados na tela.

**Trocar de modelo ou de provedor:** só o `analisar()` no `server.js` sabe qual IA está sendo usada. Trocar `gemini-2.5-flash` por outro modelo é mudar `GEMINI_MODEL` no `.env`.

## Dois modos

O app tem duas vias, escolhidas no topo da tela. As duas usam o mesmo motor
(`motor.js`), então a calibração de uma nunca vaza pra outra — cada modo carrega
a própria régua em `MODOS`, no `criterios.js`.

| Modo | Cor | Avalia | Escala |
|---|---|---|---|
| **Profissional** | Dourado | O perfil como ativo de negócio: imagem, conteúdo, posicionamento, monetização. | Skin do modo easy → Skin no zero |
| **Beleza** | Rosa | A imagem completa da pessoa: rosto, shape, pele, cabelo, feminilidade, produção, estilo, padrão. | Alto padrão → Linda → Bonita → **Seu caso é shape** |

**A beleza é franca de verdade.** Sem trava, sem piso — a nota mínima pode cair
em "Seu caso é shape", exatamente como o Robert fala nas enquetes dele. Os oito
critérios de beleza (pesos somando 100) saem dos princípios dele: *"a felicidade
é magra"* (shape, peso 18), *"a harmonia do rosto"* (peso 20), *"pele descansada
de quem dorme direito"*, *"cabelo de mulher é caro, grave com ele solto"*, *"a
mulher feminina faz mais dinheiro"*, e o sinal de *"alto padrão / baixo padrão"*.

O fecho da beleza é uma rotina de padrão (skin care, shape, cabelo) no lugar do
plano de TikTok.

## A tela

Uma tela só, do cliente final: escolhe a régua, sobe os prints, clica em
**Robert Analisar**. O resultado tem quatro partes:

1. **Nota + classificação da skin** — "Skin do modo easy", "Skin afiada",
   "Skin travada", "Skin em construção", "Skin no zero".
2. **O que o Robert viu** — a análise, na voz dele.
3. **Suas melhorias** — até 5 ações práticas, tiradas dos critérios mais fracos.
4. **O que fazer no TikTok** — o método dele em 6 passos, em toda análise.

O detalhamento dos 8 critérios fica atrás de "Ver como a nota foi calculada",
pro produto não parecer caixa-preta sem entregar a nota de cara.

Para trocar a foto de fundo, aponte o `src` de `#foto-fundo` no `index.html`
para o arquivo da imagem (ex.: `roberth.jpg`, na mesma pasta).

## A voz

Os textos usam o linguajar do próprio Robert, levantado por frequência nos 996
reels: "olha só" (674), "pessoal" (636), "entendeu?" (875), "né?" (2979),
"minha filha" (122), "pode ter certeza" (48), "confia em mim", "é isso", e a
assinatura dele — *"eu não dou as minhas opiniões, eu só explico como o mundo
funciona"* (37 ocorrências).

**"Skin"**, no vocabulário dele, é o pacote com que a pessoa se apresenta ao
mundo; **"modo easy"** é quando esse pacote já resolve metade do caminho —
*"quando a vida é fácil para a pessoa só porque ela é bonita"*.

## Arquivos

- `criterios.js` — toda a régua: critérios, pesos, níveis, travas, bloqueios, piso, ações, plano de TikTok e biblioteca de textos. **É aqui que se ajusta o método.**
- `motor.js` — cálculo da nota, geração do texto e lista de melhorias. Funções puras.
- `index.html` + `app.js` — a tela.
- `server.js` — servidor local + endpoint de leitura por IA.
- `CALIBRACAO.md` — perfis de referência. Rodar antes de mexer nos pesos.
