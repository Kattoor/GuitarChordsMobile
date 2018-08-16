const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
    if (req.url === '/')
        handleRoot(req, res);
    else
        handleStatic(req, res);
}).listen(8080);

function handleRoot(req, res) {
    switch (req.method) {
        case 'GET':
            res.write(fs.readFileSync('./index.html'));
            res.end();
            break;
    }
}

function handleStatic(req, res) {
    if (req.url.endsWith('.js'))
        res.writeHead(200, {'Content-Type': 'application/javascript'});
    else if (req.url.endsWith('.css'))
        res.writeHead(200, {'Content-Type': 'text/css'});
    res.end(fs.readFileSync('./' + req.url.slice(1)));
}
