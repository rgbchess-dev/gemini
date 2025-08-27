/**
 * Enhanced Chess Engine Module
 * File: /engine/chess-engine.js
 * 
 * Responsibilities:
 * - Board visualization (Chessground)
 * - Line management and validation
 * - Move sequence tracking
 * - Computer move automation
 */

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
        
        // Line management - NEW
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
    // CORE BOARD FUNCTIONS (existing)
    // ============================================
    
    initializeBoard() {
        console.log('Initializing board with playerColor:', this.playerColor, 'orientation:', this.orientation);
        
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
        
        console.log('Board initialized, movable color:', this.getMovableColor());
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
    // LINE MANAGEMENT (NEW)
    // ============================================
    
    /**
     * Load a line for training
     * @param {Object} lineData - Contains moves array and metadata
     * @param {string} startingFen - Optional starting position
     */
    loadLine(lineData, startingFen = null) {
        console.log('Loading line:', lineData.name, 'with moves:', lineData.moves);
        
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
        
        // Check if computer should make the first move
        const shouldPlayFirst = this.shouldComputerMove();
        console.log('After loading line, should computer move first?', shouldPlayFirst);
        
        if (shouldPlayFirst) {
            console.log('Computer will play first move in 500ms...');
            setTimeout(() => {
                console.log('Computer playing first move now');
                this.playNextComputerMove();
            }, 500);
        }
    }
    
    /**
     * Check if it's computer's turn to move
     */
    shouldComputerMove() {
        if (!this.isLineActive) return false;
        if (this.moveIndex >= this.currentMoves.length) return false;
        
        // If player plays both sides, no automatic moves
        if (this.playerColor === 'both') {
            return false;
        }
        
        // Check whose turn it is
        const isWhiteTurn = this.chess.turn() === 'w';
        
        // Determine if it's the player's turn
        const isPlayerTurn = (this.playerColor === 'white' && isWhiteTurn) || 
                            (this.playerColor === 'black' && !isWhiteTurn);
        
        // Computer should move if it's not the player's turn
        const shouldMove = !isPlayerTurn;
        
        // Debug logging
        console.log('shouldComputerMove check:', {
            playerColor: this.playerColor,
            currentTurn: isWhiteTurn ? 'white' : 'black',
            isPlayerTurn: isPlayerTurn,
            shouldMove: shouldMove,
            moveIndex: this.moveIndex,
            totalMoves: this.currentMoves.length
        });
        
        return shouldMove;
    }
    
    /**
     * Play the next computer move in the sequence
     */
    playNextComputerMove() {
        console.log('playNextComputerMove called');
        
        if (!this.isLineActive || this.moveIndex >= this.currentMoves.length) {
            console.log('Cannot play computer move:', {
                isLineActive: this.isLineActive,
                moveIndex: this.moveIndex,
                totalMoves: this.currentMoves.length
            });
            return false;
        }
        
        const nextMove = this.currentMoves[this.moveIndex];
        console.log(`Computer attempting to play move ${this.moveIndex}: ${nextMove}`);
        
        const move = this.chess.move(nextMove);
        
        if (move) {
            console.log('Computer successfully played:', move.san);
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
        }
        
        console.error(`Failed to make computer move: ${nextMove}`);
        return false;
    }
    
    /**
     * Validate a user's move against the expected sequence
     */
    validateUserMove(move) {
        if (!this.isLineActive || this.moveIndex >= this.currentMoves.length) {
            return { valid: false, expected: null, isComplete: false };
        }
        
        const expectedMove = this.currentMoves[this.moveIndex];
        const isCorrect = (move.san === expectedMove || move.lan === expectedMove);
        
        if (isCorrect) {
            this.moveIndex++;
            const isComplete = this.moveIndex >= this.currentMoves.length;
            const shouldPlayComputer = !isComplete && this.shouldComputerMove();
            
            console.log('Move validated:', {
                moveIndex: this.moveIndex,
                isComplete: isComplete,
                shouldPlayComputer: shouldPlayComputer
            });
            
            if (isComplete) {
                this.completeCurrentLine();
            }
            
            return { 
                valid: true, 
                expected: expectedMove,
                isComplete: isComplete,
                shouldPlayComputer: shouldPlayComputer
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
        if (!this.currentLine) return null;
        
        return {
            current: this.moveIndex,
            total: this.currentMoves.length,
            percentage: (this.moveIndex / this.currentMoves.length) * 100,
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
            this.loadLine(this.currentLine);
        }
    }
    
    // ============================================
    // MOVE HANDLING (enhanced)
    // ============================================
    
    handleMove(orig, dest) {
        if (!this.canPlayerMove()) {
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
            // If we have an active line, validate the move
            if (this.isLineActive) {
                const validation = this.validateUserMove(move);
                
                if (!validation.valid) {
                    // Wrong move - undo it
                    this.chess.undo();
                    this.updateBoard();
                }
                
                // Notify callback with validation result
                if (this.onMoveCallback) {
                    this.onMoveCallback(move, validation);
                }
                
                // If move was correct and computer should play
                if (validation.valid && validation.shouldPlayComputer) {
                    console.log('User move correct, computer will respond in 800ms');
                    setTimeout(() => {
                        console.log('Computer responding to user move');
                        this.playNextComputerMove();
                    }, 800);
                }
            } else {
                // Free play mode - just notify the move
                if (this.onMoveCallback) {
                    this.onMoveCallback(move, { valid: true, freePlay: true });
                }
            }
            
            this.updateBoard();
        } else {
            this.updateBoard(); // Reset invalid move
        }
    }

    // ============================================
    // PROMOTION HANDLING (existing)
    // ============================================
    
    showPromotionDialog(color) {
        const selector = document.getElementById('promotionSelector');
        if (!selector) return;

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
            
            if (validation.valid && validation.shouldPlayComputer) {
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
    // UTILITIES (existing + enhanced)
    // ============================================
    
    getCurrentColor() {
        return this.chess.turn() === 'w' ? 'white' : 'black';
    }

    getMovableColor() {
        if (this.playerColor === 'both') return this.getCurrentColor();
        if (this.playerColor === this.getCurrentColor()) return this.getCurrentColor();
        return null;
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
        console.log('Chess engine playerColor changed from', this.playerColor, 'to', color);
        this.playerColor = color;
        this.updateBoard();
        
        // If we have an active line and it's now computer's turn, play
        if (this.isLineActive && this.shouldComputerMove()) {
            console.log('After color change, computer should play');
            setTimeout(() => this.playNextComputerMove(), 500);
        }
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