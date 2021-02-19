const http = require('http');
const hostname = 'localhost';
const port = 8080;

const server = http.createServer((req, res) => {
    console.log(req)
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end("Test");
});
server.listen()
// server.listen(port, hostname, () => {
//     console.log(`Server running @ ${hostname}:${port}`);
// })