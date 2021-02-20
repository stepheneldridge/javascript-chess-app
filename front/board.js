let canvas;
let context;
let board;
let socket;
let settings;
function set_socket_listeners(){
    socket = io();
    socket.on("waiting", data => {
        console.log("Queue length: " + data);
        // socket.emit("response", "huh");
    });
    socket.on("matched", data => {
        console.log("matched, you are " + data)
        board = new Board(1000, 1000, data);
        board.load_variant(settings);
        board.start_game();
    });
    socket.on("moved", data => {
        board.perform_move(data);
    })
}

function notify_move(move){
    socket.emit("move", move);
}

function init(){
    set_socket_listeners();
    canvas = document.createElement("canvas");
    context = canvas.getContext("2d");
    document.body.appendChild(canvas);
    canvas.width = 1000;
    canvas.height = 1000;
    board = new Board(1000, 1000, "white");
    settings = {
        "grid": {
            "x": 8,
            "y": 8,
            "checkered": true,
            "colors": ["#f0d9b5", "#b58863"]
        },
        "rules": {
            "draws": {//no insuf mat
                "timer": {"ply": 100, "reset_pieces": ["pawn"]},
                "repeats": 3,
                "stalemate": true//maybe independent?
            },
            "wins": {
                "checkmate": { //if white is true, then white can be checkmated by black
                    "white": true,
                    "black": true
                }
            }
        },
        "pieces": {
            "pawn": Piece.PAWN,
            "rook": Piece.ROOK,
            "knight": Piece.KNIGHT,
            "bishop": Piece.BISHOP,
            "queen": Piece.QUEEN,
            "king": Piece.KING
        },
        "layout": {
            "white": {
                "pawn": [[0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6]],
                "rook": [[0, 7], [7, 7]],
                "knight": [[1, 7], [6, 7]],
                "bishop": [[2, 7], [5, 7]],
                "queen": [[3, 7]],
                "king": [[4, 7]]
            },
            "black": {
                "pawn": [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1]],
                "rook": [[0, 0], [7, 0]],
                "knight": [[1, 0], [6, 0]],
                "bishop": [[2, 0], [5, 0]],
                "queen": [[3, 0]],
                "king": [[4, 0]]
            }
        }
    }
    //horde
    // Piece.PAWN.moves[3].pieces.push("npawn");
    // let new_pawn = JSON.parse(JSON.stringify(Piece.PAWN));
    // new_pawn.id = "npawn";
    // new_pawn.moves.splice(2, 1);
    // settings = {
    //     "grid": {
    //         "x": 8,
    //         "y": 8,
    //         "checkered": true,
    //         "colors": ["#f0d9b5", "#b58863"]
    //     },
    //     "rules": {
    //         "draws": {//no insuf mat
    //             "timer": {"ply": 100, "reset_pieces": ["pawn"]},
    //             "repeats": 3,
    //             "stalemate": true//maybe independent?
    //         },
    //         "wins": {
    //             "checkmate": { //if white is true, then white can be checkmated by black
    //                 "white": false,
    //                 "black": true
    //             }
    //         }
    //     },
    //     "pieces": {
    //         "npawn": new_pawn,
    //         "pawn": Piece.PAWN,
    //         "rook": Piece.ROOK,
    //         "knight": Piece.KNIGHT,
    //         "bishop": Piece.BISHOP,
    //         "queen": Piece.QUEEN,
    //         "king": Piece.KING
    //     },
    //     "layout": {
    //         "white": {
    //             "npawn": [
    //                 [1, 3], [2, 3], [5, 3], [6, 3],
    //                 [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4],
    //                 [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5],
    //             ],
    //             "pawn": [
    //                 [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6],
    //                 [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7],
    //             ]
    //         },
    //         "black": {
    //             "pawn": [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1]],
    //             "rook": [[0, 0], [7, 0]],
    //             "knight": [[1, 0], [6, 0]],
    //             "bishop": [[2, 0], [5, 0]],
    //             "queen": [[3, 0]],
    //             "king": [[4, 0]]
    //         }
    //     }
    // }
    board.load_variant(settings);
    board.start_game();
    canvas.oncontextmenu = function(event){
        return false;
    }
    var events = ["onmousedown", "onmouseup", "onmousemove"];
    //  "ontouchstart", "ontouchend", "ontouchmove" later
    for(let i of events){
        canvas[i] = mouse_handler;
    }
    board.draw(context);
}

function mouse_handler(event){ //needs drawing requests
    board.mouse_events(event)
    board.draw(context);
}

class PromotionWindow{
    constructor(x, y, p, b){
        this.x = x;
        this.y = y;
        this.piece = p;
        this.board = b;
        this.promotions = this.piece.get_promotions();
        this.window_x = (this.board.tiles_x - this.promotions.length) / 2;
        this.window_y = this.board.tiles_y / 2 - 0.5;
        this.active = null;
    }

    mouse_events(event){
        let type = event.type;
        let btn = event.button;
        this.mouse_x = event.offsetX;
        this.mouse_y = event.offsetY;
        if(btn != 0)return;
        let tile_index = Math.floor(this.mouse_x / this.board.size_x - this.window_x);
        let y_frame = this.mouse_y / this.board.size_y - this.window_y;
        this.active = null;
        if(tile_index < 0 || tile_index >= this.promotions.length || y_frame < 0 || y_frame >= 1)return;
        this.active = tile_index;
        if(type == "mousedown"){
            this.board.do_promotion(this.x, this.y, this.promotions[this.active]);
        }
    }

    draw(ctx){
        ctx.fillStyle = "black";
        ctx.globalAlpha = 0.4;
        ctx.fillRect(0, 0, this.board.width, this.board.height);
        ctx.globalAlpha = 1;
        let color = this.piece.color;
        let border = 20;
        ctx.fillStyle = "lightgrey";
        ctx.fillRect(this.window_x * this.board.size_x - border, this.window_y * this.board.size_y - border, this.board.size_x * this.promotions.length + 2 * border, this.board.size_y + 2 * border);
        if(this.active != null){
            ctx.fillStyle = "green";
            ctx.globalAlpha = 0.2;
            ctx.fillRect((this.window_x + this.active) * this.board.size_x, this.window_y * this.board.size_y, this.board.size_x, this.board.size_y);
            ctx.globalAlpha = 1;
        }
        for(let i = 0; i < this.promotions.length; i++){
            Piece.draw_piece(ctx, this.window_x + i, this.window_y, this.board.size_x, this.board.size_y, color, this.promotions[i].icon[color]);
        }
    }
}

class EndWindow{
    constructor(result, board){
        this.result = result;
        this.board = board;
        if(this.result == "draw"){
            this.message = "Draw";
        }else{
            this.message = this.result.charAt(0).toUpperCase() + this.result.slice(1) + " Wins";
        }
    }

    mouse_events(event){

    }

    draw(ctx){
        ctx.fillStyle = "black";
        ctx.globalAlpha = 0.4;
        ctx.fillRect(0, 0, this.board.width, this.board.height);
        ctx.globalAlpha = 1;
        if(this.result == "draw"){
            ctx.fillStyle = "grey";
        }else{
            ctx.fillStyle = this.result;
        }
        let size = this.board.height / 10;
        ctx.font = size + "px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.message, this.board.width / 2, this.board.height / 2);
    }
}

class Board{
    constructor(w, h, view){
        this.width = w;
        this.height = h;
        this.mouse_x = 0;
        this.mouse_y = 0;
        this.view = view;
    }

    start_game(){
        this.annotations = [];
        this.selected_piece = null;
        this.ply = 1;
        this.turn = "white";
        this.move_history = [];
        this.pockets = {
            "white": [],
            "black": []
        }
        this.checks = {
            "white": false,
            "black": false
        }
        //needs to clear board
        let colors = ["white", "black"];
        for(let color of colors){
            for(let p in this.layout[color]){
                for(let coord of this.layout[color][p]){
                    this.set_tile(coord[0], coord[1], new Piece(this.pieces[p], color));
                }
            }
        }
        if(this.draw_timer){
            this.draw_timer.last_reset = 0;
        }
        if(this.draw_repeats){
            this.draw_repeats.previous = [board.hash_position()];
        }
    }

    load_variant(settings){
        this.set_grid(settings.grid.x, settings.grid.y);
        this.checkered = settings.grid.checkered ? true : false;
        this.check_colors = settings.grid.colors;
        let draws = settings.rules.draws;
        if(draws){
            if(draws.timer){
                this.set_draw_time(draws.timer.ply, draws.timer.reset_pieces);
            }
            if(draws.repeats){
                this.set_draw_repeats(draws.repeats);
            }
            this.stalemate = draws.stalemate ? true : false;
        }
        this.checkmate = settings.rules.wins.checkmate;
        this.piece_types = [];
        this.piece_index = [];
        this.pieces = settings.pieces; //switch everything to this
        for(let i in settings.pieces){
            this.piece_index.push(i);
            this.piece_types.push(settings.pieces[i]);
        }
        this.layout = settings.layout;
    }

    import_fen(fen){
        this.start_game();
        this.set_grid(this.tiles_x, this.tiles_y);
        let piece_map = {};
        for(let i in this.pieces){
            piece_map[this.pieces[i].icon.fen] = this.pieces[i];
        }
        let parts = fen.split(" ");
        let y = 0;
        for(let row of parts[0].split("/")){
            let x = 0;
            let skip = 0;
            for(let i of row){
                if("1234567890".includes(i)){
                    skip = skip * 10 + parseInt(i);
                }else{
                    x += Math.max(0, skip - 1);
                    skip = 0;
                    let white = i == i.toUpperCase();
                    this.set_tile(x, y, new Piece(piece_map[i.toLowerCase()], white ? "white" : "black"));
                }
                x += 1;
            }
            y += 1;
        }
        this.turn = parts[1] == "w" ? "white" : "black";
        for(let x of this.tiles){
            for(let y of x){
                if(y != null && y.get_tags().includes("castle")){
                    y.has_moved = true;
                }
            }
        }
        let bk = this.find_king("black");
        if(bk != null){
            if(parts[2].includes("k")){
                for(let i = bk[0]; i < this.tiles_x; i++){
                    let t = this.get_tile(i, bk[1]);
                    if(t != null && t.get_tags().includes("castle")){
                        t.has_moved = false;
                    }
                }
            }
            if(parts[2].includes("q")){
                for(let i = bk[0]; i >= 0; i--){
                    let t = this.get_tile(i, bk[1]);
                    if(t != null && t.get_tags().includes("castle")){
                        t.has_moved = false;
                    }
                }
            }
        }
        let wk = this.find_king("white");
        if(wk != null){
            if(parts[2].includes("K")){
                for(let i = wk[0]; i < this.tiles_x; i++){
                    let t = this.get_tile(i, wk[1]);
                    if(t != null && t.get_tags().includes("castle")){
                        t.has_moved = false;
                    }
                }
            }
            if(parts[2].includes("Q")){
                for(let i = wk[0]; i >= 0; i--){
                    let t = this.get_tile(i, wk[1]);
                    if(t != null && t.get_tags().includes("castle")){
                        t.has_moved = false;
                    }
                }
            }
        }
        if(parts[3] != "-"){
            let rank = 0;
            let file = 0;
            for(let i of parts[3]){
                if("1234567890".includes(i)){
                    rank = rank * 10 + parseInt(i);
                }else{
                    file = Math.ceil(file / 26) * 26 + i.charCodeAt(0) - 96;
                }
            }
            file -= 1;
            let offset = this.turn == "white" ? -1 : 1;
            this.move_history.push({
                "from": [file, this.tiles_y - (rank - offset)], //far away ig
                "to": [file, this.tiles_y - (rank + offset)],
                "piece_id": this.get_tile(file, this.tiles_y - (rank + offset)).id,
                "data": {"first_move": true}
            })
        }
        if(this.draw_timer){
            this.draw_timer.last_reset = parseInt(parts[4]);
        }
        this.ply = 2 * parseInt(parts[5]) - (this.turn == "white");
    }

    export_fen(){
        let piece_map = {};
        for(let i in this.pieces){
            piece_map[this.pieces[i].id] = this.pieces[i].icon.fen;
        }
        let fen = "";
        for(let y = 0; y < this.tiles_y; y++){
            let skip = 0;
            for(let x = 0; x < this.tiles_x; x++){
                let t = this.get_tile(x, y);
                if(t == null){
                    skip += 1;
                }else{
                    if(skip > 0){
                        fen += skip;
                    }
                    fen += t.color == "white" ? piece_map[t.id].toUpperCase() : piece_map[t.id];
                    skip = 0;
                }
            }
            if(skip > 0){
                fen += skip;
            }
            if(y != this.tiles_y - 1){
                fen += "/"
            }
        }
        if(this.turn == "white"){
            fen += " w ";
        }else{
            fen += " b ";
        }
        let wk = this.find_king("white");
        let bk = this.find_king("black");
        let castles = "";
        if(wk != null && !wk[2].has_moved){
            for(let i = wk[0]; i < this.tiles_x; i++){
                let t = this.get_tile(i, wk[1]);
                if(t != null && t.get_tags().includes("castle") && !t.has_moved){
                    castles += "K";
                    break;
                }
            }
            for(let i = wk[0]; i >= 0; i--){
                let t = this.get_tile(i, wk[1]);
                if(t != null && t.get_tags().includes("castle") && !t.has_moved){
                    castles += "Q";
                    break;
                }
            }
        }
        if(bk != null && !bk[2].has_moved){
            for(let i = bk[0]; i < this.tiles_x; i++){
                let t = this.get_tile(i, bk[1]);
                if(t != null && t.get_tags().includes("castle") && !t.has_moved){
                    castles += "k";
                    break;
                }
            }
            for(let i = bk[0]; i >= 0; i--){
                let t = this.get_tile(i, bk[1]);
                if(t != null && t.get_tags().includes("castle") && !t.has_moved){
                    castles += "q";
                    break;
                }
            }
        }
        if(castles == ""){
            fen += "- "
        }else{
            fen += castles + " ";
        }
        let enpassant = "-";
        let last_move = this.move_history[this.move_history.length - 1];
        if(last_move){
            let t = this.get_tile(...last_move.to);
            let coords = [[last_move.to[0] + 1, last_move.to[1]], [last_move.to[0] - 1, last_move.to[1]]];
            for(let c of coords){
                let n = this.get_tile(...c);
                if(!n)continue;
                let moves = this.get_valid_moves(...c, n.get_moves());
                for(let i of moves){
                    if(i.length > 2){
                        if(i[2].enpassant && this.array_equal(i[2].enpassant, last_move.to)){
                            enpassant = this.coordinate_label(i[0], i[1]);
                        }
                    }
                }
            }
        }
        fen += enpassant + " ";
        if(this.draw_timer){
            fen += this.draw_timer.last_reset;
        }else{
            fen += 0;
        }
        fen += " ";
        fen += Math.ceil(this.ply / 2);
        return fen;
    }

    get_last_move(as_string){
        let last = this.move_history[this.move_history.length - 1];
        if(!last)return;
        if(as_string){
            return this.coordinate_label(...last.from) + this.coordinate_label(...last.to);
        }else{
            return last;
        }
    }

    perform_move(data){
        let move;
        if(typeof data == "string"){
            // move =  set later
        }else if(typeof data == "object"){
            move = data;
        }
        if(!move.to || !move.from)return false;
        let t = move.piece;
        if(!t){
            t = this.get_tile(...move.from);
        }
        if(!t)return false;
        if(t.color != this.turn)return false;
        let moves = move.moves;
        if(!moves){
            moves = this.get_valid_moves(...move.from, t.get_moves());
        }
        //needs to handle chosen promotions too
        if(this.has_array(moves, move.to)){
            let could_move = this.move_tile(...move.to, ...move.from, t, moves);
            if(!could_move)return false;
            this.turn = this.turn == "white" ? "black" : "white";
            this.ply += 1;
            for(let c in this.checks){
                if(!this.get_checkmate(c))continue;
                let k = this.find_king(c);
                if(k != null){
                    this.checks[c] = this.is_attacked(k[0], k[1]);
                }else{
                    this.checks[c] = false;
                }

            }
            let can_move = this.has_moves(this.turn);
            if(!can_move){ //checkmate and stalemate
                let in_check = this.checks[this.turn];
                let result = !this.checks[this.turn] ? "draw" : this.turn == "white" ? "black" : "white";
                if(in_check){
                    if(this.get_checkmate(this.turn)){
                        result = this.turn == "white" ? "black" : "white";
                    }else{
                        result = "draw";
                    }
                }
                if(!in_check){
                    if(this.stalemate){
                        result = "draw";
                    }else{
                        result = this.turn == "white" ? "black" : "white";
                    }
                }
                if(!this.has_pieces(this.turn)){ //default win if everything is captured
                    result = this.turn == "white" ? "black" : "white";
                }
                this.end_window = new EndWindow(result, this);
            }
            if(this.check_draws()){
                this.end_window = new EndWindow("draw", this);
            }
            return true;
        }
        return false;
    }

    clear_annotations(){
        this.annotations = [];
        this.active_annotation = null;
    }

    set_draw_time(time, reset_pieces){
        if(time <= 0){
            delete this.draw_timer;
            return;
        }
        this.draw_timer = {
            "time": time,
            "reset_pieces": reset_pieces,
            "last_reset": 0
        };
    }

    set_draw_repeats(r){
        if(r <= 0){
            delete this.draw_repeats;
            return;
        }
        this.draw_repeats = {
            "repeats": r,
            "previous": []
        }
    }

    get_checkmate(color){
        if(this.checkmate){
            return this.checkmate[color];
        }
        return false;
    }
    //tags jump noncapture captureonly first blocked repeat king selfcapture
    get_valid_moves(x, y, movements, ignore, walls, override){
        let valid = []
        let self;
        if(override){
            self = override;
        }else{
            self = this.get_tile(x, y);
        }
        if(!ignore)ignore = [[]];
        if(!walls)walls = [[]];
        let dir = self.color == "white" ? -1 : 1;
        for(let i of movements){
            let tags = i.tags;
            let moves = i.moves;
            if(tags.includes("blocked")){
                let blocker = [x + i.by[0], y + i.by[1] * dir];
                if(this.has_array(ignore, blocker)){

                }else if(this.get_tile(...blocker) != null){
                    continue;
                }
            }
            if(tags.includes("first") && self.has_moved)continue;
            if(tags.includes("jump")){
                for(let c of moves){
                    let coord = [x + c[0], y + c[1] * dir]
                    if(this.is_inside(...coord)){
                        let t = this.get_tile(...coord);
                        if(this.has_array(ignore, coord)){
                            t = null;
                        }
                        if(t == null){
                            if(tags.includes("captureonly"))continue;
                            valid.push(coord);
                        }else{
                            if(this.has_array(walls, coord))continue; //does this make sense?
                            if(tags.includes("noncapture"))continue;
                            if((tags.includes("selfcapture") && t.color == self.color) || self.color != t.color){
                                valid.push([...coord, {"selfcapture": tags.includes("selfcapture")}]);
                            }
                        }
                    }
                }
            }else if(tags.includes("repeat")){
                for(let v of moves){
                    let coord = [x + v[0], y + v[1] * dir];
                    while(this.is_inside(...coord)){
                        if(this.has_array(walls, coord))break;
                        let t = this.get_tile(...coord);
                        if(this.has_array(ignore, coord)){
                            t = null;
                        }
                        if(t == null){
                            if(tags.includes("captureonly"))continue;
                        }else{
                            if(tags.includes("noncapture"))break;
                            if((tags.includes("selfcapture") && t.color == self.color) || self.color != t.color){
                                valid.push([...coord, {"selfcapture": tags.includes("selfcapture")}]);
                            }
                            break;
                        }
                        valid.push(coord);
                        coord = [coord[0] + v[0], coord[1] + v[1] * dir];
                    }
                }
            }else if(tags.includes("castle")){ //interpretation of chess960 is incorrect (ends on normal chess castle)
                if(self.has_moved)continue;
                if(this.checks[self.color] && this.get_checkmate(self.color))continue;
                for(let v of moves){
                    let coord = [x + v[0], y + v[1] * dir];
                    while(this.is_inside(...coord)){
                        let t = this.get_tile(...coord);
                        if(this.has_array(ignore, coord)){
                            t = null;
                        }
                        if(t != null){
                            if(t.get_tags().includes("castle") && !t.has_moved){
                                let through_check = false;
                                if(!override && this.get_checkmate(self.color)){
                                    for(let s = 0; s < i.distance; s++){
                                        let temp = [x + v[0] * s, y + v[1] * dir * s]
                                        if(this.is_attacked(...temp, [[x, y]], [[]], self)){
                                            through_check = true
                                            break;
                                        }
                                    }
                                }
                                if(through_check)break;
                                let dest = [x + v[0] * i.distance, y + v[1] * dir * i.distance]
                                valid.push([dest[0], dest[1], {"castle":{"orig": coord, "dest": [dest[0] - v[0], dest[1] - v[1] * dir]}}]);
                            }
                            break;
                        }
                        coord = [coord[0] + v[0], coord[1] + v[1] * dir];
                    }
                }
            }else if(tags.includes("enpassant") && !override){ //since only pawns can do this
                let last_move = this.move_history[this.move_history.length - 1];
                if(!last_move)break;
                for(let v = 0; v < moves.length; v++){
                    let dest_coord = [x + moves[v][0], y + moves[v][1] * dir];
                    let dest = this.get_tile(...dest_coord);
                    let cap_coord = [x + i.captures[v][0], y + i.captures[v][1] * dir];
                    let cap = this.get_tile(...cap_coord);
                    if(this.has_array(ignore, cap_coord) || this.has_array(walls, cap_coord) || this.has_array(walls, dest_coord))continue;
                    if(this.has_array(ignore, dest_coord)){
                        dest = null;
                    }
                    if(cap && !dest){
                        if(cap.color == self.color && !tags.includes("selfcapture"))continue;
                        if(this.array_equal(last_move.to, cap_coord) && i.pieces.includes(last_move.piece_id) && last_move.data.first_move){
                            let dist = Math.abs(last_move.to[1] - last_move.from[1]); //this is dumb
                            if(dist > 1){
                                valid.push([dest_coord[0], dest_coord[1], {"enpassant": cap_coord}]);
                            }
                        }
                    }
                }
            }
        }
        if(this.get_checkmate(self.color)){
            if(self.get_tags().includes("king") && !override){
                let unchecked = []
                for(let i of valid){
                    if(!this.is_attacked(i[0], i[1], [[x, y]], [[]], self)){
                        unchecked.push(i);
                    }
                }
                valid = unchecked;
            }else if(!override){
                let unchecked = [];
                let k = this.find_king(self.color);
                if(k){
                    for(let i of valid){
                        if(!this.is_attacked(k[0], k[1], [[x, y]], [i], k[2])){
                            unchecked.push(i);
                        }
                    }
                    valid = unchecked;
                }
            }
        }
        return valid;
    }

    //issue with pieces that can attack with a blockable jump, chinese knight
    is_attacked(x, y, ignore, walls, override){
        let moves = []
        let self = this.get_tile(x, y);
        if(override){
            self = override;
        }
        if(!ignore){
            ignore = [[]];
        }
        if(!walls){
            walls = [[]];
        }
        for(let i of this.piece_types){
            let c = this.get_valid_moves(x, y, i.moves, ignore, walls, self);
            for(let j of c){
                let t = this.get_tile(...j);
                if(t != null && t.id == i.id && t.color != self.color){
                    moves.push(j);
                }
            }
        }
        return moves.length > 0;
    }

    has_pieces(color){
        for(let i = 0; i < this.tiles.length; i++){
            for(let j = 0; j < this.tiles[i].length; j++){
                let t = this.tiles[i][j];
                if(t == null)continue;
                if(t.color == color){
                    return true;
                }
            }
        }
        return false;
    }

    has_moves(color){
        for(let i = 0; i < this.tiles.length; i++){
            for(let j = 0; j < this.tiles[i].length; j++){
                let t = this.get_tile(i, j);
                if(t == null)continue;
                if(t.color == color){
                    if(this.get_valid_moves(i, j, t.get_moves()).length > 0){
                        return true;
                    }
                }
            }
        }
        return false;
    }

    find_king(color){
        for(let x = 0; x < this.tiles.length; x++){
            for(let y = 0; y < this.tiles[x].length; y++){
                let t = this.get_tile(x, y);
                if(t != null && t.get_tags().includes("king") && t.color == color)return [x, y, t];
            }
        }
        return null;
    }

    check_draws(){
        if(this.draw_timer){ // 50 move rule
            let last = this.move_history[this.move_history.length - 1];
            if(this.draw_timer.reset_pieces.includes(last.piece_id) || last.data.capture){
                this.draw_timer.last_reset = 0;
            }else{
                this.draw_timer.last_reset += 1;
            }
            if(this.draw_timer.time == this.draw_timer.last_reset){
                return true;
            }
        }
        if(this.draw_repeats){
            let new_hash = this.hash_position(); //dict with count of each is faster
            let count = this.draw_repeats.previous.reduce(
                function(a, v){
                    return v == new_hash ? a + 1 : a
                }, 1
            )
            if(count >= this.draw_repeats.repeats){
                return true;
            }
            this.draw_repeats.previous.push(new_hash);
        }
        return false;
    }

    coordinate_label(x, y){
        return this.file_label(x) + (this.tiles_y - y);
    }

    file_label(x){
        let r = x / 26;
        let file = "";
        for(let i = 0; i <= r; i++){
            file += String.fromCharCode(x % 26 + 97);
        }
        return file;
    }

    hash_position(){
        let hash = "";
        for(let i = 0; i < this.tiles.length; i++){
            for(let j = 0; j < this.tiles[i].length; j++){
                let p = this.tiles[i][j]; //this should be fine
                if(p != null){
                    hash += "#" + this.piece_index.indexOf(p.id) + ":" + (i * this.tiles_y + j);
                }
            }
        }
        hash += "|" + (this.turn == "white" ? 0 : 1);
        return hash;
    }

    select(x, y){
        let tile = this.get_tile(x, y);
        if(tile != null){
            if(tile.color != this.turn || this.view != tile.color)return false;
            let valid = this.get_valid_moves(x, y, tile.get_moves());
            this.selected_piece = [x, y, tile, valid];
            this.selected_piece[2].is_drag = true;
            this.update_drag();
            return true;
        }
        return false;
    }

    deselect(){
        this.selected_piece = null;
    }

    update_drag(){
        this.selected_piece[2].drag_x = this.mouse_x / this.size_x;
        this.selected_piece[2].drag_y = this.mouse_y / this.size_y;
    }

    get_mouse_tile(){
        return [
            Math.floor(this.mouse_x / this.size_x),
            Math.floor(this.mouse_y / this.size_y)
        ];
    }

    create_annotation(x, y, type){
        this.deselect();
        if(type == "mousedown"){
            this.active_annotation = {
                "start": [x, y],
                "end": [x, y]
            }
        }else if(type == "mouseup"){
            if(!this.active_annotation)return;
            this.active_annotation.end = [x, y];
            let exists = false;
            for(let i in this.annotations){
                if(this.array_equal(this.annotations[i].start, this.active_annotation.start) && this.array_equal(this.annotations[i].end, this.active_annotation.end)){
                    this.annotations.splice(i, 1);
                    exists = true;
                    break;
                }
            }
            if(!exists){
                this.annotations.push(this.active_annotation);
            }
            this.active_annotation = null;
        }
    }

    mouse_events(event){
        if(this.promotion_window){
            return this.promotion_window.mouse_events(event);
        }
        if(this.end_window){
            return this.end_window.mouse_events(event);
        }
        var btn = event.button;
        this.mouse_x = event.offsetX;
        this.mouse_y = event.offsetY;
        var type = event.type;
        var mc = this.get_mouse_tile();
        var tx = mc[0];
        var ty = mc[1];
        if(this.view == "black"){
            tx = this.tiles_x - tx - 1;
            ty = this.tiles_y - ty - 1;
        }
        if(btn == 2){
            this.create_annotation(tx, ty, type);
        }
        if(btn != 0)return;
        switch(type){
            case "mousedown":
                this.clear_annotations();
                if(this.selected_piece == null){
                    return this.select(tx, ty);
                }else{
                    if(tx == this.selected_piece[0] && ty == this.selected_piece[1]){
                        this.selected_piece[2].is_drag = !this.selected_piece[2].is_drag;
                        this.update_drag();
                        return true;
                        //stop drag
                    }else if(!this.has_array(this.selected_piece[3], [tx, ty])){
                        return this.select(tx, ty);
                    }
                    //place selected piece if valid
                    //actions are on mouse up^
                }
                break
            case "mouseup":
                if(this.selected_piece == null)return;
                if(tx == this.selected_piece[0] && ty == this.selected_piece[1]){
                    this.selected_piece[2].is_drag = false;
                    return true;
                    //stop drag
                }else{
                    //place if valid
                    this.selected_piece[2].is_drag = false;
                    let data = {
                        "to": [tx, ty],
                        "from": [this.selected_piece[0], this.selected_piece[1]],
                        "piece": this.selected_piece[2],
                        "moves": this.selected_piece[3]
                    }
                    let moved = this.perform_move(data)
                    this.deselect();
                    if(moved){
                        notify_move(data);
                        return true;
                    }
                }
                break;
            case "mousemove":
                if(this.selected_piece != null){
                    if(this.selected_piece[2].is_drag){
                        this.update_drag();
                        return true;
                    }
                }
                if(this.active_annotation != null){
                    this.active_annotation.end = [tx, ty];
                }
                break;
        }
    }

    array_equal(a, b){
        if(a.length != b.length)return false;
        for(let i in a){
            if(a[i] != b[i])return false;
        }
        return true;
    }

    has_array(a, b){
        //assumes length 2 for coords
        for(let i of a){
            if(this.array_equal(i.slice(0, 2), b))return true;
        }
        return false;
    }

    get_array(a, b){
        for(let i of a){
            if(this.array_equal(i.slice(0, 2), b))return i;
        }
        return null;
    }

    is_inside(x, y){
        return  x >= 0 && x < this.tiles.length && y >= 0 && y < this.tiles[0].length;
    }

    get_tile(x, y){
        if(this.is_inside(x, y)){
            return this.tiles[x][y];
        }
        return null;
    }

    change_tile(x, y, p){
        if(this.is_inside(x, y)){
            this.tiles[x][y] = p;
            return true;
        }
        return false;
    }
    //shogi can promote when leaving, not possible atm
    promote_piece(x, y, piece){
        this.promotion_window = new PromotionWindow(x, y, piece, this);
    }

    do_promotion(x, y, piece){
        this.promotion_window = null;
        let t = this.get_tile(x, y);
        if(!t)return console.error("Promotion piece could not be found");
        let new_t = new Piece(piece, t.color);
        new_t.set_was(t);
        let last_history = this.move_history[this.move_history.length - 1];
        last_history.data.promotion = new_t.id;
        this.change_tile(x, y, new_t);
    }

    move_tile(tx, ty, fx, fy, p, valid){
        let extra = true;
        let selfcap = false;
        let castles = false;
        let enpassant = null;
        if(valid){ //checking move list, not validity
            let move = this.get_array(valid, [tx, ty]);
            if(move.length > 2 && move[2] != null){
                let data = move[2];
                if("castle" in data){
                    let t = this.get_tile(...data.castle.orig);
                    extra = this.move_tile(...data.castle.dest, ...data.castle.orig, t);
                    castles = extra;
                }
                if("selfcapture" in data){
                    selfcap = data.selfcapture;
                }
                if("enpassant" in data){
                    let t = this.get_tile(...data.enpassant);
                    if(t.color == p.color && !selfcap)return false;
                    this.capture_flag = true;
                    this.pockets[p.color].push(t);
                    this.change_tile(data.enpassant[0], data.enpassant[1], null);
                    enpassant = data.enpassant;
                }
            }
        }
        if(extra && this.set_tile(tx, ty, p, selfcap)){
            let data = {
                "from": [fx, fy],
                "to": [tx, ty],
                "piece_id": p.id,
                "data": {}
            };
            if(this.capture_flag){
                data.data.capture = true;
                delete this.capture_flag;
            }
            if(castles){
                data.data.castles = true;
            }
            if(!p.has_moved){
                data.data.first_move = true;
            }
            if(enpassant){
                data.data.enpassant = enpassant;
            }
            this.move_history.push(data);
            if(p.should_promote(tx, ty)){
                this.promote_piece(tx, ty, p);
            }
            p.has_moved = true;
            this.change_tile(fx, fy, null);
            return true;
        }
        return false;
    }

    set_tile(x, y, p, selfcap){
        let t = this.get_tile(x, y);
        if(t != null){
            if(t.color != p.color || selfcap){
                if(t.was){
                    t = t.was;
                }
                this.capture_flag = true;
                this.pockets[p.color].push(t);
                this.change_tile(x, y, p);
                return true;
            }
            //capture? or unhandled error?
        }
        return this.change_tile(x, y, p);
    }

    set_grid(x, y){
        this.tiles_x = x;
        this.tiles_y = y;
        this.size_x = this.width / this.tiles_x;
        this.size_y = this.height / this.tiles_y;
        this.tiles = [];
        for(let i = 0; i < x; i++){
            let row = [];
            for(let j = 0; j < y; j++){
                row.push(null);
            }
            this.tiles.push(row);
        }
    }

    draw(ctx){
        if(this.checkered){
            let check = 0;
            if(this.view == "black"){
                check = this.tiles_x % 2 == this.tiles_y % 2 ? 0 : 1;
            }
            for(let i = 0; i < this.tiles_x; i++){
                for(let j = 0; j < this.tiles_y; j++){
                    ctx.fillStyle = this.check_colors[check];
                    check = check == 0 ? 1 : 0;
                    ctx.fillRect(i * this.size_x, j * this.size_y, this.size_x, this.size_y);
                }
                if(this.tiles_y % 2 == 0){
                    check = check == 0 ? 1 : 0;
                }
            }
        }else{
            let border = 2;
            for(let i = 0; i < this.tiles_x; i++){
                for(let j = 0; j < this.tiles_y; j++){
                    ctx.fillStyle = this.check_colors[0];
                    ctx.fillRect(i * this.size_x, j * this.size_y, this.size_x, this.size_y);
                    ctx.fillStyle = this.check_colors[1];
                    ctx.fillRect(i * this.size_x + border, j * this.size_y + border, this.size_x - 2 * border, this.size_y - 2 * border);
                }
            }
        }

        for(let c in this.checks){
            if(!this.get_checkmate(c))continue;
            if(!this.checks[c])continue;
            let k = this.find_king(c);
            ctx.fillStyle = "red";
            ctx.globalAlpha = 0.2;
            let x, y;
            if(this.view == "black"){
                x = this.tiles_x - k[0] - 1;
                y = this.tiles_y - k[1] - 1;
            }else{
                x = k[0];
                y = k[1];
            }
            ctx.fillRect(x * this.size_x, y * this.size_y, this.size_x, this.size_y);
            ctx.globalAlpha = 1;
        }
        if(this.selected_piece != null){
            let mc = this.get_mouse_tile();
            for(let i of this.selected_piece[3]){
                let c = i;
                if(this.view == "black"){
                    c = [this.tiles_x - i[0] - 1, this.tiles_y - i[1] - 1];
                }
                let t = this.get_tile(...i);
                ctx.fillStyle = "green";
                ctx.strokeStyle = "green";
                if(c[0] == mc[0] && c[1] == mc[1]){
                    ctx.globalAlpha = 0.2;
                    ctx.fillRect(c[0] * this.size_x, c[1] * this.size_y, this.size_x, this.size_y);
                }else if(t != null){
                    ctx.lineWidth = "10";
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.rect(c[0] * this.size_x + 5, c[1] * this.size_y + 5, this.size_x - 10, this.size_y - 10);
                    ctx.stroke();
                }else{
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.arc((c[0] + 0.5) * this.size_x, (c[1] + 0.5) * this.size_y, Math.min(this.size_x, this.size_y) / 8, 0, 2 * Math.PI, false);
                    ctx.fill();
                }
            }
            ctx.fillStyle = "green";
            ctx.globalAlpha = 0.2;
            let x, y;
            if(this.view == "black"){
                x = this.tiles_x - this.selected_piece[0] - 1;
                y = this.tiles_y - this.selected_piece[1] - 1;
            }else{
                x = this.selected_piece[0];
                y = this.selected_piece[1];
            }
            ctx.fillRect(x * this.size_x, y * this.size_y, this.size_x, this.size_y);
            ctx.globalAlpha = 0.5;
            this.selected_piece[2].draw(ctx, x, y, this.size_x, this.size_y);
            ctx.globalAlpha = 1;
        }
        for(let i in this.tiles){
            for(let j in this.tiles[i]){
                let t = this.tiles[i][j];
                if(t != null){
                    if(t.is_drag){
                        t.draw(ctx, t.drag_x - 0.5, t.drag_y - 0.5, this.size_x, this.size_y);
                    }else{
                        if(this.view == "black"){
                            t.draw(ctx, this.tiles_x - i - 1, this.tiles_y - j - 1, this.size_x, this.size_y);
                        }else{

                            t.draw(ctx, i, j, this.size_x, this.size_y);
                        }
                    }
                }
            }
        }
        ctx.strokeStyle = "grey";
        ctx.fillStyle = "grey";
        ctx.lineWidth = "10";
        ctx.globalAlpha = 0.8;
        ctx.lineCap = "round";
        for(let i of this.annotations.concat([this.active_annotation])){
            if(!i)continue;
            let sx = (i.start[0] + 0.5) * this.size_x;
            let sy = (i.start[1] + 0.5) * this.size_y;
            let ex = (i.end[0] + 0.5) * this.size_x;
            let ey = (i.end[1] + 0.5) * this.size_y;
            if(this.array_equal(i.start, i.end)){
                ctx.beginPath();
                ctx.arc(sx, sy, Math.min(this.size_x, this.size_y) / 2 - 5, 0, 2 * Math.PI, false);
                ctx.stroke();
            }else{
                let angle = Math.atan2(ey - sy, ex - sx);
                let c = Math.PI / 5;
                let r = 40;
                let d = r * Math.sin(Math.PI / 2 - c);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex - d * Math.cos(angle), ey - d * Math.sin(angle));
                ctx.lineTo(ex - r * Math.cos(angle + c), ey - r * Math.sin(angle + c));
                ctx.lineTo(ex, ey);
                ctx.lineTo(ex - r * Math.cos(angle - c), ey - r * Math.sin(angle - c));
                ctx.lineTo(ex - d * Math.cos(angle), ey - d * Math.sin(angle));
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
        if(this.promotion_window){
            this.promotion_window.draw(ctx);
        }
        if(this.end_window){
            this.end_window.draw(ctx);
        }
    }
}

class Piece{
    static KNIGHT = {
        "id": "knight",
        "moves": [
            {"moves": [[1, 2], [2, 1], [-1, 2], [2, -1], [1, -2], [-2, 1], [-1, -2], [-2, -1]], "tags": ["jump"]}
        ],
        "icon": {
            "type": "char",
            "white": "♘",
            "black": "♞",
            "fen": "n"
        }
    }

    static ROOK = {
        "id": "rook",
        "tags": ["castle"],
        "moves": [
            {"moves": [[1, 0], [-1, 0], [0, 1], [0, -1]], "tags": ["repeat"]}
        ],
        "icon": {
            "type": "char",
            "white": "♖",
            "black": "♜",
            "fen": "r"
        }
    }

    static BISHOP = {
        "id": "bishop",
        "moves": [
            {"moves": [[1, 1], [-1, -1], [-1, 1], [1, -1]], "tags": ["repeat"]}
        ],
        "icon": {
            "type": "char",
            "white": "♗",
            "black": "♝",
            "fen": "b"
        }
    }

    static QUEEN = {
        "id": "queen",
        "moves": [
            {"moves": [[0, 1], [0, -1], [-1, 0], [1, 0], [1, 1], [-1, -1], [-1, 1], [1, -1]], "tags": ["repeat"]}
        ],
        "icon": {
            "type": "char",
            "white": "♕",
            "black": "♛",
            "fen": "q"
        }
    }

    static KING = {
        "id": "king",
        //needs handlers for checks
        "tags": ["king"],
        "moves": [
            {"moves": [[0, 1], [0, -1], [-1, 0], [1, 0], [1, 1], [-1, -1], [-1, 1], [1, -1]], "tags": ["jump", "king"]},
            {"moves": [[1, 0], [-1, 0]], "tags": ["castle", "king"], "distance": 2}
            //add castling
        ],
        "icon": {
            "type": "char",
            "white": "♔",
            "black": "♚",
            "fen": "k"
        }
    }

    static PAWN = {
        "id": "pawn",
        "tags": ["promote", "enpassant"],
        "promotions": {
            "forced": true,
            "region": {
                "black": {
                    "y_min": 7
                },
                "white": {
                    "y_max": 0
                }
            },
            "options": [Piece.ROOK, Piece.KNIGHT, Piece.BISHOP, Piece.QUEEN],
            "default": Piece.QUEEN
        },
        "moves":[
            {"moves": [[0, 1]], "tags": ["jump", "noncapture"]},
            {"moves": [[1, 1], [-1, 1]], "tags": ["captureonly", "jump"]}, //en passant as well?
            {"moves": [[0, 2]], "tags": ["first", "noncapture", "blocked", "jump"], "by": [0, 1]},
            {"moves": [[1, 1], [-1, 1]], "tags": ["enpassant"], "captures": [[1, 0], [-1, 0]], "pieces": ["pawn"]}
        ],
        "icon": {
            "type": "char",
            "white": "♙",
            "black": "♟",
            "fen": "p"
        }
    }
    //tags jump noncapture captureonly first blocked repeat king
    constructor(preset, color){
        this.preset = preset;
        this.color = color;
        this.icon = preset.icon[color];
        this.is_drag = false;
        this.drag_x = 0;
        this.drag_y = 0;
        this.has_moved = false;
        this.tags = this.preset.tags ? this.preset.tags : [];
        this.id = this.preset.id;
        this.was = null;
    }

    set_was(was){
        this.was = was;
    }

    get_moves(){
        return this.preset.moves;
    }

    get_tags(){
        return this.tags;
    }

    should_promote(x, y){
        if(this.tags.includes("promote")){
            let r = this.preset.promotions.region[this.color];
            if(r.y_max != undefined && y > r.y_max){
                return false;
            }
            if(r.y_min != undefined && y < r.y_min){
                return false;
            }
            if(r.x_max != undefined && x > r.x_max){
                return false;
            }
            if(r.x_min != undefined && x < r.x_min){
                return false;
            }
            return true;
        }
        return false;
    }

    get_promotions(){
        return this.preset.promotions.options;
    }

    draw(ctx, x, y, sx, sy){
        Piece.draw_piece(ctx, x, y, sx, sy, this.color, this.icon);
    }

    static draw_piece(ctx, x, y, sx, sy, color, icon){
        ctx.fillStyle = color;
        let size = Math.min(sx, sy); 
        ctx.font = size + "px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icon, x * sx + sx / 2, y * sy + sy / 2);
    }
}