const http = require('http');
const path = require('path');
const fs = require('fs/promises');
const mime = require('mime-types');

const landing = "/chess.html";

const server = http.createServer((req, res) => {
    console.log(req.socket.localAddress + ":" + req.host + " => " + req.url);
    const f = await fs.readdir(".");
    console.log(f)
    if(req.url.startsWith("/api")){

    }else{
        let filepath = "/front";
        if(req.url == "/"){
            filepath += landing;
        }else{
            filepath += req.url;
        }
        fs.readFile(path.resolve(filepath), (err, data) => {
            if(err)throw err;
            let type = mime.lookup(filename);
            if(!type)throw new Error("No mime type for file");
            res.writeHead(200, {"Content-Type": type});
            res.write(data);
            res.end();
        }).catch(err => {
            console.log(err)
            res.writeHead(404);
            if(typeof err == "object"){
                res.write(err.message);
            }else{
                res.write(err);
            }
            res.end();
        });
    }
    
});
server.listen(process.env.PORT || 8080);