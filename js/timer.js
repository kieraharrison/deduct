// timer.js - Handles game timer functionality with auto-pause
export class Timer {
    constructor() {
        this.startTime = null;
        this.pausedTime = 0; // Total time spent paused
        this.lastPauseStart = null; // When the current pause started
        this.interval = null;
        this.completed = false;
        this.isPaused = false;
        this.timerElement = document.getElementById('gameTimer');
        
        // Set up visibility change listeners
        this.setupVisibilityHandlers();
    }
    
    setupVisibilityHandlers() {
        // Handle tab visibility changes
        document.addEventListener('visibilitychange', () => {
            if (this.isRunning() && !this.completed) {
                if (document.hidden) {
                    this.pauseForVisibility();
                } else {
                    this.resumeFromVisibility();
                }
            }
        });
        
        // Handle window focus/blur as backup
        window.addEventListener('blur', () => {
            if (this.isRunning() && !this.completed && !document.hidden) {
                this.pauseForVisibility();
            }
        });
        
        window.addEventListener('focus', () => {
            if (this.isPaused && !this.completed) {
                this.resumeFromVisibility();
            }
        });
    }
    
    pauseForVisibility() {
        if (!this.isPaused && this.isRunning()) {
            this.isPaused = true;
            this.lastPauseStart = Date.now();
            
            // Add visual indicator that timer is paused
            if (this.timerElement) {
                this.timerElement.classList.add('paused');
            }
        }
    }
    
    resumeFromVisibility() {
        if (this.isPaused) {
            // Add the pause duration to our total paused time
            if (this.lastPauseStart) {
                this.pausedTime += Date.now() - this.lastPauseStart;
            }
            
            this.isPaused = false;
            this.lastPauseStart = null;
            
            // Remove visual indicator
            if (this.timerElement) {
                this.timerElement.classList.remove('paused');
            }
            
            // Update display immediately
            this.updateDisplay();
        }
    }
    
    start() {
        if (this.interval) return; // Already running
        
        this.startTime = Date.now();
        this.pausedTime = 0;
        this.completed = false;
        this.isPaused = false;
        this.lastPauseStart = null;
        
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
        this.isPaused = false;
        
        // Add completed class to timer element
        if (this.timerElement) {
            this.timerElement.classList.add('completed');
            this.timerElement.classList.remove('paused');
        }
    }
    
    reset() {
        this.stop();
        this.startTime = null;
        this.pausedTime = 0;
        this.lastPauseStart = null;
        this.completed = false;
        this.isPaused = false;
        
        // Remove completed class and reset display
        if (this.timerElement) {
            this.timerElement.classList.remove('completed', 'paused');
            this.timerElement.textContent = '00:00';
        }
    }
    
    getElapsedTime() {
        if (!this.startTime) return 0;
        
        let currentTime = Date.now();
        let totalPausedTime = this.pausedTime;
        
        // If currently paused, add the current pause duration
        if (this.isPaused && this.lastPauseStart) {
            totalPausedTime += currentTime - this.lastPauseStart;
        }
        
        // Return elapsed time minus time spent paused
        return Math.floor((currentTime - this.startTime - totalPausedTime) / 1000);
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
    
    // New method to check if timer is currently paused due to visibility
    isPausedForVisibility() {
        return this.isPaused;
    }
}
