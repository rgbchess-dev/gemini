// /engine/pgn-parser.js - Enhanced Version with Rich Move Data

/**
 * Enhanced PGN parser that provides detailed move analysis for arrow rendering
 */
export class PgnParser {
    /**
     * Takes a line object and returns an array of computed move objects with rich data
     * @param {object} line - A line object from our course JSON.
     * @returns {Array} - An array of enhanced move objects with detailed analysis
     */
    static compute(line) {
        if (typeof Chess === 'undefined') {
            console.error('FATAL: chess.js is not loaded. Parsing cannot run.');
            return [];
        }

        const computedMoves = [];
        // CRITICAL FIX: Create a new, fresh board for EACH line.
        const tempBoard = new Chess(); 
        let moveCounter = 1;

        for (let i = 0; i < line.moves.length; i++) {
            const moveNotation = line.moves[i];
            
            // Get position before the move
            const fenBefore = tempBoard.fen();
            const isWhiteTurn = tempBoard.turn() === 'w';
            
            // Try to make the move
            const moveObject = tempBoard.move(moveNotation, { sloppy: true });
            
            // This is our data validation! If a move is invalid, the entire line is considered corrupt.
            if (!moveObject) {
                console.error(`Data Validation Error in line "${line.name}": The move "${moveNotation}" is invalid from FEN: ${fenBefore}`);
                return []; // Return an empty array to prevent crashes.
            }
            
            // Get position after the move
            const fenAfter = tempBoard.fen();
            
            // Enhanced move analysis
            const enhancedMove = {
                // Basic data (existing)
                from: moveObject.from,
                to: moveObject.to,
                san: moveObject.san,
                isCapture: moveObject.flags.includes('c'),
                
                // Enhanced data (new)
                moveNumber: Math.ceil(moveCounter / 2),
                isWhiteMove: isWhiteTurn,
                piece: moveObject.piece,
                captured: moveObject.captured || null,
                promotion: moveObject.promotion || null,
                
                // Move type analysis
                moveType: this.analyzeMoveType(moveObject, moveNotation),
                flags: this.analyzeFlags(moveObject),
                
                // Positional analysis
                fenBefore: fenBefore,
                fenAfter: fenAfter,
                isCheck: moveObject.flags.includes('k'),
                isCheckmate: moveObject.flags.includes('#'),
                isCastle: moveObject.flags.includes('k') || moveObject.flags.includes('q'),
                
                // Strategic analysis
                centralControl: this.analyzesCentralControl(moveObject),
                developmentMove: this.issDevelopmentMove(moveObject, isWhiteTurn),
                tacticalThemes: this.identifyTacticalThemes(moveObject, tempBoard),
                
                // Educational metadata
                notation: moveNotation,
                index: i,
                description: this.generateMoveDescription(moveObject, moveNotation)
            };
            
            computedMoves.push(enhancedMove);
            moveCounter++;
        }
        
        console.log(`✅ Enhanced parsing complete: ${computedMoves.length} moves analyzed for "${line.name}"`);
        return computedMoves;
    }
    
    /**
     * Analyze the type of move for enhanced visualization
     */
    static analyzeMoveType(moveObject, notation) {
        if (notation.includes('#')) return 'checkmate';
        if (notation.includes('+')) return 'check';
        if (notation === 'O-O') return 'castle-kingside';
        if (notation === 'O-O-O') return 'castle-queenside';
        if (moveObject.flags.includes('c')) return 'capture';
        if (moveObject.flags.includes('e')) return 'en-passant';
        if (moveObject.promotion) return 'promotion';
        if (this.issDevelopmentMove(moveObject)) return 'development';
        return 'normal';
    }
    
    /**
     * Analyze move flags for detailed information
     */
    static analyzeFlags(moveObject) {
        const flagMap = {
            'n': 'normal',
            'c': 'capture', 
            'b': 'big-pawn',
            'e': 'en-passant',
            'k': 'king-castle',
            'q': 'queen-castle',
            'p': 'promotion'
        };
        
        return moveObject.flags.split('').map(flag => flagMap[flag] || flag);
    }
    
    /**
     * Check if move controls central squares
     */
    static analyzesCentralControl(moveObject) {
        const centralSquares = ['e4', 'e5', 'd4', 'd5'];
        const extendedCenter = ['c4', 'c5', 'f4', 'f5'];
        
        const controlsCenter = centralSquares.includes(moveObject.to);
        const influencesCenter = extendedCenter.includes(moveObject.to);
        
        return {
            controlsCenter,
            influencesCenter,
            targetSquare: moveObject.to,
            centralSquares: controlsCenter ? [moveObject.to] : []
        };
    }
    
    /**
     * Determine if this is a development move
     */
    static issDevelopmentMove(moveObject, isWhiteTurn = true) {
        const piece = moveObject.piece;
        const from = moveObject.from;
        const to = moveObject.to;
        
        // Piece development from starting squares
        const whiteStartSquares = {
            'n': ['b1', 'g1'],
            'b': ['c1', 'f1'],
            'q': ['d1'],
            'r': ['a1', 'h1']
        };
        
        const blackStartSquares = {
            'n': ['b8', 'g8'],
            'b': ['c8', 'f8'], 
            'q': ['d8'],
            'r': ['a8', 'h8']
        };
        
        const startSquares = isWhiteTurn ? whiteStartSquares : blackStartSquares;
        const pieceStartSquares = startSquares[piece] || [];
        
        return pieceStartSquares.includes(from) && !pieceStartSquares.includes(to);
    }
    
    /**
     * Identify tactical themes in the move
     */
    static identifyTacticalThemes(moveObject, board) {
        const themes = [];
        
        // Check if move creates threats
        if (board.in_check()) {
            themes.push('check');
        }
        
        if (board.in_checkmate()) {
            themes.push('checkmate');
        }
        
        // Fork detection (simplified)
        if (moveObject.piece === 'n' || moveObject.piece === 'p') {
            const attacks = this.getAttackedSquares(moveObject, board);
            const importantPieces = attacks.filter(sq => {
                const piece = board.get(sq);
                return piece && ['k', 'q', 'r'].includes(piece.type);
            });
            
            if (importantPieces.length >= 2) {
                themes.push('fork');
            }
        }
        
        // Pin detection (basic)
        if (moveObject.flags.includes('c')) {
            themes.push('capture');
        }
        
        return themes;
    }
    
    /**
     * Get squares attacked by a piece (simplified)
     */
    static getAttackedSquares(moveObject, board) {
        // This is a simplified implementation
        // In a full implementation, you'd calculate actual piece attacks
        try {
            const moves = board.moves({ 
                square: moveObject.to, 
                verbose: true 
            });
            return moves.map(move => move.to);
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Generate a human-readable description of the move
     */
    static generateMoveDescription(moveObject, notation) {
        const pieceNames = {
            'p': 'pawn',
            'r': 'rook', 
            'n': 'knight',
            'b': 'bishop',
            'q': 'queen',
            'k': 'king'
        };
        
        const pieceName = pieceNames[moveObject.piece];
        const fromSquare = moveObject.from;
        const toSquare = moveObject.to;
        
        let description = `${pieceName} from ${fromSquare} to ${toSquare}`;
        
        if (moveObject.flags.includes('c')) {
            const capturedPiece = pieceNames[moveObject.captured];
            description += ` captures ${capturedPiece}`;
        }
        
        if (notation.includes('+')) {
            description += ' with check';
        }
        
        if (notation.includes('#')) {
            description += ' - checkmate!';
        }
        
        if (notation === 'O-O') {
            description = 'castles kingside';
        }
        
        if (notation === 'O-O-O') {
            description = 'castles queenside';
        }
        
        return description;
    }
    
    /**
     * Validate and repair line data if possible
     */
    static validateLine(line) {
        if (!line || !line.moves || !Array.isArray(line.moves)) {
            console.warn('Invalid line data:', line);
            return false;
        }
        
        if (line.moves.length === 0) {
            console.warn('Empty move list in line:', line.name);
            return false;
        }
        
        return true;
    }
    
    /**
     * Get move statistics for a line
     */
    static getLineStatistics(computedMoves) {
        const stats = {
            totalMoves: computedMoves.length,
            captures: 0,
            checks: 0,
            castles: 0,
            developments: 0,
            centralMoves: 0,
            tacticalThemes: new Set()
        };
        
        computedMoves.forEach(move => {
            if (move.isCapture) stats.captures++;
            if (move.isCheck) stats.checks++;
            if (move.isCastle) stats.castles++;
            if (move.developmentMove) stats.developments++;
            if (move.centralControl.controlsCenter) stats.centralMoves++;
            
            move.tacticalThemes.forEach(theme => stats.tacticalThemes.add(theme));
        });
        
        stats.tacticalThemes = Array.from(stats.tacticalThemes);
        return stats;
    }
}