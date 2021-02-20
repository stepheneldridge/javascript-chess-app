const express = require('express');
const session = require('express-session');
const uuid = require('uuid').v4;
const http = require('http');
const socketio = require('socket.io');
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

const app = express();
const server = http.createServer(app);
const io = socketio(server);


app.enable("trust proxy");
app.use(session({
    "genid": req => {
        return uuid();
    },
    "secret": process.env.COOKIE_SECRET,
    "resave": true,
    "saveUninitialized": true,
    "cookie": {"secure": true}
}));

app.use("/static", express.static("./node_modules"));

app.get("/api/*", (req, res) => {
    res.end("api wins");
});

app.get("/*", (req, res) => {
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

server.listen(process.env.PORT || 8080);

io.on("connection", socket => {
    socket.emit("ping", "hello");
    socket.on("response", data => {
        console.log(data);
    })
});

class Game{
    constructor(white, black){
        this.white = white;
        this.black = black;
    }
}

class Matcher{
    constructor(){
        this.waiting = [];
        this.matches = {};
    }

    addWaiting(sid){
        this.waiting.push(sid);
    }

    tryPairing(){
        if(this.waiting.length >= 2){

        }
    }
}