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
