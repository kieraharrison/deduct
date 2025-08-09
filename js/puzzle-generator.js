// puzzle-generator.js - Handles all puzzle generation logic

export class PuzzleGenerator {
    constructor(size = 7, difficulty = 'easy') {
        this.size = size;
        this.difficulty = difficulty;
        
        // UPDATED: Enhanced difficulty settings with more variation
        // Branch: feature/enhanced-difficulty
        const difficultySettings = {
            easy: {
                minValue: 1,
                maxValue: 5,  // CHANGED: Reduced from 6 to make smaller sums
                minKeepCells: 5,  // CHANGED: Increased from 4 to keep more cells (easier)
                maxKeepCells: 7,  // CHANGED: Increased from 6 - only 0-2 deletions per row/column
                maxDuplicates: 2,  // CHANGED: Reduced from 4 for more unique numbers
                targetSumMultiplier: 0.7  // NEW: Multiplier for target sums (not currently used)
            },
            medium: {
                minValue: 1,
                maxValue: 9,
                minKeepCells: 3,  // CHANGED: Increased from 2
                maxKeepCells: 5,
                maxDuplicates: 3,
                targetSumMultiplier: 0.8  // NEW: Multiplier for target sums
            },
            hard: {
                minValue: 2,  // CHANGED: Increased from 1
                maxValue: 12,  // CHANGED: Increased from 9 for more complexity
                minKeepCells: 1,
                maxKeepCells: 4,  // CHANGED: Reduced from 6 for more deletions needed
                maxDuplicates: 4,  // CHANGED: Increased from 2 to make pattern recognition harder
                targetSumMultiplier: 0.9  // NEW: Multiplier for target sums
            }
        };
        
        const settings = difficultySettings[difficulty] || difficultySettings.medium;
        this.minValue = settings.minValue;
        this.maxValue = settings.maxValue;
        this.minKeepCells = settings.minKeepCells;
        this.maxKeepCells = settings.maxKeepCells;
        this.maxDuplicates = settings.maxDuplicates;
        this.targetSumMultiplier = settings.targetSumMultiplier;  // NEW
        this.maxAttempts = 1000;
    }

    generate() {
        console.log(`Generating ${this.difficulty} puzzle...`);
        
        for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
            const puzzle = this.attemptGeneration();
            if (puzzle) {
                console.log('Successfully generated puzzle');
                return puzzle;
            }
        }
        
        console.log("Could not generate valid puzzle, using fallback");
        return this.generateFallbackPuzzle();
    }

    attemptGeneration() {
        // Step 1: Create a solution mask (which cells to keep)
        const solutionMask = this.createValidSolutionMask();
        if (!solutionMask) return null;

        // Step 2: Fill the grid with random values
        const grid = this.createGrid();

        // Step 3: Calculate targets based on solution
        const targets = this.calculateTargets(grid, solutionMask);

        // Step 4: Validate the puzzle meets all criteria
        if (this.validatePuzzle(grid, solutionMask, targets)) {
            return { 
                grid, 
                solutionMask, 
                rowTargets: targets.row, 
                colTargets: targets.col,
                difficulty: this.difficulty
            };
        }

        return null;
    }

    createValidSolutionMask() {
        const mask = Array(this.size).fill().map(() => Array(this.size).fill(false));
        
        // Ensure each row has appropriate number of cells kept based on difficulty
        for (let i = 0; i < this.size; i++) {
            // Randomly decide how many cells to keep in this row
            const range = this.maxKeepCells - this.minKeepCells + 1;
            const rowKeepCount = this.minKeepCells + Math.floor(Math.random() * range);
            const rowIndices = this.shuffleArray([...Array(this.size).keys()]);
            
            for (let j = 0; j < rowKeepCount; j++) {
                mask[i][rowIndices[j]] = true;
            }
        }

        // Verify columns also have appropriate number of cells kept
        for (let j = 0; j < this.size; j++) {
            const colCount = mask.map(row => row[j]).filter(x => x).length;
            
            // Adjust if column is outside acceptable range
            if (colCount < this.minKeepCells || colCount > this.maxKeepCells) {
                if (colCount < this.minKeepCells) {
                    // Add cells until we reach minimum
                    const rowsToAdd = [];
                    for (let i = 0; i < this.size; i++) {
                        if (!mask[i][j]) rowsToAdd.push(i);
                    }
                    this.shuffleArray(rowsToAdd);
                    const cellsToAdd = this.minKeepCells - colCount;
                    for (let k = 0; k < cellsToAdd && k < rowsToAdd.length; k++) {
                        mask[rowsToAdd[k]][j] = true;
                    }
                } else if (colCount > this.maxKeepCells) {
                    // Remove cells until we reach maximum
                    const rowsToRemove = [];
                    for (let i = 0; i < this.size; i++) {
                        if (mask[i][j]) rowsToRemove.push(i);
                    }
                    this.shuffleArray(rowsToRemove);
                    const cellsToRemove = colCount - this.maxKeepCells;
                    for (let k = 0; k < cellsToRemove && k < rowsToRemove.length; k++) {
                        mask[rowsToRemove[k]][j] = false;
                    }
                }
            }
        }

        return mask;
    }

    createGrid() {
        const grid = [];
        
        // UPDATED: Better distribution of unique numbers for easy mode
        // Branch: feature/enhanced-difficulty
        for (let i = 0; i < this.size; i++) {
            const row = [];
            const usedCounts = {};
            
            for (let j = 0; j < this.size; j++) {
                let value;
                let attempts = 0;
                
                // NEW: For easy mode, try to use more unique numbers
                if (this.difficulty === 'easy') {
                    const availableValues = [];
                    for (let v = this.minValue; v <= this.maxValue; v++) {
                        if ((usedCounts[v] || 0) < this.maxDuplicates) {
                            availableValues.push(v);
                        }
                    }
                    if (availableValues.length > 0) {
                        value = availableValues[Math.floor(Math.random() * availableValues.length)];
                    } else {
                        value = this.minValue + Math.floor(Math.random() * (this.maxValue - this.minValue + 1));
                    }
                } else {
                    do {
                        value = this.minValue + Math.floor(Math.random() * (this.maxValue - this.minValue + 1));
                        attempts++;
                    } while (usedCounts[value] >= this.maxDuplicates && attempts < 50);
                }
                
                usedCounts[value] = (usedCounts[value] || 0) + 1;
                row.push(value);
            }
            grid.push(row);
        }

        // Check columns for duplicates
        for (let j = 0; j < this.size; j++) {
            const colCounts = {};
            for (let i = 0; i < this.size; i++) {
                colCounts[grid[i][j]] = (colCounts[grid[i][j]] || 0) + 1;
            }
            
            // Fix any column with more than maxDuplicates of same value
            for (let value in colCounts) {
                if (colCounts[value] > this.maxDuplicates) {
                    const positions = [];
                    for (let i = 0; i < this.size; i++) {
                        if (grid[i][j] === parseInt(value)) positions.push(i);
                    }
                    
                    // Change excess occurrences
                    const toChange = positions.slice(this.maxDuplicates);
                    for (let pos of toChange) {
                        let newValue;
                        do {
                            newValue = this.minValue + Math.floor(Math.random() * (this.maxValue - this.minValue + 1));
                        } while (colCounts[newValue] >= this.maxDuplicates);
                        
                        colCounts[grid[pos][j]]--;
                        grid[pos][j] = newValue;
                        colCounts[newValue] = (colCounts[newValue] || 0) + 1;
                    }
                }
            }
        }

        return grid;
    }

    calculateTargets(grid, solutionMask) {
        const rowTargets = [];
        const colTargets = [];

        // Calculate row targets
        for (let i = 0; i < this.size; i++) {
            let rowSum = 0;
            for (let j = 0; j < this.size; j++) {
                if (solutionMask[i][j]) {
                    rowSum += grid[i][j];
                }
            }
            rowTargets.push(rowSum);
        }

        // Calculate column targets
        for (let j = 0; j < this.size; j++) {
            let colSum = 0;
            for (let i = 0; i < this.size; i++) {
                if (solutionMask[i][j]) {
                    colSum += grid[i][j];
                }
            }
            colTargets.push(colSum);
        }

        return { row: rowTargets, col: colTargets };
    }

    validatePuzzle(grid, solutionMask, targets) {
        // Check that no row already sums to target
        for (let i = 0; i < this.size; i++) {
            const fullRowSum = grid[i].reduce((a, b) => a + b, 0);
            if (fullRowSum === targets.row[i]) return false;
            
            // Check deletion count is within difficulty range
            const deletedCount = solutionMask[i].filter(x => !x).length;
            const minDeletions = this.size - this.maxKeepCells;
            const maxDeletions = this.size - this.minKeepCells;
            if (deletedCount < minDeletions || deletedCount > maxDeletions) return false;
        }

        // Check that no column already sums to target
        for (let j = 0; j < this.size; j++) {
            let fullColSum = 0;
            let deletedCount = 0;
            
            for (let i = 0; i < this.size; i++) {
                fullColSum += grid[i][j];
                if (!solutionMask[i][j]) deletedCount++;
            }
            
            if (fullColSum === targets.col[j]) return false;
            
            const minDeletions = this.size - this.maxKeepCells;
            const maxDeletions = this.size - this.minKeepCells;
            if (deletedCount < minDeletions || deletedCount > maxDeletions) return false;
        }

        return true;
    }

    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // UPDATED: Different fallback puzzles for each difficulty
    // Branch: feature/enhanced-difficulty
    generateFallbackPuzzle() {
        console.log('Using fallback puzzle for difficulty:', this.difficulty);
        
        const fallbackPuzzles = {
            easy: {
                grid: [
                    [2, 3, 1, 4, 2, 3, 1],
                    [1, 2, 3, 1, 4, 2, 3],
                    [3, 1, 2, 3, 1, 4, 2],
                    [2, 4, 1, 2, 3, 1, 4],
                    [4, 2, 3, 1, 2, 3, 1],
                    [1, 3, 4, 2, 1, 2, 3],
                    [3, 1, 2, 4, 3, 1, 2]
                ],
                rowTargets: [10, 12, 11, 9, 13, 11, 10],
                colTargets: [11, 10, 12, 10, 11, 9, 13],
                solutionMask: Array(7).fill().map(() => Array(7).fill(true)),
                difficulty: 'easy'
            },
            medium: {
                grid: [
                    [3, 7, 2, 8, 1, 6, 4],
                    [5, 1, 9, 3, 7, 2, 8],
                    [2, 8, 4, 6, 3, 1, 7],
                    [7, 3, 6, 1, 9, 4, 2],
                    [1, 5, 8, 7, 2, 9, 3],
                    [9, 2, 1, 4, 8, 3, 6],
                    [4, 6, 3, 2, 5, 7, 1]
                ],
                rowTargets: [15, 20, 18, 16, 22, 19, 14],
                colTargets: [17, 21, 19, 15, 18, 16, 20],
                solutionMask: Array(7).fill().map(() => Array(7).fill(true)),
                difficulty: 'medium'
            },
            hard: {
                grid: [
                    [8, 12, 3, 10, 5, 9, 7],
                    [6, 4, 11, 8, 12, 3, 10],
                    [10, 7, 5, 12, 6, 8, 4],
                    [12, 9, 8, 4, 11, 6, 10],
                    [5, 11, 10, 7, 3, 12, 8],
                    [7, 3, 12, 9, 10, 5, 11],
                    [11, 8, 6, 5, 7, 10, 3]
                ],
                rowTargets: [25, 30, 28, 32, 26, 29, 24],
                colTargets: [28, 27, 30, 26, 29, 25, 31],
                solutionMask: Array(7).fill().map(() => Array(7).fill(true)),
                difficulty: 'hard'
            }
        };
        
        return fallbackPuzzles[this.difficulty] || fallbackPuzzles.medium;
    }
}
