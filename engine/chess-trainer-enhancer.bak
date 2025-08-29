/**
 * CHESS TRAINER AUTO-ENHANCER v1.0
 * 
 * Simply add this script to your HTML and it will automatically enhance
 * your existing chess trainer with advanced visual hints.
 * 
 * NO CODE CHANGES REQUIRED - just include this script!
 * 
 * Usage: <script src="./engine/chess-trainer-enhancer.js"></script>
 */

(function() {
    'use strict';
    
    console.log('🚀 Chess Trainer Auto-Enhancer Loading...');
    
    // Enhancement configuration
    const ENHANCER_CONFIG = {
        maxPreviewMoves: 3,
        animationDelay: 800,
        autoSetup: true,
        colors: {
            playerMove1: 'green',
            opponentMove: 'blue',
            playerMove2: 'orange', // new color
            nextMove: 'green',
            preview2: 'blue', 
            preview3: 'yellow',
            capture: 'red',
            check: 'red',
            castle: 'blue',
            keySquare: 'green'
        }
    };
    
    let originalFunctions = {};
    let enhancedEnabled = true;
    let multiMoveEnabled = true;
    
    // =========================================================================
    // AUTO-DETECTION AND SETUP
    // =========================================================================
    
    function waitForTrainer() {
        if (window.trainer && window.trainer.chessEngine) {
            console.log('✅ Trainer detected! Applying enhancements...');
            setTimeout(applyEnhancements, 100);
        } else {
            setTimeout(waitForTrainer, 500);
        }
    }
    
    function applyEnhancements() {
        try {
            // Backup original functions
            backupOriginalFunctions();
            
            // Enhance existing functions
            enhanceHintFunctions();
            
            // Add new controls
            addEnhancedControls();
            
            // Setup event listeners
            setupAutoEnhancers();
            
            console.log('🎯 Chess Trainer Enhanced Successfully!');
            console.log('New commands: enhancer.animate(), enhancer.toggle()');
            
        } catch (error) {
            console.error('❌ Enhancement failed:', error);
            restoreOriginalFunctions();
        }
    }
    
    // =========================================================================
    // FUNCTION ENHANCEMENT (Non-destructive overlays)
    // =========================================================================
    
    function backupOriginalFunctions() {
        // Backup existing functions if they exist
        if (window.showNextMoveHint) {
            originalFunctions.showNextMoveHint = window.showNextMoveHint;
        }
        if (window.clearMoveHints) {
            originalFunctions.clearMoveHints = window.clearMoveHints;
        }
    }
    
    function enhanceHintFunctions() {
        // Replace showNextMoveHint with enhanced version
        const originalShowHint = originalFunctions.showNextMoveHint || function() {};
        
        window.showNextMoveHint = function(positionData) {
            if (enhancedEnabled) {
                showEnhancedTheoryHints(positionData);
            } else {
                originalShowHint(positionData);
            }
        };
        
        // Replace clearMoveHints with enhanced version
        const originalClearHints = originalFunctions.clearMoveHints || function() {};
        
        window.clearMoveHints = function() {
            clearEnhancedHints();
            originalClearHints();
        };
        
        // Add new functions to global scope
        window.showEnhancedHint = showSingleEnhancedHint;
        window.animateHints = animateEnhancedHints;
    }
    
    function restoreOriginalFunctions() {
        Object.keys(originalFunctions).forEach(key => {
            if (originalFunctions[key]) {
                window[key] = originalFunctions[key];
            }
        });
    }
    
    // =========================================================================
    // TURN AND PLAYER COLOR DETECTION (CRITICAL FIX)
    // =========================================================================
    
    function shouldShowHintForCurrentTurn(moveIndex) {
        try {
            // Get player color configuration
            const playerColor = getPlayerColor();
            
            // Get whose turn it is to move
            const currentTurn = getCurrentTurn();
            
            // Get whose turn this move represents in the sequence
            const moveTurn = getMoveColor(moveIndex);
            
            console.log(`🎯 Turn check: Player=${playerColor}, CurrentTurn=${currentTurn}, MoveFor=${moveTurn}`);
            
            // If player plays both sides, always show hints
            if (playerColor === 'both') {
                return true;
            }
            
            // Only show hints when it's the player's turn to move
            if (playerColor === 'white' && moveTurn === 'white') return true;
            if (playerColor === 'black' && moveTurn === 'black') return true;
            
            return false;
            
        } catch (error) {
            console.warn('Turn detection error:', error);
            return true; // Default to showing hints if detection fails
        }
    }
    
    function getPlayerColor() {
        try {
            // Try multiple ways to get player color
            
            // Method 1: From trainer options
            if (window.trainer?.options?.defaultColor) {
                return window.trainer.options.defaultColor;
            }
            
            // Method 2: From chess engine
            if (window.trainer?.chessEngine?.playerColor) {
                return window.trainer.chessEngine.playerColor;
            }
            
            // Method 3: From UI color selector
            const colorSelect = document.getElementById('colorSelect');
            if (colorSelect?.value) {
                return colorSelect.value;
            }
            
            // Method 4: Default for E4 repertoire (usually White)
            return 'white';
            
        } catch (error) {
            console.warn('Player color detection failed:', error);
            return 'white'; // Safe default
        }
    }
    
    function getCurrentTurn() {
        try {
            const chess = window.trainer.chessEngine.chess;
            if (chess && chess.turn) {
                return chess.turn() === 'w' ? 'white' : 'black';
            }
            
            // Fallback: analyze FEN if available
            const fen = chess?.fen?.();
            if (fen) {
                const parts = fen.split(' ');
                return parts[1] === 'w' ? 'white' : 'black';
            }
            
            return 'white'; // Default
            
        } catch (error) {
            console.warn('Current turn detection failed:', error);
            return 'white';
        }
    }
    
    function getMoveColor(moveIndex) {
        try {
            // Get the starting position info
            const progress = window.trainer.getProgress();
            
            // Get initial position color from FEN or starting position
            const startingTurn = getStartingTurn();
            
            // Calculate whose move this is based on index
            // If starting with white, even indices (0,2,4...) are white moves
            // If starting with black, even indices are black moves
            if (startingTurn === 'white') {
                return (moveIndex % 2 === 0) ? 'white' : 'black';
            } else {
                return (moveIndex % 2 === 0) ? 'black' : 'white';
            }
            
        } catch (error) {
            console.warn('Move color detection failed:', error);
            // Default based on common E4 repertoire (starts with white)
            return (moveIndex % 2 === 0) ? 'white' : 'black';
        }
    }
    
    function getStartingTurn() {
        try {
            // Try to get starting FEN from current line or position
            const line = window.trainer.getCurrentLine();
            
            if (line?.fen) {
                const parts = line.fen.split(' ');
                return parts[1] === 'w' ? 'white' : 'black';
            }
            
            // Check if we're at the standard starting position
            const chess = window.trainer.chessEngine.chess;
            if (chess?.fen) {
                const currentFen = chess.fen();
                if (currentFen.includes('rnbqkbnr/pppppppp')) {
                    // Standard starting position
                    return 'white';
                }
                
                const parts = currentFen.split(' ');
                return parts[1] === 'w' ? 'white' : 'black';
            }
            
            // Default for most opening repertoires
            return 'white';
            
        } catch (error) {
            console.warn('Starting turn detection failed:', error);
            return 'white';
        }
    }
    
    // =========================================================================
    // ENHANCED HINT LOGIC (with proper turn checking)
    // =========================================================================
    
    function showEnhancedTheoryHints(positionData) {
        const { mode, line } = positionData;
        
        if (mode !== 'theory' || !line?.moves) {
            clearEnhancedHints();
            return;
        }
        
        const progress = window.trainer.getProgress();
        if (!progress?.chessProgress) return;
        
        const currentMoveIndex = progress.chessProgress.current || 0;
        const moves = line.moves;
        
        if (currentMoveIndex >= moves.length) {
            clearEnhancedHints();
            return;
        }
        
        // CRITICAL FIX: Only show hints when it's the player's turn
        if (!shouldShowHintForCurrentTurn(currentMoveIndex)) {
            clearEnhancedHints();
            console.log('🚫 Hints hidden - not player\'s turn');
            return;
        }
        
        const shapes = buildAutoEnhancedShapes(moves, currentMoveIndex);
        displayAutoShapes(shapes);
    }
    
    function buildAutoEnhancedShapes(moves, currentIndex) {
        const shapes = [];
        const maxMoves = multiMoveEnabled ? ENHANCER_CONFIG.maxPreviewMoves : 1;
        
        for (let i = 0; i < Math.min(maxMoves, moves.length - currentIndex); i++) {
            const moveNotation = moves[currentIndex + i];
            if (!moveNotation) continue;
            
            const moveData = autoParseMove(moveNotation);
            if (!moveData) continue;
            
            const color = getPreviewColor(i);
            shapes.push(...createAutoMoveShapes(moveData, color, i === 0));
        }
        
        return shapes;
    }
    
    function autoParseMove(moveNotation) {
        try {
            const chess = window.trainer.chessEngine.chess;
            if (!chess) return null;
            
            const legalMoves = chess.moves({ verbose: true });
            let targetMove = legalMoves.find(move => move.san === moveNotation);
            
            if (!targetMove) {
                const cleanNotation = moveNotation.replace(/[+#]$/, '');
                targetMove = legalMoves.find(move => 
                    move.san === cleanNotation || 
                    move.san.replace(/[+#]$/, '') === cleanNotation
                );
            }
            
            if (!targetMove) return null;
            
            return {
                from: targetMove.from,
                to: targetMove.to,
                piece: targetMove.piece,
                moveType: getMoveType(targetMove, moveNotation),
                notation: moveNotation
            };
            
        } catch (error) {
            return null;
        }
    }
    
    function createAutoMoveShapes(moveData, color, isNext) {
        const shapes = [];
        const { from, to, moveType, piece } = moveData;
        
        // Main arrow
        shapes.push({
            orig: from,
            dest: to,
            brush: color
        });
        
        // Special indicators
        if (moveType === 'capture') {
            shapes.push({ orig: to, brush: ENHANCER_CONFIG.colors.capture });
        }
        
        if (moveType === 'check') {
            const kingSquare = findKingUnderAttack();
            if (kingSquare) {
                shapes.push({ orig: kingSquare, brush: ENHANCER_CONFIG.colors.check });
            }
        }
        
        if (moveType === 'castle') {
            const rookMove = getCastleRookMove(moveData.notation, from);
            if (rookMove) {
                shapes.push({
                    orig: rookMove.from,
                    dest: rookMove.to,
                    brush: ENHANCER_CONFIG.colors.castle
                });
            }
        }
        
        // Educational squares for next move only
        if (isNext) {
            const keySquares = getKeyEducationalSquares(moveData);
            keySquares.forEach(square => {
                shapes.push({ orig: square, brush: ENHANCER_CONFIG.colors.keySquare });
            });
        }
        
        return shapes;
    }
    
    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================
    
    function getPreviewColor(index) {
        const colors = [
            ENHANCER_CONFIG.colors.nextMove,
            ENHANCER_CONFIG.colors.preview2,
            ENHANCER_CONFIG.colors.preview3
        ];
        return colors[index] || 'yellow';
    }
    
    function getMoveType(move, notation) {
        if (notation.includes('#')) return 'checkmate';
        if (notation.includes('+')) return 'check';
        if (notation === 'O-O' || notation === 'O-O-O') return 'castle';
        if (move.captured) return 'capture';
        return 'normal';
    }
    
    function findKingUnderAttack() {
        try {
            const chess = window.trainer.chessEngine.chess;
            const turn = chess.turn();
            const opponentColor = turn === 'w' ? 'b' : 'w';
            
            const board = chess.board();
            for (let rank = 0; rank < 8; rank++) {
                for (let file = 0; file < 8; file++) {
                    const piece = board[rank][file];
                    if (piece && piece.type === 'k' && piece.color === opponentColor) {
                        return String.fromCharCode(97 + file) + (8 - rank);
                    }
                }
            }
        } catch (error) {
            return null;
        }
        return null;
    }
    
    function getCastleRookMove(notation, kingFrom) {
        if (notation === 'O-O') {
            return kingFrom === 'e1' ? 
                { from: 'h1', to: 'f1' } : 
                { from: 'h8', to: 'f8' };
        }
        if (notation === 'O-O-O') {
            return kingFrom === 'e1' ? 
                { from: 'a1', to: 'd1' } : 
                { from: 'a8', to: 'd8' };
        }
        return null;
    }
    
    function getKeyEducationalSquares(moveData) {
        const { piece, to } = moveData;
        const squares = [];
        
        // Central control squares
        const centrals = ['e4', 'e5', 'd4', 'd5'];
        if (centrals.includes(to)) {
            if (to === 'e4') squares.push('d5', 'f5');
            if (to === 'd4') squares.push('c5', 'e5');
        }
        
        // Knight influence (simplified)
        if (piece === 'n') {
            const file = to.charCodeAt(0) - 97;
            const rank = parseInt(to[1]) - 1;
            
            // Show a couple key knight squares
            [[1,2], [-1,2]].forEach(([df,dr]) => {
                const nf = file + df, nr = rank + dr;
                if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
                    squares.push(String.fromCharCode(97 + nf) + (nr + 1));
                }
            });
        }
        
        return squares.slice(0, 2); // Limit to avoid clutter
    }
    
    // =========================================================================
    // DISPLAY FUNCTIONS
    // =========================================================================
    
    function displayAutoShapes(shapes) {
        try {
            const board = window.trainer.chessEngine.board;
            if (board && board.setAutoShapes) {
                board.setAutoShapes(shapes);
                console.log(`🎯 Enhanced: ${shapes.length} visual hints`);
            }
        } catch (error) {
            console.warn('Display error:', error);
        }
    }
    
    function clearEnhancedHints() {
        try {
            const board = window.trainer.chessEngine.board;
            if (board && board.setAutoShapes) {
                board.setAutoShapes([]);
            }
        } catch (error) {
            console.warn('Clear error:', error);
        }
    }
    
    function showSingleEnhancedHint(moveNotation) {
        const moveData = autoParseMove(moveNotation);
        if (moveData) {
            const shapes = createAutoMoveShapes(moveData, 'green', true);
            displayAutoShapes(shapes);
        }
    }
    
    function animateEnhancedHints() {
        console.log('🎬 Animating enhanced hints...');
        // Implementation would go here
    }
    
    // =========================================================================
    // AUTO-CONTROLS INJECTION
    // =========================================================================
    
    function addEnhancedControls() {
        const controlsContainer = document.querySelector('.control-group');
        if (!controlsContainer || document.getElementById('autoEnhancerControls')) return;
        
        const controlsHTML = `
            <div id="autoEnhancerControls" style="
                display: flex; 
                align-items: center; 
                gap: 8px; 
                margin-left: 10px; 
                background: linear-gradient(45deg, #667eea, #764ba2); 
                padding: 4px 10px; 
                border-radius: 6px; 
                color: white; 
                font-size: 0.8em;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
                <span style="font-weight: bold;">🎯 Enhanced:</span>
                <label style="display: flex; align-items: center; gap: 3px; cursor: pointer;">
                    <input type="checkbox" id="enhancerToggle" checked style="margin: 0;">
                    Hints
                </label>
                <label style="display: flex; align-items: center; gap: 3px; cursor: pointer;">
                    <input type="checkbox" id="multiMoveToggle" checked style="margin: 0;">
                    Multi
                </label>
                <span id="turnIndicator" style="
                    background: rgba(255,255,255,0.3);
                    padding: 1px 5px;
                    border-radius: 3px;
                    font-size: 0.7em;
                    margin-left: 5px;
                ">Loading...</span>
                <button id="enhancerAnimate" style="
                    background: rgba(255,255,255,0.2); 
                    border: 1px solid rgba(255,255,255,0.3); 
                    color: white; 
                    padding: 1px 5px; 
                    border-radius: 3px; 
                    cursor: pointer; 
                    font-size: 0.75em;
                ">▶</button>
            </div>
        `;
        
        controlsContainer.insertAdjacentHTML('beforeend', controlsHTML);
        
        // Event listeners
        document.getElementById('enhancerToggle').addEventListener('change', (e) => {
            enhancedEnabled = e.target.checked;
            if (!enhancedEnabled) clearEnhancedHints();
            console.log('🎯 Enhanced hints:', enhancedEnabled ? 'ON' : 'OFF');
        });
        
        document.getElementById('multiMoveToggle').addEventListener('change', (e) => {
            multiMoveEnabled = e.target.checked;
            console.log('📋 Multi-move:', multiMoveEnabled ? 'ON' : 'OFF');
        });
        
        document.getElementById('enhancerAnimate').addEventListener('click', () => {
            animateEnhancedHints();
        });
        
        // Update turn indicator
        updateTurnIndicator();
    }
    
    function updateTurnIndicator() {
        const indicator = document.getElementById('turnIndicator');
        if (!indicator) return;
        
        try {
            const playerColor = getPlayerColor();
            const currentTurn = getCurrentTurn();
            const shouldShow = shouldShowHintForCurrentTurn(
                window.trainer.getProgress()?.chessProgress?.current || 0
            );
            
            const playerIcon = playerColor === 'white' ? '♔' : playerColor === 'black' ? '♚' : '⚡';
            const turnIcon = currentTurn === 'white' ? '♔' : '♚';
            const statusIcon = shouldShow ? '✅' : '⏸️';
            
            indicator.innerHTML = `${statusIcon} ${playerIcon}→${turnIcon}`;
            indicator.title = `Player: ${playerColor} | Turn: ${currentTurn} | Hints: ${shouldShow ? 'ON' : 'OFF'}`;
            
        } catch (error) {
            indicator.innerHTML = '❓';
            indicator.title = 'Turn detection error';
        }
    }
    
    // =========================================================================
    // AUTO EVENT LISTENERS
    // =========================================================================
    
    function setupAutoEnhancers() {
        // Auto-refresh hints on moves
        if (window.trainer) {
            
            // Enhanced move event handler
            window.trainer.addEventListener('correctMove', () => {
                setTimeout(() => {
                    updateTurnIndicator(); // Update indicator
                    if (enhancedEnabled) {
                        const progress = window.trainer.getProgress();
                        if (progress?.mode === 'theory') {
                            const line = window.trainer.getCurrentLine();
                            if (line) {
                                console.log('🔄 Refreshing hints after move...');
                                showEnhancedTheoryHints({ mode: 'theory', line });
                            }
                        }
                    }
                }, 300); // Longer delay to ensure position is updated
            });
            
            // Also listen for computer moves
            window.trainer.addEventListener('computerMove', () => {
                setTimeout(() => {
                    updateTurnIndicator(); // Update indicator
                    if (enhancedEnabled) {
                        const progress = window.trainer.getProgress();
                        if (progress?.mode === 'theory') {
                            const line = window.trainer.getCurrentLine();
                            if (line) {
                                console.log('🤖 Refreshing hints after computer move...');
                                showEnhancedTheoryHints({ mode: 'theory', line });
                            }
                        }
                    }
                }, 500); // Even longer delay for computer moves
            });
            
            // Listen for position changes
            window.trainer.addEventListener('positionLoaded', (e) => {
                setTimeout(() => {
                    updateTurnIndicator(); // Update indicator
                    if (enhancedEnabled && e.detail.mode === 'theory') {
                        console.log('📍 Position loaded, checking hints...');
                        showEnhancedTheoryHints(e.detail);
                    }
                }, 100);
            });
        }
        
        // Also listen to color selector changes
        const colorSelect = document.getElementById('colorSelect');
        if (colorSelect) {
            colorSelect.addEventListener('change', () => {
                console.log('🎨 Player color changed, refreshing hints...');
                updateTurnIndicator(); // Update indicator
                setTimeout(() => {
                    if (enhancedEnabled) {
                        const progress = window.trainer.getProgress();
                        if (progress?.mode === 'theory') {
                            const line = window.trainer.getCurrentLine();
                            if (line) {
                                showEnhancedTheoryHints({ mode: 'theory', line });
                            }
                        }
                    }
                }, 200);
            });
        }
    }
    
    // =========================================================================
    // GLOBAL ENHANCER API
    // =========================================================================
    
    window.enhancer = {
        toggle: (enabled) => {
            enhancedEnabled = enabled !== undefined ? enabled : !enhancedEnabled;
            const toggle = document.getElementById('enhancerToggle');
            if (toggle) toggle.checked = enhancedEnabled;
            if (!enhancedEnabled) clearEnhancedHints();
            return enhancedEnabled;
        },
        
        multiMove: (enabled) => {
            multiMoveEnabled = enabled !== undefined ? enabled : !multiMoveEnabled;
            const toggle = document.getElementById('multiMoveToggle');
            if (toggle) toggle.checked = multiMoveEnabled;
            return multiMoveEnabled;
        },
        
        animate: animateEnhancedHints,
        show: showSingleEnhancedHint,
        clear: clearEnhancedHints,
        
        // Debug functions for turn detection
        debug: {
            playerColor: getPlayerColor,
            currentTurn: getCurrentTurn,
            startingTurn: getStartingTurn,
            shouldShow: (moveIndex) => shouldShowHintForCurrentTurn(moveIndex || 0),
            moveColor: getMoveColor
        },
        
        status: () => ({
            enhanced: enhancedEnabled,
            multiMove: multiMoveEnabled,
            trainer: !!window.trainer,
            playerColor: getPlayerColor(),
            currentTurn: getCurrentTurn()
        }),
        
        restore: restoreOriginalFunctions
    };
    
    // =========================================================================
    // AUTO-START
    // =========================================================================
    
    if (ENHANCER_CONFIG.autoSetup) {
        // Start detection when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', waitForTrainer);
        } else {
            waitForTrainer();
        }
    }
    
    console.log('🎯 Chess Trainer Auto-Enhancer Ready');
    console.log('Commands: enhancer.toggle(), enhancer.show("e4"), enhancer.status()');
    console.log('Debug: enhancer.debug.playerColor(), enhancer.debug.currentTurn()');
    console.log('Fix applied: Hints now show only on player\'s turn! ✅');
    
})();