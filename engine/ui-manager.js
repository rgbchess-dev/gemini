// /engine/ui-manager.js - FIXED VERSION - Simple and Actually Working

export class UIManager {
    constructor(trainer) {
        this.trainer = trainer;
        this.elements = {};
        
        // Simple, reliable config
        this.config = {
            multipleArrows: true,
            maxMoves: 3,
            showHints: true,
            theme: 'blue'
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
        this.setupArrowControls();
        this.performInitialUpdate();
        this.updateDebugInfo('UI Manager initialized');
        console.log('✅ Fixed UI Manager loaded');
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
            debugText: document.getElementById('debugText')
        };
    }

    setupArrowControls() {
        const enableEnhancer = document.getElementById('enableEnhancer');
        const previewMoves = document.getElementById('previewMoves');
        const boardTheme = document.getElementById('boardTheme');
        const educationalHints = document.getElementById('educationalHints');
        
        // Debug what we found
        console.log('🔧 Arrow controls found:', {
            enableEnhancer: !!enableEnhancer,
            previewMoves: !!previewMoves,
            boardTheme: !!boardTheme,
            educationalHints: !!educationalHints
        });
        
        if (enableEnhancer) {
            enableEnhancer.addEventListener('change', (e) => {
                this.config.multipleArrows = e.target.checked;
                this.updateDebugInfo(`Multiple arrows: ${this.config.multipleArrows}`);
                this.refreshArrows();
            });
        }
        
        if (previewMoves) {
            previewMoves.addEventListener('change', (e) => {
                this.config.maxMoves = parseInt(e.target.value);
                this.updateDebugInfo(`Max moves: ${this.config.maxMoves}`);
                this.refreshArrows();
            });
        }
        
        if (boardTheme) {
            boardTheme.addEventListener('change', (e) => {
                this.config.theme = e.target.value;
                this.updateDebugInfo(`Theme: ${this.config.theme}`);
                this.applyTheme(e.target.value);
            });
            // Apply initial theme
            this.applyTheme(this.config.theme);
        }
        
        if (educationalHints) {
            educationalHints.addEventListener('change', (e) => {
                this.config.showHints = e.target.checked;
                this.updateDebugInfo(`Hints: ${this.config.showHints}`);
                this.refreshArrows();
            });
        }
    }

    updateDebugInfo(message) {
        if (this.elements.debugText) {
            this.elements.debugText.textContent = message;
        }
        console.log('🐛', message);
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
        this.updateDebugInfo('Correct move played!');
        this.clearArrows();
        setTimeout(() => this.refreshArrows(), 100);
    }
    
    handleComputerMove() {
        this.updateDebugInfo('Computer played a move');
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
    // SIMPLIFIED ARROW SYSTEM THAT ACTUALLY WORKS
    // ============================================
    
    refreshArrows() {
        try {
            this.clearArrows();
            
            if (!this.config.multipleArrows || this.trainer.currentMode !== 'theory') {
                this.updateDebugInfo('Arrows disabled or not in theory mode');
                return;
            }

            const line = this.trainer.getCurrentLine();
            const progress = this.trainer.getProgress().chessProgress;
            const currentIndex = progress.current;
            
            if (!line || !line.moves || currentIndex >= line.moves.length) {
                this.updateDebugInfo('No moves to show');
                return;
            }

            const shapes = this.createArrowShapes(line.moves, currentIndex);
            
            if (shapes.length > 0) {
                this.trainer.chessEngine.board.setAutoShapes(shapes);
                this.updateDebugInfo(`Showing ${shapes.length} arrows`);
            } else {
                this.updateDebugInfo('No valid arrows created');
            }
            
        } catch (error) {
            console.error('❌ Arrow error:', error);
            this.updateDebugInfo(`Error: ${error.message}`);
        }
    }

    createArrowShapes(moves, startIndex) {
        const shapes = [];
        const colors = ['green', 'blue', 'yellow'];
        const maxMoves = Math.min(this.config.maxMoves, moves.length - startIndex);
        
        // Create a temporary chess instance to simulate moves
        const tempChess = new Chess(this.trainer.chessEngine.chess.fen());
        
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
                    // Main arrow
                    shapes.push({
                        orig: targetMove.from,
                        dest: targetMove.to,
                        brush: colors[i] || 'yellow'
                    });
                    
                    // Capture indicator
                    if (targetMove.captured && this.config.showHints) {
                        shapes.push({
                            orig: targetMove.to,
                            brush: 'red'
                        });
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

    clearArrows() {
        if (this.trainer.chessEngine.board) {
            this.trainer.chessEngine.board.setAutoShapes([]);
        }
    }

    // ============================================
    // THEME SYSTEM
    // ============================================
    
    applyTheme(themeName) {
        const themes = {
            classic: { light: '#f0d9b5', dark: '#b58863' },
            blue: { light: '#dee3e6', dark: '#8ca2ad' },
            green: { light: '#ffffdd', dark: '#86a666' },
            purple: { light: '#e8e8e8', dark: '#9f90c0' }
        };
        
        const theme = themes[themeName];
        if (!theme) return;
        
        // Apply to CSS variables
        const root = document.documentElement;
        root.style.setProperty('--board-light', theme.light);
        root.style.setProperty('--board-dark', theme.dark);
        
        // Update board background
        const boardElement = document.querySelector('cg-board');
        if (boardElement) {
            boardElement.style.backgroundColor = theme.light;
            
            // Create a simple alternating pattern
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8">
                <defs>
                    <pattern id="board" patternUnits="userSpaceOnUse" width="2" height="2">
                        <rect width="1" height="1" fill="${theme.light}"/>
                        <rect x="1" y="1" width="1" height="1" fill="${theme.light}"/>
                        <rect x="1" y="0" width="1" height="1" fill="${theme.dark}"/>
                        <rect x="0" y="1" width="1" height="1" fill="${theme.dark}"/>
                    </pattern>
                </defs>
                <rect width="8" height="8" fill="url(#board)"/>
            </svg>`;
            
            boardElement.style.backgroundImage = `url('data:image/svg+xml;base64,${btoa(svg)}')`;
        }
        
        this.updateDebugInfo(`Applied theme: ${themeName}`);
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