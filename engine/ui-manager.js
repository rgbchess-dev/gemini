export class UIManager {
    constructor(trainer) {
        this.trainer = trainer;
        this.elements = {};
        this.onDomReady();
    }

    onDomReady() {
        this.initializeElements();
        this.attachTrainerListeners();
        this.attachUIListeners();
        this.performInitialUpdate();
    }

    initializeElements() {
        const ids = ['modeSelect', 'categorySelect', 'lineSelect', 'colorSelect', 'prevLineBtn', 'nextLineBtn', 'resetBtn', 'resetProgressBtn', 'flipBtn', 'status', 'movesList', 'progressFill', 'positionInfo', 'moveComment', 'backBtn', 'forwardBtn', 'hintBtn', 'course-title'];
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (!element) console.error(`UI FATAL ERROR: Element with ID "${id}" not found.`);
            this.elements[id] = element;
        });
    }

    attachTrainerListeners() {
        this.trainer.addEventListener('stepped', () => this.renderCurrentState());
        this.trainer.addEventListener('lineChanged', (e) => this.handleLineChanged(e.detail));
        this.trainer.addEventListener('move', (e) => this.handleUserMove(e.detail));
        this.trainer.addEventListener('computerMove', () => this.renderCurrentState());
        this.trainer.addEventListener('lineComplete', () => this.handleLineComplete());
        this.trainer.addEventListener('modeChanged', () => this.handleModeChanged());
    }

    attachUIListeners() {
        this.elements.modeSelect.addEventListener('change', (e) => this.trainer.setMode(e.target.value));
        this.elements.categorySelect.addEventListener('change', (e) => this.trainer.setCategory(e.target.value));
        this.elements.lineSelect.addEventListener('change', (e) => this.trainer.selectLine(e.target.value));
        this.elements.colorSelect.addEventListener('change', (e) => this.trainer.setPlayerColor(e.target.value));
        this.elements.prevLineBtn.addEventListener('click', () => this.trainer.previousLine());
        this.elements.nextLineBtn.addEventListener('click', () => this.trainer.nextLine());
        this.elements.flipBtn.addEventListener('click', () => this.trainer.flipBoard());
        this.elements.backBtn.addEventListener('click', () => this.trainer.stepBackward());
        this.elements.forwardBtn.addEventListener('click', () => this.trainer.stepForward());
        
    }

    performInitialUpdate() {
        this.elements['course-title'].textContent = this.trainer.courseData.name;
        this.elements.colorSelect.value = this.trainer.chessEngine.playerColor;
        this.updateControlsForMode();
        this.populateCategorySelect();
        this.populateLineSelect();
        this.renderCurrentState();
    }

    renderCurrentState() {
        this.updateControlsForMode();
        this.updateMovesList();
        this.updateMoveComment();
        this.renderAnnotations();
    }
    
    handleLineChanged(data) {
        this.populateLineSelect();
        if(this.elements.lineSelect) this.elements.lineSelect.value = data.lineIndex;
        const lineName = data.line ? data.line.name : 'All lines reviewed for now!';
        const h4 = this.elements.positionInfo.querySelector('h4');
        if (h4) h4.textContent = lineName;
        this.renderCurrentState();
    }
    
    handleModeChanged() {
        this.populateCategorySelect();
    }

    handleUserMove(data) {
        if (data.validation && !data.validation.valid) {
            this.elements.status.textContent = "Incorrect. Try again.";
            setTimeout(() => { this.elements.status.textContent = "Ready"; }, 1500);
        }
        
        // Always re-render to reflect the current state, whether the move
        // was valid or invalid (which can cause a hint stage change).
        this.renderCurrentState();
    }

    handleLineComplete() {
        if (this.elements.status) this.elements.status.textContent = "Line complete!";
        if (this.trainer.currentMode === 'spaced_repetition') {
            const line = this.trainer.getCurrentLine();
            if (line) {
                this.trainer.srsManager.advanceCardStage(line.id);
                setTimeout(() => { this.trainer.loadCurrentPosition(); }, 1200);
            }
        }
    }

    updateControlsForMode() {
        const mode = this.trainer.currentMode;
        const isQuizMode = (mode === 'exercises' || mode === 'spaced_repetition');
        this.elements.backBtn.disabled = isQuizMode;
        this.elements.forwardBtn.disabled = isQuizMode;
    }
    
    populateCategorySelect() {
        const categories = this.trainer.getAvailableCategories();
        this.elements.categorySelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    populateLineSelect() {
        const lines = this.trainer.getLinesForCurrentMode();
        this.elements.lineSelect.innerHTML = lines.map((l, i) => `<option value="${i}">${l.name}</option>`).join('');
    }

    updateMoveComment() {
        const line = this.trainer.getCurrentLine();
        const progress = this.trainer.getProgress().chessProgress;
        const moveIndex = progress.current;
        let text = 'Ready';
        if (line) {
            if (moveIndex === 0) text = line.annotation || '';
            else {
                const moveObject = line.moves[moveIndex - 1];
                text = (moveObject && moveObject.comment) ? moveObject.comment : '';
            }
        }
        this.elements.moveComment.textContent = text;
    }

    renderAnnotations(isHintRequest = false) {
        const board = this.trainer.chessEngine.board;
        if (!board) return;

        board.setAutoShapes([]); // Always start with a clean slate.

        const line = this.trainer.getCurrentLine();
        if (!line || line.moves.length === 0) return;

        const progress = this.trainer.getProgress().chessProgress;
        const moveIndex = progress.current;
        if (moveIndex >= line.moves.length) return; // Line is complete.

        const moveObject = line.moves[moveIndex];
        if (!moveObject || !moveObject.san) return;

        // Use a temporary engine to find the move coordinates dynamically.
        const tempChess = new Chess(this.trainer.chessEngine.chess.fen());
        const move = tempChess.move(moveObject.san, { sloppy: true });
        if (!move) return;

        const shapes = [];
        const mode = this.trainer.currentMode;

        // --- LOGIC FOR SPACED REPETITION ---
        if (mode === 'spaced_repetition') {
            const stage = line.reviewStage || 1;
            switch (stage) {
                case 1: // Show full hint: arrow and highlight
                    shapes.push({ orig: move.from, brush: 'yellow' });
                    shapes.push({ orig: move.from, dest: move.to, brush: 'green' });
                    break;
                case 2: // Show partial hint: piece to move
                    shapes.push({ orig: move.from, brush: 'yellow' });
                    break;
                case 3: // Show no hint
                    break;
            }
        }

        // --- LOGIC FOR EXERCISES ---
        if (mode === 'exercises' && isHintRequest) {
            // Show partial hint only when the hint button is pressed
            shapes.push({ orig: move.from, brush: 'yellow' });
        }

        // --- LOGIC FOR THEORY MODE ---
        if (mode === 'theory') {
            if (!moveObject.annotations) return;
            const theoryShapes = moveObject.annotations.map(a => ({
                orig: a.type === 'highlight' ? a.square : a.from,
                dest: a.type === 'arrow' ? a.to : undefined,
                brush: this.mapPgnColorToBrush(a.color)
            }));
            shapes.push(...theoryShapes);
        }

        if (shapes.length > 0) {
            board.setAutoShapes(shapes);
        }
    }
    
    updateMovesList() {
        const history = this.trainer.chessEngine.chess.history();
        let movesText = '';
        history.forEach((move, i) => {
            if (i % 2 === 0) movesText += `${Math.floor(i / 2) + 1}. ${move} `;
            else movesText += `${move} `;
        });
        this.elements.movesList.textContent = movesText.trim() || 'Moves will appear here...';
    }

    mapPgnColorToBrush(pgnColor) {
        const colorMap = { 'green': 'paleGreen', 'red': 'red', 'yellow': 'paleBlue', 'blue': 'blue' };
        return colorMap[pgnColor] || 'paleGreen';
    }
}