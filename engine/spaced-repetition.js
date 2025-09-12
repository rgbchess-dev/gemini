export class SpacedRepetitionManager {
    constructor(openingName) {
        this.openingName = openingName;
        this.storageKey = `srs-progress-${this.openingName}`;
        this.cards = new Map();
        this.currentSession = { studied: 0, correct: 0, startTime: Date.now() };
    }

    createCard(positionId, data) {
        if (this.cards.has(positionId)) {
            const existingCard = this.cards.get(positionId);
            existingCard.moves = data.moves;
            existingCard.name = data.name;
            if (!existingCard.startingFen) existingCard.startingFen = data.startingFen;
            // --- ADDITION: Ensure existing cards have a reviewStage ---
            if (!existingCard.reviewStage) existingCard.reviewStage = 1;
            return existingCard;
        }
        
        const card = {
            id: positionId,
            opening: this.openingName,
            lineIndex: data.lineIndex,
            interval: 1,
            repetitions: 0,
            easeFactor: 2.5,
            nextReview: Date.now(),
            streak: 0,
            lastStudied: null,
            difficulty: 'new',
            // --- ADDITION: New cards always start at Stage 1 ---
            reviewStage: 1, 
            moves: data.moves || [],
            name: data.name,
            startingFen: data.startingFen
        };
        
        this.cards.set(positionId, card);
        return card;
    }

    generateCardsFromOpening(openingData) {
        if (!openingData || !openingData.lines) return;

        // --- CRITICAL FIX: Use the course's starting FEN to create cards ---
        const courseStartingFen = openingData.startingFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

        openingData.lines.forEach((line, lineIndex) => {
            if (!line.moves || !line.moves.length) return;

            const positionId = `${this.openingName}_line${lineIndex}`;
            this.createCard(positionId, {
                lineIndex: lineIndex,
                moves: line.moves,
                name: line.name,
                // For now, we assume all lines start from the course's main FEN.
                // This is a robust assumption that prevents crashes.
                startingFen: courseStartingFen
            });
        });

        console.log(`Synced ${openingData.lines.length} lines. Total cards: ${this.cards.size}`);
        this.saveProgress();
    }
    
    // ... (The rest of this file is correct: getNextCard, updateCardAfterReview, load/saveProgress etc.) ...
    // (Paste the rest of your working functions here)


    getNextCard() {
        const allCards = Array.from(this.cards.values());
        if (allCards.length === 0) return null;
        const now = Date.now();
        const dueCards = allCards.filter(card => card.nextReview <= now);
        if (dueCards.length === 0) return null;
        dueCards.sort((a, b) => {
            const aIsNew = a.difficulty === 'new';
            const bIsNew = b.difficulty === 'new';
            if (aIsNew && !bIsNew) return -1;
            if (!aIsNew && bIsNew) return 1;
            return a.nextReview - b.nextReview;
        });
        return dueCards[0];
    }

    // --- NEW FUNCTION: Advance a card to the next stage or complete it ---
    advanceCardStage(cardId) {
        const card = this.cards.get(cardId);
        if (!card) return;

        if (card.reviewStage < 3) {
            card.reviewStage++;
            console.log(`Advancing card "${card.name}" to Stage ${card.reviewStage}`);
        } else {
            // The user has completed Stage 3. This is a fully successful review.
            this.updateCardAfterReview(cardId, 5); // Grade it as "perfect"
            card.reviewStage = 1; // Reset for the next time it's due
            console.log(`✅ Card "${card.name}" review complete! Resetting to Stage 1.`);
        }
        this.saveProgress();
    }

    // --- NEW FUNCTION: Demote a card back to Stage 1 after a mistake ---
    demoteCard(cardId) {
        const card = this.cards.get(cardId);
        if (!card) return;
        
        if (card.reviewStage > 1) {
            console.log(`Mistake made. Demoting card "${card.name}" back to Stage 1.`);
            card.reviewStage = 1;
        }
        
        // Penalize the card's interval for the mistake
        this.updateCardAfterReview(cardId, 1); // Grade it as "failed"
        this.saveProgress();
    }

    updateCardAfterReview(cardId, quality) {
        const card = this.cards.get(cardId);
        if (!card) return;
        card.lastStudied = Date.now();
        this.currentSession.studied++;
        
        if (quality >= 3) {
            this.currentSession.correct++;
            card.streak++;
            if (card.difficulty === 'new') { card.difficulty = 'learning'; card.interval = 1; } 
            else if (card.difficulty === 'learning') { card.difficulty = 'testing'; card.interval = 6; } 
            else { card.interval = Math.round(card.interval * card.easeFactor); }
            card.repetitions++;
            card.easeFactor += (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            if (card.easeFactor < 1.3) card.easeFactor = 1.3;
        } else {
            card.streak = 0;
            card.repetitions = 0;
            card.interval = 1;
            card.difficulty = 'learning';
        }
        
        card.nextReview = Date.now() + (card.interval * 24 * 60 * 60 * 1000);
        this.saveProgress();
    }

    getStats() {
        const cards = Array.from(this.cards.values());
        return {
            totalCards: cards.length,
            newCards: cards.filter(c => c.difficulty === 'new').length,
            learningCards: cards.filter(c => c.difficulty === 'learning').length,
            testingCards: cards.filter(c => c.difficulty === 'testing').length,
            session: {
                studied: this.currentSession.studied,
                correct: this.currentSession.correct,
                successRate: this.currentSession.studied > 0 ? Math.round((this.currentSession.correct / this.currentSession.studied) * 100) : 0,
                timeMinutes: Math.round((Date.now() - this.currentSession.startTime) / 60000)
            }
        };
    }

    resetSession() {
        this.currentSession = { studied: 0, correct: 0, startTime: Date.now() };
    }

    // --- THIS IS THE CRITICAL FUNCTION THAT MUST EXIST ---
    loadProgress() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const deserializedCards = JSON.parse(savedData);
                this.cards = new Map(deserializedCards);
                console.log(`✅ Loaded progress: ${this.cards.size} cards for ${this.openingName}`);
            } else {
                console.log('ℹ️ No saved progress found. Starting fresh.');
            }
        } catch (error) {
            console.error('❌ Failed to load progress:', error);
            this.cards = new Map();
        }
    }

    saveProgress() {
        try {
            const serializedCards = JSON.stringify(Array.from(this.cards.entries()));
            localStorage.setItem(this.storageKey, serializedCards);
            console.log(`✅ Saved progress: ${this.cards.size} cards tracked.`);
        } catch (error) {
            console.error('❌ Failed to save progress:', error);
        }
    }
}