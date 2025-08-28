// Simple trainer.js - Clean and working

import { ChessTrainer } from './engine/trainer-core.js';
import { UIManager } from './engine/ui-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    
    console.log('🚀 Starting Chess Trainer...');
    
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
            
            // Fetch course data
            const courseResponse = await fetch(courseInfo.path);
            if (!courseResponse.ok) throw new Error(`Failed to load course data.`);
            const courseData = await courseResponse.json();

            // Update page title
            courseTitleElement.textContent = courseData.name;
            console.log('📚 Course loaded:', courseData.name);

            // Initialize trainer
            const trainer = new ChessTrainer('board', courseData, {
                defaultColor: courseData.playerColor
            });

            // Initialize UI
            const uiManager = new UIManager(trainer);
            
            // Global access for debugging
            window.trainer = trainer;
            window.uiManager = uiManager;
            
            // Simple keyboard shortcuts
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
                    case ' ': // Spacebar to toggle arrows
                        const checkbox = document.getElementById('enableEnhancer');
                        if (checkbox) {
                            checkbox.checked = !checkbox.checked;
                            checkbox.dispatchEvent(new Event('change'));
                            e.preventDefault();
                        }
                        break;
                }
            });
            
            console.log('✅ Chess Trainer initialized successfully!');
            
        } catch (error) {
            courseTitleElement.textContent = 'Error loading course!';
            console.error('❌ Initialization failed:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Start the application
    initializeTrainer(courseId);

    // Add debug commands to console
    console.log(`
    🎯 Chess Trainer Debug Commands:
    - window.trainer: Access trainer
    - window.uiManager: Access UI manager  
    - uiManager.refreshArrows(): Force refresh arrows
    - trainer.chessEngine.board.setAutoShapes([{orig:'e2',dest:'e4',brush:'green'}]): Test arrow
    
    Keyboard shortcuts:
    - R: Reset position
    - F: Flip board
    - ←/→: Previous/Next line
    - Space: Toggle multiple arrows
    `);
});