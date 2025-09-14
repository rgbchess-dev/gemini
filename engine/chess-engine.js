import { Chessground } from '../assets/js/chessground.min.js';

export class ChessEngine {
    constructor(boardElementId, options = {}) {
        this.chess = new Chess();
        this.boardElement = document.getElementById(boardElementId);
        this.board = null;
        this.playerColor = options.playerColor || 'both';
        this.orientation = options.orientation || 'white';
        this.currentLine = null;
        this.currentMoves = [];
        this.moveIndex = 0;
        this.isLineActive = false;
        this.onMoveCallback = null;
        this.onLineCompleteCallback = null;
        this.onComputerMoveCallback = null;
        this.initializeBoard();
    }

    initializeBoard() {
        this.board = Chessground(this.boardElement, {
            orientation: this.orientation,
            movable: { color: this.getMovableColor(), free: false, dests: () => this.calculateDests() },
            draggable: { showGhost: true },
            events: { move: (orig, dest) => this.handleMove(orig, dest) }
        });
    }

    updateBoard() {
        this.board.set({
            fen: this.chess.fen(),
            turnColor: this.getCurrentColor(),
            movable: { color: this.getMovableColor(), dests: this.calculateDests() }
        });
    }

    // ADD THIS FUNCTION BACK
    playComputerMoveIfNeeded() {
        if (this.shouldComputerMoveNow()) {
            this.playNextComputerMove();
        }
    }

    loadLine(lineData, startingFen = null) {
        this.currentLine = lineData;
        this.currentMoves = lineData.moves || [];
        this.moveIndex = 0;
        this.isLineActive = true;
        try {
            this.chess.load(startingFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        } catch (e) { this.chess.reset(); }
        this.updateBoard();
    }

    shouldComputerMoveNow() {
        if (!this.isLineActive || this.moveIndex >= this.currentMoves.length || this.playerColor === 'both') return false;
        const currentTurn = this.chess.turn();
        return (this.playerColor === 'white' && currentTurn === 'b') || (this.playerColor === 'black' && currentTurn === 'w');
    }

    playNextComputerMove() {
        const moveObject = this.currentMoves[this.moveIndex];
        if (!moveObject || !moveObject.san) return false;
        const move = this.chess.move(moveObject.san, { sloppy: true });
        if (move) {
            this.moveIndex++;
            this.updateBoard();
            if (this.onComputerMoveCallback) this.onComputerMoveCallback(move);
            if (this.moveIndex >= this.currentMoves.length && this.onLineCompleteCallback) this.onLineCompleteCallback();
        }
    }

    handleMove(orig, dest) {
        if (!this.canPlayerMove()) return;
        const move = this.chess.move({ from: orig, to: dest, promotion: 'q' });
        if (move) {
            if (this.isLineActive) {
                const validation = this.validateUserMove(move);
                if (!validation.valid) {
                    this.chess.undo();
                    this.updateBoard();
                } else {
                    this.updateBoard();
                    if (validation.isComplete && this.onLineCompleteCallback) this.onLineCompleteCallback();
                    else if (this.shouldComputerMoveNow()) this.playNextComputerMove();
                }
                if (this.onMoveCallback) this.onMoveCallback(move, validation);
            } else { this.updateBoard(); }
        }
    }

    validateUserMove(move) {
        if (!this.isLineActive || this.moveIndex >= this.currentMoves.length) return { valid: false };
        const expectedMoveSan = this.currentMoves[this.moveIndex].san;
        const isCorrect = (move.san === expectedMoveSan);
        if (isCorrect) {
            this.moveIndex++;
            return { valid: true, isComplete: this.moveIndex >= this.currentMoves.length };
        }
        return { valid: false };
    }

    stepBackward() { if (this.moveIndex > 0) { this.chess.undo(); this.moveIndex--; this.updateBoard(); return true; } return false; }
    stepForward() { if (this.moveIndex < this.currentMoves.length) { const moveObject = this.currentMoves[this.moveIndex]; if (this.chess.move(moveObject.san, { sloppy: true })) { this.moveIndex++; this.updateBoard(); return true; } } return false; }
    calculateDests() { const dests = new Map(); const moves = this.chess.moves({ verbose: true }); for (const move of moves) { if (!dests.has(move.from)) dests.set(move.from, []); dests.get(move.from).push(move.to); } return dests; }
    getCurrentColor() { return this.chess.turn() === 'w' ? 'white' : 'black'; }
    getMovableColor() { if (!this.isLineActive) return null; if (this.playerColor === 'both') return this.getCurrentColor(); return (this.getCurrentColor() === this.playerColor) ? this.playerColor : null; }
    canPlayerMove() { return this.getMovableColor() !== null; }
    getLineProgress() { return { current: this.moveIndex, total: this.currentMoves.length }; }
    setPlayerColor(color) {
        this.playerColor = color;
        // Command the board to orient to the player's perspective.
        if (color === 'white' || color === 'black') {
            this.board.set({ orientation: color });
        }
        this.updateBoard();
    }
    flipBoard() { this.board.toggleOrientation(); }
    onMove(callback) { this.onMoveCallback = callback; }
    onLineComplete(callback) { this.onLineCompleteCallback = callback; }
    onComputerMove(callback) { this.onComputerMoveCallback = callback; }
}