// /engine/ui-manager.js - FINAL STABLE VERSION

export class UIManager {
    constructor(trainer) {
        this.trainer = trainer;
        this.elements = {};
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
        console.log('UI Manager: Setup complete and stable.');
    }
    
    initializeElements() {
        this.elements = {
            modeSelect: document.getElementById('modeSelect'), categorySelect: document.getElementById('categorySelect'),
            categoryLabel: document.getElementById('categoryLabel'), lineSelect: document.getElementById('lineSelect'),
            colorSelect: document.getElementById('colorSelect'), prevLineBtn: document.getElementById('prevLineBtn'),
            nextLineBtn: document.getElementById('nextLineBtn'), hintBtn: document.getElementById('hintBtn'),
            resetBtn: document.getElementById('resetBtn'), flipBtn: document.getElementById('flipBtn'),
            positionInfo: document.getElementById('positionInfo'), status: document.getElementById('status'),
            movesList: document.getElementById('movesList'), successMessage: document.getElementById('successMessage'),
            errorMessage: document.getElementById('errorMessage'), progressFill: document.getElementById('progressFill')
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
        this.showNextMoveHint();
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
        this.showNextMoveHint();
    }
    
    handleCorrectMove() {
        this.clearMoveHints();
    }
    
    handleComputerMove() {
        this.showNextMoveHint();
    }

    handleLineChanged(data) {
        this.updatePositionInfo(data.line);
        this.elements.lineSelect.value = data.lineIndex;
        this.showNextMoveHint();
    }

    handleCategoryChanged(data) {
        this.populateLineSelect(data.lines);
        this.elements.lineSelect.value = 0;
        this.updatePositionInfo(this.trainer.getCurrentLine());
        this.showNextMoveHint();
    }

    // ============================================
    // STABLE VISUAL HINTING (SINGLE MOVE ONLY)
    // ============================================
    showNextMoveHint() {
        this.clearMoveHints();
        if (this.trainer.currentMode !== 'theory') return;

        const line = this.trainer.getCurrentLine();
        const moveIndex = this.trainer.getProgress().chessProgress.current;

        // CRITICAL SAFETY CHECK: This is the only array access. It's safe.
        const moveData = line?.computedMoves?.[moveIndex];

        // Only draw shapes if the moveData object is valid and has the keys we need.
        if (moveData && moveData.from && moveData.to && this.trainer.chessEngine.canPlayerMove()) {
            const shapes = [
                { orig: moveData.from, dest: moveData.to, brush: 'green' },
                { orig: moveData.to, brush: moveData.isCapture ? 'red' : 'green' }
            ];
            this.trainer.chessEngine.board.setAutoShapes(shapes);
        }
    }

    clearMoveHints() {
        if (this.trainer.chessEngine.board) this.trainer.chessEngine.board.setAutoShapes([]);
    }
    
    // ============================================
    // UI UTILITIES
    // ============================================
    populateCategorySelect(categories) {
        if(this.elements.categorySelect) this.elements.categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }
    populateLineSelect(lines) {
        if(this.elements.lineSelect) this.elements.lineSelect.innerHTML = lines.map((line, idx) => `<option value="${idx}">${line.name || `Line ${idx + 1}`}</option>`).join('');
    }
    updatePositionInfo(line) {
        if (line && this.elements.positionInfo) this.elements.positionInfo.innerHTML = `<h4>${line.name || ''}</h4><p>${line.description || ''}</p>`;
    }
}