const express = require('express');
const session = require('express-session');
const uuid = require('uuid').v4;

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

const server = express();

server.enable("trust proxy");
server.use(session({
    "genid": req => {
        return uuid();
    },
    "secret": process.env.COOKIE_SECRET,
    "resave": false,
    "saveUninitialized": true,
    "cookie": {"secure": true}
}));

server.get(/\/[^\/]+/, (req, res) => {
    if(DEBUG_MODE)console.log(req.method + " => " + req.url);
    let url = new URL(req.url, `http://${req.headers.host}`);
    let filepath = "./front";
    if(url.pathname == "/"){
        filepath += landing;
    }else{
        filepath += url.pathname;
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
});

server.get("/api/*", (req, res) => {
    req.write(200, "api wins");
    req.end();
});
// const server = http.createServer((req, res) => {
//     if(DEBUG_MODE)console.log(req.method + " => " + req.url);
//     let url = new URL(req.url, `http://${req.headers.host}`);
//     if(url.pathname.startsWith("/api")){
//         res.end("API")
//     }else{
//         let filepath = "./front";
//         if(url.pathname == "/"){
//             filepath += landing;
//         }else{
//             filepath += url.pathname;
//         }
//         fs.readFile(filepath).then((data) => {
//             let type = mime.lookup(filepath);
//             if(!type)return write_error(res, 403, "No mime type for file");
//             res.writeHead(200, {"Content-Type": type});
//             res.write(data);
//             res.end();
//         }).catch(err => {
//             write_error(res, 404, err)
//         });
//     }
// });
server.listen(process.env.PORT || 8080);