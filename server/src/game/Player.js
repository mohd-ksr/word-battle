export default class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;

    this.score = 0;

    this.lives = 2;
    this.isActive = true;
    this.isConnected = true;

    // 🔒 one-time revive protection
    this.usedImBack = false;
  }

  loseLife() {
    if (!this.isActive) return;

    this.lives--;

    if (this.lives <= 0) {
      this.lives = 0;
      this.isActive = false;
    }
  }

  canUseImBack() {
    return this.isActive && this.lives === 1 && !this.usedImBack;
  }

  resetLives() {
    if (!this.canUseImBack()) return false;

    this.lives = 2;
    this.usedImBack = true;
    this.isActive = true;
    return true;
  }
}
