class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 300;
        
        // Game state initialization
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        this.isGameOver = false;
        this.animationId = null;
        
        // Dinosaur object with physics properties
        this.dino = {
            x: 50,
            y: this.canvas.height - 60,
            width: 30,
            height: 40,
            jumping: false,
            jumpSpeed: -15,
            gravity: 1.2, // Increased gravity
            velocityY: 0,
            minJumpSpeed: -10,  // Minimum jump velocity
            maxJumpSpeed: -15,  // Maximum jump velocity
            jumpPressed: false, // Track if jump button is held
            currentJumpForce: 0 // Track current jump force for visualization
        };
        
        // Jump force visualization properties
        this.jumpForceBar = {
            x: 20,
            y: 40,
            width: 10, // Made width smaller
            height: 60, // Made height smaller
            borderWidth: 2
        };
        
        this.cacti = [];
        this.cactusSpawnInterval = 50;
        this.frameCount = 0;
        
        // Event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Start the game
        this.updateHighScoreDisplay();
        this.gameLoop();
    }
    
    // Game mechanics methods
    handleKeyDown(event) {
        // Space bar or up arrow triggers jump and game reset
        if ((event.code === 'Space' || event.key === ' ' || event.code === 'ArrowUp')) {
            if (!this.dino.jumping) {
                this.dino.jumping = true;
                this.dino.jumpPressed = true;
                this.dino.velocityY = this.dino.maxJumpSpeed;
            }
        }
        
        if (this.isGameOver && (event.code === 'Space' || event.key === ' ' || event.code === 'ArrowUp')) {
            this.resetGame();
        }
    }
    
    handleKeyUp(event) {
        if ((event.code === 'Space' || event.key === ' ' || event.code === 'ArrowUp')) {
            this.dino.jumpPressed = false;
            // Cut the upward velocity if still moving upward
            if (this.dino.velocityY < this.dino.minJumpSpeed) {
                this.dino.velocityY = this.dino.minJumpSpeed;
            }
        }
    }
    
    updateDino() {
        // Apply gravity and jump physics
        if (this.dino.jumping) {
            // Update jump force visualization
            this.dino.currentJumpForce = Math.abs(this.dino.velocityY);
            
            // Apply less gravity when jump is held and moving upward
            const gravityMultiplier = this.dino.jumpPressed && this.dino.velocityY < 0 ? 0.6 : 1;
            this.dino.velocityY += this.dino.gravity * gravityMultiplier;
            this.dino.y += this.dino.velocityY;
            
            if (this.dino.y >= this.canvas.height - 60) {
                this.dino.y = this.canvas.height - 60;
                this.dino.jumping = false;
                this.dino.velocityY = 0;
                this.dino.currentJumpForce = 0;
            }
        }
    }
    
    spawnCactus() {
        // Create obstacles at intervals
        if (this.frameCount % this.cactusSpawnInterval === 0) {
            this.cacti.push({
                x: this.canvas.width,
                y: this.canvas.height - 60,
                width: 20,
                height: 40
            });
            
            // Increase difficulty
            this.cactusSpawnInterval = Math.max(30, this.cactusSpawnInterval - 0.5);
        }
    }
    
    updateCacti() {
        const speed = 5 + Math.floor(this.score / 100);
        this.cacti = this.cacti.filter(cactus => {
            cactus.x -= speed;
            return cactus.x > -20;
        });
    }
    
    checkCollision(rect1, rect2) {
        // Create smaller hitboxes for more precise collision
        const dinoHitbox = {
            x: rect1.x + rect1.width * 0.2,  // 20% inset from left
            y: rect1.y + rect1.height * 0.1,  // 10% inset from top
            width: rect1.width * 0.6,         // 60% of original width
            height: rect1.height * 0.8        // 80% of original height
        };

        const cactusHitbox = {
            x: rect2.x + rect2.width * 0.1,   // 10% inset from left
            y: rect2.y + rect2.height * 0.1,  // 10% inset from top
            width: rect2.width * 0.8,         // 80% of original width
            height: rect2.height * 0.8        // 80% of original height
        };

        return dinoHitbox.x < cactusHitbox.x + cactusHitbox.width &&
               dinoHitbox.x + dinoHitbox.width > cactusHitbox.x &&
               dinoHitbox.y < cactusHitbox.y + cactusHitbox.height &&
               dinoHitbox.y + dinoHitbox.height > cactusHitbox.y;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - 10);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - 10);
        this.ctx.stroke();
        
        // Draw dino
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height);
        
        // Draw jump force bar
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = this.jumpForceBar.borderWidth;
        this.ctx.strokeRect(
            this.jumpForceBar.x, 
            this.jumpForceBar.y, 
            this.jumpForceBar.width, 
            this.jumpForceBar.height
        );
        
        // Calculate and draw the fill height based on current jump force
        const normalizedForce = Math.min(Math.abs(this.dino.velocityY) / Math.abs(this.dino.maxJumpSpeed), 1);
        const fillHeight = normalizedForce * this.jumpForceBar.height;
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(
            this.jumpForceBar.x,
            this.jumpForceBar.y + (this.jumpForceBar.height - fillHeight),
            this.jumpForceBar.width,
            fillHeight
        );
        
        // Draw cacti
        this.ctx.fillStyle = '#666';
        this.cacti.forEach(cactus => {
            this.ctx.fillRect(cactus.x, cactus.y, cactus.width, cactus.height);
        });
    }
    
    updateScore() {
        this.score++;
        document.getElementById('score').textContent = `Score: ${this.score}`;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScoreDisplay();
            localStorage.setItem('highScore', this.highScore);
        }
    }
    
    updateHighScoreDisplay() {
        document.getElementById('highScore').textContent = `High Score: ${this.highScore}`;
    }
    
    gameLoop() {
        // Main game loop for continuous updates
        if (!this.isGameOver) {
            this.frameCount++;
            this.updateDino();
            this.spawnCactus();
            this.updateCacti();
            this.updateScore();
            
            // Check collisions
            for (const cactus of this.cacti) {
                if (this.checkCollision(this.dino, cactus)) {
                    this.gameOver();
                    return;
                }
            }
            
            this.draw();
            this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    gameOver() {
        // Handle end game state
        this.isGameOver = true;
        document.getElementById('gameOver').classList.remove('hidden');
        cancelAnimationFrame(this.animationId);
    }
    
    resetGame() {
        // Reset all game parameters
        this.score = 0;
        this.isGameOver = false;
        this.cacti = [];
        this.cactusSpawnInterval = 50;
        this.frameCount = 0;
        this.dino.y = this.canvas.height - 60;
        this.dino.jumping = false;
        this.dino.velocityY = 0;
        document.getElementById('gameOver').classList.add('hidden');
        this.gameLoop();
    }
}

// Initialize game on window load
window.onload = () => new Game();