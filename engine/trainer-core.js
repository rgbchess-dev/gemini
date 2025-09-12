// /engine/trainer-core.js - FINAL VERSION WITH DATA CONSISTENCY FIX

import { ChessEngine } from './chess-engine.js';
import { PgnParser } from './pgn-parser.js';

export class ChessTrainer extends EventTarget {
    constructor(boardId, courseData, options = {}) {
        super();
        
        this.boardId = boardId;
        this.courseData = this.precomputeMoveData(this.normalizeCourseData(courseData));
        this.options = { defaultColor: options.defaultColor || 'white', ...options };
        
        this.srsManager = options.srsManager || null;
        this.currentSrsCard = null;
        
        this.chessEngine = null;
        this.currentMode = 'theory';
        this.currentCategory = null;
        this.currentLineIndex = 0;

        // --- THE DEFINITIVE FIX ---
        // After the main course data and the SRS manager are ready,
        // we ensure that every single SRS card also gets the essential
        // 'computedMoves' property. This makes them identical to theory lines.
        if (this.srsManager) {
            console.log('🚀 Pre-computing data for all SRS cards to ensure consistency...');
            for (const card of this.srsManager.cards.values()) {
                // This is the same computation that happens for theory lines.
                card.computedMoves = PgnParser.compute(card);
            }
            console.log('✅ SRS cards are now fully synchronized with theory data.');
        }
        // --- END OF FIX ---
        
        this.init();
    }
    
    init() {
        this.chessEngine = new ChessEngine(this.boardId, {
            playerColor: this.options.defaultColor,
            orientation: this.courseData.orientation || this.options.defaultColor
        });
        
        this.chessEngine.onMove((move, validation) => this.handleMove(move, validation));
        this.chessEngine.onLineComplete((data) => this.emit('lineComplete', data));
        this.chessEngine.onComputerMove((move) => this.emit('computerMove', { move }));
        
        this.currentCategory = this.getDefaultCategory();
        
        this.emit('initialized', { courseData: this.courseData, mode: this.currentMode, category: this.currentCategory });
        this.loadCurrentPosition();
    }

    precomputeMoveData(courseData) {
        console.log('🎯 Processing all course lines with PgnParser...');
        if (!courseData.theory || !courseData.theory.lines) return courseData;
    
        for (const line of courseData.theory.lines) {
            line.computedMoves = PgnParser.compute(line);
        }
        
        console.log('✅ Course data processing complete.');
        return courseData;
    }
    
    normalizeCourseData(data) {
        const normalized = {
            name: data.name || 'Unnamed Course',
            playerColor: data.playerColor || 'white',
            orientation: data.orientation || data.playerColor || 'white',
            theory: null,
        };
        if (data.theory) normalized.theory = data.theory;
        else if (data.lines) normalized.theory = { lines: data.lines, startingFen: data.startingFen };
        return normalized;
    }
    
    setMode(mode) {
        this.currentMode = mode;
        this.currentLineIndex = 0;
        this.emit('modeChanged', { mode: mode, categories: this.getAvailableCategories() });
        this.loadCurrentPosition();
    }
    
    loadCurrentPosition() {
        if (this.currentMode === 'spaced_repetition') {
            if (!this.srsManager) return this.emit('error', { message: 'SRS Manager not configured.' });
            
            this.currentSrsCard = this.srsManager.getNextCard();
            
            if (this.currentSrsCard) {
                this.chessEngine.loadLine(this.currentSrsCard, this.currentSrsCard.startingFen);
                this.emit('positionLoaded', { mode: this.currentMode, line: this.currentSrsCard, lineIndex: -1 });
            } else {
                this.emit('status', { message: 'Congratulations! No cards are due for review.' });
                this.chessEngine.loadLine({ moves: [] }, '8/8/8/8/8/8/8/8 w - - 0 1');
            }
        } else {
            const line = this.getCurrentLine();
            if (!line) return this.emit('error', { message: 'No line available' });
            this.chessEngine.loadLine(line, this.getStartingFen());
            this.emit('positionLoaded', { mode: this.currentMode, line: line, lineIndex: this.currentLineIndex });
        }
    }

    getHint() {
        // ... (existing logic to find the hint) ...

        // --- ADDITION: Using a hint counts as a mistake in SRS mode ---
        if (this.currentMode === 'spaced_repetition' && this.currentSrsCard) {
            this.srsManager.demoteCard(this.currentSrsCard.id);
        }

        if (nextMove) this.emit('hint', { move: nextMove });
    }
    
    handleMove(move, validation) {
        if (validation.valid) {
            this.emit('correctMove', { move, validation });
        } else {
            this.emit('incorrectMove', { move, expected: validation.expected });
            
            // --- ADDITION: If a mistake is made in SRS mode, demote the card ---
            if (this.currentMode === 'spaced_repetition' && this.currentSrsCard) {
                this.srsManager.demoteCard(this.currentSrsCard.id);
            }
        }
    }
    
    // ... (The rest of your functions: nextLine, previousLine, selectLine, etc., are correct and can remain unchanged) ...
    // ... Please paste the rest of your working functions for this file below ...

    
    nextLine() {
        // ... (this function remains unchanged)
        const lines = this.getCurrentLines();
        if (this.currentLineIndex < lines.length - 1) {
            this.currentLineIndex++;
            this.loadCurrentPosition();
            this.emit('lineChanged', { lineIndex: this.currentLineIndex, line: this.getCurrentLine() });
        }
    }
    
    previousLine() {
        // ... (this function remains unchanged)
        if (this.currentLineIndex > 0) {
            this.currentLineIndex--;
            this.loadCurrentPosition();
            this.emit('lineChanged', { lineIndex: this.currentLineIndex, line: this.getCurrentLine() });
        }
    }
    
    selectLine(index) {
        // ... (this function remains unchanged)
        this.currentLineIndex = index;
        this.loadCurrentPosition();
        this.emit('lineChanged', { lineIndex: this.currentLineIndex, line: this.getCurrentLine() });
    }
    
    setCategory(category) {
        // ... (this function remains unchanged)
        this.currentCategory = category;
        this.currentLineIndex = 0;
        this.emit('categoryChanged', { category: category, lines: this.getCurrentLines() });
        this.loadCurrentPosition();
    }
    
    resetPosition() { 
        // ... (this function remains unchanged)
        this.chessEngine.resetCurrentLine(); 
        this.emit('positionLoaded', { line: this.getCurrentLine(), lineIndex: this.currentLineIndex });
    }
    
    flipBoard() { 
        // ... (this function remains unchanged)
        this.chessEngine.flipBoard(); 
    }
    
    stepBackward() {
        // ... (this function remains unchanged)
        if (this.chessEngine.stepBackward()) {
            this.emit('stepped');
        }
    }

    stepForward() {
        // ... (this function remains unchanged)
        if (this.chessEngine.stepForward()) {
            this.emit('stepped');
        }
    }
    
    setPlayerColor(color) { 
        // ... (this function remains unchanged)
        this.chessEngine.setPlayerColor(color);
        this.loadCurrentPosition();
    }
    
    // --- MODIFIED: This function is now mode-aware ---
    getCurrentLine() {
        if (this.currentMode === 'spaced_repetition') {
            return this.currentSrsCard;
        }
        // Original logic for theory mode
        return this.getCurrentLines()[this.currentLineIndex] || null;
    }
    
    getCurrentLines() { /* ... (this function remains unchanged) ... */ return this.getCategoryLines(this.currentCategory); }
    getCategoryLines(category) { /* ... (this function remains unchanged) ... */ const allLines = this.courseData.theory?.lines || []; if (!category || category === 'All Categories') return allLines; return allLines.filter(line => line.category === category); }
    getAvailableCategories() { /* ... (this- function remains unchanged) ... */ if (!this.courseData.theory) return []; const categories = [...new Set(this.courseData.theory.lines.map(line => line.category).filter(Boolean))]; if (categories.length > 1) categories.unshift('All Categories'); return categories; }
    getDefaultCategory() { /* ... (this function remains unchanged) ... */ const cats = this.getAvailableCategories(); return cats.includes('All Categories') ? 'All Categories' : cats[0] || null; }
    getStartingFen() { /* ... (this function remains unchanged) ... */ return this.courseData.theory?.startingFen || null; }
    getProgress() { /* ... (this function remains unchanged) ... */ return { mode: this.currentMode, category: this.currentCategory, lineIndex: this.currentLineIndex, chessProgress: this.chessEngine.getLineProgress() }; }
    emit(eventName, detail) { /* ... (this function remains unchanged) ... */ this.dispatchEvent(new CustomEvent(eventName, { detail })); }
}