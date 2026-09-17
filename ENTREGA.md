# ENTREGA — Sistema "Análise de Perfil / Análise de Beleza" (Método Robert Resende)

> Documento de handoff. Contém **tudo** o que é preciso para reimplementar este
> sistema em outra stack/aplicativo: o que ele é, como funciona, as decisões de
> método que tomamos (o "porquê" de cada regra), o passo a passo, e o código-fonte
> completo de cada arquivo, no fim.
>
> Repositório: `https://github.com/audiovisual1triacompany/analise-robert`

---

## 1. O que é

Uma página web onde a pessoa **sobe prints do Instagram (ou fotos)** e recebe:
- uma **nota de 0 a 10**,
- uma **classificação** ("skin"),
- uma **análise escrita na voz do Robert Resende**,
- uma **lista de melhorias práticas**,
- e um **plano de ação** (TikTok no modo profissional; rotina de padrão no modo beleza).

São **dois produtos numa tela só**, escolhidos por um seletor no topo:

| Modo | Cor | Avalia |
|---|---|---|
| **Profissional** | Dourado | O perfil como ativo de negócio: imagem, conteúdo, posicionamento, monetização. |
| **Beleza** | Rosa (Mulher) / Azul (Homem) | A imagem da pessoa: rosto, shape, pele, cabelo, feminilidade, produção, estilo, padrão. |

No ar (versão atual): `https://analise-robert.vercel.app`

---

## 2. A ideia-chave da arquitetura (NÃO MUDE ISSO ao reimplementar)

**A IA (Google Gemini) só PONTUA os critérios. Ela NÃO dá a nota.**

O fluxo é:
1. O cliente manda as fotos + a "rubrica" (os critérios, com os nomes dos níveis) para o backend.
2. O backend pede ao Gemini para escolher, **para cada critério**, um nível (`Crítico / Fraco / Médio / Bom / Excelente`) — resposta em JSON estruturado.
3. O backend devolve só essas pontuações.
4. O **motor calibrado no cliente** (`motor.js`) transforma as pontuações em nota final, aplica travas/pisos/ajustes, escolhe o texto e o fecho.

Por que isso importa: se a IA desse a nota direto, ela **flutuaria** entre uma leitura e outra e você perderia a calibração. Separando "pontuar" (IA) de "calcular" (motor determinístico), a nota fica **estável e auditável**. Toda a régua vive em dados (`criterios.js`), não na cabeça da IA.

**Estrutura de pastas:**
```
public/           → estático (a "casca": tela + motor + régua rodam no navegador)
  index.html
  app.js          → interface, upload, compressão de imagem, render do resultado
  motor.js        → cálculo da nota e geração do texto (funções puras)
  criterios.js    → A RÉGUA: critérios, pesos, níveis, travas, pisos, textos, os 2 modos
api/
  analisar.js     → função serverless: fala com o Gemini (a chave vive aqui, no servidor)
server.js         → servidor local (espelha a Vercel) para desenvolver
vercel.json       → config de deploy (estático + função)
```

**O que é essência do produto (o que precisa ser portado):** `criterios.js` (a régua/dados) + `motor.js` (o cálculo) + o **prompt e o schema** dentro de `api/analisar.js`. O front-end (`index.html`/`app.js`) é só a casca — pode ser refeito em qualquer framework.

---

## 3. De onde veio a régua

- Extraída de **996 reels transcritos** do Robert Resende (planilha "MIL REELS TRANSCRITOS").
- Calibrada contra **22 análises reais** já entregues na planilha "100 Primeiros — Instagram" (as notas reais observadas ficavam entre 7,0 e 9,0, com centro em 8,0).
- **Regra-âncora:** todos os critérios em "Bom" = **nota 8,0** (o centro real da base).

Os detalhes de cada critério, peso, faixa e princípio de origem estão em `METODOLOGIA.md` (incluído na íntegra na seção 8).

---

## 4. Decisões de método (o "direcionamento" — leia isto antes de mexer nos números)

Estas regras foram construídas passo a passo com o dono do produto. Cada uma tem um porquê; respeite o porquê ao reimplementar.

**4.1. Escala e centro.** Cinco níveis com estes valores: `Crítico 2,0 · Fraco 5,0 · Médio 6,5 · Bom 8,0 · Excelente 9,5`. A nota é a **média ponderada** pelos pesos. Tudo em "Bom" = 8,0.

**4.2. A régua adapta por gênero.** Cada critério tem textos/níveis para Mulher (F) e Homem (M). Ex.: para mulher pesa feminilidade e elegância; para homem, postura firme e autoridade.

**4.3. Travas (limitam o teto da nota).** Condições que seguram a nota mesmo com bons critérios, como acontecia nas análises manuais:
- Perfil trancado/privado → teto 8,0
- Não aparece (câmera desligada) → teto 6,5
- Muito vendedor → teto 7,5
- Posta menos de 1x/semana → teto 8,5
- Ostentação barata → teto 7,5

**4.4. Bloqueio (impede a análise).** Perfil **trancado E sem posts** não recebe nota — não há o que avaliar. Devolve "Não avaliável" e manda abrir/postar. Diferente da trava de trancado (que ainda vê foto/bio).

**4.5. Piso por critério.** Nenhum item sozinho derruba a nota ao chão — cada critério tem um piso: estética 7,0; energia/cenário/naturalidade/limpeza/estilo-de-vida 6,0; bandeira/monetização 5,0. **O piso mexe SÓ no número.** O diagnóstico (melhorias e fecho) sempre lê a **pontuação crua** — senão os conselhos mais importantes parariam de disparar.

**4.6. Piso da régua feminina (modo profissional).** Mulher não recebe abaixo de **7,0** no profissional. Homem usa a escala inteira.

**4.7. Modo Beleza é franco, MAS tem nota mínima geral de 7,5.** A escala usa as enquetes do próprio Robert (Linda / Bonita / "seu caso é shape"), sem travas e sem piso por critério. Porém, **decisão final do dono:** a nota mínima GERAL da beleza é **7,5**, para qualquer pessoa — o número nunca destrói ninguém. A franqueza ("seu caso é shape", "foca no treino") vive no **texto do fecho e nas melhorias**, que leem a pontuação crua.

**4.8. Ajuste da leitura por IA (−1,0).** Observado na prática: a IA pontua mais generosamente que o analista humano (um perfil que o dono chama de 8 saía 9). Então **toda nota vinda da IA leva −1,0** sobre a bruta, antes de travas/piso. Pontuação feita à mão (se houver) não leva desconto. Este número é o principal parâmetro a recalibrar com perfis reais.

**4.9. O fecho é a alavanca que mais destrava, não sempre "TikTok Shop".** Perfil pronto (nota ≥ 8,5, sem travas) recebe o convite ao TikTok Shop. O resto recebe o **primeiro gatilho que bater** (ligar a câmera, vender sem vender, volume, estilo de vida, bandeira, simplificar, investir na imagem, etc.). No modo beleza, os gatilhos são shape/pele/rosto/feminilidade/cabelo/produção/estilo.

**4.10. "O que o Robert viu" é curto.** Nota + 1–2 elogios concretos + o fecho. As correções detalhadas ficam na lista "Suas melhorias" — não repetir. Critério que as fotos **não mostraram nunca vira elogio** (não se elogia o que não se viu).

**4.11. Avisos internos NUNCA aparecem para o usuário.** As mensagens de calibração ("Leitura por IA: X ajustada em −1,0", "Nota mínima: X elevada para Y", "Piso por critério aplicado") existem só para auditoria interna (`calc.avisos`) e **não são renderizadas** em lugar nenhum da tela.

**4.12. A voz do Robert.** Os textos usam o linguajar dele, levantado por frequência nos 996 reels: "né?" (2979x), "olha só" (674x), "pessoal" (636x), "entendeu?" (875x), "minha filha" (122x — só no feminino), "pode ter certeza", "confia em mim", e a assinatura "eu não dou as minhas opiniões, eu só explico como o mundo funciona" (37x). "Skin" no vocabulário dele = o pacote com que a pessoa se apresenta; "modo easy" = quando esse pacote já resolve metade do caminho.

**4.13. Grafia do nome:** **Robert Resende** (com S, não Z; e Robert, não Roberth). Confirmado nos próprios conteúdos dele.

**4.14. Cores.** Profissional = dourado; Beleza = rosa. **Homem = azul em qualquer modo.** Depois da análise, a página inteira assume a cor da nota (verde→vermelho no profissional; tons de rosa/azul na beleza), com um efeito neon.

**4.15. Determinismo da IA (importante).** O Gemini por padrão usa `temperature: 1` e a MESMA imagem devolvia pontuações diferentes a cada leitura. Corrigido fixando `temperature: 0, topP: 1, seed: 42`. Além disso o prompt tem âncoras e a regra "na dúvida, escolha Bom".

**4.16. Compressão de imagem no cliente.** Print de tela cheia passa de vários MB e estoura o limite da Vercel (~4,5 MB por requisição). O cliente encolhe a imagem para no máximo 1600px de lado, JPEG qualidade 0,82, antes de enviar. Também deixa mais barato (menos tokens).

**4.17. Cota do Gemini.** A chave gratuita tem limite de **~20 requisições por minuto** (é por minuto, não diário). Para uso público de verdade, precisa de **chave paga** — senão o app trava com poucos usuários simultâneos.

**4.18. A chave NUNCA vai no código/repositório.** Localmente ela vem de um arquivo `.env` (fora do controle de versão). Na Vercel, vem das *Environment Variables* do projeto — nunca chega ao navegador, então o usuário final não a vê.

---

## 5. Passo a passo para reimplementar / rodar

**Rodar local (para estudar e ajustar):**
1. Ter Node 18+ e uma chave do Google Gemini (grátis em https://aistudio.google.com/apikey).
2. `cp .env.example .env` e colar a chave em `GEMINI_API_KEY`.
3. `node server.js` → abre em `http://localhost:8777`.
4. Onde se ajusta o método: `public/criterios.js` (objeto `MODOS`). O cálculo: `public/motor.js`. O prompt/schema da IA: `api/analisar.js`.

**Deploy na Vercel:**
1. Projeto = estático (`public/`) + função (`api/analisar.js`). Config em `vercel.json` (`framework: null`, `outputDirectory: "public"`).
2. Cadastrar `GEMINI_API_KEY` (e opcionalmente `GEMINI_MODEL`) nas *Environment Variables* do projeto.
3. Fazer um deploy para as variáveis valerem.

**Se for reimplementar em OUTRA stack (o objetivo desta entrega):**
- Porte primeiro a **régua** (`criterios.js`) e o **motor** (`motor.js`) — são JS puro, sem dependência de framework. É o cérebro do produto.
- Porte o **prompt + o schema estruturado** de `api/analisar.js` para o backend novo, mantendo `temperature: 0` e o schema por nível (nomes, não índices).
- A tela pode ser refeita como quiser; ela só precisa: (a) subir imagens comprimidas, (b) chamar o backend com a rubrica do modo/gênero, (c) mapear os níveis de volta a valores e (d) chamar as funções do motor para render.

---

## 6. Calibração (perfis de referência)

O arquivo `CALIBRACAO.md` (incluído na íntegra na seção 8) tem perfis-padrão que o dono marcou como referência: três perfis "nota 10" e uma contra-referência. Rode-os sempre que mexer nos pesos — se algum ajuste derrubar os do topo ou subir demais a contra-referência, o ajuste está errado.

---

## 7. Estado atual e pendências conhecidas

- **No ar e funcionando** em `https://analise-robert.vercel.app` com a chave gratuita do Gemini.
- **Pendência para produto real:** trocar a chave gratuita por uma **paga** (limite de 20/min estoura com público).
- **A recalibrar com perfis reais:** o ajuste `AJUSTE_IA = -1.0` e, no modo beleza, avaliar se a nota mínima 7,5 e os rótulos "Linda/Bonita" (femininos) precisam de versão masculina.

---

## 8. Código-fonte completo

Abaixo, cada arquivo do sistema na íntegra.

### 8.a — Documentos de método (renderizados)

<!-- ===================== METODOLOGIA.md ===================== -->
## Arquivo: `METODOLOGIA.md`
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


---

<!-- ===================== CALIBRACAO.md ===================== -->
## Arquivo: `CALIBRACAO.md`
# Calibração — referências de nota

Perfis-padrão que o Luan marcou como referência. Servem pra conferir se a régua
do `criterios.js` ainda está devolvendo a nota certa depois de qualquer ajuste.

---

## Nota 10 — teto da régua

Enviados em 22/07/2026. São o inverso exato do perfil-catálogo.

### @andressafmatos — post de carrossel (1/5)

Conta verificada. Foto profissional: loira, cabelo solto e liso bem cuidado,
maquiagem impecável, decote V preto, colar delicado. Fundo desfocado em tons
quentes, luz de fim de tarde. Zero texto na imagem. Legenda social, não
comercial: "Evento especial do @eusouroberth com grandes amigos" + marcações.
534 curtidas, 29 comentários, comentários de elogio genuíno.

| Critério | Nível | Por quê |
|---|---|---|
| Estética & Cuidado | Excelente | Usa todos os pontos fortes a favor |
| Energia & Arquétipo | Excelente | Feminilidade e elegância que sussurra |
| Cenário & Sinal de Padrão | Excelente | Luz e fundo transmitem padrão sem ostentar |
| Limpeza Visual | Excelente | Nenhum texto sobre a imagem |
| Estilo de Vida | Excelente | Evento e vida social, não serviço |

### @andressafmatos — reel falando pra câmera

Cabelo preso, maquiagem, blazer acetinado roxo, microfone de lapela, fundo de
madeira. Fala direto pra câmera: "…quero compartilhar uma dica com vocês, a
minha rotina de skin care". Só a legenda automática na tela. Legenda do post:
"Dicas!!". 322 curtidas, **138 comentários**, 32 compartilhamentos.

| Critério | Nível | Por quê |
|---|---|---|
| Naturalidade | Excelente | Câmera ligada, fala como fala na vida real |
| Limpeza Visual | Excelente | Só legenda, sem arte nem poluição |
| Prontidão pra Monetizar | Excelente | Entrega valor sem vender — desejo antes da oferta |

Os 138 comentários num post de dica confirmam a tese do Robert: comunidade se
constrói servindo, não vendendo.

### @leidypertile — carrossel de rotina (12/19)

Conta verificada. Selfie à beira d'água, cabelo preso, top preto, passeando com
o cachorro, luz natural. Nenhuma produção, nenhuma arte. Legenda pessoal:
"Janeiro foi mais que um mês, foi de amores, desamores, viagens e primeiras
vezes. Que venham os próximos episódios."

| Critério | Nível | Por quê |
|---|---|---|
| Estilo de Vida | Excelente | Vida real pura — as pessoas querem essa vida |
| Naturalidade | Excelente | Sem roteiro, sem montagem |
| Energia & Arquétipo | Excelente | Feminina e leve sem esforço aparente |

---

## O padrão que os três compartilham

1. **A pessoa é o conteúdo.** Nenhum dos três posts é arte com texto — é rosto,
   corpo, ambiente e voz.
2. **Zero poluição visual.** Nada escrito por cima da imagem além de legenda.
3. **Estilo de vida no lugar de catálogo.** Evento, rotina de skin care, passeio
   com o cachorro. Serviço nenhum sendo empurrado.
4. **Estética cuidada sem parecer montada.** Inclusive na selfie sem produção.
5. **Vende sem vender.** O post de maior engajamento é o que só dá uma dica.

---

## Nota 8 — o centro da régua

Enviados em 22/07/2026. Vieram das enquetes "Análise de beleza" que o Robert
roda nos stories (jul/2025): **Linda / Bonita / Sem beleza, seu caso é shape**.
Todas as seis ficaram entre 49% e 59% em "Linda", com "sem beleza" entre 2% e 6%
— ou seja, o público reconhece a beleza sem hesitar, mas não é unânime.

| # | O que aparece | Enquete |
|---|---|---|
| 1 | Blazer vermelho sobre tricot claro, batom vermelho, sorriso, roda-gigante iluminada ao fundo | Linda 49% · Bonita 48% · 3% |
| 2 | Vestido tomara-que-caia rosé, cabelo longo solto, sentada em evento social, sorriso aberto | Linda 56% · Bonita 41% · 2% |
| 3 | Mesma da 1, outro enquadramento | Linda 49% · Bonita 48% · 3% |
| 4 | Selfie no espelho, jaqueta escura sobre blusa branca, cabelo ondulado, unha vermelha | Linda 50% · Bonita 44% · 6% |
| 5 | Cabelo muito longo e liso, maquiagem carregada, blusa branca de renda, fundo de madeira | **Alto padrão 86% · Baixo padrão 14%** |
| 6 | Blazer xadrez claro sobre gola alta preta, brincos, foto de estúdio com fundo rosé | Linda 59% · Bonita 40% · 2% |

### O que separa o 8 do 10

As seis estão bem apresentadas: cabelo cuidado, maquiagem, roupa que valoriza,
sorriso. Nenhuma tem problema de estética. A diferença para as referências de
nota 10 não está na beleza — está no **contexto**:

- São fotos avulsas, não um perfil que constrói estilo de vida ao longo do feed.
- Enquadramento mais fechado, muitas vezes selfie ou estúdio, sem o ambiente
  contando uma história (evento, praia, rotina).
- Não há evidência de câmera ligada, fala natural nem comunidade engajada.

**Regra prática:** estética boa sozinha entrega 8. O que leva ao 10 é estética
boa **mais** estilo de vida, naturalidade e comunidade.

A referência 5 usa outra enquete — **Alto padrão / Baixo padrão** — e cravou
86%. Vale como calibração do critério Energia & Arquétipo: cabelo longo, pele
trabalhada e enquadramento cuidado leem como alto padrão para o público dele.

---

## Piso da régua feminina

Decisão do Luan em 22/07/2026: **mulher nunca recebe nota abaixo de 7,0.** O
piso vence qualquer trava e está em `PISO` no `criterios.js`. A régua masculina
continua usando a escala inteira.

Consequência: na régua feminina, a trava "não aparece nos conteúdos" (teto 6,5)
nunca chega a valer — a nota sobe de volta para 7,0. As faixas abaixo de 7 ficam
inalcançáveis para mulheres. O app mostra o ajuste no painel ("Piso da régua
feminina: 6,5 elevada para 7,0"), então a leitura continua auditável.

---

## Contra-referência — @enf.alinemazon (7,3)

Analisado em 22/07/2026, é o oposto útil pra testar a régua. Foto de perfil e
bandeira excelentes (nicho cristalino: "Enf Materno Infantil | Amamentação |
Furo Humanizado | Laser"), mas 5 posts, todos arte com texto pesado na capa,
100% conteúdo técnico, zero vida pessoal. Trava de perfil parado ativa.

Estética 4 · Energia 3 · Cenário 3 · Naturalidade 2 · Limpeza 1 · Lifestyle 0 ·
Bandeira 4 · Monetização 3 → **7,8, "Skin travada"**

*(era 7,3 antes dos pisos por critério de 22/07/2026; limpeza subiu de 5,0 pra
6,0 e estilo de vida de 2,0 pra 6,0, o que levou a nota a 7,8)*

Se um ajuste na régua fizer os três perfis do topo caírem abaixo de 9,0 ou esse
subir acima de 8,0, o ajuste está errado.


---

<!-- ===================== README.md ===================== -->
## Arquivo: `README.md`
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


---

### 8.b — Código-fonte

## Arquivo: `public/index.html`
````html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Análise de Perfil · Robert Resende</title>
<style>
  :root{
    --bg:#0a0b0f; --panel:rgba(21,25,32,.82); --panel2:rgba(28,33,43,.7); --line:rgba(255,255,255,.09);
    --tx:#f0f3f8; --tx2:#a3adbf; --tx3:#6f788b;
    --gold:#c9a227; --gold2:#e8c766;
    /* Acento vivo: o app troca estas duas conforme a skin do resultado. */
    --ac:#c9a227; --ac2:#e8c766; --ac-rgb:201,162,39;
  }
  :root,.fundo::after,.selo,.cta,.res,.nota,.skin,h1 em,.sec h3,
  ul.lista li::before,ol.passos li::before,.tk-intro{transition:all .7s ease}
  *{box-sizing:border-box;margin:0;padding:0}

  body{
    background:var(--bg); color:var(--tx); min-height:100vh;
    font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif;
    -webkit-font-smoothing:antialiased;
  }

  /* ---- fundo ---- */
  .fundo{position:fixed;inset:0;z-index:-2;overflow:hidden;background:var(--bg)}
  /* A foto do Robert entra aqui: basta trocar o src de #foto-fundo */
  .fundo img{
    width:100%;height:100%;object-fit:cover;object-position:center 18%;
    opacity:.22;filter:grayscale(.35) contrast(1.05);
  }
  .fundo::after{
    content:'';position:absolute;inset:0;
    background:
      radial-gradient(90rem 55rem at 50% -12%, rgba(var(--ac-rgb),.18), transparent 60%),
      radial-gradient(60rem 40rem at 85% 95%, rgba(var(--ac-rgb),.09), transparent 65%),
      linear-gradient(180deg, rgba(10,11,15,.55) 0%, rgba(10,11,15,.82) 42%, var(--bg) 88%);
  }

  .wrap{max-width:640px;margin:0 auto;padding:46px 20px 70px;position:relative}

  /* ---- topo ---- */
  header{text-align:center;margin-bottom:34px}
  .selo{
    display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;
    letter-spacing:.18em;text-transform:uppercase;color:var(--ac2);
    border:1px solid rgba(var(--ac-rgb),.34);border-radius:30px;padding:7px 16px;
    background:rgba(var(--ac-rgb),.08);margin-bottom:18px;
    box-shadow:0 0 22px rgba(var(--ac-rgb),.18);
  }
  header h1{font-size:clamp(30px,7vw,40px);font-weight:800;letter-spacing:-.035em;line-height:1.1}
  header h1 em{font-style:normal;color:var(--ac);text-shadow:0 0 26px rgba(var(--ac-rgb),.5)}
  header p{color:var(--tx2);font-size:15px;margin-top:12px;max-width:26em;margin-inline:auto}
  header .assin{color:var(--tx3);font-size:13px;margin-top:14px;font-style:italic}

  .card{
    background:var(--panel);border:1px solid var(--line);border-radius:18px;
    backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  }

  /* ---- entrada ---- */
  .entrada{padding:20px}
  .seg{display:flex;background:rgba(0,0,0,.28);border:1px solid var(--line);border-radius:12px;padding:4px;gap:4px;margin-bottom:16px}
  .seg button{flex:1;background:none;border:0;color:var(--tx2);padding:12px;border-radius:9px;font:650 15px inherit;cursor:pointer;transition:.15s}
  .seg button.on{background:linear-gradient(180deg,var(--ac2),var(--ac));color:#1c1503;box-shadow:0 2px 14px rgba(var(--ac-rgb),.3)}
  .seg.modos{margin-bottom:10px}
  .seg.modos button{font-weight:800}

  .drop{border:2px dashed rgba(255,255,255,.14);border-radius:15px;padding:40px 20px;text-align:center;
    color:var(--tx3);font-size:15px;cursor:pointer;transition:.18s;background:rgba(0,0,0,.2)}
  .drop:hover,.drop.over{border-color:var(--ac);color:var(--tx2);background:rgba(var(--ac-rgb),.07)}
  .drop .ico{font-size:32px;display:block;margin-bottom:12px;opacity:.85}
  .drop b{color:var(--ac2)}

  .thumbs{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
  .thumb{position:relative;width:80px;height:80px;border-radius:12px;overflow:hidden;border:1px solid var(--line)}
  .thumb img{width:100%;height:100%;object-fit:cover;display:block}
  .thumb button{position:absolute;top:3px;right:3px;width:21px;height:21px;border-radius:50%;
    background:rgba(0,0,0,.72);color:#fff;border:0;font-size:13px;line-height:1;cursor:pointer;padding:0}

  .cta{width:100%;margin-top:18px;border:0;border-radius:14px;padding:20px;cursor:pointer;
    background:linear-gradient(180deg,var(--ac2),var(--ac));color:#1c1503;
    font:800 17px inherit;letter-spacing:.09em;text-transform:uppercase;
    box-shadow:0 8px 30px rgba(var(--ac-rgb),.38);}
  .cta:hover{transform:translateY(-1px);box-shadow:0 14px 40px rgba(var(--ac-rgb),.55)}
  .cta:disabled{opacity:.5;cursor:default;transform:none;box-shadow:none}

  #aviso{margin-top:14px;font-size:14px;color:var(--tx3);text-align:center;line-height:1.55}
  #aviso.erro{color:#f0837f}

  /* ---- resultado ---- */
  .res{display:none;margin-top:22px}
  .res.on{display:block;animation:sobe .45s ease both;
    box-shadow:0 0 70px rgba(var(--ac-rgb),.2), 0 0 0 1px rgba(var(--ac-rgb),.16)}
  @keyframes sobe{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

  .res-top{padding:34px 24px 28px;text-align:center;border-bottom:1px solid var(--line);
    background:linear-gradient(180deg,rgba(var(--ac-rgb),.12),transparent)}
  .nota{font-size:82px;font-weight:800;line-height:.95;letter-spacing:-.05em;font-variant-numeric:tabular-nums;
    text-shadow:0 0 44px rgba(var(--ac-rgb),.55)}
  .nota small{font-size:26px;color:var(--tx3);font-weight:600;letter-spacing:0}
  .skin{margin-top:14px;display:inline-block;font-size:13px;font-weight:800;text-transform:uppercase;
    letter-spacing:.13em;padding:8px 18px;border-radius:30px;
    box-shadow:0 0 26px rgba(var(--ac-rgb),.35)}
  .vered{margin-top:16px;color:var(--tx2);font-size:15px;line-height:1.6;max-width:30em;margin-inline:auto}

  .sec{padding:24px;border-bottom:1px solid var(--line)}
  .sec:last-child{border-bottom:0}
  .sec h3{font-size:11.5px;text-transform:uppercase;letter-spacing:.15em;color:var(--ac2);
    font-weight:800;margin-bottom:14px}
  .analise{font-size:15.5px;line-height:1.7;white-space:pre-wrap}

  ul.lista{list-style:none}
  ul.lista li{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:15px;line-height:1.55}
  ul.lista li:last-child{border-bottom:0}
  ul.lista li::before{content:'';flex:none;width:7px;height:7px;border-radius:50%;
    background:var(--ac);margin-top:9px;box-shadow:0 0 0 3px rgba(var(--ac-rgb),.18),0 0 12px rgba(var(--ac-rgb),.5)}
  ul.lista li b{color:var(--ac2);font-weight:650}

  .tk-intro{color:var(--tx2);font-size:14.5px;line-height:1.65;margin-bottom:14px;
    border-left:2px solid var(--ac);padding-left:13px;font-style:italic}
  ol.passos{list-style:none;counter-reset:p}
  ol.passos li{counter-increment:p;display:flex;gap:13px;padding:11px 0;
    border-bottom:1px solid rgba(255,255,255,.05);font-size:15px;line-height:1.55}
  ol.passos li:last-child{border-bottom:0}
  ol.passos li::before{content:counter(p);flex:none;width:25px;height:25px;border-radius:50%;
    background:rgba(var(--ac-rgb),.16);border:1px solid rgba(var(--ac-rgb),.36);color:var(--ac2);
    font:800 12px inherit;display:grid;place-items:center;margin-top:1px}

  .bar{margin-top:12px}
  .bar:first-child{margin-top:0}
  .bar-l{display:flex;justify-content:space-between;font-size:12.5px;color:var(--tx2);margin-bottom:5px}
  .bar-l b{color:var(--tx);font-variant-numeric:tabular-nums}
  .bar-t{height:6px;background:rgba(0,0,0,.4);border-radius:3px;overflow:hidden}
  .bar-f{height:100%;border-radius:3px}
  .obs{margin-top:15px;font-size:13px;color:var(--tx3);line-height:1.6}

  .rodape{display:flex;gap:10px;padding:20px 24px}
  .rodape button{flex:1;background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--tx2);
    border-radius:11px;padding:14px;font:650 14.5px inherit;cursor:pointer;transition:.15s}
  .rodape button:hover{background:rgba(255,255,255,.1);color:var(--tx)}

</style>
</head>
<body>

<div class="fundo">
  <!-- Foto do Robert: troque o src por ex. "roberth.jpg" -->
  <img id="foto-fundo" alt="" src="" onerror="this.style.display='none'">
</div>

<div class="wrap">

  <header>
    <div class="selo">★ Método Robert Resende</div>
    <h1><span id="titulo">Análise de </span><em id="titulo-em">Perfil</em></h1>
    <p id="subtitulo"></p>
    <p class="assin">"Eu não dou as minhas opiniões aqui. Eu só explico como o mundo funciona."</p>
  </header>

  <div class="card entrada">
    <div class="seg modos" id="modo">
      <button data-m="profissional" class="on">Profissional</button>
      <button data-m="beleza">Beleza</button>
    </div>

    <div class="seg" id="genero">
      <button data-g="F" class="on">Mulher</button>
      <button data-g="M">Homem</button>
    </div>

    <div class="drop" id="drop">
      <span class="ico">📸</span>
      Arraste suas fotos ou <b>toque para escolher</b>
      <input type="file" id="arquivos" accept="image/*" multiple hidden>
    </div>
    <div class="thumbs" id="thumbs"></div>

    <button class="cta" id="analisar">Robert Analisar</button>
    <div id="aviso"></div>
  </div>

  <div class="res card" id="res">
    <div class="res-top">
      <div class="nota" id="nota">—</div>
      <div class="skin" id="skin"></div>
      <div class="vered" id="vered"></div>
    </div>

    <div class="sec">
      <h3 id="tk-visto-h3">O que o Robert viu</h3>
      <div class="analise" id="txt"></div>
    </div>

    <div class="sec" id="sec-melhorias">
      <h3>Suas melhorias</h3>
      <ul class="lista" id="melhorias"></ul>
    </div>

    <div class="sec" id="sec-tiktok">
      <h3 id="tk-titulo"></h3>
      <div class="tk-intro" id="tk-intro"></div>
      <ol class="passos" id="tk-passos"></ol>
    </div>

    <div class="sec">
      <h3>Como a nota foi calculada</h3>
      <div id="barras"></div>
      <div class="obs" id="obs"></div>
    </div>

    <div class="rodape">
      <button id="copiar">Copiar análise</button>
      <button id="nova">Analisar outro</button>
    </div>
  </div>

</div>

<script src="criterios.js"></script>
<script src="motor.js"></script>
<script src="app.js"></script>
</body>
</html>
````

## Arquivo: `public/criterios.js`
````javascript
/* ============================================================
   MÉTODO SKIN — régua de análise de perfil
   Critérios, pesos, travas e biblioteca de direcionamentos.
   Extraído de 996 reels do Robert Resende + calibrado pelas
   22 análises reais da planilha "100 Primeiros - Instagram".
   ============================================================ */

// Níveis de pontuação. All-"Bom" = 8.0, que é o centro real da planilha.
const NIVEIS = [
  { v: 2.0, nome: 'Crítico' },
  { v: 5.0, nome: 'Fraco' },
  { v: 6.5, nome: 'Médio' },
  { v: 8.0, nome: 'Bom' },
  { v: 9.5, nome: 'Excelente' },
];

const CRITERIOS = [
  {
    id: 'estetica',
    elogio: { F: 'Você está bem apresentada e sabe usar os seus pontos fortes a seu favor.', M: 'Boa apresentação, viu? Passa cuidado e credibilidade.' },
    bloco: 'Imagem',
    nome: 'Estética & Cuidado Pessoal',
    peso: 18,
    base: '"Quanto maior for o ticket do produto, mais bonito tem que ser quem está vendendo." / "Beleza abre portas que o diploma não abre."',
    desc: {
      F: 'Foto de perfil, cabelo, maquiagem, peso e roupa. A pessoa está usando o que ela tem de melhor?',
      M: 'Foto de perfil, corte e barba, shape, roupa que assenta. O cara está apresentável ou desleixado?',
    },
    // Escala de beleza do próprio Robert, a mesma das enquetes dele nos stories:
    // Linda / Bonita / "sem beleza, seu caso é shape".
    niveis: {
      F: [
        'Sem beleza trabalhada — o caso aqui é shape e cuidado básico antes de tudo',
        'Descuidada: tem beleza, mas está jogada fora na maior parte do conteúdo',
        'Bonita às vezes — cuida numas fotos e larga em outras',
        'BONITA: cabelo e maquiagem em dia, roupa que valoriza, sorriso. O público reconhece',
        'LINDA: alto padrão, foto profissional, impecável — o público não hesita em chamar de linda',
      ],
      M: [
        'Largado — o caso aqui é shape, barba e cuidado básico antes de tudo',
        'Desleixado na maior parte do conteúdo',
        'Apresentável às vezes, inconstante',
        'BEM APRESENTADO: corte e barba em dia, roupa que assenta, passa credibilidade',
        'ALTO PADRÃO: imagem impecável, de quem se respeita',
      ],
    },
    dicas: {
      F: [
        'A foto de perfil é a sua vitrine, minha filha. Troca por uma bem iluminada, sorrindo e com o rosto em destaque.',
        'Invista no básico antes de qualquer coisa: cabelo arrumado, um batom, uma roupa que te valorize. Isso muda a percepção de valor do seu trabalho.',
        'Você cuida da imagem em alguns posts e larga em outros. A inconstância confunde quem te acompanha — padronize pra cima.',
      ],
      M: [
        'Comece pela foto de perfil: boa luz, barba e cabelo em dia, roupa limpa. Ninguém compra de quem não cuida nem de si.',
        'Ajuste o básico da apresentação — corte, barba e roupa que assenta. Isso é o primeiro filtro de credibilidade.',
        'Você aparece bem em alguns conteúdos e largado em outros. Padronize pra cima, sempre.',
      ],
    },
  },
  {
    id: 'energia',
    elogio: { F: 'Perfil com muita feminilidade e sempre sorridente. Excelente.', M: 'Postura firme, passa credibilidade na hora.' },
    bloco: 'Imagem',
    nome: 'Energia & Arquétipo',
    peso: 15,
    base: '"A mulher feminina faz mais dinheiro." / "A elegância não grita, ela sussurra." / "Cliente alto padrão não gosta de vendedor com energia de mulambo."',
    desc: {
      F: 'Feminilidade, sorriso, doçura e elegância. Ou energia masculinizada / energia de kenga, que afasta o alto padrão.',
      M: 'Postura firme, provedora, de quem resolve. Ou energia mole/beta e de mulambo, que derruba a credibilidade.',
    },
    niveis: {
      F: ['Energia que afasta — vulgar ou dura demais', 'Postura masculinizada, sem leveza', 'Feminina às vezes, mas sem constância', 'Feminina, sorridente, agradável', 'Muita feminilidade — elegância que sussurra'],
      M: ['Energia de mulambo, sem autoridade nenhuma', 'Postura mole, insegura na frente da câmera', 'Passa firmeza às vezes, oscila', 'Postura firme e confiável', 'Autoridade natural — passa credibilidade na hora'],
    },
    dicas: {
      F: [
        'A energia que o perfil transmite hoje afasta o público alto padrão. Busque elegância: menos exagero, mais leveza. A elegância não grita, ela sussurra.',
        'Sua postura está masculinizada demais. Traga mais feminilidade pro conteúdo — roupas, tom de voz, sorriso. Mulher feminina vende mais.',
        'Sorri mais nos vídeos. Parece bobagem, né? Mas é o que faz a pessoa querer ficar assistindo você.',
      ],
      M: [
        'O perfil não passa autoridade. Antes de qualquer estratégia, ajuste postura, tom de voz e apresentação — cliente não compra de quem parece que precisa da venda.',
        'Fale com mais firmeza e menos hesitação nos vídeos. Quem transmite segurança vende sem precisar insistir.',
        'A firmeza aparece em alguns vídeos e some em outros. Grave nos dias em que você está bem e mantenha o padrão.',
      ],
    },
  },
  {
    id: 'cenario',
    elogio: { F: 'Cenário bem construído, transmite padrão sem precisar ostentar.', M: null },
    bloco: 'Imagem',
    nome: 'Cenário & Sinal de Padrão',
    peso: 10,
    base: '"Tá tudo bem ser pobre, você só não precisa parecer um, porque senão as pessoas não compram de você." / "O marketing de ostentação afasta o cliente alto padrão."',
    desc: {
      F: 'O fundo dos vídeos, a luz e o ambiente. Nem parecendo liso, nem ostentação barata — o meio-termo cuidado.',
      M: 'O fundo dos vídeos, a luz e o ambiente. Nem parecendo liso, nem ostentação barata — o meio-termo cuidado.',
    },
    niveis: {
      F: ['Cenário bagunçado, escuro, transmite escassez', 'Fundo descuidado na maioria dos vídeos', 'Alguns cenários bons, outros ruins', 'Cenário limpo e bem iluminado', 'Ambiente impecável, transmite padrão sem ostentar'],
      M: ['Cenário bagunçado, escuro, transmite escassez', 'Fundo descuidado na maioria dos vídeos', 'Alguns cenários bons, outros ruins', 'Cenário limpo e bem iluminado', 'Ambiente impecável, transmite padrão sem ostentar'],
    },
    dicas: {
      F: [
        'O cenário está transmitindo escassez. Você não precisa de dinheiro pra resolver isso: escolha um canto da casa, uma parede limpa, uma planta e boa luz. Ninguém compra de quem parece que está apertado.',
        'Arrume o fundo dos vídeos. Gaveta aberta, roupa no varal e bagunça atrás tiram a credibilidade do que você fala.',
        'Padronize o cenário. Ter dois ou três fundos fixos e bons já resolve.',
      ],
      M: null, // usa o mesmo de F
    },
  },
  {
    id: 'naturalidade',
    elogio: { F: 'Muito natural na frente da câmera — e é justamente isso que segura o público.', M: null },
    bloco: 'Conteúdo',
    nome: 'Naturalidade (Anti-Personagem)',
    peso: 12,
    base: '"As pessoas sentem o faro de um personagem, e personagem normalmente não dá certo." / "Quando eu falei com o coração, sem roteiro, sem copy, eu comecei a viralizar."',
    desc: {
      F: 'A pessoa aparece de cara e fala como fala na vida real, ou está atuando um roteiro decorado?',
      M: 'A pessoa aparece de cara e fala como fala na vida real, ou está atuando um roteiro decorado?',
    },
    niveis: {
      F: ['Não aparece / câmera desligada / só texto e stock', 'Totalmente roteirizado, robótico', 'Aparece, mas ainda travado e artificial', 'Natural, fala como fala na vida real', 'Naturalidade total — dá vontade de assistir até o fim'],
      M: ['Não aparece / câmera desligada / só texto e stock', 'Totalmente roteirizado, robótico', 'Aparece, mas ainda travado e artificial', 'Natural, fala como fala na vida real', 'Naturalidade total — dá vontade de assistir até o fim'],
    },
    dicas: {
      F: [
        'Você precisa aparecer, pessoal. Perfil de câmera desligada não cresce e não vende — as pessoas compram de gente, não de texto na tela.',
        'Está roteirizado demais e não gera desejo. Deixe mais natural e menos ensaiado — é a sua naturalidade que faz a pessoa querer se inspirar em você.',
        'Solte um pouco mais. Grave falando como você fala com uma amiga, não como quem está gravando um comercial.',
      ],
      M: null,
    },
  },
  {
    id: 'limpeza',
    elogio: { F: 'Vídeos limpos, a mensagem fala sozinha.', M: null },
    bloco: 'Conteúdo',
    nome: 'Limpeza Visual',
    peso: 10,
    base: '"Do jeito que ele sai daqui, ele sobe para as redes sociais. Eu não coloco nem legenda." / "Reels e TikTok tem que ser raso com qualidade."',
    desc: {
      F: 'Poluição visual: excesso de escrita na tela, corte a cada 2 segundos, trend forçada, efeito demais.',
      M: 'Poluição visual: excesso de escrita na tela, corte a cada 2 segundos, trend forçada, efeito demais.',
    },
    niveis: {
      F: ['Vídeo ilegível de tanta escrita e efeito', 'Muito poluído, edição atrapalha a mensagem', 'Edição pesada em parte do conteúdo', 'Vídeos limpos, edição discreta', 'Limpeza total — a mensagem fala sozinha'],
      M: null,
    },
    dicas: {
      F: [
        'Tira as escritas dos vídeos. Elas competem com você e enterram a mensagem. Fala mais, escreve menos — confia em mim.',
        'Reduza a poluição visual — menos texto, menos efeito, menos corte. Vídeo limpo performa melhor.',
        'Diminua as edições e deixe os vídeos mais naturais. O excesso de produção afasta.',
      ],
      M: null,
    },
  },
  {
    id: 'lifestyle',
    elogio: { F: 'Bom equilíbrio entre trabalho e estilo de vida.', M: null },
    bloco: 'Conteúdo',
    nome: 'Estilo de Vida vs. Só Trabalho',
    peso: 12,
    base: '"As pessoas não gostam de acompanhar quem só fala do produto que vende." / "As pessoas querem comprar a sua beleza além do seu conhecimento."',
    desc: {
      F: 'Proporção entre conteúdo de trabalho/nicho e vida real: treino, comida, casa, rotina, o que a pessoa acredita.',
      M: 'Proporção entre conteúdo de trabalho/nicho e vida real: treino, comida, casa, rotina, o que a pessoa acredita.',
    },
    niveis: {
      F: ['100% trabalho — perfil de catálogo', 'Quase só nicho, quase nada de vida', 'Aparece a vida, mas raramente', 'Bom equilíbrio entre nicho e vida real', 'Estilo de vida forte — as pessoas querem a vida dela'],
      M: null,
    },
    dicas: {
      F: [
        'O perfil está só trabalho e fica chato de acompanhar, entendeu? Coloca estilo de vida: treino, comida, rotina, o que você acredita. As pessoas querem comprar a sua vida, não só o seu serviço.',
        'Falta vida fora do trabalho. Traga mais lifestyle pro perfil pra não virar catálogo.',
        'Você mostra a vida de vez em quando e sempre performa melhor. Aumente essa dose.',
      ],
      M: null,
    },
  },
  {
    id: 'bandeira',
    elogio: { F: 'Posicionamento claro, dá pra saber na hora o que o perfil defende.', M: null },
    bloco: 'Negócio',
    nome: 'Bandeira & Posicionamento',
    peso: 13,
    base: '"Qual é a bandeira que o seu perfil defende? O perfil que é morno tende a perder força cada vez mais."',
    desc: {
      F: 'Dá pra saber em 10 segundos o que esse perfil defende e pra quem ele fala? Ou é morno e genérico?',
      M: 'Dá pra saber em 10 segundos o que esse perfil defende e pra quem ele fala? Ou é morno e genérico?',
    },
    niveis: {
      F: ['Não dá pra saber do que o perfil trata', 'Morno — posta de tudo um pouco', 'Tema existe, mas sem bandeira clara', 'Posicionamento claro e reconhecível', 'Bandeira levantada — o público sabe exatamente o que esperar'],
      M: null,
    },
    dicas: {
      F: [
        'Ninguém sabe do que esse perfil trata, viu? Escolhe uma bandeira, defende ela e repete. Perfil morno perde força, pode ter certeza.',
        'Você posta de tudo um pouco e por isso não constrói comunidade. Escolha um tema central e fale dele de mil formas diferentes.',
        'O tema existe, mas falta bandeira. Deixe claro o que você defende e contra o que você é.',
      ],
      M: null,
    },
  },
  {
    id: 'monetizacao',
    elogio: { F: 'O caminho de compra está bem resolvido, tá?', M: null },
    bloco: 'Negócio',
    nome: 'Prontidão pra Monetizar',
    peso: 10,
    base: '"Se o cliente perceber que você precisa daquela venda, ele vai descredibilizar o seu produto." / "Eu sou especialista em vender sem vender."',
    desc: {
      F: 'Perfil aberto, bio que explica, caminho claro de compra e venda sem parecer desesperada.',
      M: 'Perfil aberto, bio que explica, caminho claro de compra e venda sem parecer desesperado.',
    },
    niveis: {
      F: ['Trancado, sem bio, sem caminho nenhum de compra', 'Vendedor bruto ou sem oferta nenhuma', 'Tem oferta, mas confusa ou escondida', 'Bio clara e caminho de compra funcionando', 'Vende sem vender — desejo antes da oferta'],
      M: null,
    },
    dicas: {
      F: [
        'Abre o perfil, arruma a bio e deixa claro o que você vende. Do jeito que está, ninguém compra de você nem que queira, tá?',
        'O perfil está muito vendedor. Reduza a venda bruta, fale menos o nome da empresa e mantenha a descontração — o cliente que sente desespero descredibiliza.',
        'A oferta existe mas está escondida. Deixe o caminho de compra óbvio na bio e nos destaques.',
      ],
      M: null,
    },
  },
];

// Travas: limitam o teto da nota, exatamente como acontece nas análises reais.
const TRAVAS = [
  { id: 'trancado', cobre: 'monetizacao', label: 'Perfil trancado / privado', teto: 8.0, nota: 'O perfil está trancado e dificulta uma análise mais profunda. Abra — quem te prejudica é o pessoal do convívio presencial, não a internet.' },
  { id: 'semrosto', cobre: 'naturalidade', label: 'Não aparece nos conteúdos (câmera desligada)', teto: 6.5, nota: 'Você não aparece. Perfil de câmera desligada não cresce e não vende. Ligue a câmera antes de qualquer outra coisa.' },
  { id: 'vendedor', cobre: 'monetizacao', label: 'Muito vendedor / só fala da empresa', teto: 7.5, nota: 'O perfil está muito vendedor. Fale menos o nome da empresa e apresente melhor o trabalho mantendo o humor, reduzindo a venda bruta.' },
  { id: 'parado', cobre: 'monetizacao', label: 'Posta menos de 1x por semana', teto: 8.5, nota: 'Poste mais. Não tem algoritmo que salve perfil parado — volume e repetição é o que educa o público.' },
  { id: 'ostentacao', cobre: 'cenario', label: 'Ostentação barata / marketing de ostentador', teto: 7.5, nota: 'Segure a ostentação. Ela atrai entretenimento barato e afasta justamente o cliente alto padrão que você quer.' },
];

// Bloqueios: não limitam a nota, impedem a análise. Sem nada publicado não há
// o que avaliar — na planilha original esses casos ficavam sem nota mesmo.
const BLOQUEIOS = [
  {
    id: 'trancado_vazio',
    label: 'Perfil trancado e sem posts',
    nota: 'Perfil trancado e sem nada publicado — não dá pra analisar. Abra o perfil e comece a postar que a gente faz a análise.',
  },
];

// Piso por critério: nenhum item desce abaixo destes números na nota final.
// É o desconto máximo que cada critério pode aplicar — ninguém recebe "Crítico"
// numa linha da própria imagem. IMPORTANTE: o piso mexe só no NÚMERO. O
// diagnóstico (melhorias e fecho) continua olhando a pontuação crua, senão os
// conselhos mais importantes parariam de disparar.
const PISO_CRITERIO = {
  estetica: 7.0,
  energia: 6.0,
  cenario: 6.0,
  naturalidade: 6.0,
  limpeza: 6.0,
  lifestyle: 6.0,
  bandeira: 5.0,
  monetizacao: 5.0,
};

// Piso da régua feminina: por decisão do método, mulher não recebe nota abaixo
// de 7,0 — o piso vence qualquer trava. A régua masculina usa a escala inteira.
const PISO = { F: 7.0, M: null };

// Classificação da skin, no vocabulário do Robert. "Skin" pra ele é o pacote com
// que a pessoa se apresenta ao mundo — e "modo easy" é quando esse pacote já
// resolve metade do caminho sozinho.
const FAIXAS = [
  {
    min: 9.0,
    nome: 'Skin do modo easy',
    veredito: 'Olha só: a vida é fácil pra quem tem essa skin. Não é imagem que falta pra você, minha filha — é volume e monetização. Pode ter certeza.',
  },
  {
    min: 8.0,
    nome: 'Skin afiada',
    veredito: 'Tá muito bom, pessoal. Base sólida. Dois ajustes finos e essa skin decola, entendeu?',
  },
  {
    min: 7.0,
    nome: 'Skin travada',
    veredito: 'O perfil é bom, mas tem uma coisa só segurando ele. Destrava isso aí que a sua vida muda.',
  },
  {
    min: 5.5,
    nome: 'Skin em construção',
    veredito: 'Tem material aqui, viu? Só que imagem e conteúdo precisam ser refeitos antes de você pensar em escalar.',
  },
  {
    min: 0.0,
    nome: 'Skin no zero',
    veredito: 'Vem cá. Antes de pensar em vender, você vai reconstruir imagem, conteúdo e posicionamento do zero. É isso.',
  },
];

// Ações práticas por critério — viram a lista de melhorias na tela de resultado.
const ACOES = {
  estetica: [
    'Troque a foto de perfil por uma com boa luz, sorrindo e com o rosto em destaque',
    'Padronize o básico: cabelo arrumado, roupa que te valorize, em todo conteúdo',
  ],
  energia: [
    'Sorria mais. Parece bobagem, é o que segura a pessoa assistindo',
    'Grave nos dias em que você está bem — a energia atravessa a tela',
  ],
  cenario: [
    'Escolha dois ou três fundos fixos: parede limpa, uma planta, boa luz',
    'Nada de gaveta aberta, roupa no varal ou bagunça atrás de você',
  ],
  naturalidade: [
    'Ligue a câmera e apareça de cara, sem roteiro decorado',
    'Fale como você fala com uma amiga, não como quem grava comercial',
  ],
  limpeza: [
    'Tire as escritas de cima do vídeo — elas competem com você',
    'Corte a edição pela metade: menos efeito, menos corte, mais fala',
  ],
  lifestyle: [
    'Poste sua rotina: treino, comida, casa, o que você acredita',
    'Regra simples: pra cada post de trabalho, um de vida real',
  ],
  bandeira: [
    'Escreva numa frase o que o seu perfil defende — e repita isso até cansar',
    'Deixe claro na bio pra quem você fala e o que você resolve',
  ],
  monetizacao: [
    'Abra o perfil e arrume a bio com o caminho de compra na cara',
    'Entregue valor antes de oferecer: o desejo de comprar vem depois',
  ],
};

// Plano de TikTok — o método dele, em passos. Aparece em toda análise.
const PLANO_TIKTOK = {
  titulo: 'O que fazer no TikTok',
  intro:
    'Olha só: comece pelo TikTok, que lá ninguém que te conhece está olhando. O Insta é melhor pra fazer dinheiro, mas o TikTok é onde você cria coragem e fica conhecida. Quando estiver cascuda, traz pro Insta.',
  passos: [
    'Pegue UM tema só e fale dele de mil formas diferentes. É a repetição que educa o público — não é ficar arrumando mil assuntos.',
    'Raso com qualidade. Reels e TikTok não é lugar de ser profundo; profundidade é pra live e pra consultoria, onde você tem tempo.',
    'Nada de trend nem dancinha. Eu fiz 1 milhão de seguidores em 90 dias sem uma trend no feed, e você não precisa também.',
    'Não trave na edição. Do jeito que sai da câmera pode subir — eu não coloco nem legenda.',
    'Grave muito mais do que posta. Volume é o que separa quem cresce de quem fica reclamando do algoritmo.',
    'Quando a base estiver de pé, entre no TikTok Shop. Aí sim essa skin começa a monetizar de verdade.',
  ],
};

// Ajuste de calibração da leitura por IA. Observado na prática: a IA pontua mais
// generosamente que o analista humano. Este desconto alinha a saída dela com as
// notas reais — ajuste este número conforme for testando com perfis conhecidos.
const AJUSTE_IA = -1.0;

// Fecho de monetização. Em vez de sempre empurrar TikTok Shop, escolhe a
// alavanca que mais destrava ESSE perfil agora. Todos saem da base do Robert.
const CTA_PRONTO = {
  id: 'tiktokshop',
  texto: 'Olha só: essa skin já está pronta. Agora é produzir no TikTok Shop e começar a faturar logo, viu? Não tem mais desculpa.',
};

const CTAS = [
  {
    id: 'camera',
    gatilho: { criterio: 'naturalidade', ate: 5.0 },
    texto: 'Olha só: antes de pensar em vender, você tem que ligar a câmera. Ninguém compra de texto na tela — as pessoas compram de gente, entendeu? Grava um vídeo por dia falando do que você entende que a sua vida muda.',
  },
  {
    id: 'semvender',
    gatilho: { trava: 'vendedor' },
    texto: 'Para de vender e começa a servir, né? Quando você entrega valor sem pedir nada em troca, o desejo de comprar aparece sozinho. É assim que funciona — é vender sem vender.',
  },
  {
    id: 'volume',
    gatilho: { trava: 'parado' },
    texto: 'O que trava você não é o algoritmo, é o volume. Pode ter certeza. Pega UM tema e fala dele de mil formas diferentes — é a repetição que educa o público e faz ele comprar de você.',
  },
  {
    id: 'semostentar',
    gatilho: { trava: 'ostentacao' },
    texto: 'Segura essa ostentação, viu? Ela atrai entretenimento barato e afasta justamente o cliente alto padrão que você quer. Quem tem dinheiro de verdade não fica mostrando.',
  },
  {
    id: 'comecar',
    gatilho: { trava: 'trancado' },
    texto: 'Abre esse perfil e começa a produzir. Quem te prejudica de verdade é a gentalha do seu convívio presencial, não a internet — e ela entrega o seu conteúdo de graça pra milhões de pessoas.',
  },
  {
    id: 'lifestyle',
    gatilho: { criterio: 'lifestyle', ate: 5.0 },
    texto: 'Mostra a sua vida, não só o seu serviço. As pessoas querem comprar a sua beleza e o seu estilo de vida antes de comprarem o seu conhecimento, tá?',
  },
  {
    id: 'bandeira',
    gatilho: { criterio: 'bandeira', ate: 6.5 },
    texto: 'Vem cá: qual é a bandeira que o seu perfil defende? Escolhe uma e repete até cansar. Perfil morno perde força — comunidade se constrói quando o público sabe exatamente o que esperar de você.',
  },
  {
    id: 'simplificar',
    gatilho: { criterio: 'limpeza', ate: 5.0 },
    texto: 'Simplifica, minha filha. Tira o texto da tela, corta a edição pela metade e fala mais. Raso com qualidade é o que performa — profundidade é lugar de live e de consultoria, onde você tem tempo.',
  },
  {
    id: 'estetica',
    gatilho: { criterio: 'estetica', ate: 6.5 },
    texto: 'Investe na sua imagem antes de investir em tráfego. Eu não dou opinião aqui, eu explico como o mundo funciona: quanto maior o ticket, mais bonito tem que ser quem está vendendo. Beleza abre porta que diploma não abre.',
  },
  {
    id: 'padrao',
    gatilho: { criterio: 'cenario', ate: 5.0 },
    texto: 'Arruma esse cenário antes de escalar. Tá tudo bem ser pobre, pessoal, você só não pode PARECER — senão as pessoas não compram de você. É isso.',
  },
  {
    // fallback: nenhum gatilho bateu, o perfil está mediano em tudo
    id: 'relevancia',
    gatilho: null,
    texto: 'Fica relevante nas redes que o preço para de ser discutido. Quanto maior você fica, menos gente tem coragem de pechinchar o seu trabalho. Confia em mim.',
  },
];

/* ============================================================
   MODO BELEZA — a régua de beleza do Robert, franco de verdade.
   Avalia a imagem completa (rosto, pele, shape, cabelo,
   feminilidade, produção, estilo, padrão) pelos princípios dele.
   Sem travas, sem piso — o "seu caso é shape" pode acontecer.
   ============================================================ */

const B_CRITERIOS = [
  {
    id: 'rosto',
    peso: 20,
    bloco: 'Rosto',
    nome: 'Rosto & Harmonia',
    base: '"A harmonia do rosto é a primeira coisa que o público julga." / "Beleza abre porta que o diploma não abre."',
    desc: { F: 'Os traços do rosto, a harmonia, a simetria. É o primeiro filtro do público.', M: 'Os traços, a harmonia, o queixo e a mandíbula. O primeiro filtro do público.' },
    elogio: { F: 'Rosto lindo, de traços harmônicos — o público não hesita.', M: 'Rosto de traços fortes e harmônicos, passa presença.' },
    niveis: {
      F: ['Traços que pedem harmonização antes de tudo', 'Rosto comum, sem nada que se destaque', 'Bonita de rosto às vezes, sem constância', 'BONITA — traços harmônicos, o público reconhece', 'LINDA — rosto de alto padrão, ninguém hesita'],
      M: ['Traços que pedem cuidado antes de tudo', 'Rosto comum, sem destaque', 'Bonito às vezes, sem constância', 'BEM APESSOADO — traços harmônicos', 'ALTO PADRÃO — rosto que ninguém questiona'],
    },
    dicas: {
      F: ['Estude ângulos e luz que valorizam o seu rosto', 'Considere harmonização pra equilibrar os traços', 'Padronize as fotos no ângulo que mais te favorece'],
      M: ['Estude ângulos e luz que valorizam o seu rosto', 'Barba bem feita alinha a mandíbula e o queixo', 'Padronize o ângulo que mais te favorece'],
    },
  },
  {
    id: 'shape',
    peso: 18,
    bloco: 'Corpo',
    nome: 'Shape & Peso',
    base: '"A felicidade é magra." / "Sem beleza, seu caso é shape." / "Rica não é cavalona."',
    desc: { F: 'O peso e a definição do corpo. Nem acima do peso, nem cavalona — o meio elegante.', M: 'O shape, o porte, a definição. Nem largado, nem inflado — o meio elegante.' },
    elogio: { F: 'Shape no ponto — magra e elegante, do jeito que a vida fica fácil.', M: 'Shape no ponto — definido e elegante, passa disciplina.' },
    niveis: {
      F: ['Bem acima do peso — aqui o caso é shape antes de tudo', 'Acima do peso, atrapalha a imagem', 'Peso ok, mas sem definição', 'MAGRA e no peso — a felicidade é magra', 'Shape de alto padrão — magra e definida, nem cavalona'],
      M: ['Bem fora de forma — aqui o caso é shape antes de tudo', 'Fora de forma, atrapalha a imagem', 'Ok, mas sem definição', 'EM FORMA — shape que passa disciplina', 'Shape de alto padrão — definido e elegante'],
    },
    dicas: {
      F: ['Foca no shape — treino e alimentação limpa antes de tudo', 'A felicidade é magra: shape simplifica a sua vida inteira', 'Consistência no treino vale mais que dieta relâmpago'],
      M: ['Foca no shape — treino e alimentação limpa antes de tudo', 'Shape passa disciplina, e disciplina vende', 'Consistência no treino vale mais que dieta relâmpago'],
    },
  },
  {
    id: 'pele',
    peso: 14,
    bloco: 'Rosto',
    nome: 'Pele & Skin Care',
    base: '"A pele descansada de quem dorme direito, sem olheira, com o skin care em dia."',
    desc: { F: 'O viço e o cuidado da pele. Rosto descansado ou marcado e cansado?', M: 'O viço e o cuidado da pele. Rosto descansado ou marcado e cansado?' },
    elogio: { F: 'Pele impecável, o viço de quem se trata.', M: 'Pele cuidada, o viço de quem se trata.' },
    niveis: {
      F: ['Pele descuidada, sem skin care nenhum', 'Pele cansada — olheira, sem viço', 'Pele ok, mas inconstante', 'Pele cuidada, descansada, skin care em dia', 'Pele impecável — viço de alto padrão'],
      M: ['Pele descuidada, sem cuidado nenhum', 'Pele cansada, sem viço', 'Pele ok, mas inconstante', 'Pele cuidada e descansada', 'Pele impecável — viço de alto padrão'],
    },
    dicas: {
      F: ['Comece uma rotina de skin care — pele descansada muda tudo', 'Durma direito e trate a olheira: o rosto de quem dorme bem aparece', 'Pele com viço fotografa muito melhor'],
      M: ['Comece uma rotina de skin care — pele descansada muda tudo', 'Durma direito e trate a olheira', 'Pele com viço fotografa muito melhor'],
    },
  },
  {
    id: 'feminilidade',
    peso: 14,
    bloco: 'Energia',
    nome: 'Feminilidade & Elegância',
    base: '"A mulher feminina faz mais dinheiro." / "A elegância não grita, ela sussurra."',
    desc: { F: 'Leveza, doçura e elegância. Ou energia dura/masculinizada, ou vulgar de kenga.', M: 'Postura firme, porte, presença. Ou energia mole, ou de mulambo.' },
    elogio: { F: 'Muita feminilidade — a elegância que sussurra.', M: 'Porte firme e presença — passa alto padrão.' },
    niveis: {
      F: ['Energia dura ou vulgar — afasta o alto padrão', 'Masculinizada, sem leveza', 'Feminina às vezes, sem constância', 'Feminina, doce, elegante', 'Muita feminilidade — a elegância que sussurra'],
      M: ['Energia de mulambo, sem presença', 'Postura mole, sem porte', 'Passa presença às vezes', 'Porte firme e presente', 'Presença de alto padrão, natural'],
    },
    dicas: {
      F: ['Traga leveza e doçura pra imagem — o alto padrão não grita', 'Menos exagero, mais delicadeza: a elegância sussurra', 'Fotos serenas passam mais classe que poses forçadas'],
      M: ['Trabalhe o porte e a presença nas fotos', 'Menos pose forçada, mais naturalidade firme', 'Postura ereta e olhar tranquilo passam alto padrão'],
    },
  },
  {
    id: 'cabelo',
    peso: 12,
    bloco: 'Corpo',
    nome: 'Cabelo',
    base: '"Cabelo de mulher é caro." / "Grave com o cabelo solto, eles te valorizam."',
    desc: { F: 'A saúde, o brilho e o cuidado do cabelo — sozinho ele levanta a beleza.', M: 'O corte e o cuidado do cabelo e da barba.' },
    elogio: { F: 'Cabelo impecável — sozinho já levanta a sua beleza.', M: 'Cabelo e barba bem cuidados, alinham o visual.' },
    niveis: {
      F: ['Cabelo descuidado, sem tratamento', 'Cabelo ok, mas sem brilho', 'Cabelo bom em alguns momentos', 'Cabelo cuidado, saudável, te valoriza', 'Cabelo impecável — levanta a beleza sozinho'],
      M: ['Cabelo e barba largados', 'Sem cuidado, inconstante', 'Ok em alguns momentos', 'Corte e barba bem cuidados', 'Visual impecável, alinhado'],
    },
    dicas: {
      F: ['Trate o cabelo e grave com ele solto — te valoriza', 'Cabelo cuidado sozinho levanta a beleza', 'Vale investir: cabelo de mulher é caro, mas rende'],
      M: ['Mantenha corte e barba sempre alinhados', 'Um corte que combina com o rosto muda o visual', 'Cuide da saúde do cabelo, não só do formato'],
    },
  },
  {
    id: 'producao',
    peso: 10,
    bloco: 'Energia',
    nome: 'Maquiagem & Produção',
    base: '"Passa uma maquiagem, arruma esse cabelo — o mundo trata melhor quem se cuida."',
    desc: { F: 'Maquiagem, arrumação, o cuidado de se produzir pra foto.', M: 'A arrumação geral, o cuidado de se apresentar bem na foto.' },
    elogio: { F: 'Produção impecável, digna de foto profissional.', M: 'Bem apresentado, cuidado em cada detalhe.' },
    niveis: {
      F: ['Sem nenhuma produção, largada na foto', 'Pouco cuidado com maquiagem e arrumação', 'Produz às vezes', 'Bem produzida — maquiagem e arrumação em dia', 'Produção impecável, foto profissional'],
      M: ['Largado, sem cuidado na foto', 'Pouca arrumação', 'Cuida às vezes', 'Bem apresentado', 'Impecável, foto profissional'],
    },
    dicas: {
      F: ['Passe uma maquiagem e arrume o cabelo pra foto — o mundo trata melhor quem se cuida', 'Invista numa foto profissional pro perfil', 'Boa luz vale mais que filtro'],
      M: ['Cuide da apresentação: roupa alinhada, barba feita, boa luz', 'Invista numa foto profissional pro perfil', 'Boa luz vale mais que filtro'],
    },
  },
  {
    id: 'estilo',
    peso: 8,
    bloco: 'Corpo',
    nome: 'Roupa & Estilo',
    base: '"A roupa que valoriza — nem vulgar de kenga, nem masculina."',
    desc: { F: 'A roupa valoriza o corpo e a beleza? Nem vulgar, nem largada, nem masculina.', M: 'A roupa assenta e valoriza? Nem largada, nem exagerada.' },
    elogio: { F: 'Estilo de alto padrão — elegante e caro sem ostentar.', M: 'Estilo alinhado — roupa que assenta e valoriza.' },
    niveis: {
      F: ['Roupa que não valoriza — vulgar ou desleixada', 'Roupa comum, sem intenção', 'Acerta o estilo às vezes', 'Roupa que valoriza o corpo e a beleza', 'Estilo de alto padrão — elegante sem ostentar'],
      M: ['Roupa largada ou exagerada', 'Comum, sem intenção', 'Acerta às vezes', 'Roupa que assenta e valoriza', 'Estilo de alto padrão — alinhado sem ostentar'],
    },
    dicas: {
      F: ['Escolha roupa que valoriza o corpo — nem vulgar, nem largada', 'Estude o estilo do alto padrão: elegante e caro sem ostentar', 'Cores sóbrias passam mais classe'],
      M: ['Escolha roupa que assenta no corpo — nem larga, nem exagerada', 'Estude o estilo do alto padrão: alinhado sem ostentar', 'Cores sóbrias passam mais classe'],
    },
  },
  {
    id: 'padrao',
    peso: 4,
    bloco: 'Energia',
    nome: 'Sinal de Alto Padrão',
    base: '"Alto padrão / baixo padrão." / "Quando a rica faz procedimento, fica natural."',
    desc: { F: 'O conjunto: natural e elegante (alto padrão) ou exagerado e forçado (baixo padrão)?', M: 'O conjunto: natural e elegante (alto padrão) ou forçado (baixo padrão)?' },
    elogio: { F: 'Alto padrão inquestionável — natural, elegante, cara.', M: 'Alto padrão inquestionável — natural e elegante.' },
    niveis: {
      F: ['Baixo padrão — exagero, procedimento mal feito', 'Sinais de baixo padrão', 'No meio do caminho', 'Passa alto padrão', 'Alto padrão inquestionável — natural e elegante'],
      M: ['Baixo padrão — forçado, exagerado', 'Sinais de baixo padrão', 'No meio do caminho', 'Passa alto padrão', 'Alto padrão inquestionável — natural'],
    },
    dicas: {
      F: ['Busque o natural: procedimento bom é o que ninguém percebe', 'Corte o exagero — alto padrão é discreto', 'Menos é mais: a elegância não grita'],
      M: ['Busque o natural, sem exagero', 'Alto padrão é discreto — menos é mais', 'A elegância não grita'],
    },
  },
];

// Escala de beleza do Robert, das enquetes dos stories: Linda / Bonita / e o
// franco "sem beleza, seu caso é shape".
const B_FAIXAS = [
  { min: 9.0, nome: 'Alto padrão', veredito: 'Olha só: alto padrão de verdade. O público não hesita. Essa beleza abre porta que diploma não abre, pode ter certeza.' },
  { min: 8.0, nome: 'Linda', veredito: 'Você é linda, pessoal. Beleza reconhecida. Uns ajustes finos e vira alto padrão, pode ter certeza.' },
  { min: 7.0, nome: 'Bonita', veredito: 'Bonita, viu? Tem beleza sim. Falta cuidado num ou dois pontos pra virar linda.' },
  { min: 5.5, nome: 'Beleza pra trabalhar', veredito: 'Tem beleza pra lapidar aqui. Cuida do que eu vou te falar que a sua régua sobe rápido, entendeu?' },
  { min: 0.0, nome: 'Seu caso é shape', veredito: 'Vou ser franco, que eu não dou opinião, eu explico como o mundo funciona: a beleza aqui ainda não foi trabalhada. Seu caso é shape, skin care e cuidado — e isso muda tudo. Bora?' },
];

const B_PLANO = {
  titulo: 'Sua rotina de padrão',
  intro: 'Olha só: beleza não é sorte, é rotina. O que separa a linda da bonita é o que ela faz todo dia. Segue isso aqui que a sua régua sobe.',
  passos: [
    'Shape em primeiro lugar. Treino e alimentação limpa — a felicidade é magra, e isso simplifica tudo.',
    'Skin care todo dia. Pele descansada, sem olheira, é o que o alto padrão tem em comum.',
    'Cabelo tratado e solto nas fotos. Ele sozinho levanta a sua beleza.',
    'Maquiagem e produção pra registrar. O mundo trata melhor quem se cuida.',
    'Roupa que valoriza — elegante, nunca vulgar. A elegância não grita, ela sussurra.',
    'Procedimento só se ficar natural. Alto padrão é o que ninguém percebe.',
  ],
};

const B_CTA_PRONTO = {
  id: 'altopadrao',
  texto: 'Olha só: essa beleza já é alto padrão. Agora é manter a rotina e usar isso a seu favor — beleza abre porta que diploma não abre, pode ter certeza.',
};

const B_CTAS = [
  { id: 'shape', gatilho: { criterio: 'shape', ate: 5.0 }, texto: 'Vou ser franco: o seu caso agora é shape. Foca no treino e na alimentação, que quando o shape vem, a sua régua de beleza sobe inteira. É isso.' },
  { id: 'rosto', gatilho: { criterio: 'rosto', ate: 5.0 }, texto: 'Considera uma harmonização pra equilibrar os traços. O rosto é a primeira coisa que o público julga, pode ter certeza.' },
  { id: 'pele', gatilho: { criterio: 'pele', ate: 5.0 }, texto: 'Começa hoje uma rotina de skin care. Pele descansada, sem olheira, é o que toda mulher de alto padrão tem em comum.' },
  { id: 'feminilidade', gatilho: { criterio: 'feminilidade', ate: 5.0 }, texto: 'Traz mais feminilidade pra sua imagem: leveza, doçura, elegância. A mulher feminina é tratada diferente, é assim que funciona.' },
  { id: 'cabelo', gatilho: { criterio: 'cabelo', ate: 6.5 }, texto: 'Trata esse cabelo e grava com ele solto. Cabelo de mulher é caro, mas é o que mais te valoriza.' },
  { id: 'producao', gatilho: { criterio: 'producao', ate: 6.5 }, texto: 'Capricha na produção e tira uma foto boa. O mundo trata melhor quem se cuida, pode ter certeza.' },
  { id: 'estilo', gatilho: { criterio: 'estilo', ate: 6.5 }, texto: 'Ajusta o estilo: roupa que valoriza, nem vulgar nem largada. A elegância não grita, ela sussurra.' },
  { id: 'lapidar', gatilho: null, texto: 'Cuida de cada detalhe que eu te falei que a sua beleza sobe de régua. Beleza é rotina, não é sorte — confia em mim.' },
];

const B_ACOES = Object.fromEntries(B_CRITERIOS.map((c) => [c.id, c.dicas.F]));

/* ============================================================
   MODOS — cada via empacota a sua régua. O motor recebe o modo
   ativo e trabalha por cima dele, então a calibração de cada um
   fica isolada. Profissional = dourado; Beleza = rosa.
   ============================================================ */

function _corDeVerde(v) {
  if (v >= 9) return '#3fb950';
  if (v >= 8) return '#2ea043';
  if (v >= 6.5) return '#d29922';
  if (v >= 5) return '#db6d28';
  return '#da3633';
}
function _corDeRosa(v) {
  if (v >= 9) return '#ff4d94';
  if (v >= 8) return '#f05a9e';
  if (v >= 6.5) return '#e06aa6';
  if (v >= 5) return '#cf6a97';
  return '#b25a86';
}
function _corDeAzul(v) {
  if (v >= 9) return '#4d9fff';
  if (v >= 8) return '#3b82f6';
  if (v >= 6.5) return '#5b8fd6';
  if (v >= 5) return '#6b83b8';
  return '#5a6f9a';
}

// Homem puxa a tonalidade pro azul em qualquer modo.
const AZUL = '#3b82f6';

const MODOS = {
  profissional: {
    id: 'profissional',
    rotulo: 'Profissional',
    titulo: 'Análise de Perfil',
    subtitulo: 'Sobe os prints do seu Instagram e descobre em que pé está a sua skin — e o que fazer pra ela começar a monetizar.',
    corBase: { F: '#c9a227', M: AZUL },
    criterios: CRITERIOS,
    travas: TRAVAS,
    bloqueios: BLOQUEIOS,
    pisoCriterio: PISO_CRITERIO,
    pisoGenero: PISO,
    faixas: FAIXAS,
    acoes: ACOES,
    ctas: CTAS,
    ctaPronto: CTA_PRONTO,
    prontoMin: 8.5,
    plano: PLANO_TIKTOK,
    corDe: (v) => _corDeVerde(v), // qualidade de negócio: verde→vermelho nos dois gêneros
    tituloVisto: 'O que o Robert viu',
  },
  beleza: {
    id: 'beleza',
    rotulo: 'Beleza',
    titulo: 'Análise de Beleza',
    subtitulo: 'Sobe uma foto de rosto e uma de corpo inteiro e descubra em que pé está a sua beleza pela régua do Robert.',
    corBase: { F: '#e84d8a', M: AZUL },
    criterios: B_CRITERIOS,
    travas: [], // beleza não tem trava — a nota é o retrato cru
    bloqueios: BLOQUEIOS,
    pisoCriterio: {}, // sem piso por critério — o piso geral cuida da nota mínima
    // Nota mínima GERAL da beleza: ninguém recebe abaixo de 7,5, por decisão do
    // método. O número nunca destrói a pessoa; a franqueza vive no diagnóstico
    // (o fecho e as melhorias leem a pontuação crua e ainda dizem "seu caso é shape").
    pisoGenero: { F: 7.5, M: 7.5 },
    faixas: B_FAIXAS,
    acoes: B_ACOES,
    ctas: B_CTAS,
    ctaPronto: B_CTA_PRONTO,
    prontoMin: 8.5,
    plano: B_PLANO,
    corDe: (v, g) => (g === 'M' ? _corDeAzul(v) : _corDeRosa(v)),
    tituloVisto: 'O que o Robert viu',
  },
};
````

## Arquivo: `public/motor.js`
````javascript
/* ============================================================
   Motor do Método SKIN — cálculo da nota e geração do texto.
   Funções puras, sem DOM. Recebem o MODO ativo (cfg) e trabalham
   por cima dele, então profissional e beleza compartilham o mesmo
   motor sem que a calibração de um vaze pro outro.
   ============================================================ */

function campoDe(c, chave, genero) {
  return c[chave][genero] || c[chave].F;
}

/**
 * @param {Object}  cfg     o modo ativo (MODOS.profissional | MODOS.beleza)
 * @param {Object}  notas   { criterioId: valorDoNivel }
 * @param {Set}     travas  ids de travas e bloqueios marcados
 * @param {string}  genero  'F' | 'M'
 * @param {boolean} porIA   true quando a pontuação veio da leitura automática
 */
function calcularNota(cfg, notas, travas, genero, porIA) {
  const bloqueio = cfg.bloqueios.find((b) => travas.has(b.id));
  if (bloqueio) return { bloqueio };

  const faltando = cfg.criterios.filter((c) => notas[c.id] === undefined).length;
  if (faltando) return { faltando };

  // Aplica o piso de cada critério antes de ponderar. As notas cruas seguem
  // intactas em `notas` — é delas que saem as melhorias e o fecho.
  const notasPiso = {};
  let pisouAlgum = false;
  cfg.criterios.forEach((c) => {
    const min = cfg.pisoCriterio[c.id] || 0;
    notasPiso[c.id] = Math.max(notas[c.id], min);
    if (notasPiso[c.id] > notas[c.id]) pisouAlgum = true;
  });

  const bruta = cfg.criterios.reduce((s, c) => s + notasPiso[c.id] * c.peso, 0) / 100;
  const ajuste = porIA ? AJUSTE_IA : 0;
  const ativas = cfg.travas.filter((t) => travas.has(t.id));
  const teto = ativas.length ? Math.min(...ativas.map((t) => t.teto)) : 10;
  const piso = cfg.pisoGenero[genero] || 0;
  const comTeto = Math.min(bruta + ajuste, teto);
  const final = Math.round(Math.max(comTeto, piso) * 10) / 10;

  const n = (v) => v.toFixed(1).replace('.', ',');
  const avisos = [];
  if (pisouAlgum) avisos.push('Piso por critério aplicado.');
  if (ajuste) avisos.push(`Leitura por IA: ${n(bruta)} ajustada em ${n(ajuste)}.`);
  if (bruta + ajuste > teto) avisos.push(`Limitada a ${n(teto)} por trava.`);
  if (comTeto < piso) avisos.push(`Nota mínima: ${n(comTeto)} elevada para ${n(piso)}.`);

  return { bruta, ajuste, teto, piso, final, ativas, avisos, notasPiso, faixa: cfg.faixas.find((f) => final >= f.min) };
}

/**
 * Escolhe o fecho pela alavanca que mais destrava esse perfil.
 * Perfil pronto vai pro fecho de "pronto"; o resto recebe o primeiro gatilho.
 */
function escolherCTA(cfg, calc, notas) {
  const { final, ativas } = calc;
  if (final >= cfg.prontoMin && !ativas.length) return cfg.ctaPronto.texto;

  const travasAtivas = new Set(ativas.map((t) => t.id));
  const bateu = cfg.ctas.find((cta) => {
    if (!cta.gatilho) return true; // fallback
    if (cta.gatilho.trava) return travasAtivas.has(cta.gatilho.trava);
    return notas[cta.gatilho.criterio] <= cta.gatilho.ate;
  });
  return bateu.texto;
}

/**
 * Monta o texto: Nota + elogio + fecho, na voz do Robert.
 */
function gerarTexto(cfg, calc, notas, genero, nome, arroba, naoVistos = []) {
  const cab = [nome, arroba && (arroba.startsWith('@') ? arroba : '@' + arroba)].filter(Boolean).join(' — ');

  if (calc.bloqueio) return [cab, calc.bloqueio.nota].filter(Boolean).join('\n\n');

  const { final } = calc;
  const ordenados = [...cfg.criterios].sort((a, b) => notas[a.id] - notas[b.id] || a.peso - b.peso);

  let corpo = `Nota ${final.toFixed(1).replace('.', ',')}.`;

  // elogios: até 2 pontos fortes (nota >= 8). Critério não visto nunca vira elogio.
  const fortes = [...ordenados].reverse().filter((c) => notas[c.id] >= 8 && !naoVistos.includes(c.id));
  fortes.slice(0, final >= cfg.prontoMin ? 2 : 1).forEach((c) => {
    corpo += ' ' + campoDe(c, 'elogio', genero);
  });

  corpo += ' ' + escolherCTA(cfg, calc, notas);

  return [cab, corpo].filter(Boolean).join('\n\n');
}

/**
 * Lista de melhorias: as ações dos critérios mais fracos, do que mais pesa
 * pro que menos pesa. Critério não visto fica de fora.
 */
function melhorias(cfg, notas, naoVistos = [], limite = 5) {
  return cfg.criterios
    .filter((c) => notas[c.id] < 8 && !naoVistos.includes(c.id))
    .sort((a, b) => notas[a.id] - notas[b.id] || b.peso - a.peso)
    .flatMap((c) => (cfg.acoes[c.id] || []).map((texto) => ({ criterio: c.nome, texto })))
    .slice(0, limite);
}
````

## Arquivo: `public/app.js`
````javascript
/* Análise — sobe os prints, escolhe o modo, clica em Robert Analisar.
   A IA só pontua os critérios; a nota e os textos saem do motor calibrado. */

const $ = (s) => document.querySelector(s);
const prints = [];
let genero = 'F';
let modo = 'profissional';

const cfg = () => MODOS[modo];
// cor de base do momento: depende do modo (dourado/rosa) e do gênero (azul no homem)
const corBaseAtual = () => cfg().corBase[genero];

/* ---------- prints ---------- */

function renderThumbs() {
  $('#thumbs').innerHTML = '';
  prints.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'thumb';
    d.innerHTML = `<img src="${p.url}" alt=""><button>×</button>`;
    d.querySelector('button').onclick = () => {
      URL.revokeObjectURL(p.url);
      prints.splice(i, 1);
      renderThumbs();
    };
    $('#thumbs').appendChild(d);
  });
}

// Encolhe a imagem no navegador antes de enviar. Print de tela cheia passa de
// vários MB e estoura o limite da Vercel (~4,5 MB por requisição) — além de
// custar mais tokens. 1600px de lado maior já é mais que suficiente pra IA ler.
const MAX_LADO = 1600;
function comprimir(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
      const w = Math.round(img.width * escala);
      const h = Math.round(img.height * escala);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      const url = c.toDataURL('image/jpeg', 0.82);
      resolve({ tipo: 'image/jpeg', dados: url.split(',')[1], url });
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

function receber(arquivos) {
  [...arquivos]
    .filter((f) => f.type.startsWith('image/'))
    .forEach(async (f) => {
      const p = await comprimir(f);
      if (p) {
        prints.push(p);
        renderThumbs();
      }
    });
}

const drop = $('#drop');
drop.onclick = () => $('#arquivos').click();
$('#arquivos').onchange = (e) => receber(e.target.files);
['dragenter', 'dragover'].forEach((ev) =>
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add('over');
  })
);
['dragleave', 'drop'].forEach((ev) =>
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    if (ev === 'drop') receber(e.dataTransfer.files);
  })
);

$('#genero').onclick = (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  genero = b.dataset.g;
  $('#genero').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  // gênero muda a régua e a tonalidade — limpa o resultado e reaplica a cor
  $('#res').classList.remove('on');
  aplicarAcento(corBaseAtual());
};

/* ---------- modo (profissional | beleza) ---------- */

function aplicarModo() {
  const c = cfg();
  $('#titulo').textContent = c.titulo.replace(/(\S+)$/, '');
  $('#titulo-em').textContent = c.titulo.split(' ').pop();
  $('#subtitulo').textContent = c.subtitulo;
  $('#tk-visto-h3').textContent = c.tituloVisto;
  $('#modo').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.m === modo));
  aplicarAcento(corBaseAtual());
  $('#res').classList.remove('on'); // troca de produto → limpa resultado
}

$('#modo').onclick = (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  modo = b.dataset.m;
  aplicarModo();
};

/* ---------- acento ---------- */

// A página inteira assume a cor do modo (dourado no profissional, rosa na
// beleza) e, no resultado, a cor da nota. O neon vem junto.
function clarear(hex, f = 0.42) {
  const n = parseInt(hex.slice(1), 16);
  const m = (x) => Math.round(x + (255 - x) * f);
  return `rgb(${m((n >> 16) & 255)}, ${m((n >> 8) & 255)}, ${m(n & 255)})`;
}

function aplicarAcento(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = document.documentElement.style;
  r.setProperty('--ac', hex);
  r.setProperty('--ac2', clarear(hex));
  r.setProperty('--ac-rgb', `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`);
}

/* ---------- resultado ---------- */

function aviso(msg, erro) {
  $('#aviso').textContent = msg;
  $('#aviso').className = erro ? 'erro' : '';
}

function mostrar(calc, notas, saida) {
  const c = cfg();

  // leitura incompleta: melhor não mostrar nota nenhuma do que mostrar uma errada
  if (calc.faltando) {
    aviso('A leitura veio incompleta. Tenta de novo, de preferência com mais fotos.', true);
    return;
  }

  $('#res').classList.add('on');
  const naoVistos = saida.naoAvaliavel || [];

  if (calc.bloqueio) {
    aplicarAcento(corBaseAtual());
    $('#nota').textContent = '—';
    $('#nota').style.color = 'var(--tx3)';
    $('#skin').textContent = 'Não dá pra avaliar';
    $('#skin').style.cssText = 'background:rgba(255,255,255,.06);color:#a3adbf';
    $('#vered').textContent = '';
    $('#txt').textContent = calc.bloqueio.nota;
    $('#sec-melhorias').style.display = 'none';
    $('#sec-tiktok').style.display = 'none';
    $('#barras').innerHTML = '';
    $('#obs').textContent = '';
    return;
  }

  $('#sec-melhorias').style.display = '';
  $('#sec-tiktok').style.display = '';

  const cor = c.corDe(calc.final, genero);
  aplicarAcento(cor);
  $('#nota').innerHTML = calc.final.toFixed(1).replace('.', ',') + '<small>/10</small>';
  $('#nota').style.color = cor;
  $('#skin').textContent = calc.faixa.nome;
  $('#skin').style.cssText = `background:${cor}22;color:${cor};border:1px solid ${cor}55`;
  $('#vered').textContent = calc.faixa.veredito;
  $('#txt').textContent = gerarTexto(c, calc, notas, genero, '', '', naoVistos);

  // melhorias
  const lista = melhorias(c, notas, naoVistos);
  $('#melhorias').innerHTML = lista.length
    ? lista.map((m) => `<li><span><b>${m.criterio}.</b> ${m.texto}</span></li>`).join('')
    : '<li><span>Nada a corrigir por aqui. Você já está no ponto.</span></li>';

  // plano final (TikTok no profissional, rotina de padrão na beleza)
  $('#tk-titulo').textContent = c.plano.titulo;
  $('#tk-intro').textContent = c.plano.intro;
  $('#tk-passos').innerHTML = c.plano.passos.map((p) => `<li><span>${p}</span></li>`).join('');

  // detalhamento — mostra o valor que de fato entrou na conta (já com o piso)
  $('#barras').innerHTML = c.criterios
    .map((cr) => {
      const v = calc.notasPiso[cr.id];
      return `<div class="bar">
      <div class="bar-l"><span>${cr.nome}</span><b>${v.toFixed(1).replace('.', ',')}</b></div>
      <div class="bar-t"><div class="bar-f" style="width:${v * 10}%;background:${c.corDe(v, genero)}"></div></div>
    </div>`;
    })
    .join('');

  // Só o que é pro usuário: o que a IA viu e o que faltou nas fotos.
  // Os avisos de calibração (ajuste da IA, piso, teto) são INTERNOS — nunca aqui.
  const pendentes = naoVistos.map((id) => c.criterios.find((cr) => cr.id === id)?.nome).filter(Boolean);
  $('#obs').textContent = [
    saida.observacoes,
    pendentes.length ? `As fotos não mostravam: ${pendentes.join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/* ---------- ações ---------- */

$('#analisar').onclick = async () => {
  if (!prints.length) return aviso('Sobe pelo menos uma foto.', true);

  const c = cfg();
  const botao = $('#analisar');
  botao.disabled = true;
  botao.textContent = 'Analisando…';
  aviso('O Robert está olhando…');

  try {
    const r = await fetch('/api/analisar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imagens: prints.map((p) => ({ tipo: p.tipo, dados: p.dados })),
        rubrica: {
          modo,
          genero,
          criterios: c.criterios.map((cr) => ({
            id: cr.id,
            nome: cr.nome,
            base: cr.base,
            desc: campoDe(cr, 'desc', genero),
            niveis: campoDe(cr, 'niveis', genero),
          })),
          travas: [...c.bloqueios, ...c.travas].map((t) => ({ id: t.id, label: t.label })),
        },
      }),
    });
    // O servidor pode devolver um erro de plataforma em texto puro (ex.: 413 de
    // imagem grande). Lê como texto e só então tenta JSON, pra dar mensagem clara.
    const cru = await r.text();
    let saida;
    try {
      saida = JSON.parse(cru);
    } catch {
      return aviso(
        r.status === 413
          ? 'As fotos ficaram pesadas demais. Tenta com menos fotos de uma vez.'
          : 'O servidor respondeu de um jeito inesperado. Tenta de novo em instantes.',
        true
      );
    }
    if (saida.erro) return aviso(saida.mensagem || 'Falha na leitura.', true);

    const notas = {};
    c.criterios.forEach((cr) => {
      if (typeof saida[cr.id] === 'number') notas[cr.id] = NIVEIS[saida[cr.id]].v;
    });

    aviso('');
    mostrar(calcularNota(c, notas, new Set(saida.travas || []), genero, true), notas, saida);
    $('#res').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    aviso('Erro ao falar com o servidor: ' + e.message, true);
  } finally {
    botao.disabled = false;
    botao.textContent = 'Robert Analisar';
  }
};

$('#copiar').onclick = async (e) => {
  const partes = [$('#txt').textContent];
  const lista = [...document.querySelectorAll('#melhorias li')].map((li) => '• ' + li.textContent.trim());
  if (lista.length) partes.push('SUAS MELHORIAS\n' + lista.join('\n'));
  const passos = [...document.querySelectorAll('#tk-passos li')].map((li, i) => `${i + 1}. ${li.textContent.trim()}`);
  if (passos.length) partes.push($('#tk-titulo').textContent.toUpperCase() + '\n' + passos.join('\n'));

  await navigator.clipboard.writeText(partes.join('\n\n'));
  e.target.textContent = 'Copiado';
  setTimeout(() => (e.target.textContent = 'Copiar análise'), 1400);
};

$('#nova').onclick = () => {
  prints.forEach((p) => URL.revokeObjectURL(p.url));
  prints.length = 0;
  renderThumbs();
  $('#res').classList.remove('on');
  aplicarAcento(corBaseAtual());
  aviso('');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

aplicarModo();
````

## Arquivo: `api/analisar.js`
````javascript
/* ============================================================
   Leitura dos prints pela IA (Gemini) — função serverless.
   Roda na Vercel em /api/analisar e, localmente, é chamada pelo
   server.js. A IA só pontua os critérios; a nota e o texto saem
   do motor calibrado no cliente.
   A chave vem de process.env.GEMINI_API_KEY (var de ambiente na
   Vercel; localmente o server.js carrega do .env).
   ============================================================ */

const MODELO = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const NIVEIS = ['Crítico', 'Fraco', 'Médio', 'Bom', 'Excelente'];

// Schema no dialeto do Gemini (subconjunto do OpenAPI): tipos em maiúsculo e
// enum só em STRING — por isso os níveis vêm por nome, não por índice.
function montarSchema(rubrica) {
  const props = {};
  const obrigatorios = [];

  rubrica.criterios.forEach((c) => {
    props[c.id] = {
      type: 'STRING',
      enum: NIVEIS,
      description: `${c.nome}. ${NIVEIS.map((n, i) => `${n}=${c.niveis[i]}`).join(' | ')}`,
    };
    obrigatorios.push(c.id);
  });

  props.travas = {
    type: 'ARRAY',
    items: { type: 'STRING', enum: rubrica.travas.map((t) => t.id) },
    description: 'Travas visíveis nas fotos: ' + rubrica.travas.map((t) => `${t.id}=${t.label}`).join(' | '),
  };
  props.naoAvaliavel = {
    type: 'ARRAY',
    items: { type: 'STRING', enum: rubrica.criterios.map((c) => c.id) },
    description: 'Critérios que as fotos não permitem avaliar com segurança.',
  };
  props.observacoes = {
    type: 'STRING',
    description: 'Até 3 frases sobre o que você viu nas fotos e sustentou cada pontuação.',
  };
  obrigatorios.push('travas', 'naoAvaliavel', 'observacoes');

  return { type: 'OBJECT', properties: props, required: obrigatorios };
}

function montarPrompt(rubrica) {
  const regua = rubrica.criterios
    .map((c) => `${c.id} — ${c.nome}\n  O que olhar: ${c.desc}\n  Base: ${c.base}\n  Níveis: ${c.niveis.map((n, i) => `${i}=${n}`).join(' | ')}`)
    .join('\n\n');

  const beleza = rubrica.modo === 'beleza';
  const foco = beleza
    ? 'a BELEZA e a imagem da pessoa (rosto, pele, shape, cabelo, feminilidade, produção, estilo e padrão)'
    : 'o PERFIL de Instagram como ativo de negócio (imagem, conteúdo, posicionamento e monetização)';

  return `Você analisa ${foco} pela régua do Robert Resende, empresário brasileiro que ensina imagem, posicionamento e beleza como ferramenta de negócio.

O público é ${rubrica.genero === 'M' ? 'masculino' : 'feminino'} — use a régua abaixo, que já está adaptada.

Sua função é pontuar os critérios olhando as fotos. Você NÃO dá a nota final: o sistema calcula a nota a partir das suas pontuações. Pontue cada critério com o índice do nível que descreve o que você vê.

RÉGUA:

${regua}
${rubrica.travas.length ? `\nTRAVAS (marque só as que você consegue confirmar nas fotos):\n${rubrica.travas.map((t) => `${t.id} — ${t.label}`).join('\n')}\n` : ''}
REGRAS:
- **Na dúvida entre dois níveis, escolha o do meio ("Bom").** É o centro da régua e a resposta certa na maioria dos casos. Só use "Excelente" ou "Crítico" quando a foto não deixar dúvida — os dois extremos são raros.
- Seja consistente: a mesma foto tem que receber sempre a mesma pontuação. Decida pelo que está visível, não por impressão geral.
- Pontue o que você vê, não o que você imagina. Se as fotos não permitem julgar um critério, liste ele em naoAvaliavel e pontue "Bom" como neutro.
- Seja específico nas observações: cite o que na foto sustenta a pontuação.
${
  beleza
    ? '- Esta é uma avaliação de imagem pela régua comercial do Robert (a mesma das enquetes "Linda / Bonita" dele), não um julgamento moral da pessoa. Seja direto e técnico, sem crueldade gratuita.'
    : '- Esta é uma avaliação comercial de imagem de perfil, não um julgamento da pessoa.'
}`;
}

// 429 (cota) e 503 (sobrecarga) são temporários — vale esperar e tentar de novo.
async function chamarComRetry(url, opcoes, tentativas = 3) {
  for (let i = 0; ; i++) {
    const r = await fetch(url, opcoes);
    if (r.ok || (r.status !== 429 && r.status !== 503) || i >= tentativas - 1) return r;
    await new Promise((ok) => setTimeout(ok, 2000 * (i + 1)));
  }
}

async function analisar(corpo) {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) {
    return { erro: 'sem_chave', mensagem: 'A chave do Gemini ainda não foi configurada no servidor.' };
  }

  const partes = corpo.imagens.map((img) => ({ inlineData: { mimeType: img.tipo, data: img.dados } }));
  partes.push({ text: 'Analise estas fotos e pontue os critérios.' });

  const r = await chamarComRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: montarPrompt(corpo.rubrica) }] },
        contents: [{ role: 'user', parts: partes }],
        generationConfig: {
          // Determinismo: sem isso o Gemini usa temperature 1 e a mesma imagem
          // devolve pontuações diferentes a cada leitura.
          temperature: 0,
          topP: 1,
          seed: 42,
          responseMimeType: 'application/json',
          responseSchema: montarSchema(corpo.rubrica),
        },
      }),
    }
  );

  const saida = await r.json();
  if (r.status === 429) {
    return { erro: 'cota', mensagem: 'A cota da chave do Gemini estourou. Espere um minuto e tente de novo.' };
  }
  if (!r.ok) return { erro: 'api', mensagem: saida.error?.message || `Gemini respondeu ${r.status}.` };

  const texto = saida.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) {
    const motivo = saida.candidates?.[0]?.finishReason || saida.promptFeedback?.blockReason;
    return { erro: 'vazio', mensagem: `A IA não devolveu pontuação${motivo ? ` (${motivo})` : ''}.` };
  }

  // Converte os nomes de nível de volta para os índices que o motor usa.
  const bruto = JSON.parse(texto);
  const resultado = { travas: bruto.travas || [], naoAvaliavel: bruto.naoAvaliavel || [], observacoes: bruto.observacoes || '' };
  corpo.rubrica.criterios.forEach((c) => {
    const i = NIVEIS.indexOf(bruto[c.id]);
    if (i >= 0) resultado[c.id] = i;
  });
  return resultado;
}

// Handler da Vercel: /api/analisar
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'metodo', mensagem: 'Use POST.' });
    return;
  }
  try {
    const corpo = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const saida = await analisar(corpo);
    res.status(saida.erro ? 400 : 200).json(saida);
  } catch (e) {
    res.status(500).json({ erro: 'falha', mensagem: e.message });
  }
};

// Reaproveitado pelo server.js local
module.exports.analisar = analisar;

// A imagem em base64 pode ser grande; deixa o corpo até 12 MB.
module.exports.config = { api: { bodyParser: { sizeLimit: '12mb' } } };
````

## Arquivo: `server.js`
````javascript
/* Servidor local — espelha a Vercel: serve public/ e roda /api/analisar.
   Na Vercel isso é automático (public/ = estático, api/ = funções); aqui é só
   pra desenvolver e testar. A chave vem do .env da pasta CLAUDE CODE. */

const http = require('http');
const fs = require('fs');
const path = require('path');

const raiz = __dirname;
const publicDir = path.join(raiz, 'public');
const PORTA = 8777;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

// Local: carrega a chave do .env da pasta CLAUDE CODE. Na Vercel, vem das
// Environment Variables do projeto — este bloco simplesmente não acha o arquivo.
(function carregarEnv() {
  // Procura o .env na pasta do projeto (repo clonado) e, se não achar, na
  // pasta-mãe (setup original na CLAUDE CODE/). Na Vercel nenhum existe — as
  // variáveis vêm das Environment Variables do projeto.
  const arquivo = [path.join(raiz, '.env'), path.join(raiz, '..', '.env')].find((p) => fs.existsSync(p));
  if (!arquivo) return;
  fs.readFileSync(arquivo, 'utf8')
    .split('\n')
    .forEach((linha) => {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
})();

const { analisar } = require('./api/analisar');

http
  .createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/analisar') {
      let corpo = '';
      req.on('data', (c) => (corpo += c));
      req.on('end', async () => {
        try {
          const saida = await analisar(JSON.parse(corpo));
          res.writeHead(saida.erro ? 400 : 200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(saida));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ erro: 'falha', mensagem: e.message }));
        }
      });
      return;
    }

    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel === '/') rel = '/index.html';
    const arquivo = path.join(publicDir, rel);
    if (!arquivo.startsWith(publicDir)) return res.writeHead(403).end();
    fs.readFile(arquivo, (err, buf) => {
      if (err) return res.writeHead(404).end('404');
      res.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo)] || 'application/octet-stream' });
      res.end(buf);
    });
  })
  .listen(PORTA, '127.0.0.1', () => {
    console.log(`Análise de Perfil em http://localhost:${PORTA}`);
    console.log(process.env.GEMINI_API_KEY ? `Leitura por IA: ativa (${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}).` : 'Leitura por IA: GEMINI_API_KEY não encontrada.');
  });
````

## Arquivo: `vercel.json`
````json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "buildCommand": null,
  "installCommand": null,
  "outputDirectory": "public",
  "functions": { "api/analisar.js": { "maxDuration": 60 } }
}
````

## Arquivo: `package.json`
````json
{
  "name": "analise-perfil",
  "version": "1.0.0",
  "private": true,
  "engines": { "node": "22.x" }
}
````

## Arquivo: `.env.example`
````bash
# Chave da API do Google Gemini — pegue em https://aistudio.google.com/apikey
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
````

## Arquivo: `.gitignore`
````text
node_modules
.env
.env.*
!.env.example
.vercel
.DS_Store
````

## Arquivo: `.vercelignore`
````text
node_modules
*.md
server.js
.env
.env.*
````

---

*Documento gerado em 2026-09-17 a partir do repositório `analise-robert`. Código lido diretamente dos arquivos-fonte.*
