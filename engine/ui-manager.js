// /engine/ui-manager.js - FINAL VERSION WITH LINE COMPLETE MESSAGE

export class UIManager {
    constructor(trainer) {
        // ... (constructor is unchanged) ...
        this.trainer = trainer;
        this.elements = {};
        this.config = {
            multipleArrows: true,
            maxMoves: 3,
            showHints: true
        };
        this.setup();
    }
    
    // ... (setup, onDomReady, initializeElements are unchanged) ...
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
            progressFill: document.getElementById('progressFill'),
            moveComment: document.getElementById('moveComment')
        };
    }

    performInitialUpdate() {
        // ... (this function is unchanged) ...
        const state = this.trainer.getProgress();
        this.populateCategorySelect(this.trainer.getAvailableCategories());
        this.populateLineSelect(this.trainer.getCurrentLines());
        if(this.elements.modeSelect) this.elements.modeSelect.value = state.mode;
        if(this.elements.colorSelect) this.elements.colorSelect.value = this.trainer.options.defaultColor;
        if(this.elements.categorySelect) this.elements.categorySelect.value = state.category;
        if(this.elements.lineSelect) this.elements.lineSelect.value = state.lineIndex;
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
        // --- NEW ---
        this.trainer.addEventListener('lineComplete', () => this.handleLineComplete());
    }

    // --- NEW FUNCTION ---
    handleLineComplete() {
        // Update the main status bar
        if (this.elements.status) {
            this.elements.status.textContent = 'Line complete! Well done!';
            this.elements.status.classList.add('success');
        }

        // Show the pop-up success message
        if (this.elements.successMessage) {
            this.elements.successMessage.textContent = 'Line Complete!';
            this.elements.successMessage.classList.add('show');

            // Hide the message after 3 seconds
            setTimeout(() => {
                this.elements.successMessage.classList.remove('show');
            }, 3000);
        }
    }
    
    // ... (rest of the file is unchanged) ...
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
        this.updateMovesList();
        this.updateMoveComment(); 

        // --- ADDED --- Reset status text when a new position loads
        if (this.elements.status) {
            this.elements.status.textContent = 'Ready';
            this.elements.status.classList.remove('success', 'error');
        }
    }
    
    handleCorrectMove() {
        this.clearArrows();
        setTimeout(() => this.refreshArrows(), 100);
        this.updateMovesList();
        this.updateMoveComment();
    }
    
    handleComputerMove() {
        this.refreshArrows();
        this.updateMovesList();
        this.updateMoveComment();
    }

    handleLineChanged(data) {
        this.updatePositionInfo(data.line);
        this.elements.lineSelect.value = data.lineIndex;
        this.refreshArrows();
        this.updateMovesList();
        this.updateMoveComment();

        // --- ADDED --- Also reset status when the line is changed manually
        if (this.elements.status) {
            this.elements.status.textContent = 'Ready';
            this.elements.status.classList.remove('success', 'error');
        }
    }

    handleCategoryChanged(data) {
        this.populateLineSelect(data.lines);
        this.elements.lineSelect.value = 0;
        this.updatePositionInfo(this.trainer.getCurrentLine());
        this.refreshArrows();
        this.updateMovesList();
        this.updateMoveComment();
    }

    updateMovesList() {
        if (!this.elements.movesList) return;
        const history = this.trainer.chessEngine.chess.history();
        if (history.length > 0) {
            let formattedMoves = '';
            for (let i = 0; i < history.length; i++) {
                if (i % 2 === 0) {
                    const moveNumber = Math.floor(i / 2) + 1;
                    formattedMoves += `${moveNumber}. ${history[i]} `;
                } else {
                    formattedMoves += `${history[i]} `;
                }
            }
            this.elements.movesList.textContent = formattedMoves.trim();
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
            if (!line || !line.moves || currentIndex >= line.moves.length) { return; }
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
        const tempChess = new Chess(this.trainer.chessEngine.chess.fen());
        let computerMovesShown = 0;
        let playerMovesShown = 0;
        for (let i = 0; i < maxMoves; i++) {
            const moveNotation = moves[startIndex + i];
            if (!moveNotation) continue;
            try {
                const legalMoves = tempChess.moves({ verbose: true });
                let targetMove = legalMoves.find(move => move.san === moveNotation);
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
                        color = playerMovesShown === 0 ? 'green' : 'yellow';
                        playerMovesShown++;
                    } else {
                        color = computerMovesShown === 0 ? 'blue' : null;
                        if (computerMovesShown === 0) computerMovesShown++;
                    }
                    if (color) {
                        shapes.push({ orig: targetMove.from, dest: targetMove.to, brush: color });
                        if (targetMove.captured && this.config.showHints) {
                            shapes.push({ orig: targetMove.to, brush: 'red' });
                        }
                    }
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

    isPlayerMove(moveIndex) {
        const playerColor = this.trainer.chessEngine.playerColor;
        if (playerColor === 'both') return true;
        const progress = this.trainer.getProgress().chessProgress;
        const currentIndex = progress.current;
        const offset = moveIndex - currentIndex;
        const currentTurn = this.trainer.chessEngine.getCurrentColor();
        let moveColor;
        if (offset === 0) {
            moveColor = currentTurn;
        } else {
            moveColor = (offset % 2 === 0) ? currentTurn : (currentTurn === 'white' ? 'black' : 'white');
        }
        return playerColor === moveColor;
    }

    clearArrows() {
        if (this.trainer.chessEngine.board) {
            this.trainer.chessEngine.board.setAutoShapes([]);
        }
    }
    
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
            this.elements.positionInfo.innerHTML = `<h4>${line.name || ''}</h4><p>${line.description || ''}</p><p id="moveComment" style="font-style: italic; color: #aaa; margin-top: 10px;"></p>`;
            this.elements.moveComment = document.getElementById('moveComment');
        }
    }
}