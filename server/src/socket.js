
import GameRoom from "./game/GameRoom.js";

const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function setupSockets(io) {
  io.on("connection", (socket) => {

    /* ===== CREATE ROOM ===== */
    socket.on("CREATE_ROOM", ({ playerName }) => {
      const roomId = generateRoomId();
      const room = new GameRoom(roomId);
      rooms.set(roomId, room);

      room.ownerId = socket.id;
      room.addPlayer(socket.id, playerName);
      socket.join(roomId);

      io.to(roomId).emit("ROOM_CREATED", {
        roomId,
        ownerId: room.ownerId,
        players: room.players.map(p => ({
          id: p.id,
          name: p.name
        }))
      });
    });

    /* ===== JOIN ROOM ===== */
    socket.on("JOIN_ROOM", ({ roomId, playerName }) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit("MOVE_REJECTED", { reason: "ROOM_NOT_FOUND" });
        return;
      }

      room.addPlayer(socket.id, playerName);
      socket.join(roomId);

      io.to(roomId).emit("PLAYER_JOINED", {
        players: room.players.map(p => ({
          id: p.id,
          name: p.name
        }))
      });
    });

    /* ===== START GAME ===== */
    socket.on("START_GAME", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      if (socket.id !== room.ownerId) {
        socket.emit("MOVE_REJECTED", { reason: "ONLY_OWNER_CAN_START" });
        return;
      }

      if (room.players.length < 2) {
        socket.emit("MOVE_REJECTED", { reason: "NEED_AT_LEAST_2_PLAYERS" });
        return;
      }

      io.to(roomId).emit("GAME_STARTED");
      room.startGame(io);
    });

    /* ===== PLACE LETTER ===== */
    socket.on("PLACE_LETTER", ({ roomId, row, col, letter }) => {
      try {
        const room = rooms.get(roomId);
        room.placeLetter(socket.id, row, col, letter);

        io.to(roomId).emit("LETTER_PLACED", {
          row,
          col,
          letter,
          playerId: socket.id
        });
      } catch (e) {
        socket.emit("MOVE_REJECTED", { reason: e.message });
      }
    });

    /* ===== ATTEMPT WORD ===== */
    socket.on("ATTEMPT_WORD", ({ roomId, cells }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      try {
        const result = room.attemptWord(socket.id, cells);

        io.to(roomId).emit("WORD_RESULT", {
          playerId: socket.id,
          word: result.word,
          points: result.points
        });
      } catch (e) {
        socket.emit("MOVE_REJECTED", { reason: e.message });
      }

      // 🔥 TURN ALWAYS ENDS (VALID / INVALID)
      try {
        room.endTurn(io);
      } catch { }
    });

    /* ===== PASS TURN ===== */
    socket.on("PASS_TURN", ({ roomId }) => {
      try {
        const room = rooms.get(roomId);
        room.passTurn(socket.id, io);
      } catch (e) {
        socket.emit("MOVE_REJECTED", { reason: e.message });
      }
    });

    /* ===== I'M BACK (REVIVE) ===== */
    socket.on("IM_BACK", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      try {
        room.revivePlayer(socket.id, io);
      } catch (e) {
        socket.emit("MOVE_REJECTED", { reason: e.message });
      }
    });

    /* ===== DISCONNECT ===== */
    socket.on("disconnect", () => {
      // optional future handling (reconnect, ghost player, etc.)
    });
    /* ===== CHAT MESSAGE ===== */
    socket.on("CHAT_MESSAGE", ({ roomId, name, message }) => {
      if (!rooms.has(roomId)) return;

      io.to(roomId).emit("CHAT_MESSAGE", {
        name,
        message
      });

      /* ===== REJOIN ROOM ===== */
      socket.on("REJOIN_ROOM", ({ roomId, playerName }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const player = room.players.find(p => p.name === playerName);
        if (!player) return;

        // 🔁 rebind socket
        player.id = socket.id;
        socket.join(roomId);

        socket.emit("REJOIN_SUCCESS", {
          roomId,
          players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
            lives: p.lives,
            isActive: p.isActive
          })),
          grid: room.grid.cells,
          currentPlayerId: room.getCurrentPlayer().id,
          timeLimit: 40
        });
      });


    });
  });
}
