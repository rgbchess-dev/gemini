// /engine/ui-manager.js - FINAL CORRECTED VERSION

export class UIManager {
    constructor(trainer) {
        this.trainer = trainer;
        this.elements = {};
        this.config = { multipleArrows: true, maxMoves: 3, showHints: true };
        this.setup();
    }
    
    setup() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDomReady());
        } else { this.onDomReady(); }
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
        this.updatePositionInfo(this.trainer.getCurrentLine());
        this.refreshArrows();
        this.updateMovesList();
        this.updateMoveComment();
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
        this.elements.modeSelect.addEventListener('change', () => this.trainer.setMode(this.elements.modeSelect.value));
        this.elements.categorySelect.addEventListener('change', () => this.trainer.setCategory(this.elements.categorySelect.value));
        this.elements.lineSelect.addEventListener('change', () => this.trainer.selectLine(parseInt(this.elements.lineSelect.value)));
        this.elements.colorSelect.addEventListener('change', () => this.trainer.setPlayerColor(this.elements.colorSelect.value));
        this.elements.prevLineBtn.addEventListener('click', () => this.trainer.previousLine());
        this.elements.nextLineBtn.addEventListener('click', () => this.trainer.nextLine());
        this.elements.resetBtn.addEventListener('click', () => this.trainer.resetPosition());
        this.elements.flipBtn.addEventListener('click', () => this.trainer.flipBoard());
        this.elements.backBtn.addEventListener('click', () => this.trainer.stepBackward());
        this.elements.forwardBtn.addEventListener('click', () => this.trainer.stepForward());
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
        this.elements.lineSelect.value = data.lineIndex;
        this.updateMovesList();
        this.updateMoveComment();
        this.refreshArrows();
        if (this.elements.status) {
            this.elements.status.textContent = 'Ready';
            this.elements.status.classList.remove('success', 'error');
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
            setTimeout(() => { this.elements.successMessage.classList.remove('show'); }, 3000);
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
        if (line && line.comments && line.comments[commentIndex]) {
            this.elements.moveComment.textContent = line.comments[commentIndex];
        }
    }
    
    // --- ARROW FUNCTIONS RESTORED TO CORRECT VERSION ---
    refreshArrows() {
        try {
            this.clearArrows();
            if (!this.config.multipleArrows || this.trainer.currentMode !== 'theory') { return; }
            const playerColor = this.trainer.chessEngine.playerColor;
            const currentTurn = this.trainer.chessEngine.getCurrentColor();
            if (playerColor !== 'both' && playerColor !== currentTurn) { return; }

            const line = this.trainer.getCurrentLine();
            const progress = this.trainer.getProgress().chessProgress;
            const currentIndex = progress.current;
            
            if (!line || !line.computedMoves || currentIndex >= line.computedMoves.length) {
                return;
            }

            const shapes = this.createArrowShapes(line.computedMoves, currentIndex);
            if (shapes.length > 0) {
                this.trainer.chessEngine.board.setAutoShapes(shapes);
            }
        } catch (error) {
            console.error('❌ Arrow error:', error);
        }
    }

    createArrowShapes(computedMoves, startIndex) {
        const shapes = [];
        const maxMoves = Math.min(this.config.maxMoves, computedMoves.length - startIndex);
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

    isPlayerMove(moveIndex) {
        const playerColor = this.trainer.chessEngine.playerColor;
        if (playerColor === 'both') return true;
        
        const line = this.trainer.getCurrentLine();
        if (!line || !line.computedMoves || !line.computedMoves[moveIndex]) return false;
        
        const move = line.computedMoves[moveIndex];
        const moveColor = move.isWhiteMove ? 'white' : 'black';
        
        return playerColor === moveColor;
    }

    clearArrows() {
        if (this.trainer.chessEngine.board) {
            this.trainer.chessEngine.board.setAutoShapes([]);
        }
    }
    
    populateCategorySelect(categories) {
        if(this.elements.categorySelect) {
            this.elements.categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }
    }
    
    populateLineSelect(lines) {
        if(this.elements.lineSelect) {
            this.elements.lineSelect.innerHTML = lines.map((line, idx) => `<option value="${idx}">${line.name || `Line ${idx + 1}`}</option>`).join('');
        }
    }
    
    updatePositionInfo(line) {
        if (line && this.elements.positionInfo) {
            const infoContainer = this.elements.positionInfo.querySelector('div');
            if (infoContainer) {
                infoContainer.innerHTML = `<h4>${line.name || ''}</h4><p>${line.description || ''}</p>`;
            } else {
                this.elements.positionInfo.innerHTML = `<div><h4>${line.name || ''}</h4><p>${line.description || ''}</p></div><p id="moveComment" style="font-style: italic; color: #aaa; margin-top: 10px;"></p>`;
            }
            this.elements.moveComment = document.getElementById('moveComment');
        }
    }
}