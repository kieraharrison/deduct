// timer.js - Handles game timer functionality

export class Timer {
    constructor() {
        this.startTime = null;
        this.interval = null;
        this.completed = false;
        this.timerElement = document.getElementById('gameTimer');
    }

    start() {
        if (this.interval) return; // Already running
        
        this.startTime = Date.now();
        this.completed = false;
        
        // Update immediately
        this.updateDisplay();
        
        // Then update every second
        this.interval = setInterval(() => {
            if (!this.completed) {
                this.updateDisplay();
            }
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.completed = true;
        
        // Add completed class to timer element
        if (this.timerElement) {
            this.timerElement.classList.add('completed');
        }
    }

    reset() {
        this.stop();
        this.startTime = null;
        this.completed = false;
        
        // Remove completed class and reset display
        if (this.timerElement) {
            this.timerElement.classList.remove('completed');
            this.timerElement.textContent = '00:00';
        }
    }

    getElapsedTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    getFormattedTime() {
        const elapsed = this.getElapsedTime();
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateDisplay() {
        if (this.timerElement) {
            this.timerElement.textContent = this.getFormattedTime();
        }
    }

    isRunning() {
        return this.interval !== null;
    }
}
