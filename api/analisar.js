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
