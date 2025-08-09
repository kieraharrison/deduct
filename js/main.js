// main.js - Main game controller that ties everything together
import { PuzzleGenerator } from './puzzle-generator.js';
import { GameState } from './game-state.js';
import { UIRenderer } from './ui-renderer.js';
import { Timer } from './timer.js';

class DeductGame {
    constructor() {
        console.log('Initializing DeductGame...');
        
        this.gameState = new GameState();
        this.timer = new Timer();
        this.renderer = new UIRenderer(this.gameState, this.timer);
        this.gameInitialized = false;  // NEW: Track if game has been initialized
        
        this.initializeEventListeners();
        
        // NEW: Show welcome modal on first load instead of generating puzzle
        // Branch: feature/welcome-modal
        this.showWelcomeModal();
    }
    
    initializeEventListeners() {
        console.log('Setting up event listeners...');
        
        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Difficulty button clicked:', e.target.dataset.difficulty);
                this.setDifficulty(e.target.dataset.difficulty);
            });
        });
        
        // Control buttons
        const resetBtn = document.getElementById('resetBtn');
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('Reset button clicked');
                // NEW: Check if game initialized before reset
                if (this.gameInitialized) {
                    this.resetPuzzle();
                } else {
                    this.showWelcomeModal();
                }
            });
        }
        
        // Guides toggle
        const guidesToggle = document.getElementById('guidesToggle');
        if (guidesToggle) {
            guidesToggle.addEventListener('change', (e) => {
                console.log('Guides toggle changed:', e.target.checked);
                if (this.gameInitialized) {  // NEW: Only toggle if game initialized
                    this.toggleGuides(e.target.checked);
                }
            });
        }
        
        // Grid cell clicks (delegated)
        const gameGrid = document.getElementById('gameGrid');
        if (gameGrid) {
            gameGrid.addEventListener('click', (e) => {
                // NEW: Prevent clicks if game not initialized
                // Branch: bugfix/initial-click
                if (!this.gameInitialized) {
                    console.log('Game not initialized, showing welcome modal');
                    this.showWelcomeModal();
                    return;
                }
                
                if (e.target.classList.contains('cell')) {
                    const index = Array.from(e.target.parentNode.children).indexOf(e.target);
                    const row = Math.floor(index / 7);
                    const col = index % 7;
                    console.log(`Cell clicked: ${row}, ${col}`);
                    this.handleCellClick(row, col);
                }
            });
        } else {
            console.error('gameGrid element not found');
        }
        
        // NEW: Welcome modal difficulty buttons
        // Branch: feature/welcome-modal
        const easyStart = document.getElementById('easyStart');
        const mediumStart = document.getElementById('mediumStart');
        const hardStart = document.getElementById('hardStart');
        
        if (easyStart) {
            easyStart.addEventListener('click', () => this.startGame('easy'));
        }
        if (mediumStart) {
            mediumStart.addEventListener('click', () => this.startGame('medium'));
        }
        if (hardStart) {
            hardStart.addEventListener('click', () => this.startGame('hard'));
        }
        
        // NEW: Win modal buttons
        // Branch: feature/win-celebration
        const playAgainBtn = document.getElementById('playAgainBtn');
        const changeDifficultyBtn = document.getElementById('changeDifficultyBtn');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.playAgain());
        }
        if (changeDifficultyBtn) {
            changeDifficultyBtn.addEventListener('click', () => this.changeDifficulty());
        }
    }
    
    // NEW: Show welcome modal
    // Branch: feature/welcome-modal
    showWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    // NEW: Hide welcome modal
    hideWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    // NEW: Start game with selected difficulty
    // Branch: feature/welcome-modal
    startGame(difficulty) {
        console.log('Starting game with difficulty:', difficulty);
        
        // Close welcome modal
        this.hideWelcomeModal();
        
        // Set difficulty and generate puzzle
        this.gameState.difficulty = difficulty;
        this.newPuzzle();
        this.gameInitialized = true;  // NEW: Mark game as initialized
        
        // Update difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('active');
            }
        });
    }
    
    setDifficulty(difficulty) {
        console.log('Setting difficulty to:', difficulty);
        
        // NEW: Check if game initialized
        if (!this.gameInitialized) {
            this.startGame(difficulty);
            return;
        }
        
        this.gameState.difficulty = difficulty;
        
        // Update button states
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('active');
            }
        });
        
        // Generate new puzzle with selected difficulty
        this.newPuzzle();
    }
    
    handleCellClick(row, col) {
        console.log(`Handling cell click at ${row}, ${col}`);
        
        // Start timer on first move if not already started
        if (!this.timer.isRunning() && !this.gameState.gameCompleted) {
            console.log('Starting timer');
            this.timer.start();
        }
        
        // Toggle cell state
        this.gameState.toggleCell(row, col);
        
        // Re-render the grid
        console.log('Re-rendering grid after cell click');
        this.renderer.renderGrid();
        
        // Check for win condition
        if (this.gameState.checkWin()) {
            console.log('Win condition met!');
            this.handleWin();
        } else {
            this.renderer.updateStatus();
        }
    }
    
    // UPDATED: Enhanced win handler with modal
    // Branch: feature/win-celebration
    handleWin() {
        console.log('Handling win');
        this.gameState.gameCompleted = true;
        this.timer.stop();
        this.renderer.showWinStatus();
        this.renderer.animateWin();
        
        // NEW: Show win modal after animation starts
        setTimeout(() => {
            this.showWinModal();
            this.createConfetti();  // NEW: Add confetti effect
        }, 500);
    }
    
    // NEW: Show win modal
    // Branch: feature/win-celebration
    showWinModal() {
        const modal = document.getElementById('winModal');
        const timeDisplay = document.getElementById('winTime');
        
        if (modal && timeDisplay) {
            timeDisplay.textContent = this.timer.getFormattedTime();
            modal.classList.add('active');
        }
    }
    
    // NEW: Hide win modal
    hideWinModal() {
        const modal = document.getElementById('winModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    // NEW: Create confetti effect
    // Branch: feature/win-celebration
    createConfetti() {
        const colors = ['#6482fc', '#fbb45c', '#bfc0f3', '#90EE90', '#FFD700', '#FFA07A'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 3000);
            }, i * 30);
        }
    }
    
    // NEW: Play again with same difficulty
    // Branch: feature/win-celebration
    playAgain() {
        this.hideWinModal();
        this.newPuzzle();
    }
    
    // NEW: Change difficulty after win
    // Branch: feature/win-celebration
    changeDifficulty() {
        this.hideWinModal();
        this.showWelcomeModal();
    }
    
    resetPuzzle() {
        console.log('Resetting puzzle');
        this.timer.stop();
        this.timer.reset();
        this.gameState.reset();
        this.renderer.renderGrid();
        this.renderer.updateStatus();
        this.renderer.updateTimerDisplay();
    }
    
    newPuzzle() {
        console.log("Generating new puzzle...");
        this.timer.stop();
        this.timer.reset();
        
        // Generate a new puzzle with current difficulty
        const generator = new PuzzleGenerator(7, this.gameState.difficulty);
        const newPuzzle = generator.generate();
        
        console.log('Generated puzzle:', newPuzzle);
        
        // Initialize game with new puzzle
        this.gameState.initializeWithPuzzle(newPuzzle);
        
        // Update UI
        this.renderer.updatePuzzleInfo();
        this.renderer.renderGrid();
        this.renderer.updateStatus();
        this.renderer.updateTimerDisplay();
        
        console.log('New puzzle setup complete');
    }
    
    toggleGuides(showGuides) {
        console.log('Toggling guides:', showGuides);
        this.gameState.showGuides = showGuides;
        this.renderer.renderGrid();
    }
}

// Initialize game when DOM is ready
// UPDATED: Only create game instance, don't generate puzzle yet
// Branch: bugfix/initial-load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    window.game = new DeductGame();
});

// Also try immediate initialization in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded...');
} else {
    // DOM already loaded
    console.log('DOM already loaded, initializing game immediately...');
    window.game = new DeductGame();
}
