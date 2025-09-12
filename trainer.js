// trainer.js - FINAL, SIMPLIFIED VERSION FOR JSON COURSES ONLY

import { ChessTrainer } from './engine/trainer-core.js';
import { UIManager } from './engine/ui-manager.js';
import { SpacedRepetitionManager } from './engine/spaced-repetition.js';

document.addEventListener('DOMContentLoaded', () => {
    
    console.log('🚀 Starting Chess Trainer...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    const courseTitleElement = document.getElementById('course-title');

    if (!courseId) {
        courseTitleElement.textContent = 'Error: No course selected!';
        return;
    }

    async function initializeTrainer(id) {
        try {
            // 1. Find the course in the manifest file
            const manifestResponse = await fetch('./data/courses.json');
            const courses = await manifestResponse.json();
            const courseInfo = courses.find(c => c.id === id);

            if (!courseInfo) throw new Error(`Course with ID "${id}" not found.`);
            
            // 2. Fetch and parse the course file as JSON
            console.log(` H Loading JSON course from: ${courseInfo.path}`);
            const courseResponse = await fetch(courseInfo.path);
            if (!courseResponse.ok) throw new Error(`Failed to load course file at: ${courseInfo.path}`);
            const courseData = await courseResponse.json();

            courseTitleElement.textContent = courseData.name;
            console.log('📚 Course loaded:', courseData.name);

            // 3. Initialize the application's components with the course data
            const srsManager = new SpacedRepetitionManager(courseData.name);
            srsManager.loadProgress();
            srsManager.generateCardsFromOpening(courseData.theory);

            const trainer = new ChessTrainer('board', courseData, {
                defaultColor: courseData.playerColor,
                srsManager: srsManager
            });
            
            const uiManager = new UIManager(trainer);
            
            window.trainer = trainer;
            window.uiManager = uiManager;
            window.srsManager = srsManager;
            
            console.log('✅ Chess Trainer initialized successfully!');
            
        } catch (error) {
            courseTitleElement.textContent = 'Error loading course!';
            console.error('❌ Initialization failed:', error);
            alert(`A critical error occurred. Check the console for details.`);
        }
    }

    initializeTrainer(courseId);
});

// --- ALL PGN-RELATED FUNCTIONS HAVE BEEN ELIMINATED ---