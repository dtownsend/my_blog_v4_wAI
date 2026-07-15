import { createServer } from 'node:http';

const server = createServer((req, res) => {
  if (req.method === 'GET') {                 // health check for webServer readiness
    res.writeHead(200); res.end('fake beehiiv up'); return;
  }
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    const { email = '' } = JSON.parse(body || '{}');
    const json = (status, payload) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    };
    if (email.includes('dupe')) return json(409, { message: 'already exists' });
    if (email.includes('boom')) return json(500, { message: 'beehiiv is down' });
    return json(201, { data: { id: 'sub_fake', email } });   // success
  });
});

server.listen(4000, () => console.log('fake beehiiv on http://localhost:4000'));
