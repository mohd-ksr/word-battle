
import Grid from "./Grid.js";
import Player from "./Player.js";
import WordValidator from "./WordValidator.js";

const TURN_TIME_MS = 40_000;

function isSimpleWordVariation(oldWord, newWord) {
  const suffixes = ["S", "ES", "ED", "ING"];

  for (const suf of suffixes) {
    if (newWord === oldWord + suf) return true;
    if (oldWord === newWord + suf) return true;
  }
  return false;
}


export default class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;

    this.players = [];
    this.grid = new Grid();
    this.usedWords = new Set();

    this.ownerId = null;
    this.gameStarted = false;

    this.currentTurn = 0;
    this.turnTimer = null;
    this.letterPlacedThisTurn = false;
  }

  addPlayer(id, name) {
    const player = new Player(id, name);
    this.players.push(player);
    return player;
  }

  getCurrentPlayer() {
    return this.players[this.currentTurn];
  }

  nextTurn() {
    let safety = 0;

    do {
      this.currentTurn = (this.currentTurn + 1) % this.players.length;
      safety++;
    } while (
      !this.getCurrentPlayer().isActive &&
      safety < this.players.length
    );
  }

  /* ===== GAME START ===== */
  startGame(io) {
    if (this.gameStarted) return;
    this.gameStarted = true;
    this.startTurn(io);
  }

  /* ===== TURN TIMER ===== */
  startTurn(io) {
    clearTimeout(this.turnTimer);
    this.letterPlacedThisTurn = false;

    const player = this.getCurrentPlayer();

    io.to(this.roomId).emit("TURN_UPDATE", {
      currentPlayerId: player.id,
      timeLimit: 40
    });

    this.turnTimer = setTimeout(() => this.onTimeout(io), TURN_TIME_MS);
  }

  onTimeout(io) {
    const player = this.getCurrentPlayer();
    player.loseLife();

    io.to(this.roomId).emit("LIFE_LOST", {
      playerId: player.id,
      lives: player.lives
    });

    if (!player.isActive) {
      io.to(this.roomId).emit("PLAYER_ELIMINATED", {
        playerId: player.id
      });
    }

    if (this.checkGameOver(io)) return;

    this.nextTurn();
    this.startTurn(io);
  }


  endTurn(io) {
    clearTimeout(this.turnTimer);

    if (this.checkGameOver(io)) return;

    this.nextTurn();
    this.startTurn(io);
  }



  /* ===== ACTIONS ===== */

  placeLetter(playerId, row, col, letter) {
    if (!this.gameStarted) throw new Error("GAME_NOT_STARTED");

    const player = this.getCurrentPlayer();
    if (player.id !== playerId) throw new Error("NOT_YOUR_TURN");
    if (!player.isActive) throw new Error("PLAYER_ELIMINATED");
    if (this.letterPlacedThisTurn)
      throw new Error("LETTER_ALREADY_PLACED");

    this.grid.placeLetter(row, col, letter);
    this.letterPlacedThisTurn = true;
  }

  attemptWord(playerId, cells) {
    if (!this.gameStarted) throw new Error("GAME_NOT_STARTED");
    if (!this.letterPlacedThisTurn)
      throw new Error("MUST_PLACE_LETTER_FIRST");

    const player = this.getCurrentPlayer();
    if (player.id !== playerId) throw new Error("NOT_YOUR_TURN");
    if (!player.isActive) throw new Error("PLAYER_ELIMINATED");

    if (!WordValidator.isStraightLine(cells))
      throw new Error("NOT_STRAIGHT_LINE");

    if (!WordValidator.isContinuous(cells))
      throw new Error("NOT_CONTINUOUS");

    for (const c of cells) {
      if (this.grid.getLetter(c.row, c.col) === null)
        throw new Error("EMPTY_CELL");
    }

    const word = WordValidator.buildWord(cells, this.grid);

    if (!WordValidator.isValidEnglishWord(word))
      throw new Error("INVALID_ENGLISH_WORD");

    for (const used of this.usedWords) {
      if (isSimpleWordVariation(used, word)) {
        throw new Error("WORD_VARIATION_USED");
      }
    }

    if (this.usedWords.has(word))
      throw new Error("WORD_USED");

    this.usedWords.add(word);
    player.score += word.length;

    return { word, points: word.length };
  }

  passTurn(playerId, io) {
    if (!this.gameStarted) throw new Error("GAME_NOT_STARTED");
    if (!this.letterPlacedThisTurn)
      throw new Error("MUST_PLACE_LETTER_FIRST");

    const player = this.getCurrentPlayer();
    if (player.id !== playerId) throw new Error("NOT_YOUR_TURN");
    if (!player.isActive) throw new Error("PLAYER_ELIMINATED");

    this.endTurn(io);
  }

  /* ===== I'M BACK (REVIVE) ===== */
  revivePlayer(playerId, io) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) throw new Error("PLAYER_NOT_FOUND");

    const success = player.resetLives();
    if (!success) throw new Error("IM_BACK_NOT_ALLOWED");

    io.to(this.roomId).emit("IM_BACK_OK", {
      playerId: player.id,
      lives: player.lives
    });
  }
  isGridFull() {
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        if (this.grid.getLetter(r, c) === null) {
          return false;
        }
      }
    }
    return true;
  }


  endGame(io) {
    this.gameStarted = false;

    // sort players by score
    const ranking = [...this.players]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((p, i) => ({
        rank: i + 1,
        id: p.id,
        name: p.name,
        score: p.score
      }));

    io.to(this.roomId).emit("GAME_ENDED", {
      ranking
    });
  }
  checkGameOver(io) {
    const activePlayers = this.players.filter(p => p.isActive);

    // Case 1: sirf 1 player bacha
    if (activePlayers.length <= 1) {
      this.endGame(io);
      return true;
    }

    // Case 2: grid full
    if (this.isGridFull()) {
      this.endGame(io);
      return true;
    }

    return false;
  }

}



