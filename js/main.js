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
        
        this.initializeEventListeners();
        
        // Generate initial puzzle
        console.log('Creating initial puzzle...');
        this.newPuzzle();
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
        const newPuzzleBtn = document.getElementById('newPuzzleBtn');
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('Reset button clicked');
                this.resetPuzzle();
            });
        }
        
        if (newPuzzleBtn) {
            newPuzzleBtn.addEventListener('click', () => {
                console.log('New puzzle button clicked');
                this.newPuzzle();
            });
        }
        
        // Guides toggle
        const guidesToggle = document.getElementById('guidesToggle');
        if (guidesToggle) {
            guidesToggle.addEventListener('change', (e) => {
                console.log('Guides toggle changed:', e.target.checked);
                this.toggleGuides(e.target.checked);
            });
        }
        
        // Grid cell clicks (delegated)
        const gameGrid = document.getElementById('gameGrid');
        if (gameGrid) {
            gameGrid.addEventListener('click', (e) => {
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
    }
    
    setDifficulty(difficulty) {
        console.log('Setting difficulty to:', difficulty);
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
    
    handleWin() {
        console.log('Handling win');
        this.gameState.gameCompleted = true;
        this.timer.stop();
        this.renderer.showWinStatus();
        this.renderer.animateWin();
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
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    window.game = new DeductGame();
});

// Also try immediate initialization in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
    // Still loading, wait for DOMContentLoaded
    console.log('Document still loading, waiting for DOMContentLoaded...');
} else {
    // DOM already loaded
    console.log('DOM already loaded, initializing game immediately...');
    window.game = new DeductGame();
}
