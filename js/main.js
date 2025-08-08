// main.js - Main game controller that ties everything together

import { PuzzleGenerator } from './puzzle-generator.js';
import { GameState } from './game-state.js';
import { UIRenderer } from './ui-renderer.js';
import { Timer } from './timer.js';

class DeductGame {
    constructor() {
        this.gameState = new GameState();
        this.timer = new Timer();
        this.renderer = new UIRenderer(this.gameState, this.timer);
        
        this.initializeEventListeners();
        this.newPuzzle();
    }

    initializeEventListeners() {
        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setDifficulty(e.target.dataset.difficulty);
            });
        });

        // Control buttons
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetPuzzle();
        });

        document.getElementById('newPuzzleBtn').addEventListener('click', () => {
            this.newPuzzle();
        });

        // Guides toggle
        document.getElementById('guidesToggle').addEventListener('change', (e) => {
            this.toggleGuides(e.target.checked);
        });

        // Grid cell clicks (delegated)
        document.getElementById('gameGrid').addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                const index = Array.from(e.target.parentNode.children).indexOf(e.target);
                const row = Math.floor(index / 7);
                const col = index % 7;
                this.handleCellClick(row, col);
            }
        });
    }

    setDifficulty(difficulty) {
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
        // Start timer on first move if not already started
        if (!this.timer.isRunning() && !this.gameState.gameCompleted) {
            this.timer.start();
        }

        // Toggle cell state
        this.gameState.toggleCell(row
