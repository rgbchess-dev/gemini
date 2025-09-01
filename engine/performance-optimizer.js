// /performance-patch.js - SAFE Performance Improvements
// Add this file and include it AFTER your existing trainer.js loads

(function() {
    'use strict';
    
    console.log('🔧 Applying safe performance patches...');
    
    // Wait for trainer to be ready
    function waitForTrainer() {
        if (window.trainer && window.uiManager) {
            applyPerformancePatches();
        } else {
            setTimeout(waitForTrainer, 50);
        }
    }
    
    function applyPerformancePatches() {
        const trainer = window.trainer;
        const uiManager = window.uiManager;
        
        if (!trainer || !uiManager) {
            console.warn('Trainer or UI Manager not found');
            return;
        }
        
        console.log('✅ Trainer found, applying optimizations...');
        
        // ============================================
        // 1. BATCH UI UPDATES (BIGGEST PERFORMANCE WIN)
        // ============================================
        
        let updateQueue = new Set();
        let isUpdating = false;
        
        function batchUpdate(callback) {
            updateQueue.add(callback);
            
            if (!isUpdating) {
                isUpdating = true;
                requestAnimationFrame(() => {
                    // Execute all queued updates in one frame
                    updateQueue.forEach(cb => {
                        try { cb(); } catch(e) { console.warn('Update error:', e); }
                    });
                    updateQueue.clear();
                    isUpdating = false;
                });
            }
        }
        
        // Patch existing methods to use batching
        const originalUpdateMovesList = uiManager.updateMovesList.bind(uiManager);
        const originalRefreshArrows = uiManager.refreshArrows.bind(uiManager);
        const originalUpdateMoveComment = uiManager.updateMoveComment.bind(uiManager);
        
        uiManager.updateMovesList = function() {
            batchUpdate(originalUpdateMovesList);
        };
        
        uiManager.refreshArrows = function() {
            batchUpdate(originalRefreshArrows);
        };
        
        uiManager.updateMoveComment = function() {
            batchUpdate(originalUpdateMoveComment);
        };
        
        // ============================================
        // 2. OPTIMIZE CHESSGROUND SETTINGS
        // ============================================
        
        if (trainer.chessEngine && trainer.chessEngine.board) {
            // Faster animations for snappier feel
            trainer.chessEngine.board.set({
                animation: {
                    enabled: true,
                    duration: 150  // Reduced from default 200ms
                }
            });
            console.log('✅ Board animations optimized');
        }
        
        // ============================================
        // 3. CACHE EXPENSIVE OPERATIONS
        // ============================================
        
        let arrowCache = new Map();
        let moveListCache = '';
        
        // Cache arrow computations
        const originalRefreshArrowsImpl = originalRefreshArrows;
        uiManager.refreshArrows = function() {
            const line = trainer.getCurrentLine();
            const progress = trainer.getProgress().chessProgress;
            const cacheKey = `${line?.id || 'none'}-${progress.current}-${trainer.chessEngine.playerColor}`;
            
            // Return early if already computed
            if (arrowCache.has(cacheKey)) {
                return;
            }
            
            batchUpdate(() => {
                originalRefreshArrowsImpl();
                arrowCache.set(cacheKey, true);
                
                // Keep cache size manageable
                if (arrowCache.size > 50) {
                    const firstKey = arrowCache.keys().next().value;
                    arrowCache.delete(firstKey);
                }
            });
        };
        
        // Cache move list if unchanged
        const originalUpdateMovesListImpl = originalUpdateMovesList;
        uiManager.updateMovesList = function() {
            const progress = trainer.getProgress().chessProgress;
            const history = trainer.chessEngine.chess.history().slice(0, progress.current);
            const historyKey = history.join(',');
            
            if (moveListCache === historyKey) {
                return; // Skip if unchanged
            }
            
            batchUpdate(() => {
                originalUpdateMovesListImpl();
                moveListCache = historyKey;
            });
        };
        
        // ============================================
        // 4. REDUCE TIMEOUT DELAYS
        // ============================================
        
        // Find and optimize existing setTimeout calls in ChessEngine
        if (trainer.chessEngine && trainer.chessEngine.handleMove) {
            const originalHandleMove = trainer.chessEngine.handleMove.bind(trainer.chessEngine);
            
            trainer.chessEngine.handleMove = function(orig, dest) {
                const result = originalHandleMove(orig, dest);
                
                // Reduce computer move delay for snappier feel
                if (this.shouldComputerMoveNow && this.shouldComputerMoveNow()) {
                    // Reduce delay from 600ms to 200ms
                    setTimeout(() => {
                        if (this.playNextComputerMove) {
                            this.playNextComputerMove();
                        }
                    }, 200); // Much faster computer responses
                }
                
                return result;
            };
        }
        
        // ============================================
        // 5. GPU ACCELERATION (SAFE CSS)
        // ============================================
        
        function addGPUAcceleration() {
            const style = document.createElement('style');
            style.textContent = `
                .cg-wrap, #board-container {
                    transform: translateZ(0);
                    will-change: transform;
                }
                
                piece {
                    transform: translateZ(0);
                    transition-duration: 0.12s !important;
                }
                
                piece.dragging {
                    will-change: transform;
                }
                
                #movesList {
                    contain: layout style paint;
                    transform: translateZ(0);
                }
                
                button:active {
                    transform: translateZ(0) scale(0.98);
                }
            `;
            document.head.appendChild(style);
        }
        
        addGPUAcceleration();
        
        // ============================================
        // 6. MEMORY CLEANUP
        // ============================================
        
        // Clean up caches periodically  
        setInterval(() => {
            if (arrowCache.size > 30) {
                arrowCache.clear();
                console.log('🧹 Arrow cache cleared');
            }
        }, 30000); // Every 30 seconds
        
        // ============================================
        // 7. PERFORMANCE MONITORING (OPTIONAL)
        // ============================================
        
        let performanceData = {
            moveCount: 0,
            totalMoveTime: 0
        };
        
        // Monitor move performance
        if (trainer.chessEngine && trainer.chessEngine.handleMove) {
            const originalMove = trainer.chessEngine.handleMove.bind(trainer.chessEngine);
            
            trainer.chessEngine.handleMove = function(orig, dest) {
                const start = performance.now();
                const result = originalMove(orig, dest);
                
                performanceData.totalMoveTime += performance.now() - start;
                performanceData.moveCount++;
                
                return result;
            };
        }
        
        // Add performance report to window (for debugging)
        window.getPerformanceReport = function() {
            const avgMoveTime = performanceData.moveCount > 0 ? 
                performanceData.totalMoveTime / performanceData.moveCount : 0;
                
            console.log(`📊 Performance Report:
    - Average move time: ${avgMoveTime.toFixed(1)}ms
    - Total moves: ${performanceData.moveCount}
    - Arrow cache size: ${arrowCache.size}
    - Memory: ${performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1) + 'MB' : 'Unknown'}`);
        };
        
        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        
        console.log('🎯 Performance patches applied successfully!');
        console.log('💡 Use window.getPerformanceReport() to check performance');
        
        // Visual indicator that optimizations are active
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-family: monospace;
            z-index: 9999;
            pointer-events: none;
        `;
        indicator.textContent = 'OPTIMIZED ⚡';
        document.body.appendChild(indicator);
        
        // Fade out after 3 seconds
        setTimeout(() => {
            indicator.style.transition = 'opacity 1s';
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 1000);
        }, 3000);
    }
    
    // Start the optimization process
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForTrainer);
    } else {
        waitForTrainer();
    }
    
})();