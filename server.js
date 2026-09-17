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
