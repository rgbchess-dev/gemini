// /engine/pgn-parser.js - FINAL STABLE VERSION

/**
 * A dedicated tool to parse PGN/SAN move notations into coordinate data.
 */
export class PgnParser {
    /**
     * Takes a line object and returns an array of computed move objects.
     * @param {object} line - A line object from our course JSON.
     * @returns {Array} - An array of objects, e.g., [{ from, to, san, isCapture }, ...]
     */
    static compute(line) {
        if (typeof Chess === 'undefined') {
            console.error('FATAL: chess.js is not loaded. Parsing cannot run.');
            return [];
        }

        const computedMoves = [];
        // CRITICAL FIX: Create a new, fresh board for EACH line.
        const tempBoard = new Chess(); 

        for (const moveNotation of line.moves) {
            const moveObject = tempBoard.move(moveNotation, { sloppy: true });
            
            // This is our data validation! If a move is invalid, the entire line is considered corrupt.
            if (!moveObject) {
                console.error(`Data Validation Error in line "${line.name}": The move "${moveNotation}" is invalid from FEN: ${tempBoard.fen()}`);
                return []; // Return an empty array to prevent crashes.
            }
            
            computedMoves.push({
                from: moveObject.from,
                to: moveObject.to,
                san: moveObject.san,
                isCapture: moveObject.flags.includes('c')
            });
        }
        
        return computedMoves;
    }
}