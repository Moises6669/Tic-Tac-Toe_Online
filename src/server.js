const http = require("http")
const express = require("express");
const app = express();
const socketIo = require("socket.io");
const fs = require("fs");
const path  = require('path');

const port = process.env.PORT || 8080;

const server = http.Server(app).listen(()=>{
    console.log('Server on Port 8080');
});
const io = socketIo(server);
const clients = {};


//Routes
app.get("/", (req, res) => {
    const stream = fs.createReadStream(__dirname + "/Static/home.html");
    stream.pipe(res);
});

app.get("/game",(req,res)=>{
    const stream = fs.createReadStream(__dirname + "/Static/index.html");
    stream.pipe(res);
})

// Serve static resources
app.use(express.static(path.join(__dirname ,"/Static")))
app.use(express.static(path.join(__dirname , "/../node_modules/")));

var players = {}; // opponent: scoket.id of the opponent, symbol = "X" | "O", socket: player's socket
var unmatched;


// When a client connects
io.on("connection", function(socket) {
    let id = socket.id;

    console.log("New client connected. ID: ", socket.id);
    clients[socket.id] = socket;

    socket.on("disconnect", () => { 
        console.log("Client disconnected. ID: ", socket.id);
        delete clients[socket.id];
        socket.broadcast.emit("clientdisconnect", id);
    });

    join(socket); // Fill 'players' data structure

    if (opponentOf(socket)) { // If the current player has an opponent the game can begin
        socket.emit("game.begin", { // Send the game.begin event to the player
            symbol: players[socket.id].symbol
        });

        opponentOf(socket).emit("game.begin", { // Send the game.begin event to the opponent
            symbol: players[opponentOf(socket).id].symbol 
        });
    }


    // Event for when any player makes a move
    socket.on("make.move", function(data) {
        if (!opponentOf(socket)) {
            // This shouldn't be possible since if a player doens't have an opponent the game board is disabled
            return;
        }

        // Validation of the moves can be done here

        socket.emit("move.made", data); // Emit for the player who made the move
        opponentOf(socket).emit("move.made", data); // Emit for the opponent
    });

    socket.on("disconnect", function() {
        if (opponentOf(socket)) {
        opponentOf(socket).emit("opponent.left");
        }
    });
});

function join(socket) {
    players[socket.id] = {
        opponent: unmatched,
        symbol: "X",
        socket: socket
    };

    if (unmatched) { 
        players[socket.id].symbol = "O";
        players[unmatched].opponent = socket.id;
        unmatched = null;
    } else {  
        unmatched = socket.id;
    }
}

function opponentOf(socket) {
    if (!players[socket.id].opponent) {
        return;
    }
    return players[players[socket.id].opponent].socket;
}