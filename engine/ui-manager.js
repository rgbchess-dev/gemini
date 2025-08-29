// /engine/ui-manager.js - FIXED VERSION - Complete File

export class UIManager {
    constructor(trainer) {
        this.trainer = trainer;
        this.elements = {};
        
        // Simple, reliable config
        this.config = {
            multipleArrows: true,
            maxMoves: 3,
            showHints: true
        };
        
        this.setup();
    }
    
    setup() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDomReady());
        } else {
            this.onDomReady();
        }
    }
    
    onDomReady() {
        this.initializeElements();
        this.attachTrainerListeners();
        this.attachUIListeners();
        this.performInitialUpdate();
        console.log('✅ UI Manager loaded');
    }
    
    initializeElements() {
        this.elements = {
            modeSelect: document.getElementById('modeSelect'),
            categorySelect: document.getElementById('categorySelect'),
            categoryLabel: document.getElementById('categoryLabel'),
            lineSelect: document.getElementById('lineSelect'),
            colorSelect: document.getElementById('colorSelect'),
            prevLineBtn: document.getElementById('prevLineBtn'),
            nextLineBtn: document.getElementById('nextLineBtn'),
            hintBtn: document.getElementById('hintBtn'),
            resetBtn: document.getElementById('resetBtn'),
            flipBtn: document.getElementById('flipBtn'),
            positionInfo: document.getElementById('positionInfo'),
            status: document.getElementById('status'),
            movesList: document.getElementById('movesList'),
            successMessage: document.getElementById('successMessage'),
            errorMessage: document.getElementById('errorMessage'),
            progressFill: document.getElementById('progressFill')
        };
    }

    performInitialUpdate() {
        const state = this.trainer.getProgress();
        this.populateCategorySelect(this.trainer.getAvailableCategories());
        this.populateLineSelect(this.trainer.getCurrentLines());
        if(this.elements.modeSelect) this.elements.modeSelect.value = state.mode;
        if(this.elements.colorSelect) this.elements.colorSelect.value = this.trainer.options.defaultColor;
        if(this.elements.categorySelect) this.elements.categorySelect.value = state.category;
        if(this.elements.lineSelect) this.elements.lineSelect.value = state.lineIndex;
        this.updatePositionInfo(this.trainer.getCurrentLine());
        this.refreshArrows();
    }
    
    attachTrainerListeners() {
        this.trainer.addEventListener('positionLoaded', e => this.handlePositionLoaded(e.detail));
        this.trainer.addEventListener('correctMove', () => this.handleCorrectMove());
        this.trainer.addEventListener('computerMove', () => this.handleComputerMove());
        this.trainer.addEventListener('lineChanged', e => this.handleLineChanged(e.detail));
        this.trainer.addEventListener('categoryChanged', e => this.handleCategoryChanged(e.detail));
    }
    
    attachUIListeners() {
        this.elements.modeSelect.addEventListener('change', () => this.trainer.setMode(this.elements.modeSelect.value));
        this.elements.categorySelect.addEventListener('change', () => this.trainer.setCategory(this.elements.categorySelect.value));
        this.elements.lineSelect.addEventListener('change', () => this.trainer.selectLine(parseInt(this.elements.lineSelect.value)));
        this.elements.colorSelect.addEventListener('change', () => this.trainer.setPlayerColor(this.elements.colorSelect.value));
        this.elements.prevLineBtn.addEventListener('click', () => this.trainer.previousLine());
        this.elements.nextLineBtn.addEventListener('click', () => this.trainer.nextLine());
        this.elements.resetBtn.addEventListener('click', () => this.trainer.resetPosition());
        this.elements.flipBtn.addEventListener('click', () => this.trainer.flipBoard());
    }
    
    handlePositionLoaded(data) {
        this.updatePositionInfo(data.line);
        this.refreshArrows();
    }
    
    handleCorrectMove() {
        this.clearArrows();
        setTimeout(() => this.refreshArrows(), 100);
    }
    
    handleComputerMove() {
        this.refreshArrows();
    }

    handleLineChanged(data) {
        this.updatePositionInfo(data.line);
        this.elements.lineSelect.value = data.lineIndex;
        this.refreshArrows();
    }

    handleCategoryChanged(data) {
        this.populateLineSelect(data.lines);
        this.elements.lineSelect.value = 0;
        this.updatePositionInfo(this.trainer.getCurrentLine());
        this.refreshArrows();
    }

    // ============================================
    // FIXED ARROW SYSTEM - MAIN LOGIC
    // ============================================
    
    refreshArrows() {
        try {
            this.clearArrows();
            
            if (!this.config.multipleArrows || this.trainer.currentMode !== 'theory') {
                return;
            }

            // CRITICAL FIX: Only show arrows when it's player's turn
            const playerColor = this.trainer.chessEngine.playerColor;
            const currentTurn = this.trainer.chessEngine.getCurrentColor();
            
            if (playerColor !== 'both' && playerColor !== currentTurn) {
                return; // Computer's turn - no arrows
            }

            const line = this.trainer.getCurrentLine();
            const progress = this.trainer.getProgress().chessProgress;
            const currentIndex = progress.current;
            
            if (!line || !line.moves || currentIndex >= line.moves.length) {
                return;
            }

            const shapes = this.createArrowShapes(line.moves, currentIndex);
            
            if (shapes.length > 0) {
                this.trainer.chessEngine.board.setAutoShapes(shapes);
            }
            
        } catch (error) {
            console.error('❌ Arrow error:', error);
        }
    }

    createArrowShapes(moves, startIndex) {
        const shapes = [];
        const maxMoves = Math.min(this.config.maxMoves, moves.length - startIndex);
        
        // Create a temporary chess instance to simulate moves
        const tempChess = new Chess(this.trainer.chessEngine.chess.fen());
        
        // Track computer move count to show blue arrow for first computer move only
        let computerMovesShown = 0;
        let playerMovesShown = 0;
        
        for (let i = 0; i < maxMoves; i++) {
            const moveNotation = moves[startIndex + i];
            if (!moveNotation) continue;
            
            try {
                // Get legal moves in current position
                const legalMoves = tempChess.moves({ verbose: true });
                
                // Find the move that matches our notation
                let targetMove = legalMoves.find(move => move.san === moveNotation);
                
                // Try without check/checkmate symbols
                if (!targetMove) {
                    const cleanNotation = moveNotation.replace(/[+#]$/, '');
                    targetMove = legalMoves.find(move => 
                        move.san === cleanNotation || 
                        move.san.replace(/[+#]$/, '') === cleanNotation
                    );
                }
                
                if (targetMove) {
                    const isPlayerMove = this.isPlayerMove(startIndex + i);
                    let color;
                    
                    if (isPlayerMove) {
                        // Player moves: green for first, yellow for others
                        color = playerMovesShown === 0 ? 'green' : 'yellow';
                        playerMovesShown++;
                    } else {
                        // Computer moves: blue for FIRST computer move only
                        color = computerMovesShown === 0 ? 'blue' : null;
                        if (computerMovesShown === 0) computerMovesShown++;
                    }
                    
                    if (color) {
                        // Main arrow
                        shapes.push({
                            orig: targetMove.from,
                            dest: targetMove.to,
                            brush: color
                        });
                        
                        // Capture indicator
                        if (targetMove.captured && this.config.showHints) {
                            shapes.push({
                                orig: targetMove.to,
                                brush: 'red'
                            });
                        }
                    }
                    
                    // Make the move in temp board for next iteration
                    tempChess.move(moveNotation, { sloppy: true });
                } else {
                    console.warn('⚠️ Could not parse move:', moveNotation);
                }
                
            } catch (error) {
                console.warn('⚠️ Move parsing error:', error);
                continue;
            }
        }
        
        return shapes;
    }

    // FIXED: Determine if a move belongs to player or computer (works for both White and Black)
    isPlayerMove(moveIndex) {
        const playerColor = this.trainer.chessEngine.playerColor;
        if (playerColor === 'both') return true;
        
        // Get the current position to determine who moves at this point in the sequence
        const progress = this.trainer.getProgress().chessProgress;
        const currentIndex = progress.current;
        
        // Calculate the offset from current position
        const offset = moveIndex - currentIndex;
        
        // Get who's turn it is right now (at currentIndex)
        const currentTurn = this.trainer.chessEngine.getCurrentColor();
        
        // Determine who makes the move at moveIndex
        let moveColor;
        if (offset === 0) {
            // This is the current move
            moveColor = currentTurn;
        } else {
            // Alternate colors from current turn
            moveColor = (offset % 2 === 0) ? currentTurn : (currentTurn === 'white' ? 'black' : 'white');
        }
        
        return playerColor === moveColor;
    }

    clearArrows() {
        if (this.trainer.chessEngine.board) {
            this.trainer.chessEngine.board.setAutoShapes([]);
        }
    }

    // ============================================
    // UI UTILITIES
    // ============================================
    
    populateCategorySelect(categories) {
        if(this.elements.categorySelect) {
            this.elements.categorySelect.innerHTML = categories.map(cat => 
                `<option value="${cat}">${cat}</option>`
            ).join('');
        }
    }
    
    populateLineSelect(lines) {
        if(this.elements.lineSelect) {
            this.elements.lineSelect.innerHTML = lines.map((line, idx) => 
                `<option value="${idx}">${line.name || `Line ${idx + 1}`}</option>`
            ).join('');
        }
    }
    
    updatePositionInfo(line) {
        if (line && this.elements.positionInfo) {
            this.elements.positionInfo.innerHTML = `<h4>${line.name || ''}</h4><p>${line.description || ''}</p>`;
        }
    }
}