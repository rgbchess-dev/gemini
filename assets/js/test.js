console.log("Script starting...");

const fs = require('fs');
const chessCode = fs.readFileSync('/docker/nginx/js/chess.min.js', 'utf8');
eval(chessCode);

function generateFEN(moves) {
    const tempChess = new Chess();
    moves.forEach(move => tempChess.move(move));
    return tempChess.fen();
}

// Exercise 1: After 8.Ke2
const ex1 = generateFEN(['e4','e5','Nf3','Nc6','Bc4','Nf6','Ng5','Bc5','Nxf7','Bxf2+','Kxf2','Nxe4+','Ke1','Qh4+','Ke2']);
console.log("Exercise 1 FEN:", ex1);

// Exercise 2: After 9.Nxh8  
const ex2 = generateFEN(['e4','e5','Nf3','Nc6','Bc4','Nf6','Ng5','Bc5','Nxf7','Bxf2+','Kxf2','Nxe4+','Ke1','Qh4+','g3','Nxg3','Nxh8']);
console.log("Exercise 2 FEN:", ex2);

// Exercise 3: After 10.Ke2
const ex3 = generateFEN(['e4','e5','Nf3','Nc6','Bc4','Nf6','Ng5','Bc5','Nxf7','Bxf2+','Kxf2','Nxe4+','Ke1','Qh4+','g3','Nxg3','hxg3','Qxh1+','Ke2']);
console.log("Exercise 3 FEN:", ex3);

// Exercise 4: King hunt - after 12.Kxd5
const ex4 = generateFEN(['e4','e5','Nf3','Nc6','Bc4','Nf6','Ng5','Bc5','Nxf7','Bxf2+','Kxf2','Nxe4+','Ke2','Nd4+','Ke3','Qh4','g3','Nxg3','hxg3','Qxg3+','Ke4','d5+','Kxd5']);
console.log("Exercise 4 FEN:", ex4);

// Exercise 5: Line 2 after 13.g3
const ex5 = generateFEN(['e4','e5','Nf3','Nc6','Bc4','Nf6','Ng5','Bc5','Nxf7','Bxf2+','Kf1','Qe7','Nxh8','d5','exd5','Nd4','c3','Bg4','Qa4+','Nd7','cxd4','Qf6','dxe5','Qf4','g3']);
console.log("Exercise 5 FEN:", ex5);

// Exercise 6: After 5.Bxf7+
const ex6 = generateFEN(['e4','e5','Nf3','Nc6','Bc4','Nf6','Ng5','Bc5','Bxf7+']);
console.log("Exercise 6 FEN:", ex6);