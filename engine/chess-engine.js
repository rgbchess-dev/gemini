// /engine/chess-engine.js - FINAL VERSION

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
        this.setupPromotionHandlers();
        this.cachedDests = null;
        this.lastCalculatedFen = null;
    }
    
    initializeBoard() {
        this.board = Chessground(this.boardElement, {
            orientation: this.orientation,
            movable: {
                color: this.getMovableColor(),
                free: false,
                dests: this.calculateDests()
            },
            draggable: { showGhost: true }
        });
        this.board.set({
            movable: { events: { after: (orig, dest) => this.handleMove(orig, dest) } }
        });
    }

    calculateDests() {
        const dests = new Map();
        
        // Only check squares that have pieces of the current player
        const currentTurn = this.chess.turn(); // 'w' or 'b'
        const board = this.chess.board();
        
        board.forEach((row, rowIndex) => {
            row.forEach((piece, colIndex) => {
                if (piece && piece.color === currentTurn) {
                    const square = String.fromCharCode(97 + colIndex) + (8 - rowIndex);
                    const moves = this.chess.moves({square, verbose: true});
                    if (moves.length) {
                        dests.set(square, moves.map(m => m.to));
                    }
                }
            });
        });
        
        return dests;
    }

    updateBoard() {
        this.board.set({
            fen: this.chess.fen(),
            turnColor: this.getCurrentColor(),
            movable: { color: this.getMovableColor(), dests: this.calculateDests() }
        });
    }
    
    // In /engine/chess-engine.js

    // REPLACE your existing loadLine function with this one
    loadLine(lineData, startingFen = null) {
        this.currentLine = lineData;
        this.currentMoves = lineData.moves || [];
        this.moveIndex = 0;
        this.isLineActive = true;
        
        // --- CRITICAL FIX: Add a safety check ---
        // Only call chess.load if startingFen is a valid string.
        // Otherwise, just reset to the default starting position.
        try {
            if (startingFen && typeof startingFen === 'string') { 
                this.chess.load(startingFen); 
            } else { 
                this.chess.reset(); 
            }
        } catch (e) {
            console.error("Invalid FEN provided to chess.js, resetting board:", startingFen);
            this.chess.reset();
        }
        
        this.updateBoard();
        
        setTimeout(() => {
            if (this.shouldComputerMoveNow()) { this.playNextComputerMove(); }
        }, 100);
    }
    
    shouldComputerMoveNow() {
        if (!this.isLineActive || this.moveIndex >= this.currentMoves.length || this.playerColor === 'both') {
            return false;
        }
        const currentTurn = this.chess.turn();
        return (this.playerColor === 'white' && currentTurn === 'b') || (this.playerColor === 'black' && currentTurn === 'w');
    }
    
    playNextComputerMove() {
        if (!this.isLineActive || this.moveIndex >= this.currentMoves.length) return false;
        const nextMove = this.currentMoves[this.moveIndex];
        const move = this.chess.move(nextMove, { sloppy: true });
        if (move) {
            this.moveIndex++;
            this.updateBoard();
            if (this.onComputerMoveCallback) this.onComputerMoveCallback(move);
            if (this.moveIndex >= this.currentMoves.length) this.completeCurrentLine();
            return true;
        }
        return false;
    }
    
    validateUserMove(move) {
        if (!this.isLineActive || this.moveIndex >= this.currentMoves.length) {
            return { valid: false, expected: null, isComplete: false };
        }
        const expectedMove = this.currentMoves[this.moveIndex];
        const isCorrect = (move.san === expectedMove);
        if (isCorrect) {
            this.moveIndex++;
            const isComplete = this.moveIndex >= this.currentMoves.length;
            return { valid: true, expected: expectedMove, isComplete: isComplete };
        }
        return { valid: false, expected: expectedMove, isComplete: false };
    }
    
    completeCurrentLine() {
        this.isLineActive = false;
        if (this.onLineCompleteCallback) {
            this.onLineCompleteCallback({ line: this.currentLine, totalMoves: this.currentMoves.length });
        }
    }
    
    getLineProgress() {
        if (!this.currentLine) return { current: 0, total: 0, percentage: 0, isComplete: true };
        return {
            current: this.moveIndex,
            total: this.currentMoves.length,
            percentage: this.currentMoves.length > 0 ? (this.moveIndex / this.currentMoves.length) * 100 : 0,
            isComplete: this.moveIndex >= this.currentMoves.length
        };
    }
    
    resetCurrentLine() {
        if (this.currentLine) { this.loadLine(this.currentLine); }
    }

    // --- NEW FUNCTIONS FOR STEPPING ---
    stepBackward() {
        if (this.moveIndex > 0) {
            this.chess.undo();
            this.moveIndex--;
            this.updateBoard();
            return true;
        }
        return false;
    }

    stepForward() {
        if (this.moveIndex < this.currentMoves.length) {
            const nextMove = this.currentMoves[this.moveIndex];
            if (this.chess.move(nextMove, { sloppy: true })) {
                this.moveIndex++;
                this.updateBoard();
                return true;
            }
        }
        return false;
    }
    
    handleMove(orig, dest) {
        if (!this.canPlayerMove()) { this.updateBoard(); return; }
        const piece = this.chess.get(orig);
        const isPromotion = piece && piece.type === 'p' && ((piece.color === 'w' && dest[1] === '8') || (piece.color === 'b' && dest[1] === '1'));
        if (isPromotion) {
            this.pendingPromotion = { from: orig, to: dest };
            this.showPromotionDialog(piece.color);
            return;
        }
        const move = this.chess.move({ from: orig, to: dest });
        if (move) {
            if (this.isLineActive) {
                const validation = this.validateUserMove(move);
                if (!validation.valid) {
                    this.chess.undo();
                    this.updateBoard();
                } else {
                    this.updateBoard();
                    if (validation.isComplete) {
                        this.completeCurrentLine();
                    } else {
                    if (this.shouldComputerMoveNow()) {
                        setTimeout(() => this.playNextComputerMove(), 300);
                    }
                    }
                }
                if (this.onMoveCallback) this.onMoveCallback(move, validation);
            } else {
                this.updateBoard();
                if (this.onMoveCallback) this.onMoveCallback(move, { valid: true, freePlay: true });
            }
        } else {
            this.updateBoard();
        }
    }
    
    showPromotionDialog(color) { /* ... unchanged ... */ }
    hidePromotionDialog() { /* ... unchanged ... */ }
    handlePromotion(promotionPiece) { /* ... unchanged ... */ }
    setupPromotionHandlers() { /* ... unchanged ... */ }
    
    getCurrentColor() { return this.chess.turn() === 'w' ? 'white' : 'black'; }
    getMovableColor() {
        if (this.playerColor === 'both') return this.getCurrentColor();
        if (this.playerColor === this.getCurrentColor()) return this.getCurrentColor();
        return null;
    }
    canPlayerMove() {
        if (this.playerColor === 'both') return true;
        return this.getCurrentColor() === this.playerColor;
    }
    
    setPlayerColor(color) {
        this.playerColor = color;
        this.updateBoard();
        setTimeout(() => {
            if (this.isLineActive && this.shouldComputerMoveNow()) { this.playNextComputerMove(); }
        }, 100);
    }

    setOrientation(orientation) {
        this.orientation = orientation;
        this.board.set({ orientation: orientation });
    }

    flipBoard() {
        const newOrientation = this.orientation === 'white' ? 'black' : 'white';
        this.setOrientation(newOrientation);
        return newOrientation;
    }
    
    onMove(callback) { this.onMoveCallback = callback; }
    onLineComplete(callback) { this.onLineCompleteCallback = callback; }
    onComputerMove(callback) { this.onComputerMoveCallback = callback; }
}