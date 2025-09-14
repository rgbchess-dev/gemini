import { ChessEngine } from './chess-engine.js';

export class ChessTrainer extends EventTarget {
    constructor(boardElementId, courseData, options = {}) {
        super();
        this.courseData = courseData;
        this.allLines = courseData.lines || [];
        this.srsManager = options.srsManager;
        this.options = options;
        this.chessEngine = new ChessEngine(boardElementId, {
            playerColor: courseData.playerColor || this.options.defaultColor || 'white',
            orientation: courseData.orientation
        });
        this.currentMode = 'theory';
        this.currentCategory = this.getAvailableCategories()[0] || null;
        this.currentLineIndex = 0;
        this.setupEngineListeners();
        this.loadCurrentPosition();
    }

    setupEngineListeners() {
        this.chessEngine.onMove((move, validation) => {
             if (!validation.valid && (this.currentMode === 'spaced_repetition' || this.currentMode === 'exercises')) {
                const line = this.getCurrentLine();
                if (line && line.id) this.srsManager.demoteCard(line.id);
            }
            this.dispatchEvent(new CustomEvent('move', { detail: { move, validation } }));
        });
        this.chessEngine.onLineComplete(() => this.dispatchEvent(new CustomEvent('lineComplete')));
        this.chessEngine.onComputerMove((move) => this.dispatchEvent(new CustomEvent('computerMove', { detail: { move } })));
    }

    loadCurrentPosition() {
        const line = this.getCurrentLine();

        // --- DIAGNOSTIC INSTRUMENTATION ---
        console.log("%c--- Trainer Core: loadCurrentPosition ---", "color: blue; font-weight: bold;");
        if (line) {
            console.log("Attempting to load line:", line.name);
            console.log("Line Object Received:", line);
            console.log(`Checking for FEN property... Found: "${line.fen || 'NOT FOUND'}"`);
        } else {
            console.warn("No current line could be found for the selected mode/category.");
        }
        // --- END DIAGNOSTIC ---

        if (line) {
            this.chessEngine.loadLine(line, line.fen || this.courseData.startingFen);
        } else {
            this.chessEngine.loadLine({ moves: [] }); // Load an empty board if no line
        }
        
        this.dispatchEvent(new CustomEvent('lineChanged', { detail: { line, lineIndex: this.currentLineIndex } }));

        if (this.currentMode === 'theory' || this.currentMode === 'spaced_repetition') {
            setTimeout(() => this.chessEngine.playComputerMoveIfNeeded(), 50);
        }
    }

    getLinesForCurrentMode() {
        const mode = this.currentMode;

        if (mode === 'theory' || mode === 'exercises') {
            return this.allLines.filter(line => line.type === mode && line.category === this.currentCategory);
        }

        if (mode === 'spaced_repetition') {
            const theoryLines = this.allLines.filter(line => line.type === 'theory' && line.category === this.currentCategory);
            return theoryLines.map(line => {
                const card = this.srsManager.getCard(line.id);
                return { ...line, ...card };
            });
        }
        return [];
    }

    getCurrentLine() {
        const lines = this.getLinesForCurrentMode();
        return lines[this.currentLineIndex] || null;
    }

    getAvailableCategories(forMode = this.currentMode) {
        const targetType = (forMode === 'spaced_repetition') ? 'theory' : forMode;
        const lines = this.allLines.filter(line => line.type === targetType);
        return [...new Set(lines.map(line => line.category))];
    }
    
    setMode(newMode) {
        this.currentMode = newMode;
        this.currentCategory = this.getAvailableCategories()[0] || null;
        this.currentLineIndex = 0;
        this.dispatchEvent(new CustomEvent('modeChanged'));
        this.loadCurrentPosition();
    }
    
    setCategory(newCategory) {
        this.currentCategory = newCategory;
        this.currentLineIndex = 0;
        this.loadCurrentPosition();
    }
    
    selectLine(lineIndex) {
        this.currentLineIndex = parseInt(lineIndex, 10);
        this.loadCurrentPosition();
    }
    
    getProgress() { return { chessProgress: this.chessEngine.getLineProgress() }; }
    
    stepForward() { if (this.chessEngine.stepForward()) this.dispatchEvent(new CustomEvent('stepped')); }
    stepBackward() { if (this.chessEngine.stepBackward()) this.dispatchEvent(new CustomEvent('stepped')); }
    nextLine() { const lines = this.getLinesForCurrentMode(); if (this.currentLineIndex < lines.length - 1) { this.currentLineIndex++; this.loadCurrentPosition(); }}
    previousLine() { if (this.currentLineIndex > 0) { this.currentLineIndex--; this.loadCurrentPosition(); }}
    setPlayerColor(color) {
    this.chessEngine.setPlayerColor(color);
    // After changing color, check if the computer needs to move.
    if (this.currentMode === 'theory' || this.currentMode === 'spaced_repetition') {
        this.chessEngine.playComputerMoveIfNeeded();
    }
}
    flipBoard() { this.chessEngine.flipBoard(); }
}