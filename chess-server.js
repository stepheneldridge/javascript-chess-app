const http = require('http');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log(req)
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end("Test");
});
server.listen(process.env.PORT)
// server.listen(port, hostname, () => {
//     console.log(`Server running @ ${hostname}:${port}`);
// })