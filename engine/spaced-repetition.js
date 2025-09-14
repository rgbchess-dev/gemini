// SpacedRepetitionManager.js - REFACTORED

export class SpacedRepetitionManager {
    constructor(courseId) {
        this.courseId = courseId;
        this.storageKey = `srs-progress-${this.courseId}`;
        this.cards = new Map();
        this.loadProgress();
    }

    /**
     * Scans the course data for theory lines and ensures a tracking card exists for each.
     * Does not overwrite existing progress.
     */
    generateCardsFromOpening(courseData) {
        if (!courseData || !courseData.lines) return;
        const theoryLines = courseData.lines.filter(line => line.type === 'theory');
        let updated = false;
        theoryLines.forEach(line => {
            if (line.id && !this.cards.has(line.id)) {
                this.cards.set(line.id, this.createCard(line));
                updated = true;
            }
        });
        if (updated) this.saveProgress();
    }

    /**
     * Retrieves the progress card for a given line ID.
     * If one doesn't exist, it creates a temporary one for the current session.
     * @param {string} lineId The ID of the line.
     * @returns {{id: string, reviewStage: number}} The progress card.
     */
    getCard(lineId) {
        if (!this.cards.has(lineId)) {
            return { id: lineId, reviewStage: 1 };
        }
        return this.cards.get(lineId);
    }

    /**
     * Creates a new, default progress card for a line, starting at Stage 1.
     */
    createCard(line) {
        return {
            id: line.id,
            reviewStage: 1, // Start at Stage 1: Full hints
        };
    }

    /**
     * Advances a card to the next stage upon successful completion.
     * Caps at Stage 3.
     * @param {string} cardId The ID of the card/line to advance.
     */
    advanceCardStage(cardId) {
        const card = this.cards.get(cardId);
        if (!card) return;

        if (card.reviewStage < 3) {
            card.reviewStage++;
            console.log(`SRS: Advanced line ${cardId} to Stage ${card.reviewStage}`);
        } else {
            console.log(`SRS: Line ${cardId} already mastered at Stage 3.`);
        }
        this.saveProgress();
    }

    /**
     * Demotes a card back to Stage 1 upon failure (incorrect move).
     * @param {string} cardId The ID of the card/line to demote.
     */
    demoteCard(cardId) {
        const card = this.cards.get(cardId);
        if (!card) return;

        if (card.reviewStage !== 1) {
            card.reviewStage = 1;
            console.log(`SRS: Demoted line ${cardId} back to Stage 1.`);
        }
        this.saveProgress();
    }

    /**
     * Loads progress from browser's localStorage.
     */
    loadProgress() {
        const savedData = localStorage.getItem(this.storageKey);
        if (savedData) {
            try {
                this.cards = new Map(JSON.parse(savedData));
            } catch (e) {
                console.error("SRS: Failed to parse saved progress.", e);
                this.cards = new Map();
            }
        }
    }

    /**
     * Saves the current progress to browser's localStorage.
     */
    saveProgress() {
        localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.cards.entries())));
    }

    /**
     * Deletes all progress for the current course.
     */
    resetProgress() {
        console.log(`SRS: Resetting all progress for course ${this.courseId}.`);
        this.cards.clear();
        localStorage.removeItem(this.storageKey);
        // A page reload after this is recommended to ensure a clean state.
    }
}