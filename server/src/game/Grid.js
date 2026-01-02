export default class Grid {
  constructor(rows = 15, cols = 15) {
    this.rows = rows;
    this.cols = cols;
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null)
    );
  }

  isInside(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  isEmpty(row, col) {
    return this.isInside(row, col) && this.cells[row][col] === null;
  }

  placeLetter(row, col, letter) {
    if (!this.isInside(row, col)) throw new Error("OUT_OF_BOUNDS");
    if (!this.isEmpty(row, col)) throw new Error("CELL_OCCUPIED");
    this.cells[row][col] = letter.toUpperCase();
  }

  getLetter(row, col) {
    return this.cells[row][col];
  }
}
