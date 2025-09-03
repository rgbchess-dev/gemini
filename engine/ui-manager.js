// Complete ui-manager.js with PGN annotation support
// Replace your existing ui-manager.js with this complete version

export class UIManager {
    constructor(trainer) {
        this.trainer = trainer;
        this.elements = {};
        this.config = { 
            multipleArrows: true, 
            maxMoves: 3, 
            showHints: true,
            showPgnAnnotations: true,
            showAnnotationInfo: false
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
    }
    
    initializeElements() {
        this.elements = {
            modeSelect: document.getElementById('modeSelect'),
            categorySelect: document.getElementById('categorySelect'),
            lineSelect: document.getElementById('lineSelect'),
            colorSelect: document.getElementById('colorSelect'),
            prevLineBtn: document.getElementById('prevLineBtn'),
            nextLineBtn: document.getElementById('nextLineBtn'),
            resetBtn: document.getElementById('resetBtn'),
            flipBtn: document.getElementById('flipBtn'),
            status: document.getElementById('status'),
            movesList: document.getElementById('movesList'),
            successMessage: document.getElementById('successMessage'),
            errorMessage: document.getElementById('errorMessage'),
            progressFill: document.getElementById('progressFill'),
            positionInfo: document.getElementById('positionInfo'),
            moveComment: document.getElementById('moveComment'),
            backBtn: document.getElementById('backBtn'),
            forwardBtn: document.getElementById('forwardBtn')
        };
    }

    performInitialUpdate() {
        const state = this.trainer.getProgress();
        this.populateCategorySelect(this.trainer.getAvailableCategories());
        this.populateLineSelect(this.trainer.getCurrentLines());
        
        if (this.elements.modeSelect) this.elements.modeSelect.value = state.mode;
        if (this.elements.colorSelect) this.elements.colorSelect.value = this.trainer.options.defaultColor;
        if (this.elements.categorySelect) this.elements.categorySelect.value = state.category;
        if (this.elements.lineSelect) this.elements.lineSelect.value = state.lineIndex;
        
        // Enhanced configuration for PGN support
        this.config.showPgnAnnotations = true;     // Enable PGN arrows by default
        this.config.showAnnotationInfo = false;    // Set to true for debugging
        this.config.multipleArrows = true;         // Keep standard arrows enabled
        this.config.maxMoves = 3;                  // Standard arrow settings
        this.config.showHints = true;
        
        this.updatePositionInfo(this.trainer.getCurrentLine());
        this.refreshArrows();
        this.updateMovesList();
        this.updateMoveComment();
        
        // Log annotation support status
        const currentLine = this.trainer.getCurrentLine();
        if (currentLine && currentLine.annotations) {
            console.log(`🔸 Line "${currentLine.name}" has PGN annotations:`, {
                arrows: currentLine.annotations.arrows.length,
                highlights: currentLine.annotations.highlights.length,
                comments: currentLine.annotations.comments.length
            });
        }
    }
    
    attachTrainerListeners() {
        this.trainer.addEventListener('positionLoaded', e => this.handlePositionLoaded(e.detail));
        this.trainer.addEventListener('correctMove', () => this.handleCorrectMove());
        this.trainer.addEventListener('computerMove', () => this.handleComputerMove());
        this.trainer.addEventListener('lineChanged', e => this.handleLineChanged(e.detail));
        this.trainer.addEventListener('categoryChanged', e => this.handleCategoryChanged(e.detail));
        this.trainer.addEventListener('lineComplete', e => this.handleLineComplete(e.detail));
        this.trainer.addEventListener('stepped', () => this.handleStep());
    }

    attachUIListeners() {
        if (this.elements.modeSelect) {
            this.elements.modeSelect.addEventListener('change', () => 
                this.trainer.setMode(this.elements.modeSelect.value));
        }
        if (this.elements.categorySelect) {
            this.elements.categorySelect.addEventListener('change', () => 
                this.trainer.setCategory(this.elements.categorySelect.value));
        }
        if (this.elements.lineSelect) {
            this.elements.lineSelect.addEventListener('change', () => 
                this.trainer.selectLine(parseInt(this.elements.lineSelect.value)));
        }
        if (this.elements.colorSelect) {
            this.elements.colorSelect.addEventListener('change', () => 
                this.trainer.setPlayerColor(this.elements.colorSelect.value));
        }
        if (this.elements.prevLineBtn) {
            this.elements.prevLineBtn.addEventListener('click', () => this.trainer.previousLine());
        }
        if (this.elements.nextLineBtn) {
            this.elements.nextLineBtn.addEventListener('click', () => this.trainer.nextLine());
        }
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.trainer.resetPosition());
        }
        if (this.elements.flipBtn) {
            this.elements.flipBtn.addEventListener('click', () => this.trainer.flipBoard());
        }
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', () => this.trainer.stepBackward());
        }
        if (this.elements.forwardBtn) {
            this.elements.forwardBtn.addEventListener('click', () => this.trainer.stepForward());
        }
    }
    
    handlePositionLoaded(data) {
        this.updatePositionInfo(data.line);
        this.updateMovesList();
        this.updateMoveComment(); 
        this.refreshArrows();
        if (this.elements.status) {
            this.elements.status.textContent = 'Ready';
            this.elements.status.classList.remove('success', 'error');
        }
    }
    
    handleCorrectMove() {
        this.clearArrows();
        this.refreshArrows();
        this.updateMovesList();
        this.updateMoveComment();
    }
    
    handleComputerMove() {
        this.updateMovesList();
        this.updateMoveComment();
        this.refreshArrows();
    }

    handleLineChanged(data) {
        this.updatePositionInfo(data.line);
        if (this.elements.lineSelect) {
            this.elements.lineSelect.value = data.lineIndex;
        }
        this.updateMovesList();
        this.updateMoveComment();
        this.refreshArrows();
        if (this.elements.status) {
            this.elements.status.textContent = 'Ready';
            this.elements.status.classList.remove('success', 'error');
        }
    }

    handleCategoryChanged(data) {
        this.populateLineSelect(data.lines);
        if (this.elements.lineSelect) {
            this.elements.lineSelect.value = 0;
        }
    }

    handleLineComplete(data) {
        if (this.elements.status) {
            this.elements.status.textContent = 'Line complete! Well done!';
            this.elements.status.classList.add('success');
        }
        if (this.elements.successMessage) {
            this.elements.successMessage.textContent = 'Line Complete!';
            this.elements.successMessage.classList.add('show');
            setTimeout(() => { 
                this.elements.successMessage.classList.remove('show'); 
            }, 3000);
        }
    }

    handleStep() {
        this.updateMovesList();
        this.updateMoveComment();
        this.refreshArrows();
    }
    
    updateMovesList() {
        if (!this.elements.movesList) return;
        
        const progress = this.trainer.getProgress().chessProgress;
        const history = this.trainer.chessEngine.chess.history().slice(0, progress.current);
        
        if (history.length > 0) {
            // OPTIMIZED: Use array join instead of string concatenation
            const moves = [];
            for (let i = 0; i < history.length; i++) {
                if (i % 2 === 0) {
                    const moveNumber = Math.floor(i / 2) + 1;
                    moves.push(`${moveNumber}.${history[i]}`);
                } else { 
                    moves.push(history[i]); 
                }
            }
            this.elements.movesList.textContent = moves.join(' ');
        } else { 
            this.elements.movesList.textContent = 'Moves will appear here...'; 
        }
    }

    updateMoveComment() {
        if (!this.elements.moveComment) return;
        
        const line = this.trainer.getCurrentLine();
        const progress = this.trainer.getProgress().chessProgress;
        const commentIndex = progress.current > 0 ? progress.current - 1 : 0;
        
        let comment = '';
        
        // Get regular comment (cleaned of annotations)
        if (line && line.comments && line.comments[commentIndex]) {
            comment = line.comments[commentIndex];
        }
        
        // Add annotation info for debugging (optional)
        if (line && line.annotations && this.config.showAnnotationInfo) {
            const arrows = line.annotations.arrows.length;
            const highlights = line.annotations.highlights.length;
            
            if (arrows > 0 || highlights > 0) {
                comment += ` [📍${arrows} arrows, ${highlights} highlights]`;
            }
        }
        
        this.elements.moveComment.textContent = comment;
    }
    
    // COMPLETE refreshArrows method with dual arrow system:
    refreshArrows() {
        try {
            this.clearArrows();
            if (this.trainer.currentMode !== 'theory') { 
                return; 
            }
            
            const playerColor = this.trainer.chessEngine.playerColor;
            const currentTurn = this.trainer.chessEngine.getCurrentColor();
            
            const line = this.trainer.getCurrentLine();
            const progress = this.trainer.getProgress().chessProgress;
            const currentIndex = progress.current;
            
            if (!line) {
                return;
            }

            const shapes = [];
            
            // 1. Add PGN annotation arrows (DISTINCT COLORS - highest priority)
            if (line.annotations && line.annotations.arrows && this.config.showPgnAnnotations !== false) {
                const pgnArrows = this.createPgnAnnotationShapes(line, currentIndex);
                shapes.push(...pgnArrows);
                if (pgnArrows.length > 0) {
                    console.log(`🔸 Added ${pgnArrows.length} PGN annotation arrows`);
                }
            }
            
            // 2. Add computed move arrows (STANDARD COLORS - if enabled and applicable)
            if (this.config.multipleArrows && 
                (playerColor === 'both' || playerColor === currentTurn)) {
                
                if (line.computedMoves && currentIndex < line.computedMoves.length) {
                    const moveArrows = this.createArrowShapes(line.computedMoves, currentIndex);
                    shapes.push(...moveArrows);
                    if (moveArrows.length > 0) {
                        console.log(`🎯 Added ${moveArrows.length} computed move arrows`);
                    }
                }
            }
            
            // Apply all shapes to the board
            if (shapes.length > 0) {
                this.trainer.chessEngine.board.setAutoShapes(shapes);
            }
            
        } catch (error) {
            console.error('❌ Arrow error:', error);
        }
    }

    // RESTORE missing createArrowShapes method (STANDARD TOOL ARROWS):
    createArrowShapes(computedMoves, startIndex) {
        const shapes = [];
        const maxMoves = Math.min(this.config.maxMoves || 3, computedMoves.length - startIndex);
        let playerMovesShown = 0;
        
        for (let i = 0; i < maxMoves; i++) {
            const move = computedMoves[startIndex + i];
            if (!move) continue;

            const isPlayerMove = this.isPlayerMove(startIndex + i);
            let color;

            if (isPlayerMove) {
                // STANDARD TOOL COLORS for computed moves
                color = playerMovesShown === 0 ? 'green' : 'yellow';
                playerMovesShown++;
            } else {
                color = 'blue'; // Computer moves are always blue
            }
            
            if (color) {
                shapes.push({ orig: move.from, dest: move.to, brush: color });
                if (move.isCapture && this.config.showHints) {
                    shapes.push({ orig: move.to, brush: 'red' });
                }
            }
        }
        return shapes;
    }

    // RESTORE missing isPlayerMove method:
    isPlayerMove(moveIndex) {
        const playerColor = this.trainer.chessEngine.playerColor;
        if (playerColor === 'both') return true;
        
        const line = this.trainer.getCurrentLine();
        if (!line || !line.computedMoves || !line.computedMoves[moveIndex]) return false;
        
        const move = line.computedMoves[moveIndex];
        const moveColor = move.isWhiteMove ? 'white' : 'black';
        
        return playerColor === moveColor;
    }

    /**
     * Create DISTINCT arrow shapes from PGN [%cal] annotations
     */
    createPgnAnnotationShapes(line, currentIndex) {
        const shapes = [];
        
        if (!line.annotations || !line.annotations.arrows) {
            return shapes;
        }
        
        // Show PGN arrows - these use DISTINCT colors from the tool arrows
        for (const arrow of line.annotations.arrows) {
            // Convert PGN annotation color to DISTINCT chessground brush
            const brush = this.mapPgnColorToBrush(arrow.color);
            
            shapes.push({
                orig: arrow.from,
                dest: arrow.to,
                brush: brush
            });
        }
        
        // Add square highlights from PGN [%csl] annotations
        if (line.annotations.highlights) {
            for (const highlight of line.annotations.highlights) {
                shapes.push({
                    orig: highlight.square,
                    brush: this.mapPgnColorToBrush(highlight.color)
                });
            }
        }
        
        return shapes;
    }

    /**
     * Map PGN annotation colors to DISTINCT chessground brush colors
     * These are DIFFERENT from the standard tool colors (green/yellow/blue)
     */
    mapPgnColorToBrush(pgnColor) {
        const colorMap = {
            'green': 'paleGreen',    // PGN green -> pale green (distinct from tool green)
            'red': 'red',            // PGN red -> red
            'yellow': 'paleBlue',    // PGN yellow -> pale blue (distinct from tool yellow)  
            'blue': 'purple',        // PGN blue -> purple (distinct from tool blue)
            'orange': 'orange'       // PGN orange -> orange (if available)
        };
        
        return colorMap[pgnColor] || 'paleGreen';
    }

    // Toggle PGN annotations:
    togglePgnAnnotations() {
        this.config.showPgnAnnotations = !this.config.showPgnAnnotations;
        this.refreshArrows();
        
        const status = this.config.showPgnAnnotations ? 'enabled' : 'disabled';
        console.log(`🔸 PGN annotations ${status}`);
        
        // Show visual feedback
        if (this.elements.status) {
            this.elements.status.textContent = `PGN annotations ${status}`;
            this.elements.status.classList.remove('success', 'error');
            this.elements.status.classList.add('info');
            
            setTimeout(() => {
                if (this.elements.status) {
                    this.elements.status.textContent = 'Ready';
                    this.elements.status.classList.remove('info');
                }
            }, 2000);
        }
    }

    clearArrows() {
        if (this.trainer.chessEngine.board) {
            this.trainer.chessEngine.board.setAutoShapes([]);
        }
    }
    
    populateCategorySelect(categories) {
        if (this.elements.categorySelect) {
            this.elements.categorySelect.innerHTML = categories.map(cat => 
                `<option value="${cat}">${cat}</option>`).join('');
        }
    }
    
    populateLineSelect(lines) {
        if (this.elements.lineSelect) {
            this.elements.lineSelect.innerHTML = lines.map((line, idx) => 
                `<option value="${idx}">${line.name || `Line ${idx + 1}`}</option>`).join('');
        }
    }
    
    updatePositionInfo(line) {
        if (line && this.elements.positionInfo) {
            const infoContainer = this.elements.positionInfo.querySelector('div');
            if (infoContainer) {
                infoContainer.innerHTML = `<h4>${line.name || ''}</h4><p>${line.description || ''}</p>`;
            } else {
                this.elements.positionInfo.innerHTML = `
                    <div>
                        <h4>${line.name || ''}</h4>
                        <p>${line.description || ''}</p>
                    </div>
                    <p id="moveComment" style="font-style: italic; color: #aaa; margin-top: 10px;"></p>`;
            }
            this.elements.moveComment = document.getElementById('moveComment');
        }
    }
}