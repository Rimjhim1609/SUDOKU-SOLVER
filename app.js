// --- SUDOKU GENERATOR WITH VARIABLE CLUES ---

function generateSudoku(clues) {
  let board = Array.from({length:9},()=>Array(9).fill(0));
  fillDiagonal(board);
  fillRemaining(board, 0, 3);
  const solvedBoard = board.map(r=>r.slice());

  let cellsToRemove = 81 - clues;
  while (cellsToRemove > 0) {
    let i = Math.floor(Math.random()*9);
    let j = Math.floor(Math.random()*9);
    if (board[i][j] !== 0) {
      board[i][j] = 0;
      cellsToRemove--;
    }
  }
  return {puzzle: board, solution: solvedBoard};
}

function unUsedInBox(grid, rowStart, colStart, num) {
  for (let i=0; i<3; i++)
    for (let j=0; j<3; j++)
      if (grid[rowStart+i][colStart+j] === num) return false;
  return true;
}

function fillBox(grid, row, col) {
  let num;
  for (let i=0; i<3; i++) {
    for (let j=0; j<3; j++) {
      do {
        num = Math.floor(Math.random()*9) + 1;
      } while (!unUsedInBox(grid, row, col, num));
      grid[row+i][col+j] = num;
    }
  }
}

function fillDiagonal(grid) {
  for (let i=0; i<9; i+=3)
    fillBox(grid, i, i);
}

function isSafe(grid, i, j, num) {
  for (let x=0; x<9; x++)
    if (grid[i][x] === num || grid[x][j] === num) return false;
  let row = i - (i % 3), col = j - (j % 3);
  return unUsedInBox(grid, row, col, num);
}

function fillRemaining(grid, i, j) {
  if (j >= 9 && i < 8) { i++; j = 0; }
  if (i >= 9 && j >= 9) return true;
  if (i < 3) { if (j < 3) j = 3; }
  else if (i < 6) { if (j === Math.floor(i/3)*3) j += 3; }
  else if (j === 6) { i++; j = 0; if (i >= 9) return true; }

  for (let num=1; num<=9; num++) {
    if (isSafe(grid, i, j, num)) {
      grid[i][j] = num;
      if (fillRemaining(grid, i, j+1)) return true;
      grid[i][j] = 0;
    }
  }
  return false;
}

// --- APP LOGIC ---

let original = [], solution = [], cur = [], hintsLeft=3, seconds=0, timerInterval=null;

const boardEl = document.getElementById('board');
const timerEl = document.getElementById('timer');
const modalRoot = document.getElementById('modal-root');
const modalMsg = document.getElementById('modal-msg');
const doneBtn = document.getElementById('done-btn');

const cluesConfig = {
  easy: 30,
  medium: 25,
  hard: 20
};

function copyBoard(b) { return b.map(r=>r.slice()); }

function buildGrid() {
  boardEl.innerHTML = '';
  for (let r=0; r<9; r++) {
    for (let c=0; c<9; c++) {
      const cellWrap = document.createElement('div');
      cellWrap.className = 'cell';
      const input = document.createElement('input');
      input.type = "text";
      input.maxLength = 1;
      input.inputMode = "numeric";
      input.tabIndex = r*9 + c + 1;
      input.value = cur[r][c] || '';
      input.disabled = original[r][c] !== 0;
      input.addEventListener('input', e => onInput(r, c, e.target.value));
      cellWrap.appendChild(input);
      boardEl.appendChild(cellWrap);
    }
  }
}

function render() {
  const cells = boardEl.querySelectorAll('.cell');
  for (let r=0; r<9; r++) {
    for (let c=0; c<9; c++) {
      const idx = r*9 + c;
      const wrap = cells[idx];
      const input = wrap.querySelector('input');
      input.value = cur[r][c] || '';
      if (cur[r][c] && !isValidPlacement(cur, r, c, cur[r][c])) {
        wrap.classList.add('highlight-wrong');
      } else {
        wrap.classList.remove('highlight-wrong');
      }
    }
  }
  updateDoneButton();
}

function onInput(r, c, val) {
  cur[r][c] = parseInt(val) || 0;
  render();
}

function isValidPlacement(b,r,c,val) {
  if (!val) return true;
  for (let j=0; j<9; j++) if (j !== c && b[r][j] === val) return false;
  for (let i=0; i<9; i++) if (i !== r && b[i][c] === val) return false;
  const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
  for (let i=br; i < br+3; i++)
    for (let j=bc; j < bc+3; j++)
      if (!(i===r && j===c) && b[i][j] === val) return false;
  return true;
}

function findEmpty(b) {
  for (let r=0; r<9; r++)
    for (let c=0; c<9; c++)
      if (b[r][c] === 0) return [r, c];
  return null;
}

function solveBacktrack(b) {
  const empty = findEmpty(b);
  if (!empty) return true;
  const [r, c] = empty;
  for (let val = 1; val <= 9; val++) {
    if (isValidPlacement(b, r, c, val)) {
      b[r][c] = val;
      if (solveBacktrack(b)) return true;
      b[r][c] = 0;
    }
  }
  return false;
}

function solvePuzzle() {
  cur = copyBoard(original);
  solution = copyBoard(original);
  if (!solveBacktrack(solution)) {
    alert('Puzzle unsolvable');
    return;
  }
  cur = copyBoard(solution);
  render();
  stopTimer();
  showWin(true, false);
}

function useHint() {
  if (hintsLeft <= 0) {
    alert('No hints left');
    return;
  }
  if (!solution.length) {
    solution = copyBoard(original);
    if (!solveBacktrack(solution)) {
      alert('Puzzle unsolvable');
      return;
    }
  }
  const empties = [];
  for (let r=0; r<9; r++)
    for (let c=0; c<9; c++)
      if (!cur[r][c]) empties.push([r, c]);
  if (!empties.length) return;
  const [r, c] = empties[Math.floor(Math.random()*empties.length)];
  cur[r][c] = solution[r][c];
  hintsLeft--;
  render();
}

function checkBoard() {
  render();
  alert('Board checked! Wrong cells highlighted');
}

function resetBoard() {
  cur = copyBoard(original);
  render();
  seconds = 0;
  updateTimer();
}

function checkWin() {
  for (let r=0; r<9; r++)
    for (let c=0; c<9; c++)
      if (cur[r][c] !== solution[r][c]) {
        alert('Some cells are wrong. Keep trying!');
        return;
      }
  render();
  showWin(false, false);
}

function giveUp() {
  cur = copyBoard(solution);
  render();
  stopTimer();
  showWin(false, true);
}

function newPuzzle() {
  const lvl = document.getElementById('level-select').value;
  const clues = cluesConfig[lvl] || 30;
  const {puzzle, solution: soln} = generateSudoku(clues);
  original = copyBoard(puzzle);
  cur = copyBoard(puzzle);
  hintsLeft = 3;
  seconds = 0;
  solution = copyBoard(soln);
  buildGrid();
  render();
  startTimer();
}

function updateDoneButton() {
  const allFilled = cur.flat().every(cell => cell !== 0 && cell !== '');
  doneBtn.disabled = !allFilled;
  doneBtn.style.opacity = allFilled ? '1' : '0.5';
}

function updateTimer() {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  timerEl.textContent = `${m}:${s}`;
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    seconds++;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function showWin(solved=true, gaveUp=false) {
  modalRoot.classList.add('active');
  const msg = gaveUp ? 'Better luck next time! The solution is revealed.' : (solved ? 'Solved by the solver.' : 'You solved it!');
  modalMsg.textContent = msg;
}

function closeModal() {
  modalRoot.classList.remove('active');
}

document.getElementById('new-btn').onclick = newPuzzle;
document.getElementById('solve-btn').onclick = solvePuzzle;
document.getElementById('hint-btn').onclick = useHint;
document.getElementById('check-btn').onclick = checkBoard;
document.getElementById('done-btn').onclick = checkWin;
document.getElementById('reset-btn').onclick = resetBoard;
document.getElementById('giveup-btn').onclick = giveUp;
document.getElementById('level-select').onchange = newPuzzle;
document.getElementById('close-modal-btn').onclick = closeModal;
document.getElementById('next-puzzle-btn').onclick = () => { closeModal(); newPuzzle(); };

window.onload = newPuzzle;

// Arrow keys navigation skipping disabled (filled) cells

function focusCell(r, c) {
  const idx = r * 9 + c;
  const cells = boardEl.querySelectorAll('.cell input');
  if (cells[idx]) cells[idx].focus();
}

boardEl.onkeydown = function(event) {
  const active = document.activeElement;
  if (!active || active.tagName !== 'INPUT') return;
  const cells = Array.from(boardEl.querySelectorAll('.cell input'));
  let idx = cells.indexOf(active);
  if (idx === -1) return;
  let r = Math.floor(idx / 9);
  let c = idx % 9;

  function nextEditable(r, c, dr, dc) {
    while (true) {
      r += dr;
      c += dc;
      if (r < 0 || r > 8 || c < 0 || c > 8) return null;
      const newIdx = r * 9 + c;
      if (!cells[newIdx].disabled) return cells[newIdx];
    }
  }

  let nextInput = null;
  switch (event.key) {
    case "ArrowLeft":
      nextInput = nextEditable(r, c, 0, -1);
      break;
    case "ArrowRight":
      nextInput = nextEditable(r, c, 0, 1);
      break;
    case "ArrowUp":
      nextInput = nextEditable(r, c, -1, 0);
      break;
    case "ArrowDown":
      nextInput = nextEditable(r, c, 1, 0);
      break;
    default:
      return;
  }

  if (nextInput) {
    nextInput.focus();
    event.preventDefault();
  }
};
