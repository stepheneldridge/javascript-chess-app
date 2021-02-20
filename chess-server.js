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
    res.end("There is no API yet");
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


class Game{
    constructor(white, black){
        this.white = white;
        this.black = black;
        this.white.socket.emit("matched", "white");
        this.black.socket.emit("matched", "black");
    }
}

class Matcher{
    constructor(){
        this.waiting = [];
        this.matches = {};
    }

    addWaiting(sid, socket){
        socket.emit("waiting", this.waiting.length);
        this.waiting.push({"id": sid, "socket": socket});
        this.tryPairing();
    }

    tryPairing(){
        if(this.waiting.length >= 2){
            let clients = this.waiting.splice(0, 2);
            let game = new Game(clients[0], clients[1]);
            this.matches[clients[0].id] = game;
            this.matches[clients[1].id] = game;
        }
    }
}

let matcher = new Matcher();
io.on("connection", socket => {
    // socket.emit("p", "hello");
    matcher.addWaiting(socket.id, socket);
    socket.on("response", data => {
        console.log(data);
    })
});