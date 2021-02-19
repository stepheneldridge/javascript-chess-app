const http = require('http');
const path = require('path');
const fs = require('fs/promises');
const mime = require('mime-types');

const landing = "/chess.html";

const DEBUG_MODE = true;

function write_error(res, code, error){
    if(DEBUG_MODE){
        console.log(error);
    }
    res.writeHead(code);
    if(typeof error == "object"){
        res.end(error.message);
    }else{
        res.end(error);
    }
}

const server = http.createServer((req, res) => {
    if(DEBUG_MODE)console.log(req.socket.localAddress + " : " + req.method + " => " + req.url);
    if(req.url.startsWith("/api")){

    }else{
        let filepath = "./front";
        if(req.url == "/"){
            filepath += landing;
        }else{
            filepath += req.url;
        }
        fs.readFile(filepath).then((data) => {
            let type = mime.lookup(filepath);
            if(!type)return write_error(res, 403, "No mime type for file");
            res.writeHead(200, {"Content-Type": type});
            res.write(data);
            res.end();
        }).catch(err => {
            write_error(res, 404, err)
        });
    }
    
});
server.listen(process.env.PORT || 8080);