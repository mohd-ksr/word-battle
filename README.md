# ⚔️ Word Battle
Word Battle is a browser-based real-time multiplayer word game designed to test vocabulary, strategy, and speed.
Players take turns placing letters and forming valid English words on a shared grid. The game includes a life system, countdown timer, animated leaderboard, session restoration on refresh, and live chat support.

The architecture ensures synchronized gameplay across all connected clients using Socket.IO and a modular backend game engine.

## Live Game
🔗 Play Here: https://wordxbattle.netlify.app/

## 🚀 Features
- 🎮 Real-time multiplayer gameplay
- 🔄 Turn-based system with automatic player rotation
- ⏱️ 40-second timer per turn
- ❤️ Life system with elimination logic
- 🏆 Animated live leaderboard (auto-sorted by score)
- 🧠 Word validation with rule enforcement
- 🚫 Duplicate & variation word restriction
- 💬 Real-time in-game chat
- ✨ Smooth animations for correct and wrong words
- 📱 Responsive UI design

## 🛠 Tech Stack
### Frontend
- HTML5
- CSS3
- JavaScript (ES6)

### Backend
- Node.js
- Express.js
- Socket.IO (WebSockets)
### Architecture & Concepts
- Class-based GameRoom engine
- Real-time state synchronization
- Modular game logic separation

## 🎮 How to Play
1. Enter your name.
2. Create a room or join using a room code.
3. Wait for the host to start the game.
4. On your turn:
  - Place exactly one letter.
  - Select connected letters in a straight line.
  - Submit your word before the timer runs out.
5. Score points based on word length.
6. Survive with your lives and outscore opponents.

## 📜 Game Rules
1. Join or Create Room
  - Enter your name and create a room or join using a room code.
2. Turn-Based Gameplay
  - Each player gets a turn. Only the active player can play.
3. Timer Rule ⏱️
  - You have 40 seconds to complete your turn.
  - Time up → lose 1 life.
4. Lives System ❤️
  - Start with 2 lives. Lose both → eliminated.
  - With 1 life left, you can use "I'm Back" once.
5. Making a Word ✍️
  - Place exactly one letter first, then select connected letters.
  - Letters must be in a straight line (horizontal / vertical).
6. Scoring 🏆
  - Score = number of letters in the word.
  - Example: DOG → +3 points
7. Used Words Rule
  - Once a word is used, it cannot be used again.

## 👨‍💻 Author
- Mo Kausar 
- GitHub: https://github.com/mohd-ksr/
