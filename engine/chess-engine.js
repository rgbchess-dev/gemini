// /engine/chess-engine.js - FIXED VERSION with Working Computer Moves

import { Chessground } from '../assets/js/chessground.min.js';

export class ChessEngine {
    constructor(boardElementId, options = {}) {
        // Core chess components
        this.chess = new Chess();
        this.boardElement = document.getElementById(boardElementId);
        this.board = null;
        
        // Player settings
        this.playerColor = options.playerColor || 'both';
        this.orientation = options.orientation || 'white';
        
        // Line management
        this.currentLine = null;
        this.currentMoves = [];
        this.moveIndex = 0;
        this.isLineActive = false;
        
        // Callbacks
        this.onMoveCallback = null;
        this.onLineCompleteCallback = null;
        this.onComputerMoveCallback = null;
        
        this.initializeBoard();
        this.setupPromotionHandlers();
    }

    // ============================================
    // CORE BOARD FUNCTIONS
    // ============================================
    
    initializeBoard() {
        console.log('🎯 Initializing board with playerColor:', this.playerColor, 'orientation:', this.orientation);
        
        this.board = Chessground(this.boardElement, {
            orientation: this.orientation,
            movable: {
                color: this.getMovableColor(),
                free: false,
                dests: this.calculateDests()
            },
            draggable: {
                showGhost: true
            }
        });

        this.board.set({
            movable: {
                events: {
                    after: (orig, dest) => this.handleMove(orig, dest)
                }
            }
        });
        
        console.log('🎯 Board initialized, movable color:', this.getMovableColor());
    }

    calculateDests() {
        const dests = new Map();
        this.chess.SQUARES.forEach(s => {
            const ms = this.chess.moves({square: s, verbose: true});
            if (ms.length) dests.set(s, ms.map(m => m.to));
        });
        return dests;
    }

    updateBoard() {
        this.board.set({
            fen: this.chess.fen(),
            turnColor: this.getCurrentColor(),
            movable: {
                color: this.getMovableColor(),
                dests: this.calculateDests()
            }
        });
    }

    // ============================================
    // LINE MANAGEMENT - FIXED
    // ============================================
    
    /**
     * Load a line for training
     */
    loadLine(lineData, startingFen = null) {
        console.log('🎯 Loading line:', lineData.name, 'with moves:', lineData.moves);
        
        this.currentLine = lineData;
        this.currentMoves = lineData.moves || [];
        this.moveIndex = 0;
        this.isLineActive = true;
        
        // Load starting position
        if (startingFen) {
            this.chess.load(startingFen);
        } else {
            this.chess.reset();
        }
        
        this.updateBoard();
        
        // FIXED: Check if computer should make the first move
        setTimeout(() => {
            if (this.shouldComputerMoveNow()) {
                console.log('🤖 Computer will make first move...');
                this.playNextComputerMove();
            }
        }, 300);
    }
    
    /**
     * FIXED: Check if it's computer's turn to move right now
     */
    shouldComputerMoveNow() {
        if (!this.isLineActive) {
            console.log('🤖 Not computer turn: line not active');
            return false;
        }
        
        if (this.moveIndex >= this.currentMoves.length) {
            console.log('🤖 Not computer turn: no more moves');
            return false;
        }
        
        // If player plays both sides, never auto-move
        if (this.playerColor === 'both') {
            console.log('🤖 Not computer turn: player plays both sides');
            return false;
        }
        
        // Check whose turn it is to move
        const currentTurn = this.chess.turn(); // 'w' or 'b'
        const isWhiteTurn = currentTurn === 'w';
        
        // Determine if it's the computer's turn
        let isComputerTurn = false;
        
        if (this.playerColor === 'white') {
            // Player is white, so computer is black
            isComputerTurn = !isWhiteTurn; // Computer moves when it's black's turn
        } else if (this.playerColor === 'black') {
            // Player is black, so computer is white  
            isComputerTurn = isWhiteTurn; // Computer moves when it's white's turn
        }
        
        console.log('🤖 Turn check:', {
            currentTurn: isWhiteTurn ? 'white' : 'black',
            playerColor: this.playerColor,
            isComputerTurn: isComputerTurn,
            moveIndex: this.moveIndex,
            nextMove: this.currentMoves[this.moveIndex]
        });
        
        return isComputerTurn;
    }
    
    /**
     * FIXED: Play the next computer move in the sequence
     */
    playNextComputerMove() {
        console.log('🤖 playNextComputerMove called');
        
        if (!this.isLineActive) {
            console.log('🤖 Cannot move: line not active');
            return false;
        }
        
        if (this.moveIndex >= this.currentMoves.length) {
            console.log('🤖 Cannot move: no more moves in sequence');
            return false;
        }
        
        const nextMove = this.currentMoves[this.moveIndex];
        console.log(`🤖 Computer playing move ${this.moveIndex + 1}: ${nextMove}`);
        
        try {
            const move = this.chess.move(nextMove, { sloppy: true });
            
            if (move) {
                console.log('🤖 Computer successfully played:', move.san);
                this.moveIndex++;
                this.updateBoard();
                
                // Notify callback
                if (this.onComputerMoveCallback) {
                    this.onComputerMoveCallback(move);
                }
                
                // Check if line is complete
                if (this.moveIndex >= this.currentMoves.length) {
                    this.completeCurrentLine();
                }
                
                return true;
            } else {
                console.error('🤖 Failed to make computer move:', nextMove);
                return false;
            }
        } catch (error) {
            console.error('🤖 Error making computer move:', error);
            return false;
        }
    }
    
    /**
     * Validate a user's move against the expected sequence
     */
    validateUserMove(move) {
        if (!this.isLineActive || this.moveIndex >= this.currentMoves.length) {
            return { valid: false, expected: null, isComplete: false };
        }
        
        const expectedMove = this.currentMoves[this.moveIndex];
        const isCorrect = (move.san === expectedMove);
        
        console.log('🎯 User move validation:', {
            played: move.san,
            expected: expectedMove,
            isCorrect: isCorrect
        });
        
        if (isCorrect) {
            this.moveIndex++;
            const isComplete = this.moveIndex >= this.currentMoves.length;
            
            return { 
                valid: true, 
                expected: expectedMove,
                isComplete: isComplete
            };
        }
        
        return { 
            valid: false, 
            expected: expectedMove,
            isComplete: false 
        };
    }
    
    /**
     * Handle line completion
     */
    completeCurrentLine() {
        console.log('🏁 Line completed!');
        this.isLineActive = false;
        
        if (this.onLineCompleteCallback) {
            this.onLineCompleteCallback({
                line: this.currentLine,
                totalMoves: this.currentMoves.length
            });
        }
    }
    
    /**
     * Get current progress in the line
     */
    getLineProgress() {
        if (!this.currentLine) return { current: 0, total: 0, percentage: 0, isComplete: true };
        
        return {
            current: this.moveIndex,
            total: this.currentMoves.length,
            percentage: this.currentMoves.length > 0 ? (this.moveIndex / this.currentMoves.length) * 100 : 0,
            isComplete: this.moveIndex >= this.currentMoves.length,
            movesPlayed: this.currentMoves.slice(0, this.moveIndex),
            movesRemaining: this.currentMoves.slice(this.moveIndex)
        };
    }
    
    /**
     * Reset current line to beginning
     */
    resetCurrentLine() {
        if (this.currentLine) {
            console.log('🔄 Resetting line to beginning');
            this.loadLine(this.currentLine);
        }
    }
    
    // ============================================
    // MOVE HANDLING - FIXED
    // ============================================
    
    handleMove(orig, dest) {
        console.log('👤 User attempting move:', orig, 'to', dest);
        
        if (!this.canPlayerMove()) {
            console.log('👤 Move rejected: not player turn');
            this.updateBoard(); // Reset invalid drag
            return;
        }

        // Check for promotion
        const piece = this.chess.get(orig);
        const isPromotion = piece && piece.type === 'p' &&
            ((piece.color === 'w' && dest[1] === '8') ||
             (piece.color === 'b' && dest[1] === '1'));

        if (isPromotion) {
            this.pendingPromotion = { from: orig, to: dest };
            this.showPromotionDialog(piece.color);
            return;
        }

        // Try to make the move
        const move = this.chess.move({ from: orig, to: dest });
        
        if (move) {
            console.log('👤 User successfully played:', move.san);
            
            // If we have an active line, validate the move
            if (this.isLineActive) {
                const validation = this.validateUserMove(move);
                
                if (!validation.valid) {
                    // Wrong move - undo it
                    console.log('👤 Wrong move! Undoing:', move.san, 'Expected:', validation.expected);
                    this.chess.undo();
                    this.updateBoard();
                } else {
                    console.log('👤 Correct move!');
                    this.updateBoard();
                    
                    // Check if line is complete
                    if (validation.isComplete) {
                        this.completeCurrentLine();
                    } else {
                        // FIXED: Check if computer should respond
                        setTimeout(() => {
                            if (this.shouldComputerMoveNow()) {
                                console.log('🤖 Computer will respond in 600ms...');
                                setTimeout(() => {
                                    this.playNextComputerMove();
                                }, 600);
                            }
                        }, 100);
                    }
                }
                
                // Notify callback with validation result
                if (this.onMoveCallback) {
                    this.onMoveCallback(move, validation);
                }
            } else {
                // Free play mode - just notify the move
                this.updateBoard();
                if (this.onMoveCallback) {
                    this.onMoveCallback(move, { valid: true, freePlay: true });
                }
            }
        } else {
            console.log('👤 Invalid move attempted');
            this.updateBoard(); // Reset invalid move
        }
    }

    // ============================================
    // PROMOTION HANDLING
    // ============================================
    
    showPromotionDialog(color) {
        const selector = document.getElementById('promotionSelector');
        if (!selector) {
            // Default to queen if no promotion dialog
            this.handlePromotion('q');
            return;
        }

        selector.style.display = 'block';
        
        // Show only pieces of the correct color
        selector.querySelectorAll('.promotion-piece').forEach(piece => {
            const isWhite = piece.classList.contains('white');
            piece.style.display = (color === 'w' && isWhite) || (color === 'b' && !isWhite) ? 'block' : 'none';
        });
    }

    hidePromotionDialog() {
        const selector = document.getElementById('promotionSelector');
        if (selector) {
            selector.style.display = 'none';
        }
    }

    handlePromotion(promotionPiece) {
        if (!this.pendingPromotion) return;

        const move = this.chess.move({
            from: this.pendingPromotion.from,
            to: this.pendingPromotion.to,
            promotion: promotionPiece
        });

        this.pendingPromotion = null;
        this.hidePromotionDialog();

        if (move && this.onMoveCallback) {
            const validation = this.isLineActive ? this.validateUserMove(move) : { valid: true, freePlay: true };
            this.onMoveCallback(move, validation);
            
            if (validation.valid && this.shouldComputerMoveNow()) {
                setTimeout(() => this.playNextComputerMove(), 800);
            }
        }

        this.updateBoard();
    }

    setupPromotionHandlers() {
        document.querySelectorAll('.promotion-piece').forEach(piece => {
            piece.addEventListener('click', () => {
                const promotionPiece = piece.dataset.piece;
                this.handlePromotion(promotionPiece);
            });
        });
    }

    // ============================================
    // UTILITIES
    // ============================================
    
    getCurrentColor() {
        return this.chess.turn() === 'w' ? 'white' : 'black';
    }

    getMovableColor() {
        if (this.playerColor === 'both') return this.getCurrentColor();
        if (this.playerColor === this.getCurrentColor()) return this.getCurrentColor();
        return null; // Computer's turn - player can't move
    }

    canPlayerMove() {
        if (this.playerColor === 'both') return true;
        return this.getCurrentColor() === this.playerColor;
    }

    loadPosition(fen) {
        this.isLineActive = false; // Free play when loading arbitrary position
        this.currentLine = null;
        
        if (fen) {
            this.chess.load(fen);
        } else {
            this.chess.reset();
        }
        this.updateBoard();
    }

    getGameState() {
        return {
            fen: this.chess.fen(),
            turn: this.getCurrentColor(),
            inCheck: this.chess.in_check(),
            inCheckmate: this.chess.in_checkmate(),
            inStalemate: this.chess.in_stalemate(),
            inDraw: this.chess.in_draw(),
            gameOver: this.chess.game_over(),
            pgn: this.chess.pgn(),
            history: this.chess.history(),
            lineProgress: this.getLineProgress()
        };
    }

    setPlayerColor(color) {
        console.log('🎯 Chess engine playerColor changed from', this.playerColor, 'to', color);
        this.playerColor = color;
        this.updateBoard();
        
        // If we have an active line and it's now computer's turn, play
        setTimeout(() => {
            if (this.isLineActive && this.shouldComputerMoveNow()) {
                console.log('🤖 After color change, computer should play');
                this.playNextComputerMove();
            }
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

    // ============================================
    // EVENT CALLBACKS
    // ============================================
    
    onMove(callback) {
        this.onMoveCallback = callback;
    }

    onLineComplete(callback) {
        this.onLineCompleteCallback = callback;
    }

    onComputerMove(callback) {
        this.onComputerMoveCallback = callback;
    }

    // ============================================
    // CLEANUP
    // ============================================
    
    destroy() {
        this.board = null;
        this.chess = null;
        this.currentLine = null;
        this.onMoveCallback = null;
        this.onLineCompleteCallback = null;
        this.onComputerMoveCallback = null;
    }
}