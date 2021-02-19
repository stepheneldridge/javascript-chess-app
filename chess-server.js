const http = require('http');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const landing = "/chess.html";

const server = http.createServer((req, res) => {
    console.log(req.socket.localAddress + ":" + req.host + " => " + req.path)
    if(req.path.startsWith("/api")){

    }else{
        let filename = "/front";
        if(req.path == "/"){
            filename += landing;
        }else{
            filename += req.path;
        }
        fs.createReadStream(filename).pipe(res);
        fs.readFile(filename, (err, data) => {
            if(err)throw err;
            let type = mime.lookup(filename);
            if(!type)throw new Error("No mime type for file");
            res.writeHead(200, {"Content-Type": type});
            res.write(data);
        }).catch(err => {
            res.writeHead(404);
            if(typeof err == "object"){
                res.write(err.message);
            }else{
                res.write(err);
            }
        });
    }
    res.end();
});
server.listen(process.env.PORT || 8080);