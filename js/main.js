// main.js - Main game controller that ties everything together
// FIXED: Removed HintSystem import and implemented basic hint functionality

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
        this.gameInitialized = false;
        this.hintsUsed = 0;
        this.maxHints = 3;
        
        this.initializeEventListeners();
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
        const hintBtn = document.getElementById('hintBtn');  
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('Reset button clicked');
                if (this.gameInitialized) {
                    this.resetPuzzle();
                } else {
                    this.showWelcomeModal();
                }
            });
        }

        // Hint button - FIXED: Implemented basic hint functionality
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                console.log('Hint button clicked');
                this.showHint();
            });
        }
        
        // Guides toggle
        const guidesToggle = document.getElementById('guidesToggle');
        if (guidesToggle) {
            guidesToggle.addEventListener('change', (e) => {
                console.log('Guides toggle changed:', e.target.checked);
                if (this.gameInitialized) {
                    this.toggleGuides(e.target.checked);
                }
            });
        }
        
        // Grid cell clicks (delegated)
        const gameGrid = document.getElementById('gameGrid');
        if (gameGrid) {
            gameGrid.addEventListener('click', (e) => {
                if (e.target.classList.contains('cell')) {
                    if (!this.gameInitialized) {
                        console.log('Game not initialized, ignoring click');
                        return;
                    }
                    
                    const cells = Array.from(gameGrid.children);
                    const index = cells.indexOf(e.target);
                    
                    if (index === -1) {
                        console.log('Could not find cell index');
                        return;
                    }
                    
                    const row = Math.floor(index / 7);
                    const col = index % 7;
                    console.log(`Cell clicked: ${row}, ${col}`);
                    this.handleCellClick(row, col);
                }
            });
        } else {
            console.error('gameGrid element not found');
        }
        
        // Modal event handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('difficulty-btn')) {
                const difficulty = e.target.dataset.difficulty;
                if (difficulty) {
                    if (e.target.closest('#welcomeModal')) {
                        this.startGame(difficulty);
                    } else if (e.target.closest('#winModal')) {
                        this.hideWinModal();
                        this.startGame(difficulty);
                    } else {
                        this.setDifficulty(difficulty);
                    }
                }
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.gameInitialized && !this.gameState.gameCompleted) {
                if (e.key === 'h' || e.key === 'H') {
                    this.showHint();
                } else if (e.key === 'r' || e.key === 'R') {
                    this.resetPuzzle();
                }
            }
        });
    }
    
    // Show welcome modal
    showWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        if (modal) {
            document.body.classList.add('modal-open');
            modal.classList.add('active');
            console.log('Welcome modal shown');
        }
    }
    
    // Hide welcome modal
    hideWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    }
    
    // Start game with selected difficulty
    startGame(difficulty) {
        console.log('Starting game with difficulty:', difficulty);
        
        this.hideWelcomeModal();
        this.gameState.difficulty = difficulty;
        this.newPuzzle();
        this.gameInitialized = true;
        
        // Update difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('active');
            }
        });
        
        this.renderer.renderGrid();
        console.log('Game started and initialized successfully');
    }
    
    setDifficulty(difficulty) {
        console.log('Setting difficulty to:', difficulty);
        
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
        
        this.newPuzzle();
        this.gameInitialized = true;
    }
    
    handleCellClick(row, col) {
        console.log(`Handling cell click at ${row}, ${col}`);
        
        console.log('Game state before click:', {
            gameInitialized: this.gameInitialized,
            gridValue: this.gameState.getCellValue(row, col),
            cellState: this.gameState.getCellState(row, col)
        });

        this.clearHintHighlight();
        
        // Start timer on first move if not already started
        if (!this.timer.isRunning() && !this.gameState.gameCompleted) {
            console.log('Starting timer on first move');
            this.timer.start();
        }
        
        this.gameState.toggleCell(row, col);
        
        console.log('Game state after toggle:', {
            gridValue: this.gameState.getCellValue(row, col),
            cellState: this.gameState.getCellState(row, col)
        });
        
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

    // FIXED: Implemented basic hint system
    showHint() {
        if (!this.gameInitialized || this.gameState.gameCompleted) {
            return;
        }

        if (this.hintsUsed >= this.maxHints) {
            this.showHintMessage('No hints remaining!', 'warning');
            return;
        }

        // Find a hint move
        const hint = this.findHintMove();
        
        if (hint) {
            this.hintsUsed++;
            this.highlightHint(hint);
            this.showHintMessage(hint.message, 'success');
        } else {
            this.showHintMessage('No obvious moves found. Try looking for patterns!', 'info');
        }
    }

    findHintMove() {
        // Check for forced deletions
        for (let row = 0; row < 7; row++) {
            const currentSum = this.gameState.getCurrentRowSum(row);
            const target = this.gameState.rowTargets[row];
            const excess = currentSum - target;
            
            if (excess > 0) {
                for (let col = 0; col < 7; col++) {
                    if (this.gameState.getCellState(row, col) === 'normal') {
                        const value = this.gameState.getCellValue(row, col);
                        if (value === excess) {
                            return {
                                row, col,
                                action: 'delete',
                                message: `Row ${row + 1} needs to reduce by exactly ${excess}. This cell has value ${value}.`
                            };
                        }
                    }
                }
            }
        }

        // Check for forced keeps
        for (let row = 0; row < 7; row++) {
            const currentSum = this.gameState.getCurrentRowSum(row);
            const target = this.gameState.rowTargets[row];
            
            if (currentSum === target) {
                for (let col = 0; col < 7; col++) {
                    if (this.gameState.getCellState(row, col) === 'normal') {
                        return {
                            row, col,
                            action: 'confirm',
                            message: `Row ${row + 1} already equals its target. Keep all remaining cells.`
                        };
                    }
                }
            }
        }

        // Check columns for similar patterns
        for (let col = 0; col < 7; col++) {
            const currentSum = this.gameState.getCurrentColSum(col);
            const target = this.gameState.colTargets[col];
            const excess = currentSum - target;
            
            if (excess > 0) {
                for (let row = 0; row < 7; row++) {
                    if (this.gameState.getCellState(row, col) === 'normal') {
                        const value = this.gameState.getCellValue(row, col);
                        if (value === excess) {
                            return {
                                row, col,
                                action: 'delete',
                                message: `Column ${col + 1} needs to reduce by exactly ${excess}. This cell has value ${value}.`
                            };
                        }
                    }
                }
            } else if (currentSum === target) {
                for (let row = 0; row < 7; row++) {
                    if (this.gameState.getCellState(row, col) === 'normal') {
                        return {
                            row, col,
                            action: 'confirm',
                            message: `Column ${col + 1} already equals its target. Keep all remaining cells.`
                        };
                    }
                }
            }
        }

        // Check for intersection logic
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                if (this.gameState.getCellState(row, col) === 'normal') {
                    const value = this.gameState.getCellValue(row, col);
                    
                    const rowSum = this.gameState.getCurrentRowSum(row);
                    const rowTarget = this.gameState.rowTargets[row];
                    const rowSumWithout = rowSum - value;
                    
                    const colSum = this.gameState.getCurrentColSum(col);
                    const colTarget = this.gameState.colTargets[col];
                    const colSumWithout = colSum - value;
                    
                    // If both would be under target, must keep
                    if (rowSumWithout < rowTarget && colSumWithout < colTarget) {
                        return {
                            row, col,
                            action: 'confirm',
                            message: `Deleting this cell would make both row ${row + 1} and column ${col + 1} impossible to reach their targets.`
                        };
                    }
                }
            }
        }

        return null;
    }

    highlightHint(hint) {
        const gridElement = document.getElementById('gameGrid');
        if (gridElement) {
            const cellIndex = hint.row * 7 + hint.col;
            const cell = gridElement.children[cellIndex];
            if (cell) {
                cell.classList.add('hint-highlight');
                if (hint.action === 'delete') {
                    cell.classList.add('hint-delete');
                } else if (hint.action === 'confirm') {
                    cell.classList.add('hint-confirm');
                }
            }
        }
    }

    showHintMessage(message, type) {
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            statusElement.innerHTML = `<div class="hint-message">${message} (Hints used: ${this.hintsUsed}/${this.maxHints})</div>`;
            statusElement.className = 'status hint';
        }
        
        // Auto-clear message after 5 seconds
        setTimeout(() => {
            this.renderer.updateStatus();
        }, 5000);
    }
    
    clearHintHighlight() {
        const gridElement = document.getElementById('gameGrid');
        if (gridElement) {
            const cells = gridElement.children;
            for (let cell of cells) {
                cell.classList.remove('hint-highlight', 'hint-delete', 'hint-confirm');
            }
        }
    }
    
    handleWin() {
        console.log('Handling win');
        this.gameState.gameCompleted = true;
        this.timer.stop();
        this.renderer.showWinStatus();
        this.renderer.animateWin();
        
        // Show win modal after animation starts
        setTimeout(() => {
            this.showWinModal();
            this.createConfetti();
        }, 500);
    }
    
    showWinModal() {
        const modal = document.getElementById('winModal');
        const timeDisplay = document.getElementById('winTime');
        const hintsDisplay = document.getElementById('winHints');
        
        if (modal && timeDisplay) {
            timeDisplay.textContent = this.timer.getFormattedTime();
            
            if (hintsDisplay) {
                if (this.hintsUsed === 0) {
                    hintsDisplay.textContent = '🏆 Perfect! No hints used!';
                    hintsDisplay.className = 'hints-perfect';
                } else {
                    hintsDisplay.textContent = `Hints used: ${this.hintsUsed}/${this.maxHints}`;
                    hintsDisplay.className = 'hints-used';
                }
            }
            
            document.body.classList.add('modal-open');
            modal.classList.add('active');
        }
    }
    
    hideWinModal() {
        const modal = document.getElementById('winModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    }
    
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
    
    playAgain() {
        this.hideWinModal();
        this.newPuzzle();
    }
    
    changeDifficulty() {
        this.hideWinModal();
        this.showWelcomeModal();
    }
    
    resetPuzzle() {
        console.log('Resetting puzzle');
        this.timer.stop();
        this.timer.reset();
        this.gameState.reset();
        this.hintsUsed = 0; // Reset hints
        this.renderer.renderGrid();
        this.renderer.updateStatus();
        this.renderer.updateTimerDisplay();
    }
    
    newPuzzle() {
        console.log("Generating new puzzle...");
        this.timer.stop();
        this.timer.reset();
        this.hintsUsed = 0; // Reset hints for new puzzle
        
        // Generate a new puzzle with current difficulty
        const generator = new PuzzleGenerator(7, this.gameState.difficulty);
        const newPuzzle = generator.generate();
        
        console.log('Generated puzzle:', newPuzzle);
        console.log('Grid values:', newPuzzle.grid);
        console.log('Puzzle validated:', newPuzzle.validated);
        
        // Initialize game with new puzzle
        this.gameState.initializeWithPuzzle(newPuzzle);
        
        // Debug: Verify the game state has the correct grid
        console.log('Game state after initialization:');
        for (let i = 0; i < 7; i++) {
            console.log(`Row ${i}:`, this.gameState.grid[i]);
        }
        
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
if (!window.gameInitialized) {
    window.gameInitialized = true;

    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing game...');
        window.game = new DeductGame();
        window.game.showWelcomeModal();
    });
}
