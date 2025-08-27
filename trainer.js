import { ChessTrainer } from './engine/trainer-core.js';
import { UIManager } from './engine/ui-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // Get the course ID from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    const courseTitleElement = document.getElementById('course-title');

    if (!courseId) {
        courseTitleElement.textContent = 'Error: No course selected!';
        alert('No course ID found in the URL. Please select a course from the homepage.');
        window.location.href = '/index.html'; // Redirect to homepage
        return;
    }

    async function initializeTrainer(id) {
        try {
            // First, fetch the manifest to find the course path
            const manifestResponse = await fetch('./data/courses.json');
            if (!manifestResponse.ok) throw new Error('Failed to load course manifest.');
            const courses = await manifestResponse.json();
            const courseInfo = courses.find(c => c.id === id);

            if (!courseInfo) throw new Error(`Course with ID "${id}" not found in manifest.`);
            
            // Now, fetch the actual course data
            const courseResponse = await fetch(courseInfo.path);
            if (!courseResponse.ok) throw new Error(`Failed to load course data from ${courseInfo.path}`);
            const courseData = await courseResponse.json();

            // Update page title with course name
            courseTitleElement.textContent = courseData.name;

            // Initialize the trainer with the dynamically loaded data
            const trainer = new ChessTrainer('board', courseData, {
                defaultColor: courseData.playerColor
            });

            // Initialize the UI manager
            const uiManager = new UIManager(trainer);
            
            // Make trainer globally accessible for debugging
            window.trainer = trainer;
            
        } catch (error) {
            courseTitleElement.textContent = 'Error loading course!';
            console.error('Initialization failed:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Start the application
    initializeTrainer(courseId);
});