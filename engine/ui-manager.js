// Complete ui-manager.js with PGN annotation support AND BUG FIXES
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
            forwardBtn: document.getElementById('forwardBtn'),
            hintBtn: document.getElementById('hintBtn') 
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
        
        this.config.showPgnAnnotations = true;
        this.config.showAnnotationInfo = false;
        this.config.multipleArrows = true;
        this.config.maxMoves = 3;
        this.config.showHints = true;
        
        this.updatePositionInfo(this.trainer.getCurrentLine());
        this.refreshArrows();
        this.updateMovesList();
        this.updateMoveComment();
        
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

        // --- FIX: Correctly implement the hint event listener ---
        this.trainer.addEventListener('hint', e => {
            const move = e.detail.move;
            console.log(`UI received hint: Drawing arrow from ${move.from} to ${move.to}`);
    
            const engine = this.trainer.chessEngine;
    
            if (engine && engine.board) {
                // Use the CORRECT Chessground function to draw a temporary blue hint arrow
                engine.board.setAutoShapes([{ orig: move.from, dest: move.to, brush: 'blue' }]);
            } else {
                console.error('Cannot draw hint arrow: chessEngine or board object not found.');
            }
        });
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
        if (this.elements.hintBtn) {
            this.elements.hintBtn.addEventListener('click', () => this.trainer.getHint());
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

    // --- FIX: This function now correctly triggers a position load ---
    handleCategoryChanged(data) {
        this.populateLineSelect(data.lines);
        if (this.elements.lineSelect) {
            this.elements.lineSelect.value = 0;
        }
        // This was the missing step: after changing category,
        // we must explicitly tell the trainer to load the first line of the new category.
        this.trainer.selectLine(0);
    }

    handleLineComplete(data) {
        if (this.elements.status) {
            this.elements.status.textContent = 'Line complete! Well done!';
            this.elements.status.classList.add('success');
        }

        if (this.trainer.currentMode === 'spaced_repetition') {
            const card = this.trainer.getCurrentLine();
            if (card) {
                // 1. Tell the SRS manager to advance the stage for the card we just finished.
                this.trainer.srsManager.advanceCardStage(card.id);

                // 2. Automatically load the next position.
                // This will either be the same card on its next stage, or a new card.
                setTimeout(() => {
                    this.trainer.loadCurrentPosition();
                }, 1500); // 1.5 second delay for the user to see the success message
            }
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
        
        if (line && line.comments && line.comments[commentIndex]) {
            comment = line.comments[commentIndex];
        }
        
        if (line && line.annotations && this.config.showAnnotationInfo) {
            const arrows = line.annotations.arrows.length;
            const highlights = line.annotations.highlights.length;
            
            if (arrows > 0 || highlights > 0) {
                comment += ` [📍${arrows} arrows, ${highlights} highlights]`;
            }
        }
        
        this.elements.moveComment.textContent = comment;
    }
    
// INSIDE ui-manager.js
// REPLACE your entire refreshArrows function with this one.

// In /engine/ui-manager.js

    // REPLACE your existing refreshArrows function with this one
    refreshArrows() {
        this.clearArrows();
        const line = this.trainer.getCurrentLine();
        
        // Only run arrow logic if we have a valid line and are in an appropriate mode
        if (!line || (this.trainer.currentMode !== 'theory' && this.trainer.currentMode !== 'spaced_repetition')) {
            return;
        }

        // --- NEW: Stage-aware logic ---
        const stage = (this.trainer.currentMode === 'spaced_repetition') ? (line.reviewStage || 1) : 1;

        if (stage === 1) {
            // STAGE 1 ("Theory"): Show all guiding arrows (green/yellow/blue)
            if (line.computedMoves) {
                const progress = this.trainer.getProgress().chessProgress;
                const shapes = this.createArrowShapes(line.computedMoves, progress.current);
                if (shapes.length > 0) this.trainer.chessEngine.board.setAutoShapes(shapes);
            }
        } else if (stage === 2) {
            // STAGE 2 ("Piece Hint"): Highlight the starting square of the next move
            const progress = this.trainer.getProgress().chessProgress;
            const nextMoveSan = line.moves[progress.current];
            if (nextMoveSan) {
                // We need to find the 'from' square. The simplest way is to ask chess.js
                const tempChess = new Chess(this.trainer.chessEngine.chess.fen());
                const moveObject = tempChess.move(nextMoveSan, { sloppy: true });
                if (moveObject) {
                    const fromSquare = moveObject.from;
                    this.trainer.chessEngine.board.setAutoShapes([{ orig: fromSquare, brush: 'yellow' }]);
                }
            }
        } else if (stage === 3) {
            // STAGE 3 ("No Assistance"): Do nothing.
            return;
        }
    }

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
                color = playerMovesShown === 0 ? 'green' : 'yellow';
                playerMovesShown++;
            } else {
                color = 'blue';
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

    isPlayerMove(moveIndex) {
        const playerColor = this.trainer.chessEngine.playerColor;
        if (playerColor === 'both') return true;
        
        const line = this.trainer.getCurrentLine();
        if (!line || !line.computedMoves || !line.computedMoves[moveIndex]) return false;
        
        const move = line.computedMoves[moveIndex];
        const moveColor = move.isWhiteMove ? 'white' : 'black';
        
        return playerColor === moveColor;
    }

    createPgnAnnotationShapes(line, currentIndex) {
        const shapes = [];
        if (!line.annotations || !line.annotations.arrows) { return shapes; }
        
        for (const arrow of line.annotations.arrows) {
            const brush = this.mapPgnColorToBrush(arrow.color);
            shapes.push({ orig: arrow.from, dest: arrow.to, brush: brush });
        }
        
        if (line.annotations.highlights) {
            for (const highlight of line.annotations.highlights) {
                shapes.push({ orig: highlight.square, brush: this.mapPgnColorToBrush(highlight.color) });
            }
        }
        return shapes;
    }

    mapPgnColorToBrush(pgnColor) {
        const colorMap = {
            'green': 'paleGreen',
            'red': 'red',
            'yellow': 'paleBlue',
            'blue': 'purple',
            'orange': 'orange'
        };
        return colorMap[pgnColor] || 'paleGreen';
    }

    togglePgnAnnotations() {
        this.config.showPgnAnnotations = !this.config.showPgnAnnotations;
        this.refreshArrows();
        const status = this.config.showPgnAnnotations ? 'enabled' : 'disabled';
        console.log(`🔸 PGN annotations ${status}`);
        
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