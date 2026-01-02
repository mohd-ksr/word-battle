import fs from "fs";

// Load words
const words = new Set(
  fs.readFileSync("server/words/english_words.txt", "utf-8")
    .split("\n")
    .map(w => w.trim().toUpperCase())
    .filter(Boolean)
);

// 1️⃣ Common words test
console.log("=== COMMON WORDS TEST ===");
[
  "TREE", "HOUSE", "GAME", "APPLE", "WATER",
  "COMPUTER", "PLAYER", "WORD", "BATTLE", "SERVER", "CLIENT", "NETWORK", "TRIE", "STACK", 
    "QUEUE", "GRAPH", "ARRAY", "OBJECT", "FUNCTION", "VARIABLE", "CONSTANT", "STRING", "NUMBER", "BOOLEAN", "NULL", "UNDEFINED", "FLOAT", "DOUBLE", "INTEGER", "CHARACTER", "SYMBOL", "CLASS", "METHOD", "PROPERTY", "EVENT", "THREAD", "PROCESS"
].forEach(w =>
  console.log(w, words.has(w) ? "✅ FOUND" : "❌ MISSING")
);

// 2️⃣ Game-specific words
console.log("\n=== GAME WORDS TEST ===");
[
  "GRID", "TURN", "SCORE", "LINE", "SELECT", "PASS"
].forEach(w =>
  console.log(w, words.has(w) ? "✅ FOUND" : "⚠️ NOT FOUND")
);

// 3️⃣ Fake / garbage words
console.log("\n=== FAKE WORDS TEST ===");
[
  "ASDF", "QWERT", "ZXCV", "AAAA", "TTTT"
].forEach(w =>
  console.log(w, words.has(w) ? "❌ BAD (should reject)" : "✅ REJECTED")
);

// 4️⃣ Total size
console.log("\nTOTAL WORD COUNT:", words.size);
