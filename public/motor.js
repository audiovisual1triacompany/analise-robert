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
