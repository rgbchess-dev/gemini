document.addEventListener('DOMContentLoaded', () => {
    const courseListContainer = document.getElementById('course-list');
    const loadingMessage = document.getElementById('loadingMessage');

    async function loadCourses() {
        try {
            const response = await fetch('./data/courses.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const courses = await response.json();
            
            loadingMessage.style.display = 'none';
            displayCourses(courses);

        } catch (error) {
            loadingMessage.textContent = 'Error: Could not load courses. Please check the console for details.';
            console.error('Failed to fetch courses:', error);
        }
    }

    function displayCourses(courses) {
        courseListContainer.innerHTML = ''; // Clear loading message

        courses.forEach(course => {
            const cardLink = document.createElement('a');
            cardLink.href = `trainer.html?course=${course.id}`;
            cardLink.className = 'course-card';

            cardLink.innerHTML = `
                <h2>${course.name}</h2>
                <p>${course.description}</p>
                <p class="author">By: ${course.author}</p>
                <p class="player-color">Play as ${course.playerColor}</p>
            `;
            
            courseListContainer.appendChild(cardLink);
        });
    }

    loadCourses();
});