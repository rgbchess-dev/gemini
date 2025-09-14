import { ChessTrainer } from './engine/trainer-core.js';
import { UIManager } from './engine/ui-manager.js';
import { SpacedRepetitionManager } from './engine/spaced-repetition.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    const courseTitleElement = document.getElementById('course-title');

    if (!courseId) {
        if (courseTitleElement) courseTitleElement.textContent = 'Error: No course selected!';
        return;
    }

    async function initializeTrainer(id) {
        try {
            // Step 1: Fetch the course manifest
            const manifestResponse = await fetch('./data/courses.json');
            const courses = await manifestResponse.json();
            const courseInfo = courses.find(c => c.id === id);
            if (!courseInfo) throw new Error(`Course with ID "${id}" not found.`);

            // Step 2: Fetch the course data itself
            const courseResponse = await fetch(courseInfo.path);
            if (!courseResponse.ok) throw new Error(`Failed to load course file: ${courseInfo.path}`);
            const courseData = await courseResponse.json();

            // Step 3: Initialize the SRS manager FIRST, and generate its cards
            // This is the correct, robust order.
            const srsManager = new SpacedRepetitionManager(courseData.name);
            srsManager.generateCardsFromOpening(courseData);

            // Step 4: Now, initialize the main trainer with all data and modules
            const trainer = new ChessTrainer('board', courseData, {
                defaultColor: courseData.playerColor,
                srsManager: srsManager
            });
            
            // Step 5: Finally, initialize the UI manager
            const uiManager = new UIManager(trainer);
            
            // For debugging purposes
            window.trainer = trainer;
            window.uiManager = uiManager;

        } catch (error) {
            if (courseTitleElement) courseTitleElement.textContent = 'Error loading course!';
            console.error('❌ Initialization failed:', error);
        }
    }

    initializeTrainer(courseId);
});