// main.js - Main game controller that ties everything together
import { PuzzleGenerator, HintSystem } from './puzzle-generator.js';
import { GameState } from './game-state.js';
import { UIRenderer } from './ui-renderer.js';
import { Timer } from './timer.js';

class DeductGame {
    constructor() {
        console.log('Initializing DeductGame...');
        
        this.gameState = new GameState();
        this.timer = new Timer();
        this.renderer = new UIRenderer(this.gameState, this.timer);
        this.gameInitialized = false;  // Track if game has been initialized
        this.hintSystem = null;  // Will be set when puzzle is generated
        this.hintsUsed = 0;
        
        this.initializeEventListeners();

        // Show welcome modal on first load instead of generating puzzle
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
                // Check if game initialized before reset
                if (this.gameInitialized) {
                    this.resetPuzzle();
                } else {
                    this.showWelcomeModal();
                }
            });
        }

        // Hint button
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                console.log('Hint button clicked');
                if (this.gameInitialized && !this.gameState.gameCompleted) {
                    this.showHint();
                }
            });
        }
        
        // Guides toggle - FIX: Only toggle guides, don't do anything else
        const guidesToggle = document.getElementById('guidesToggle');
        if (guidesToggle) {
            guidesToggle.addEventListener('change', (e) => {
                console.log('Guides toggle changed:', e.target.checked);
                // FIX: Always allow guides toggle if game is initialized, do nothing if not
                if (this.gameInitialized) {
                    this.toggleGuides(e.target.checked);
                }
                // FIX: Remove any implicit else behavior that might cause issues
            });
        }
        
        // Grid cell clicks (delegated)
        const gameGrid = document.getElementById('gameGrid');
        if (gameGrid) {
            gameGrid.addEventListener('click', (e) => {
                if (e.target.classList.contains('cell')) {
                    // FIX: Only check if game is initialized, don't show modal on every click
                    if (!this.gameInitialized) {
                        console.log('Game not initialized, ignoring click');
                        return; // Simply ignore the click instead of showing modal
                    }
                    
                    // FIX: Safer way to get cell index
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
        
        // Welcome modal difficulty buttons - need to handle these with delegation
        // since the modal elements might not exist yet
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('difficulty-btn') && e.target.closest('#welcomeModal')) {
                const difficulty = e.target.dataset.difficulty;
                if (difficulty) {
                    this.startGame(difficulty);
                }
            }
        });
        
        // Win modal buttons
        const playAgainBtn = document.getElementById('playAgainBtn');
        const changeDifficultyBtn = document.getElementById('changeDifficultyBtn');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.playAgain());
        }
        if (changeDifficultyBtn) {
            changeDifficultyBtn.addEventListener('click', () => this.changeDifficulty());
        }

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
            // Prevent body scroll when modal is open
            document.body.classList.add('modal-open');
            modal.classList.add('active');
            
            console.log('Welcome modal shown');
        }
    }
    
    // Hide welcome modal with scroll restoration
    hideWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        if (modal) {
            modal.classList.remove('active');
            // Restore body scroll when modal is closed
            document.body.classList.remove('modal-open');
        }
    }
    
    // Start game with selected difficulty
    startGame(difficulty) {
        console.log('Starting game with difficulty:', difficulty);
        
        // Close welcome modal
        this.hideWelcomeModal();
        
        // Set difficulty and generate puzzle
        this.gameState.difficulty = difficulty;
        this.newPuzzle();
        
        // FIX: Set gameInitialized AFTER puzzle is fully generated and rendered
        this.gameInitialized = true;
        
        // Update difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('active');
            }
        });
        
        // FIX: Force an immediate render to ensure the grid is properly displayed
        this.renderer.renderGrid();
        
        console.log('Game started and initialized successfully');
    }
    
    setDifficulty(difficulty) {
        console.log('Setting difficulty to:', difficulty);
        
        // Check if game initialized
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
        
        // FIX: Ensure gameInitialized stays true since we're just changing difficulty
        this.gameInitialized = true;
    }
    
    handleCellClick(row, col) {
        console.log(`Handling cell click at ${row}, ${col}`);
        
        // Add debugging to see if game state is being corrupted
        console.log('Game state before click:', {
            gameInitialized: this.gameInitialized,
            gridValue: this.gameState.getCellValue(row, col),
            cellState: this.gameState.getCellState(row, col)
        });

        // Clear any hint highlighting
        this.clearHintHighlight();
        
        // Start timer on first move if not already started
        if (!this.timer.isRunning() && !this.gameState.gameCompleted) {
            console.log('Starting timer on first move');
            this.timer.start();
        }
        
        // Toggle cell state
        this.gameState.toggleCell(row, col);
        
        // Add debugging after toggle
        console.log('Game state after toggle:', {
            gridValue: this.gameState.getCellValue(row, col),
            cellState: this.gameState.getCellState(row, col)
        });
        
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

      showHint() {
        if (!this.hintSystem) {
            console.error('Hint system not initialized');
            return;
        }
        
        // Get current state
        const currentDeleted = this.gameState.deleted;
        const currentConfirmed = this.gameState.confirmed;
        
        // Get hint from hint system
        const hint = this.hintSystem.getHint(currentDeleted, currentConfirmed);
        
        console.log('Hint generated:', hint);
        
        // Display hint
        this.displayHint(hint);
        
        // Track hint usage
        this.hintsUsed++;
        
        // Update hint button text to show count
        if (hintBtn) {
            hintBtn.textContent = `💡 Hint (${this.hintsUsed})`;
        }
    }

       displayHint(hint) {
        // Clear previous hint
        this.clearHintHighlight();
        
        // Show hint message
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            statusElement.innerHTML = `<div class="hint-message">${hint.message}</div>`;
            statusElement.className = 'status hint';
        }
        
        // Highlight the suggested cell if applicable
        if (hint.highlight && hint.cell) {
            const gridElement = document.getElementById('gameGrid');
            if (gridElement) {
                const cellIndex = hint.cell.row * 7 + hint.cell.col;
                const cells = gridElement.children;
                if (cells[cellIndex]) {
                    cells[cellIndex].classList.add('hint-highlight');
                    
                    // Add action-specific highlight
                    if (hint.action === 'delete') {
                        cells[cellIndex].classList.add('hint-delete');
                    } else if (hint.action === 'confirm') {
                        cells[cellIndex].classList.add('hint-confirm');
                    }
                }
            }
        }

        // Auto-clear hint after 10 seconds
        setTimeout(() => {
            this.clearHintHighlight();
            this.renderer.updateStatus();
        }, 10000);
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
    
    // Enhanced win handler with modal
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
    
    // Show win modal
    showWinModal() {
        const modal = document.getElementById('winModal');
        const timeDisplay = document.getElementById('winTime');
        
        if (modal && timeDisplay) {
            timeDisplay.textContent = this.timer.getFormattedTime();
            // Prevent body scroll when modal is open
            document.body.classList.add('modal-open');
            modal.classList.add('active');
        }
    }
    
    // Hide win modal with scroll restoration
    hideWinModal() {
        const modal = document.getElementById('winModal');
        if (modal) {
            modal.classList.remove('active');
            // Restore body scroll when modal is closed
            document.body.classList.remove('modal-open');
        }
    }
    
    // Create confetti effect
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
    
    // Play again with same difficulty
    playAgain() {
        this.hideWinModal();
        this.newPuzzle();
    }
    
    // Change difficulty after win
    changeDifficulty() {
        this.hideWinModal();
        this.showWelcomeModal();
        // FIX: Don't reset gameInitialized here, let the user choose
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
        console.log('Grid values:', newPuzzle.grid);
        
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
        window.game.showWelcomeModal(); // Now guaranteed to exist
    });
}
