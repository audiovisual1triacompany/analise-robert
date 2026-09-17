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
