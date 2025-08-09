// ui-renderer.js - Handles all UI rendering

export class UIRenderer {
    constructor(gameState, timer) {
        this.gameState = gameState;
        this.timer = timer;
        
        // Cache DOM elements
        this.gridElement = document.getElementById('gameGrid');
        this.gridWrapper = document.getElementById('gridWrapper');
        this.statusElement = document.getElementById('gameStatus');
        this.puzzleInfoElement = document.getElementById('puzzleInfo');
        
        console.log('UIRenderer initialized');
        console.log('Grid element:', this.gridElement);
        console.log('Grid wrapper:', this.gridWrapper);
    }

    renderGrid() {
        console.log('Rendering grid...');
        
        if (!this.gridElement || !this.gridWrapper) {
            console.error('Required DOM elements not found');
            return;
        }
        
        this.gridElement.innerHTML = '';
        
        // Remove old target and current elements
        this.gridWrapper.querySelectorAll('.row-target, .col-target, .row-current, .col-current').forEach(el => el.remove());
        
        // Add column targets (top)
        for (let col = 0; col < 7; col++) {
            const colTarget = document.createElement('div');
            colTarget.className = 'col-target';
            colTarget.style.gridColumn = col + 2;
            colTarget.style.gridRow = 1;
            
            const currentSum = this.gameState.getCurrentColSum(col);
            const targetSum = this.gameState.colTargets[col];
            colTarget.textContent = `${targetSum}`;
            
            if (currentSum === targetSum) {
                colTarget.classList.add('complete');
            } else if (currentSum < targetSum) {
                colTarget.classList.add('over-target');
            }
            
            this.gridWrapper.appendChild(colTarget);
        }
        
        // Add column currents (bottom) - showing difference from target
        if (this.gameState.showGuides) {
            for (let col = 0; col < 7; col++) {
                const colCurrent = document.createElement('div');
                colCurrent.className = 'col-current';
                colCurrent.style.gridColumn = col + 2;
                colCurrent.style.gridRow = 9;
                
                const currentSum = this.gameState.getCurrentColSum(col);
                const targetSum = this.gameState.colTargets[col];
                const difference = currentSum - targetSum;
                
                if (difference === 0) {
                    colCurrent.textContent = `✓`;
                    colCurrent.classList.add('complete');
                } else if (difference > 0) {
                    colCurrent.textContent = `-${difference}`;
                } else {
                    colCurrent.textContent = `+${Math.abs(difference)}`;
                }
                
                this.gridWrapper.appendChild(colCurrent);
            }
        }
        
        // Add row targets (left)
        for (let row = 0; row < 7; row++) {
            const rowTarget = document.createElement('div');
            rowTarget.className = 'row-target';
            rowTarget.style.gridColumn = 1;
            rowTarget.style.gridRow = row + 2;
            
            const currentSum = this.gameState.getCurrentRowSum(row);
            const targetSum = this.gameState.rowTargets[row];
            rowTarget.textContent = `${targetSum}`;
            
            if (currentSum === targetSum) {
                rowTarget.classList.add('complete');
            } else if (currentSum < targetSum) {
                rowTarget.classList.add('over-target');
            }
            
            this.gridWrapper.appendChild(rowTarget);
        }
        
        // Add row currents (right) - showing difference from target
        if (this.gameState.showGuides) {
            for (let row = 0; row < 7; row++) {
                const rowCurrent = document.createElement('div');
                rowCurrent.className = 'row-current';
                rowCurrent.style.gridColumn = 9;
                rowCurrent.style.gridRow = row + 2;
                
                const currentSum = this.gameState.getCurrentRowSum(row);
                const targetSum = this.gameState.rowTargets[row];
                const difference = currentSum - targetSum;
                
                if (difference === 0) {
                    rowCurrent.textContent = `✓`;
                    rowCurrent.classList.add('complete');
                } else if (difference > 0) {
                    rowCurrent.textContent = `-${difference}`;
                } else {
                    rowCurrent.textContent = `+${Math.abs(difference)}`;
                }
                
                this.gridWrapper.appendChild(rowCurrent);
            }
        }
        
        // Add grid cells
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.textContent = this.gameState.getCellValue(row, col);
                
                // Apply the appropriate state class
                const cellState = this.gameState.getCellState(row, col);
                console.log(`Cell ${row},${col} state: ${cellState}`);
                
                if (cellState === 'deleted') {
                    cell.classList.add('deleted');
                } else if (cellState === 'confirmed') {
                    cell.classList.add('confirmed');
                }

                this.gridElement.appendChild(cell);
            }
        }
        
        console.log('Grid rendered successfully');
    }

    updateStatus(message = '') {
        if (this.statusElement) {
            this.statusElement.textContent = message;
            this.statusElement.className = 'status';
        }
    }

    showWinStatus() {
        const finalTime = this.timer.getElapsedTime();
        const minutes = Math.floor(finalTime / 60);
        const seconds = finalTime % 60;
        
        if (this.statusElement) {
            this.statusElement.textContent = `🎉 Solved in ${minutes}:${seconds.toString().padStart(2, '0')}!`;
            this.statusElement.className = 'status win';
        }
    }

    updatePuzzleInfo() {
        if (this.puzzleInfoElement) {
            const difficulty = this.gameState.difficulty;
            this.puzzleInfoElement.textContent = `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} puzzle`;
        }
    }

    updateTimerDisplay() {
        this.timer.updateDisplay();
    }

    animateWin() {
        const cells = document.querySelectorAll('.cell:not(.deleted)');
        cells.forEach((cell, index) => {
            setTimeout(() => {
                cell.classList.add('win-animation');
                setTimeout(() => {
                    cell.classList.remove('win-animation');
                }, 600);
            }, index * 50);
        });
    }
}
