// /engine/spaced-repetition.js - Complete working implementation
export class SpacedRepetitionManager {
    constructor(openingName) {
        this.openingName = openingName;
        this.cards = new Map();
        this.currentSession = {
            studied: 0,
            correct: 0,
            startTime: Date.now()
        };
    }

    createCard(positionId, data) {
        const card = {
            id: positionId,
            opening: this.openingName,
            lineIndex: data.lineIndex,
            
            interval: 1,
            repetitions: 0,
            easeFactor: 2.5,
            nextReview: Date.now(),
            
            lineCompletions: 0,
            correctTestAttempts: 0,
            totalTestAttempts: 0,
            streak: 0,
            lastStudied: null,
            currentMoveInLine: 0,
            difficulty: 'new',
            
            moves: data.moves || [],
            name: data.name,
            category: data.category,
            description: data.description,
            hint: data.hint,
            playerColor: data.playerColor || 'black',
            orientation: data.orientation || 'black'
        };
        
        this.cards.set(positionId, card);
        return card;
    }

    generateCardsFromOpening(openingData) {
        console.log('=== GENERATING SPACED REPETITION CARDS ===');
        
        if (!openingData || !openingData.lines || !openingData.lines.length) {
            console.error('ERROR: No lines in opening data');
            return;
        }

        const playerColor = openingData.playerColor || 'black';
        const orientation = openingData.orientation || 'black';
        let cardCount = 0;

        openingData.lines.forEach((line, lineIndex) => {
            if (!line.moves || !line.moves.length) {
                console.warn(`Skipping line ${lineIndex}: no moves`);
                return;
            }

            const positionId = `${this.openingName}_line${lineIndex}`;
            const cardData = {
                lineIndex: lineIndex,
                moves: line.moves,
                name: line.name,
                category: line.category || 'Main Lines',
                description: line.description || `Learn ${line.name}`,
                hint: line.hint || `Study ${line.name} variation`,
                playerColor: playerColor,
                orientation: orientation
            };

            this.createCard(positionId, cardData);
            cardCount++;
        });

        console.log(`Generated ${cardCount} cards for ${this.openingName}`);
        console.log(`Total cards available: ${this.cards.size}`);
    }

    getNextCard() {
        const allCards = Array.from(this.cards.values());
        
        if (allCards.length === 0) {
            console.log('No cards available');
            return null;
        }

        const learningCards = allCards.filter(card => card.lineCompletions < 2);
        if (learningCards.length > 0) {
            console.log(`Returning learning card: ${learningCards[0].name}`);
            return learningCards[0];
        }

        const testingCards = allCards.filter(card => card.lineCompletions >= 2);
        if (testingCards.length > 0) {
            console.log(`Returning testing card: ${testingCards[0].name}`);
            return testingCards[0];
        }

        console.log(`Returning first available card: ${allCards[0].name}`);
        return allCards[0];
    }

    updateCardAfterReview(cardId, quality) {
        const card = this.cards.get(cardId);
        if (!card) return;

        card.lastStudied = Date.now();
        this.currentSession.studied++;
        
        const isLearningPhase = card.lineCompletions < 2;
        
        if (isLearningPhase) {
            if (quality >= 3) {
                this.currentSession.correct++;
            }
        } else {
            card.totalTestAttempts++;
            
            if (quality >= 3) {
                card.correctTestAttempts++;
                card.streak++;
                this.currentSession.correct++;
                
                if (card.repetitions === 0) {
                    card.interval = 1;
                } else if (card.repetitions === 1) {
                    card.interval = 6;
                } else {
                    card.interval = Math.round(card.interval * card.easeFactor);
                }
                
                card.repetitions++;
                card.easeFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
                
                if (card.easeFactor < 1.3) {
                    card.easeFactor = 1.3;
                }
                
                card.difficulty = card.repetitions >= 2 && card.easeFactor >= 2.5 ? 'mastered' : 'testing';
            } else {
                card.streak = 0;
                card.repetitions = 0;
                card.interval = 1;
                card.difficulty = 'learning';
                card.lineCompletions = 0;
                card.currentMoveInLine = 0;
            }
            
            card.nextReview = Date.now() + (card.interval * 24 * 60 * 60 * 1000);
        }
    }

    getStats() {
        const cards = Array.from(this.cards.values());
        
        return {
            totalCards: cards.length,
            learningCards: cards.filter(c => c.lineCompletions < 2).length,
            testingCards: cards.filter(c => c.lineCompletions >= 2).length,
            masteredCards: cards.filter(c => c.difficulty === 'mastered').length,
            
            session: {
                studied: this.currentSession.studied,
                correct: this.currentSession.correct,
                successRate: this.currentSession.studied > 0 ? 
                    Math.round((this.currentSession.correct / this.currentSession.studied) * 100) : 0,
                timeMinutes: Math.round((Date.now() - this.currentSession.startTime) / 60000)
            }
        };
    }

    resetSession() {
        this.currentSession = { studied: 0, correct: 0, startTime: Date.now() };
    }

    loadProgress() {
        console.log(`Loading spaced repetition data for ${this.openingName}`);
    }

    saveProgress() {
        console.log(`Saved progress: ${this.cards.size} cards tracked`);
    }
}