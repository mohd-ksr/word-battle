import fs from "fs";
import path from "path";

/* ===== LOAD ENGLISH WORD LIST ONCE ===== */
const WORD_SET = new Set(
  fs.readFileSync(
    path.join(process.cwd(), "words/english_words.txt"),
    "utf-8"
  )
    .split("\n")
    .map(w => w.trim().toUpperCase())
    .filter(w => /^[A-Z]{3,}$/.test(w)) // only A–Z, min length 3
);

export default class WordValidator {

  /* ===== EXISTING LOGIC (UNCHANGED) ===== */

  static isStraightLine(cells) {
    const sameRow = cells.every(c => c.row === cells[0].row);
    const sameCol = cells.every(c => c.col === cells[0].col);
    return sameRow || sameCol;
  }

  static isContinuous(cells) {
    const sorted = [...cells].sort((a, b) =>
      a.row === b.row ? a.col - b.col : a.row - b.row
    );

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const dr = Math.abs(curr.row - prev.row);
      const dc = Math.abs(curr.col - prev.col);
      if (dr + dc !== 1) return false;
    }
    return true;
  }

  static buildWord(cells, grid) {

    // Decide direction
    const isHorizontal = cells.every(c => c.row === cells[0].row);

    // Sort cells by grid direction (NOT selection order)
    const sorted = [...cells].sort((a, b) => {
      if (isHorizontal) {
        return a.col - b.col;   // left → right
      } else {
        return a.row - b.row;   // top → bottom
      }
    });

    // Build word in fixed order
    return sorted
      .map(c => grid.getLetter(c.row, c.col))
      .join("");
  }


  /* ===== NEW CORE LOGIC ===== */

  static isValidEnglishWord(word) {
    return WORD_SET.has(word.toUpperCase());
  }
}
