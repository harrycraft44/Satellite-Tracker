const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'satellites.ndjson');
const front_end = path.join(__dirname, 'front/');
http.createServer((req, res) => {
    if (req.url === '/satellites') {
        res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
        fs.createReadStream(DATA_FILE).pipe(res);
    } else if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        fs.createReadStream(path.join(front_end, 'index.html')).pipe(res);
    } else if (req.url.endsWith('.js')) {
        const filePath = path.join(front_end, req.url.replace(/^\//, ''));
        res.writeHead(200, {'Content-Type': 'application/javascript'});
        fs.createReadStream(filePath).pipe(res);
    } else if (req.url.endsWith('.png')) {
        const filePath = path.join(front_end, req.url.replace(/^\//, ''));
        res.writeHead(200, {'Content-Type': 'image/png'});
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
}).listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
