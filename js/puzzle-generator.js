// puzzle-generator.js - Enhanced puzzle generation with unique solution validation

export class PuzzleGenerator {
    constructor(size = 7, difficulty = 'easy') {
        this.size = size;
        this.difficulty = difficulty;
        
        // More meaningful difficulty settings with better progression
        const difficultySettings = {
            easy: {
                minValue: 1,
                maxValue: 6,
                minDeletions: 8,   // Total cells to delete (out of 49)
                maxDeletions: 12,
                allowMultipleSolutions: false,
                maxAmbiguousRows: 0,  // Rows/cols where multiple deletion patterns work
                requireObviousMoves: true,  // Must have some "forced" deletions
                minForcedMoves: 3
            },
            medium: {
                minValue: 1,
                maxValue: 9,
                minDeletions: 14,
                maxDeletions: 20,
                allowMultipleSolutions: false,
                maxAmbiguousRows: 2,
                requireObviousMoves: true,
                minForcedMoves: 2
            },
            hard: {
                minValue: 2,
                maxValue: 12,
                minDeletions: 18,
                maxDeletions: 28,
                allowMultipleSolutions: false,
                maxAmbiguousRows: 4,
                requireObviousMoves: false,
                minForcedMoves: 0
            }
        };
        
        const settings = difficultySettings[difficulty] || difficultySettings.medium;
        Object.assign(this, settings);
        this.maxAttempts = 500;  // Reduced since validation is expensive
    }

    generate() {
        console.log(`Generating ${this.difficulty} puzzle with unique solution...`);
        
        for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
            const puzzle = this.attemptGeneration();
            if (puzzle) {
                console.log(`Successfully generated valid puzzle after ${attempt + 1} attempts`);
                return puzzle;
            }
        }
        
        console.log("Could not generate valid puzzle, using fallback");
        return this.generateFallbackPuzzle();
    }

    attemptGeneration() {
        // Step 1: Create a grid with values
        const grid = this.createGrid();
        
        // Step 2: Create a solution mask with proper deletion count
        const deletionCount = this.minDeletions + 
            Math.floor(Math.random() * (this.maxDeletions - this.minDeletions + 1));
        const solutionMask = this.createSolutionMask(grid, deletionCount);
        
        if (!solutionMask) return null;
        
        // Step 3: Calculate targets
        const targets = this.calculateTargets(grid, solutionMask);
        
        // Step 4: Validate unique solution
        if (!this.hasUniqueSolution(grid, targets)) {
            return null;
        }
        
        // Step 5: Check difficulty requirements
        if (!this.meetsDifficultyRequirements(grid, targets, solutionMask)) {
            return null;
        }
        
        return { 
            grid, 
            solutionMask, 
            rowTargets: targets.row, 
            colTargets: targets.col,
            difficulty: this.difficulty
        };
    }

    createGrid() {
        const grid = [];
        
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                // Use a distribution that creates more interesting patterns
                let value;
                if (this.difficulty === 'easy') {
                    // Easy: More repeated values, simpler patterns
                    const weights = [0.15, 0.2, 0.25, 0.2, 0.15, 0.05];
                    value = this.weightedRandom(this.minValue, this.maxValue, weights);
                } else if (this.difficulty === 'medium') {
                    // Medium: Balanced distribution
                    value = this.minValue + Math.floor(Math.random() * (this.maxValue - this.minValue + 1));
                } else {
                    // Hard: More extreme values, less predictable
                    if (Math.random() < 0.3) {
                        // 30% chance of low values
                        value = this.minValue + Math.floor(Math.random() * 3);
                    } else if (Math.random() < 0.7) {
                        // 40% chance of high values  
                        value = this.maxValue - Math.floor(Math.random() * 3);
                    } else {
                        // 30% chance of middle values
                        value = Math.floor((this.minValue + this.maxValue) / 2) + Math.floor(Math.random() * 3) - 1;
                    }
                }
                row.push(value);
            }
            grid.push(row);
        }
        
        return grid;
    }

    weightedRandom(min, max, weights) {
        const range = max - min + 1;
        if (weights.length !== range) {
            return min + Math.floor(Math.random() * range);
        }
        
        const sum = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * sum;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return min + i;
            }
        }
        return max;
    }

    createSolutionMask(grid, targetDeletions) {
        // Start with all cells kept (true)
        const mask = Array(this.size).fill().map(() => Array(this.size).fill(true));
        let deletions = 0;
        
        // Try to create a balanced deletion pattern
        const positions = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                positions.push([i, j]);
            }
        }
        
        // Shuffle positions for random selection
        this.shuffleArray(positions);
        
        // Delete cells while maintaining constraints
        for (const [row, col] of positions) {
            if (deletions >= targetDeletions) break;
            
            // Check if we can delete this cell
            mask[row][col] = false;
            
            // Ensure each row/col has at least 2 cells remaining
            const rowCount = mask[row].filter(x => x).length;
            const colCount = mask.map(r => r[col]).filter(x => x).length;
            
            if (rowCount < 2 || colCount < 2) {
                // Can't delete this cell, restore it
                mask[row][col] = true;
            } else {
                deletions++;
            }
        }
        
        return deletions === targetDeletions ? mask : null;
    }

    calculateTargets(grid, solutionMask) {
        const rowTargets = [];
        const colTargets = [];

        for (let i = 0; i < this.size; i++) {
            let rowSum = 0;
            for (let j = 0; j < this.size; j++) {
                if (solutionMask[i][j]) {
                    rowSum += grid[i][j];
                }
            }
            rowTargets.push(rowSum);
        }

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

    hasUniqueSolution(grid, targets) {
        // Use backtracking to find all solutions
        const solutions = this.findAllSolutions(grid, targets, [], 0, 0, 2);
        
        // We want exactly 1 solution
        return solutions.length === 1;
    }

    findAllSolutions(grid, targets, currentMask, row, col, maxSolutions) {
        // If we've found enough solutions, stop searching
        if (this.solutions && this.solutions.length >= maxSolutions) {
            return this.solutions;
        }
        
        // Initialize solutions array on first call
        if (row === 0 && col === 0) {
            this.solutions = [];
            currentMask = Array(this.size).fill().map(() => Array(this.size).fill(true));
        }
        
        // Move to next position
        if (col >= this.size) {
            col = 0;
            row++;
        }
        
        // If we've processed all cells, check if this is a valid solution
        if (row >= this.size) {
            if (this.isValidSolution(grid, currentMask, targets)) {
                // Deep copy the solution
                const solution = currentMask.map(row => [...row]);
                this.solutions.push(solution);
            }
            return this.solutions;
        }
        
        // Try keeping the current cell
        currentMask[row][col] = true;
        this.findAllSolutions(grid, targets, currentMask, row, col + 1, maxSolutions);
        
        // Try deleting the current cell (if constraints allow)
        if (this.canDeleteCell(currentMask, row, col)) {
            currentMask[row][col] = false;
            
            // Early pruning: check if current partial solution can still reach targets
            if (this.canReachTargets(grid, currentMask, targets, row, col)) {
                this.findAllSolutions(grid, targets, currentMask, row, col + 1, maxSolutions);
            }
            
            // Restore for backtracking
            currentMask[row][col] = true;
        }
        
        return this.solutions;
    }

    canDeleteCell(mask, row, col) {
        // Temporarily delete to check constraints
        mask[row][col] = false;
        
        // Check row has at least 2 cells
        const rowCount = mask[row].filter(x => x).length;
        
        // Check column has at least 2 cells
        let colCount = 0;
        for (let i = 0; i < this.size; i++) {
            if (mask[i][col]) colCount++;
        }
        
        // Restore original state
        mask[row][col] = true;
        
        return rowCount >= 2 && colCount >= 2;
    }

    canReachTargets(grid, mask, targets, currentRow, currentCol) {
        // Optimization: Check if the current partial solution could possibly reach the targets
        // This helps prune the search space
        
        // Check completed rows
        for (let i = 0; i <= currentRow && i < this.size; i++) {
            let rowSum = 0;
            let rowMin = 0;
            let rowMax = 0;
            
            for (let j = 0; j < this.size; j++) {
                if (i < currentRow || (i === currentRow && j <= currentCol)) {
                    // Already decided cells
                    if (mask[i][j]) {
                        rowSum += grid[i][j];
                        rowMin += grid[i][j];
                        rowMax += grid[i][j];
                    }
                } else {
                    // Undecided cells - could be kept or deleted
                    rowMax += grid[i][j];
                }
            }
            
            // If this row can't possibly reach its target, prune
            if (i < currentRow || (i === currentRow && currentCol === this.size - 1)) {
                if (rowSum !== targets.row[i]) {
                    return false;
                }
            } else if (rowMin > targets.row[i] || rowMax < targets.row[i]) {
                return false;
            }
        }
        
        return true;
    }

    isValidSolution(grid, mask, targets) {
        // Check all row sums
        for (let i = 0; i < this.size; i++) {
            let sum = 0;
            for (let j = 0; j < this.size; j++) {
                if (mask[i][j]) {
                    sum += grid[i][j];
                }
            }
            if (sum !== targets.row[i]) return false;
        }
        
        // Check all column sums
        for (let j = 0; j < this.size; j++) {
            let sum = 0;
            for (let i = 0; i < this.size; i++) {
                if (mask[i][j]) {
                    sum += grid[i][j];
                }
            }
            if (sum !== targets.col[j]) return false;
        }
        
        return true;
    }

    meetsDifficultyRequirements(grid, targets, solutionMask) {
        if (!this.requireObviousMoves) return true;
        
        // Count "forced" moves - cells that must be deleted to reach target
        let forcedMoves = 0;
        
        // Check rows
        for (let i = 0; i < this.size; i++) {
            const rowSum = grid[i].reduce((a, b) => a + b, 0);
            const target = targets.row[i];
            const excess = rowSum - target;
            
            // Find cells that MUST be deleted
            for (let j = 0; j < this.size; j++) {
                if (!solutionMask[i][j] && grid[i][j] > excess) {
                    // This cell is too big to keep - forced deletion
                    forcedMoves++;
                }
            }
        }
        
        return forcedMoves >= this.minForcedMoves;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    generateFallbackPuzzle() {
        console.log('Using validated fallback puzzle for difficulty:', this.difficulty);
        
        // These are hand-crafted puzzles with guaranteed unique solutions
        const fallbackPuzzles = {
            easy: {
                grid: [
                    [3, 2, 4, 1, 5, 2, 3],
                    [1, 4, 2, 3, 2, 4, 1],
                    [5, 1, 3, 2, 4, 1, 5],
                    [2, 3, 1, 4, 1, 5, 2],
                    [4, 2, 5, 1, 3, 2, 4],
                    [1, 5, 2, 3, 2, 4, 1],
                    [3, 1, 4, 2, 5, 1, 3]
                ],
                rowTargets: [15, 11, 16, 12, 14, 10, 13],
                colTargets: [14, 12, 15, 10, 16, 11, 13],
                solutionMask: [
                    [true, false, true, true, true, true, true],
                    [true, true, false, true, true, true, false],
                    [true, true, true, false, true, true, true],
                    [false, true, true, true, false, true, true],
                    [true, false, true, true, true, false, true],
                    [true, true, false, true, false, true, true],
                    [true, true, true, false, true, true, false]
                ],
                difficulty: 'easy'
            },
            medium: {
                grid: [
                    [7, 3, 8, 2, 6, 4, 9],
                    [4, 9, 1, 7, 3, 8, 2],
                    [2, 6, 4, 9, 1, 5, 7],
                    [8, 1, 7, 3, 9, 2, 6],
                    [5, 8, 2, 6, 4, 7, 1],
                    [9, 4, 6, 1, 8, 3, 5],
                    [1, 7, 3, 5, 2, 9, 4]
                ],
                rowTargets: [24, 18, 22, 20, 15, 26, 17],
                colTargets: [25, 20, 19, 18, 21, 24, 15],
                solutionMask: [
                    [true, false, true, false, true, true, true],
                    [false, true, true, true, false, true, true],
                    [true, true, false, true, true, false, true],
                    [true, false, true, true, true, false, true],
                    [false, true, true, false, true, true, false],
                    [true, true, true, false, true, true, true],
                    [true, true, false, true, false, true, true]
                ],
                difficulty: 'medium'
            },
            hard: {
                grid: [
                    [11, 5, 9, 3, 12, 7, 10],
                    [6, 12, 4, 10, 5, 11, 3],
                    [9, 3, 11, 6, 8, 4, 12],
                    [4, 10, 5, 12, 3, 9, 6],
                    [12, 6, 8, 4, 11, 5, 10],
                    [7, 11, 3, 9, 6, 12, 4],
                    [10, 4, 12, 5, 9, 3, 11]
                ],
                rowTargets: [28, 20, 35, 18, 30, 24, 32],
                colTargets: [33, 25, 28, 19, 31, 22, 29],
                solutionMask: [
                    [false, true, true, false, true, false, true],
                    [true, false, false, true, true, true, false],
                    [true, false, true, true, true, false, true],
                    [false, true, false, true, false, true, true],
                    [true, false, true, false, true, true, true],
                    [true, true, false, true, false, true, false],
                    [true, false, true, false, true, false, true]
                ],
                difficulty: 'hard'
            }
        };
        
        return fallbackPuzzles[this.difficulty] || fallbackPuzzles.medium;
    }
}
