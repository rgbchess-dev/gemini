// /engine/trainer-core.js - FIXED VERSION with Working Computer Move Events

import { ChessEngine } from './chess-engine.js';
import { SpacedRepetitionManager } from './spaced-repetition.js';
import { PgnParser } from './pgn-parser.js';

export class ChessTrainer extends EventTarget {
    constructor(boardId, courseData, options = {}) {
        super();
        
        this.boardId = boardId;
        this.courseData = this.precomputeMoveData(this.normalizeCourseData(courseData));
        this.options = { defaultColor: options.defaultColor || 'white', ...options };
        
        this.chessEngine = null;
        this.currentMode = 'theory';
        this.currentCategory = null;
        this.currentLineIndex = 0;
        
        this.init();
    }
    
    init() {
        this.chessEngine = new ChessEngine(this.boardId, {
            playerColor: this.options.defaultColor,
            orientation: this.courseData.orientation || this.options.defaultColor
        });
        
        // FIXED: Proper event handling
        this.chessEngine.onMove((move, validation) => this.handleMove(move, validation));
        this.chessEngine.onLineComplete((data) => this.handleLineComplete(data));
        this.chessEngine.onComputerMove((move) => this.handleComputerMove(move));
        
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
            exercises: null,
            spacedRepetition: null
        };
        if (data.theory) normalized.theory = data.theory;
        else if (data.lines) normalized.theory = { lines: data.lines, startingFen: data.startingFen };
        if (data.exercises) normalized.exercises = Array.isArray(data.exercises) ? 
            { lines: data.exercises } : data.exercises;
        if (data.spacedRepetition) normalized.spacedRepetition = data.spacedRepetition;
        return normalized;
    }
    
    setMode(mode) {
        console.log('🎯 Mode changed to:', mode);
        this.currentMode = mode;
        this.currentLineIndex = 0;
        this.emit('modeChanged', { mode: mode, categories: this.getAvailableCategories() });
        this.loadCurrentPosition();
    }
    
    loadCurrentPosition() {
        const line = this.getCurrentLine();
        if (!line) {
            console.warn('⚠️ No line available');
            this.emit('error', { message: 'No line available' });
            return;
        }
        
        console.log('🎯 Loading position for line:', line.name);
        this.chessEngine.loadLine(line, this.getStartingFen());
        this.emit('positionLoaded', {
            mode: this.currentMode,
            line: line,
            lineIndex: this.currentLineIndex
        });
    }
    
    // FIXED: Proper event emission
    handleMove(move, validation) {
        console.log('🎯 Move handled:', move.san, 'Valid:', validation.valid);
        
        if (validation.valid) {
            this.emit('correctMove', { move, validation });
        } else {
            this.emit('incorrectMove', { move, expected: validation.expected });
        }
    }
    
    handleComputerMove(move) {
        console.log('🤖 Computer move handled:', move.san);
        this.emit('computerMove', { move });
    }
    
    handleLineComplete(data) {
        console.log('🏁 Line completed:', data.line?.name);
        this.emit('lineComplete', data);
    }
    
    nextLine() {
        const lines = this.getCurrentLines();
        if (this.currentLineIndex < lines.length - 1) {
            this.currentLineIndex++;
            console.log('➡️ Next line:', this.currentLineIndex);
            this.loadCurrentPosition();
            this.emit('lineChanged', { lineIndex: this.currentLineIndex, line: this.getCurrentLine() });
        }
    }
    
    previousLine() {
        if (this.currentLineIndex > 0) {
            this.currentLineIndex--;
            console.log('⬅️ Previous line:', this.currentLineIndex);
            this.loadCurrentPosition();
            this.emit('lineChanged', { lineIndex: this.currentLineIndex, line: this.getCurrentLine() });
        }
    }
    
    selectLine(index) {
        console.log('🎯 Selecting line:', index);
        this.currentLineIndex = index;
        this.loadCurrentPosition();
        this.emit('lineChanged', { lineIndex: this.currentLineIndex, line: this.getCurrentLine() });
    }
    
    setCategory(category) {
        console.log('🎯 Category changed to:', category);
        this.currentCategory = category;
        this.currentLineIndex = 0;
        this.emit('categoryChanged', { category: category, lines: this.getCurrentLines() });
        this.loadCurrentPosition();
    }
    
    resetPosition() { 
        console.log('🔄 Resetting position');
        this.chessEngine.resetCurrentLine(); 
    }
    
    flipBoard() { 
        console.log('🔄 Flipping board');
        this.chessEngine.flipBoard(); 
    }
    
    setPlayerColor(color) { 
        console.log('🎯 Player color changed to:', color);
        this.chessEngine.setPlayerColor(color);
        this.loadCurrentPosition();
    }
    
    getCurrentLine() { return this.getCurrentLines()[this.currentLineIndex] || null; }
    getCurrentLines() { return this.getCategoryLines(this.currentCategory); }
    getCategoryLines(category) {
        const allLines = this.courseData.theory?.lines || [];
        if (!category || category === 'All Categories') return allLines;
        return allLines.filter(line => line.category === category);
    }
    getAvailableCategories() {
        if (!this.courseData.theory) return [];
        const categories = [...new Set(this.courseData.theory.lines.map(line => line.category).filter(Boolean))];
        if (categories.length > 1) categories.unshift('All Categories');
        return categories;
    }
    getDefaultCategory() {
        const cats = this.getAvailableCategories();
        return cats.includes('All Categories') ? 'All Categories' : cats[0] || null;
    }
    getStartingFen() { return this.courseData.theory?.startingFen || null; }
    getProgress() {
        return {
            mode: this.currentMode,
            category: this.currentCategory,
            lineIndex: this.currentLineIndex,
            chessProgress: this.chessEngine.getLineProgress()
        };
    }
    emit(eventName, detail) { 
        console.log('📡 Event emitted:', eventName, detail);
        this.dispatchEvent(new CustomEvent(eventName, { detail })); 
    }
}