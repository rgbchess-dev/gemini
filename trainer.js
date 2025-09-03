// Complete working trainer.js - REPLACE YOUR ENTIRE FILE WITH THIS
// This version has all functions properly named and working

import { ChessTrainer } from './engine/trainer-core.js';
import { UIManager } from './engine/ui-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    
    console.log('🚀 Starting Chess Trainer with PGN Variation Support...');
    
    // Get the course ID from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    const courseTitleElement = document.getElementById('course-title');

    if (!courseId) {
        courseTitleElement.textContent = 'Error: No course selected!';
        alert('No course ID found in the URL. Please select a course from the homepage.');
        window.location.href = '/index.html';
        return;
    }

    async function initializeTrainer(id) {
        try {
            // Fetch the manifest
            const manifestResponse = await fetch('./data/courses.json');
            if (!manifestResponse.ok) throw new Error('Failed to load course manifest.');
            const courses = await manifestResponse.json();
            const courseInfo = courses.find(c => c.id === id);

            if (!courseInfo) throw new Error(`Course with ID "${id}" not found.`);
            
            // Fetch course data - handle both JSON and PGN
            const courseResponse = await fetch(courseInfo.path);
            if (!courseResponse.ok) throw new Error(`Failed to load course data.`);
            
            let courseData;
            if (courseInfo.path.endsWith('.json')) {
                courseData = await courseResponse.json();
            } else if (courseInfo.path.endsWith('.pgn')) {
                const pgnText = await courseResponse.text();
                console.log('🎯 Parsing PGN with enhanced variation extraction...');
                
                // Use @mliebelt/pgn-parser (browser UMD version)
                const parsed = PgnParser.parse(pgnText, {startRule: "game"});
                
                // Convert to expected course format with ALL variations
                courseData = convertPgnToCourseData(parsed);
                
            } else {
                throw new Error('Unsupported course format');
            }

            // Update page title
            courseTitleElement.textContent = courseData.name;
            console.log('📚 Course loaded:', courseData.name);
            console.log(`   ${courseData.theory.lines.length} lines extracted`);

            // Initialize trainer
            const trainer = new ChessTrainer('board', courseData, {
                defaultColor: courseData.playerColor
            });

            // Initialize UI
            const uiManager = new UIManager(trainer);
            
            // Global access for debugging
            window.trainer = trainer;
            window.uiManager = uiManager;
            
            // Enhanced keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Don't interfere with typing in inputs
                if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'select') {
                    return;
                }
                
                switch (e.key.toLowerCase()) {
                    case 'r':
                        if (!e.ctrlKey && !e.metaKey) {
                            trainer.resetPosition();
                            e.preventDefault();
                        }
                        break;
                    case 'f':
                        if (!e.ctrlKey && !e.metaKey) {
                            trainer.flipBoard();
                            e.preventDefault();
                        }
                        break;
                    case 'arrowleft':
                        trainer.previousLine();
                        e.preventDefault();
                        break;
                    case 'arrowright':
                        trainer.nextLine();
                        e.preventDefault();
                        break;
                    case ' ': // Spacebar to toggle standard arrows
                        uiManager.config.multipleArrows = !uiManager.config.multipleArrows;
                        uiManager.refreshArrows();
                        console.log(`Standard arrows ${uiManager.config.multipleArrows ? 'enabled' : 'disabled'}`);
                        e.preventDefault();
                        break;
                    case 'a': // 'A' to toggle PGN annotations
                        if (uiManager.togglePgnAnnotations) {
                            uiManager.togglePgnAnnotations();
                            e.preventDefault();
                        }
                        break;
                }
            });
            
            console.log('✅ Chess Trainer with PGN variations initialized successfully!');
            
        } catch (error) {
            courseTitleElement.textContent = 'Error loading course!';
            console.error('❌ Initialization failed:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Start the application
    initializeTrainer(courseId);

    // Enhanced debug commands
    console.log(`
    🎯 Chess Trainer Debug Commands:
    - window.trainer: Access trainer
    - window.uiManager: Access UI manager  
    - uiManager.refreshArrows(): Force refresh arrows
    - uiManager.togglePgnAnnotations(): Toggle PGN annotation arrows
    - trainer.getCurrentLine(): See current line data
    - trainer.getCurrentLine().annotations: See PGN annotations
    
    Keyboard shortcuts:
    - R: Reset position
    - F: Flip board
    - ←/→: Previous/Next line
    - Space: Toggle standard arrows (green/yellow/blue)
    - A: Toggle PGN annotation arrows (pale colors)
    `);
});

/**
 * Convert PGN to Course Data - SIMPLE, WORKING VERSION
 */
function convertPgnToCourseData(parsed) {
    console.log('📚 Converting PGN to course data...');
    
    const courseData = {
        name: parsed.tags.Event || parsed.tags.Opening || 'PGN Course',
        author: parsed.tags.White || parsed.tags.Black || 'Unknown',
        description: parsed.tags.Annotator || 'Imported from PGN',
        playerColor: determinePlayerColor(parsed.tags),
        orientation: determinePlayerColor(parsed.tags),
        theory: {
            startingFen: parsed.tags.FEN || null,
            lines: []
        }
    };

    // Simple extraction: main line + variations
    const allLines = extractAllLines(parsed.moves, parsed.tags);
    courseData.theory.lines = allLines;
    
    console.log(`✅ Extracted ${allLines.length} lines from PGN:`);
    allLines.forEach((line, i) => {
        console.log(`   ${i + 1}. ${line.name} (${line.moves.length} moves)`);
        if (line.annotations) {
            console.log(`      📍 ${line.annotations.arrows.length} arrows, ${line.annotations.highlights.length} highlights`);
        }
    });
    
    return courseData;
}

/**
 * Extract all lines - main line + variations
 */
function extractAllLines(moves, tags = {}) {
    const allLines = [];
    
    // 1. Extract main line
    const mainLine = extractMainLine(moves, tags);
    if (mainLine.moves.length > 0) {
        allLines.push(mainLine);
    }
    
    // 2. Extract variations
    const variations = extractVariations(moves, tags);
    allLines.push(...variations);
    
    return allLines;
}

/**
 * Extract the main line (just the main moves, no variations)
 */
function extractMainLine(moves, tags) {
    const mainMoves = [];
    const mainComments = [];
    
    for (const move of moves) {
        const moveNotation = extractMoveNotation(move);
        if (moveNotation) {
            mainMoves.push(moveNotation);
            mainComments.push(extractComment(move) || '');
        }
    }
    
    return {
        name: tags.Opening || tags.Event || 'Main Line',
        description: tags.Annotator || 'Main line from PGN',
        category: tags.ECO || 'Main Lines',
        moves: mainMoves,
        comments: mainComments,
        annotations: extractAnnotations(moves)
    };
}

/**
 * Extract all variations recursively - FIXED VERSION
 */
function extractVariations(moves, tags = {}, depth = 0, parentMoves = []) {
    const variations = [];
    let variationCounter = 1;
    
    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        
        if (move.variations && Array.isArray(move.variations) && move.variations.length > 0) {
            
            // Build the position up to this point
            const positionMoves = [...parentMoves];
            for (let j = 0; j < i; j++) {
                const moveNotation = extractMoveNotation(moves[j]);
                if (moveNotation) {
                    positionMoves.push(moveNotation);
                }
            }
            
            for (const variation of move.variations) {
                if (variation && Array.isArray(variation) && variation.length > 0) {
                    
                    // Build variation line
                    const variationMoves = [];
                    const variationComments = [];
                    
                    // Add position moves
                    positionMoves.forEach(move => {
                        variationMoves.push(move);
                        variationComments.push('');
                    });
                    
                    // Add variation moves
                    for (const varMove of variation) {
                        const moveNotation = extractMoveNotation(varMove);
                        if (moveNotation) {
                            variationMoves.push(moveNotation);
                            variationComments.push(extractComment(varMove) || '');
                        }
                    }
                    
                    // Validate the move sequence
                    if (validateMoveSequence(variationMoves)) {
                        const variationLine = {
                            name: generateVariationName(variation, variationCounter, tags, depth),
                            description: `Variation ${variationCounter}${depth > 0 ? ` (depth ${depth})` : ''}`,
                            category: determineVariationCategory(variation, tags),
                            moves: variationMoves,
                            comments: variationComments,
                            annotations: extractAnnotations(variation),
                            variationInfo: {
                                branchPoint: positionMoves.length,
                                depth: depth,
                                number: variationCounter
                            }
                        };
                        
                        variations.push(variationLine);
                        
                        // Recursively extract sub-variations
                        const subVariations = extractVariations(variation, tags, depth + 1, variationMoves);
                        variations.push(...subVariations);
                    } else {
                        console.warn(`⚠️ Skipping invalid variation ${variationCounter} - invalid move sequence`);
                    }
                    
                    variationCounter++;
                }
            }
        }
    }
    
    return variations;
}

/**
 * Validate a move sequence
 */
function validateMoveSequence(moves) {
    if (!moves || moves.length === 0) return true;
    
    try {
        const testBoard = new Chess();
        
        for (const move of moves) {
            const result = testBoard.move(move, { sloppy: true });
            if (!result) {
                return false;
            }
        }
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Extract move notation from various formats
 */
function extractMoveNotation(move) {
    if (!move) return null;
    
    if (typeof move === 'string') {
        return move;
    }
    
    if (move.notation) {
        return move.notation.notation || 
               move.notation.san || 
               move.notation.move || 
               move.notation;
    }
    
    return move.san || move.move || move.toString();
}

/**
 * Extract comments from move
 */
function extractComment(move) {
    if (!move) return '';
    
    let comment = '';
    
    if (move.commentAfter) comment += move.commentAfter;
    if (move.comment) comment += (comment ? ' ' : '') + move.comment;
    if (move.commentBefore) comment += (comment ? ' ' : '') + move.commentBefore;
    
    return comment.trim();
}

/**
 * Extract annotations like [%cal] for arrows
 */
function extractAnnotations(moves) {
    const annotations = {
        arrows: [],
        highlights: [],
        comments: []
    };
    
    for (const move of moves) {
        const comment = extractComment(move);
        if (!comment) continue;
        
        // Extract [%cal] arrow annotations
        const calMatches = comment.match(/\[%cal\s+([^\]]+)\]/gi);
        if (calMatches) {
            for (const match of calMatches) {
                const arrowData = match.replace(/\[%cal\s+/gi, '').replace(/\]/g, '');
                const arrows = parseCalAnnotation(arrowData);
                annotations.arrows.push(...arrows);
            }
        }
        
        // Extract [%csl] highlight annotations  
        const cslMatches = comment.match(/\[%csl\s+([^\]]+)\]/gi);
        if (cslMatches) {
            for (const match of cslMatches) {
                const highlightData = match.replace(/\[%csl\s+/gi, '').replace(/\]/g, '');
                const highlights = parseCslAnnotation(highlightData);
                annotations.highlights.push(...highlights);
            }
        }
        
        // Store clean comment
        const cleanComment = comment
            .replace(/\[%cal\s+[^\]]+\]/gi, '')
            .replace(/\[%csl\s+[^\]]+\]/gi, '')
            .trim();
            
        if (cleanComment) {
            annotations.comments.push(cleanComment);
        }
    }
    
    return annotations;
}

/**
 * Parse [%cal] arrow annotations
 */
function parseCalAnnotation(calData) {
    const arrows = [];
    
    if (!calData || typeof calData !== 'string') {
        return arrows;
    }
    
    const arrowSpecs = calData.split(',');
    
    for (const spec of arrowSpecs) {
        const trimmed = spec.trim();
        
        // Parse format like "Ge2e4" 
        const match = trimmed.match(/([GRYBOWP])([a-h][1-8])([a-h][1-8])/i);
        
        if (match) {
            const [, color, from, to] = match;
            
            arrows.push({
                from: from.toLowerCase(),
                to: to.toLowerCase(),
                color: mapAnnotationColor(color)
            });
        }
    }
    
    return arrows;
}

/**
 * Parse [%csl] square highlight annotations
 */
function parseCslAnnotation(cslData) {
    const highlights = [];
    const highlightSpecs = cslData.split(',');
    
    for (const spec of highlightSpecs) {
        const trimmed = spec.trim();
        if (trimmed.length >= 3) {
            const color = trimmed[0];
            const square = trimmed.slice(1, 3);
            
            highlights.push({
                square: square,
                color: mapAnnotationColor(color)
            });
        }
    }
    
    return highlights;
}

/**
 * Map annotation color codes
 */
function mapAnnotationColor(colorCode) {
    const colorMap = {
        'G': 'green',
        'R': 'red', 
        'Y': 'yellow',
        'B': 'blue',
        'O': 'orange'
    };
    
    return colorMap[colorCode.toUpperCase()] || 'green';
}

/**
 * Generate meaningful variation names
 */
function generateVariationName(variation, varNum, tags, depth) {
    if (variation.length > 0) {
        const firstComment = extractComment(variation[0]);
        if (firstComment) {
            const cleanComment = firstComment
                .replace(/\[%cal\s+[^\]]+\]/gi, '')
                .replace(/\[%csl\s+[^\]]+\]/gi, '')
                .trim();
            
            // Look for patterns like "Hungarian Defense" or "Rousseau Gambit"
            const patterns = [
                /(?:The\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?\s+(?:Defense|Attack|Gambit|System|Line|Variation))/i,
                /([A-Z][a-z]+\s+(?:Gambit|Defense|Attack|System|Line))/i,
                /^([A-Z][^.!?\[\]]{3,40}?)(?:[.!?\[]|$)/
            ];
            
            for (const pattern of patterns) {
                const match = cleanComment.match(pattern);
                if (match && match[1]) {
                    const name = match[1].trim().replace(/[.!?]+$/, '');
                    return `Variation ${varNum}: ${name}`;
                }
            }
        }
        
        // Fallback: use first moves
        const firstMoves = variation.slice(0, 2)
            .map(extractMoveNotation)
            .filter(Boolean)
            .join(' ');
        
        if (firstMoves) {
            return `Variation ${varNum}: ${firstMoves}`;
        }
    }
    
    return `Variation ${varNum}`;
}

/**
 * Determine variation category
 */
function determineVariationCategory(variation, tags) {
    const comment = variation.length > 0 ? extractComment(variation[0]) : '';
    
    const categoryKeywords = {
        'Defense': ['Defense', 'Defensive'],
        'Attack': ['Attack', 'Attacking', 'Aggressive'], 
        'Gambit': ['Gambit'],
        'Trap': ['Trap', 'Tricky'],
        'Endgame': ['Endgame', 'Ending'],
        'Opening': ['Opening', 'Debut']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => comment.includes(keyword))) {
            return category;
        }
    }
    
    return tags.ECO || 'Variations';
}

/**
 * Determine player color from PGN tags
 */
function determinePlayerColor(tags) {
    if (tags.White && tags.White.toLowerCase().includes('student')) return 'white';
    if (tags.Black && tags.Black.toLowerCase().includes('student')) return 'black';
    return 'white';
}