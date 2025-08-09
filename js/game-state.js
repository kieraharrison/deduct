// game-state.js - Manages all game state
export class GameState {
    constructor() {
        this.grid = [];
        this.deleted = [];
        this.confirmed = [];
        this.rowTargets = [];
        this.colTargets = [];
        this.size = 7;
        this.gameCompleted = false;
        this.currentPuzzle = null;
        this.solutionMask = null;
        this.difficulty = 'easy';
        this.showGuides = true;
        
        console.log('GameState initialized');
    }
    
    initializeWithPuzzle(puzzle) {
        console.log('Initializing with puzzle:', puzzle);
        this.currentPuzzle = puzzle;
        this.grid = puzzle.grid.map(row => [...row]);
        this.rowTargets = [...puzzle.rowTargets];
        this.colTargets = [...puzzle.colTargets];
        this.solutionMask = puzzle.solutionMask;
        this.difficulty = puzzle.difficulty || this.difficulty;
        
        // Initialize deleted and confirmed states
        this.deleted = Array(this.size).fill().map(() => Array(this.size).fill(false));
        this.confirmed = Array(this.size).fill().map(() => Array(this.size).fill(false));
        this.gameCompleted = false;
        
        console.log('Game state initialized with grid:', this.grid);
    }
    
    reset() {
        console.log('Resetting game state');
        // Reset to current puzzle's initial state
        if (this.currentPuzzle) {
            this.deleted = Array(this.size).fill().map(() => Array(this.size).fill(false));
            this.confirmed = Array(this.size).fill().map(() => Array(this.size).fill(false));
            this.gameCompleted = false;
        }
    }
    
    toggleCell(row, col) {
        console.log(`Toggling cell at ${row}, ${col}`);
        console.log(`Current state - deleted: ${this.deleted[row][col]}, confirmed: ${this.confirmed[row][col]}`);
        
        // Cycle through three states: normal -> deleted -> confirmed -> normal
        if (!this.confirmed[row][col] && !this.deleted[row][col]) {
            // Normal -> Deleted
            this.deleted[row][col] = true;
            console.log('Cell set to deleted');
        } else if (this.deleted[row][col]) {
            // Deleted -> Confirmed (keeping the cell)
            this.deleted[row][col] = false;
            this.confirmed[row][col] = true;
            console.log('Cell set to confirmed');
        } else {
            // Confirmed -> Normal
            this.confirmed[row][col] = false;
            console.log('Cell set to normal');
        }
    }
    
    getCurrentRowSum(row) {
        let sum = 0;
        for (let col = 0; col < this.size; col++) {
            if (!this.deleted[row][col]) {
                sum += this.grid[row][col];
            }
        }
        return sum;
    }
    
    getCurrentColSum(col) {
        let sum = 0;
        for (let row = 0; row < this.size; row++) {
            if (!this.deleted[row][col]) {
                sum += this.grid[row][col];
            }
        }
        return sum;
    }
    
    checkWin() {
        for (let i = 0; i < this.size; i++) {
            if (this.getCurrentRowSum(i) !== this.rowTargets[i]) return false;
            if (this.getCurrentColSum(i) !== this.colTargets[i]) return false;
        }
        return true;
    }
    
    getCellState(row, col) {
        if (this.deleted[row][col]) return 'deleted';
        if (this.confirmed[row][col]) return 'confirmed';
        return 'normal';
    }
    
    getCellValue(row, col) {
        return this.grid[row][col];
    }
}
