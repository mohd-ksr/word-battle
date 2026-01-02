const socket = io("https://word-battle-zkle.onrender.com");

const SIZE = 15;

const life1 = document.getElementById("life1");
const life2 = document.getElementById("life2");
const imBackBtn = document.getElementById("imBackBtn");
const usedWordsListEl = document.getElementById("usedWordsList");
let usedWords = [];


function renderUsedWords() {
  usedWordsListEl.innerHTML = "";

  usedWords.forEach(w => {
    const div = document.createElement("div");
    div.className = "used-word-row";
    div.innerText = `${w.player} → ${w.word} (+${w.points})`;
    usedWordsListEl.appendChild(div);
  });
}


function updateLivesUI(lives) {
  life1.style.opacity = lives >= 1 ? "1" : "0.2";
  life2.style.opacity = lives >= 2 ? "1" : "0.2";

  // 1 life bachi → I'm Back dikhao
  if (lives === 1) {
    imBackBtn.classList.remove("hidden");
  } else {
    imBackBtn.classList.add("hidden");
  }
}

imBackBtn.onclick = () => {
  socket.emit("IM_BACK", { roomId });
};

socket.on("LIFE_LOST", d => {
  if (d.playerId === myId) {
    updateLivesUI(d.lives);
    showPopup("💔 Time up! You lost 1 life", "warn");
    if (d.lives === 1) {
      showPopup("⚠️ Last life left! Use I'm Back if needed", "warn");
    }
  }
  else {
    const name = playerMap[d.playerId];
    showPopup(`⏱️ ${name} ran out of time`, "info");
  }
});


socket.on("IM_BACK_OK", d => {
  updateLivesUI(d.lives);
});

socket.on("PLAYER_ELIMINATED", d => {

  // 🔔 POPUP (NEW ADDITION)
  const name = playerMap[d.playerId] || "A player";
  showPopup(`☠️ ${name} is eliminated`, "error");

  // ⬇️ EXISTING UI LOGIC (UNCHANGED)
  const rows = document.querySelectorAll(".player-row");

  rows.forEach(row => {
    if (row.dataset.playerId === d.playerId) {
      row.style.opacity = "0.4";
      row.style.textDecoration = "line-through";
    }
  });
});



// ===== POPUP SYSTEM =====
const popup = document.getElementById("popup");
let popupTimer = null;

function showPopup(text, type = "info") {
  clearTimeout(popupTimer);

  popup.innerText = text;
  popup.classList.remove("hidden");
  popup.className = `popup ${type}`;

  popupTimer = setTimeout(() => {
    popup.classList.add("hidden");
  }, 2200);
}


// ===== TIMER =====
let turnTimerInterval = null;
let timeLeft = 0;

const timerEl = document.getElementById("timer");
function startTurnTimer(seconds) {
  clearInterval(turnTimerInterval);
  timeLeft = seconds;
  updateTimerUI();

  turnTimerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();

    if (timeLeft <= 0) {
      clearInterval(turnTimerInterval);
      timerEl.innerText = "⏱️ 0s";
    }
  }, 1000);
}

function updateTimerUI() {
  timerEl.innerText = `⏱️ ${timeLeft}s`;
}


// ===== GLOBAL STATE =====
let roomId = null;
let myId = null;
let ownerId = null;
let myName = "";

let playerMap = {};   // { id: name }
let scores = {};      // { id: score }

let grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
let selected = [];

let isMyTurn = false;
let letterPlaced = false;

// ===== ELEMENTS =====
const home = document.getElementById("home");
const mode = document.getElementById("mode");
const lobby = document.getElementById("lobby");
const game = document.getElementById("game");

const nameInput = document.getElementById("nameInput");
const playBtn = document.getElementById("playBtn");

const playerNameLabel = document.getElementById("playerNameLabel");
const currentPlayerDisplay = document.getElementById("currentPlayerDisplay");

const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const joinBox = document.getElementById("joinBox");
const roomCodeInput = document.getElementById("roomCodeInput");
const joinConfirmBtn = document.getElementById("joinConfirmBtn");

const roomCodeEl = document.getElementById("roomCode");
const playersEl = document.getElementById("players");
const lobbyMsg = document.getElementById("lobbyMsg");
const startGameBtn = document.getElementById("startGameBtn");

const instructionEl = document.getElementById("instruction");
const actionsEl = document.getElementById("actions");

const checkWordBtn = document.getElementById("checkWordBtn");
const passTurnBtn = document.getElementById("passTurnBtn");

const gridEl = document.getElementById("grid");
const scoreboardEl = document.getElementById("scoreboard");

const rulesCard = document.getElementById("rulesCard");

// ===== HOME =====
nameInput.addEventListener("input", () => {
  playBtn.disabled = nameInput.value.trim().length === 0;
});

playBtn.onclick = () => {
  myName = nameInput.value.trim();
  home.classList.add("hidden");
  mode.classList.remove("hidden");
  playerNameLabel.innerText = myName;
};

// ===== MODE =====
createBtn.onclick = () => {
  socket.emit("CREATE_ROOM", { playerName: myName });
};

joinBtn.onclick = () => {
  joinBox.classList.toggle("hidden");
};

joinConfirmBtn.onclick = () => {
  const code = roomCodeInput.value.trim();
  if (!code) return alert("Enter room code");
  roomId = code;
  socket.emit("JOIN_ROOM", { roomId, playerName: myName });
};
localStorage.setItem("roomId", roomId);
localStorage.setItem("playerName", myName);


// ===== GRID BUILD =====
for (let r = 0; r < SIZE; r++) {
  for (let c = 0; c < SIZE; c++) {
    const cell = document.createElement("div");
    cell.className = "cell disabled";
    cell.dataset.row = r;
    cell.dataset.col = c;
    cell.onclick = () => onCellClick(cell);
    gridEl.appendChild(cell);
  }
}

function enableGrid(enable) {
  document.querySelectorAll(".cell").forEach(c =>
    c.classList.toggle("disabled", !enable)
  );
}

// ===== CELL CLICK =====
function onCellClick(cell) {
  if (!isMyTurn) return;

  const r = +cell.dataset.row;
  const c = +cell.dataset.col;

  // PLACE LETTER
  if (!letterPlaced && grid[r][c] === null) {
    const input = document.createElement("input");
    input.maxLength = 1;
    input.className = "letter-input";
    cell.innerHTML = "";
    cell.appendChild(input);
    input.focus();

    input.oninput = () => {
      const val = input.value.toUpperCase();
      if (!/^[A-Z]$/.test(val)) {
        input.value = "";
        return;
      }

      socket.emit("PLACE_LETTER", { roomId, row: r, col: c, letter: val });
      letterPlaced = true;
    };

    input.onblur = () => {
      if (!letterPlaced) cell.innerHTML = "";
    };
    return;
  }

  // SELECT WORD
  if (letterPlaced && grid[r][c] !== null) {
    cell.classList.toggle("selected");
    const idx = selected.findIndex(x => x.row === r && x.col === c);
    idx === -1
      ? selected.push({ row: r, col: c })
      : selected.splice(idx, 1);
  }
}

// ===== GAME ACTIONS =====
checkWordBtn.onclick = () => {
  socket.emit("ATTEMPT_WORD", { roomId, cells: selected });
  resetTurnUI();
};

passTurnBtn.onclick = () => {
  socket.emit("PASS_TURN", { roomId });
  resetTurnUI();
};

startGameBtn.onclick = () => {
  socket.emit("START_GAME", { roomId });
};

function resetTurnUI() {
  selected = [];
  letterPlaced = false;
  actionsEl.classList.add("hidden");
  instructionEl.innerText = "";
  enableGrid(false);
  document.querySelectorAll(".selected")
    .forEach(c => c.classList.remove("selected"));
}

// ===== SCOREBOARD =====
function renderScoreboard(activePlayerId) {
  scoreboardEl.innerHTML = "<b>Players</b><br><br>";

  Object.entries(playerMap).forEach(([id, name]) => {
    const row = document.createElement("div");
    row.className = "player-row";
    row.dataset.playerId = id;
    if (id === activePlayerId) row.classList.add("active");

    row.innerHTML = `
      <span>${name}</span>
      <span>${scores[id] || 0}</span>
    `;
    scoreboardEl.appendChild(row);
  });
}

// ===== SOCKET EVENTS =====
socket.on("connect", () => {
  myId = socket.id;

  const savedRoom = localStorage.getItem("roomId");
  const savedName = localStorage.getItem("playerName");

  if (savedRoom && savedName) {
    socket.emit("REJOIN_ROOM", {
      roomId: savedRoom,
      playerName: savedName
    });
  }
});

// CREATE
socket.on("ROOM_CREATED", d => {
  roomId = d.roomId;
  ownerId = d.ownerId;

  playerMap = {};
  scores = {};

  d.players.forEach(p => {
    playerMap[p.id] = p.name;
    scores[p.id] = 0;
  });

  mode.classList.add("hidden");
  lobby.classList.remove("hidden");

  renderLobby(d.players);
  localStorage.setItem("roomId", d.roomId);
  localStorage.setItem("playerName", myName);
});

// JOIN
socket.on("PLAYER_JOINED", d => {
  playerMap = {};
  scores = {};

  d.players.forEach(p => {
    playerMap[p.id] = p.name;
    scores[p.id] = scores[p.id] || 0;
  });

  mode.classList.add("hidden");
  lobby.classList.remove("hidden");

  if (!ownerId) ownerId = d.players[0].id;

  renderLobby(d.players);
  localStorage.setItem("roomId", d.roomId);
  localStorage.setItem("playerName", myName);
});

// GAME START
socket.on("GAME_STARTED", () => {
  lobby.classList.add("hidden");
  game.classList.remove("hidden");

  // 🔥 HIDE RULES AFTER GAME START
  if (rulesCard) rulesCard.classList.add("hidden");

  // center me sirf apna naam
  currentPlayerDisplay.innerText = myName;
  localStorage.setItem("roomId", d.roomId);
  localStorage.setItem("playerName", myName);
});

// TURN UPDATE
socket.on("TURN_UPDATE", d => {
  resetTurnUI();
  isMyTurn = d.currentPlayerId === myId;

  renderScoreboard(d.currentPlayerId);

  // ⏱️ START / RESET TIMER
  startTurnTimer(d.timeLimit || 40);

  if (isMyTurn) {
    showPopup("🔥 Your turn!", "success");
    instructionEl.innerText = "Select an empty cell to place a letter";
    enableGrid(true);
  } else {
    instructionEl.innerText = "Waiting for other player...";
    enableGrid(false);
  }
});

socket.on("GAME_STARTED", () => {
  lobby.classList.add("hidden");
  game.classList.remove("hidden");

  currentPlayerDisplay.innerText = myName;
  timerEl.innerText = "⏱️ --";
});

// WORD RESULT (SCORE UPDATE)
socket.on("WORD_RESULT", d => {

  // ✅ SCORE UPDATE (already)
  scores[d.playerId] = (scores[d.playerId] || 0) + d.points;
  renderScoreboard(d.playerId);

  // 🆕 USED WORD STORE
  usedWords.unshift({
    player: playerMap[d.playerId],
    word: d.word,
    points: d.points
  });

  renderUsedWords();

  // 🔔 POPUPS (already)
  if (d.playerId === myId) {
    showPopup(`🎉 +${d.points} points! ${d.word}`, "success");
  } else {
    const name = playerMap[d.playerId];
    showPopup(`🧠 ${name} made "${d.word}" (+${d.points})`, "info");
  }
});


// LETTER PLACED
socket.on("LETTER_PLACED", d => {
  grid[d.row][d.col] = d.letter;
  const idx = d.row * SIZE + d.col;
  const cell = gridEl.children[idx];
  cell.textContent = d.letter;
  cell.classList.add("filled");

  if (d.playerId === myId) {
    letterPlaced = true;
    instructionEl.innerText =
      "Select letters → Check Word OR Pass Turn";
    actionsEl.classList.remove("hidden");
  }
});

// ===== LOBBY =====
function renderLobby(players) {
  roomCodeEl.innerText = roomId;
  playersEl.innerHTML = "";

  players.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p.name + (p.id === ownerId ? " (Host)" : "");
    playersEl.appendChild(li);
  });

  if (myId === ownerId) {
    startGameBtn.classList.remove("hidden");
    lobbyMsg.innerText = "You are the host. Start when ready.";
  } else {
    startGameBtn.classList.add("hidden");
    lobbyMsg.innerText = "Waiting for host to start the game...";
  }
}

socket.on("MOVE_REJECTED", d => {
  const map = {
    INVALID_ENGLISH_WORD: "❌ Not a valid English word",
    NOT_STRAIGHT_LINE: "❌ Letters must be in a straight line",
    NOT_CONTINUOUS: "❌ Letters must be continuous",
    WORD_USED: "⚠️ Word already used",
    EMPTY_CELL: "❌ Invalid selection",
    MUST_PLACE_LETTER_FIRST: "⚠️ Place a letter first",
    WORD_VARIATION_USED: "⚠️ Word variation already used"
  };

  showPopup(map[d.reason] || "❌ Invalid move", "error");
});


const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const sendChatBtn = document.getElementById("sendChatBtn");

sendChatBtn.onclick = sendChat;
chatInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendChat();
});

function sendChat() {
  const msg = chatInput.value.trim();
  if (!msg) return;

  socket.emit("CHAT_MESSAGE", {
    roomId,
    name: myName,
    message: msg
  });

  chatInput.value = "";
}

socket.on("CHAT_MESSAGE", d => {
  const div = document.createElement("div");
  div.className = "chat-msg";
  div.innerHTML = `<span class="chat-name">${d.name}:</span> ${d.message}`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});


socket.on("GAME_ENDED", d => {
  const overlay = document.getElementById("endGameOverlay");
  const list = document.getElementById("winnerList");

  list.innerHTML = "";

  d.ranking.forEach(p => {
    const div = document.createElement("div");
    div.className = `winner-row winner-${p.rank}`;
    div.innerHTML = `
      <span>#${p.rank} ${p.name}</span>
      <span>${p.score}</span>
    `;
    list.appendChild(div);
  });

  overlay.classList.remove("hidden");
});

socket.on("GAME_ENDED", d => {
  const overlay = document.getElementById("endGameOverlay");
  const list = document.getElementById("winnerList");

  list.innerHTML = "";

  d.ranking.forEach((p, i) => {
    const div = document.createElement("div");
    div.innerText = `#${i + 1} ${p.name} — ${p.score}`;
    list.appendChild(div);
  });

  overlay.classList.remove("hidden");
});





function hideEndGameOverlay() {
  document.getElementById("endGameOverlay").classList.add("hidden");
}

document.getElementById("playAgainBtn").onclick = () => {
  hideEndGameOverlay();

  // 🔄 RESET GAME STATE
  grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  selected = [];
  scores = {};
  playerMap = {};

  gridEl.innerHTML = "";
  scoreboardEl.innerHTML = "";
  instructionEl.innerText = "";
  currentPlayerDisplay.innerText = "";
  timerEl.innerText = "⏱️ --";

  // 🔁 rebuild grid
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell disabled";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.onclick = () => onCellClick(cell);
      gridEl.appendChild(cell);
    }
  }

  // 🎮 back to lobby
  game.classList.add("hidden");
  lobby.classList.remove("hidden");

  showPopup("🔄 New game ready", "info");
};

document.getElementById("playAgainBtn").onclick = () => {
  document.getElementById("endGameOverlay").classList.add("hidden");

  // HARD RESET UI
  game.classList.add("hidden");
  lobby.classList.remove("hidden");

  gridEl.innerHTML = "";
  scoreboardEl.innerHTML = "";
  instructionEl.innerText = "";
  timerEl.innerText = "⏱️ --";

  grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  selected = [];
  isMyTurn = false;
  letterPlaced = false;

  showPopup("🔄 Ready for next game", "info");
};



window.addEventListener("load", () => {
  const savedRoom = localStorage.getItem("roomId");
  const savedName = localStorage.getItem("playerName");

  if (savedRoom && savedName) {
    socket.emit("REJOIN_ROOM", {
      roomId: savedRoom,
      playerName: savedName
    });
  }
});


socket.on("REJOIN_SUCCESS", d => {
  roomId = d.roomId;

  playerMap = {};
  scores = {};

  d.players.forEach(p => {
    playerMap[p.id] = p.name;
    scores[p.id] = p.score;

    if (p.id === myId) {
      updateLivesUI(p.lives);
    }
  });

  // restore grid
  grid = d.grid;
  gridEl.innerHTML = "";

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      if (grid[r][c]) {
        cell.textContent = grid[r][c];
        cell.classList.add("filled");
      }

      cell.onclick = () => onCellClick(cell);
      gridEl.appendChild(cell);
    }
  }

  lobby.classList.add("hidden");
  game.classList.remove("hidden");

  renderScoreboard(d.currentPlayerId);
  startTurnTimer(d.timeLimit || 40);

  showPopup("🔄 Reconnected to game", "success");
});









