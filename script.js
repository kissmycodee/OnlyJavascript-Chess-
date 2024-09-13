const pieces = {
    'r': '♖', 'n': '♘', 'b': '♗', 'q': '♕', 'k': '♔', 'p': '♙', // Black pieces
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'  // White pieces
};

const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    Array(8).fill(''),
    Array(8).fill(''),
    Array(8).fill(''),
    Array(8).fill(''),
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

let currentTurn = 'white'; // Track the turn (white or black)
let selectedSquare = null;
let validMoves = [];
let isCheck = false;  // Track if the current player's king is in check
let checkmate = false; // Track if it's checkmate

const moveHistory = []; // Store history of moves

// Draw the chess board
function drawBoard() {
    const boardElement = document.getElementById('chess-board');
    boardElement.innerHTML = ''; // Clear previous board
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square', (row + col) % 2 === 0 ? 'white' : 'black');
            square.dataset.position = `${row}-${col}`;

            if (initialBoard[row][col]) {
                square.textContent = pieces[initialBoard[row][col]];
            }

            // Highlight valid moves
            if (validMoves.some(move => move[0] === row && move[1] === col)) {
                square.style.backgroundColor = 'yellow'; // Highlight valid moves
            }

            square.addEventListener('click', () => handleSquareClick(row, col));
            square.addEventListener('touchstart', (event) => handleTouchStart(event, row, col)); // Touch support
            boardElement.appendChild(square);
        }
    }
    drawMoveHistory(); // Update move history display after redrawing the board
}

// Handle square click events
function handleSquareClick(row, col) {
    handleMove(row, col);
}

// Handle touch events
function handleTouchStart(event, row, col) {
    event.preventDefault(); // Prevent scrolling on touch
    handleMove(row, col);
}

// Handle the actual move logic
function handleMove(row, col) {
    if (checkmate) {
        alert("Game over! Checkmate.");
        return;
    }

    if (selectedSquare) {
        const [selectedRow, selectedCol] = selectedSquare.split('-').map(Number);
        const targetPiece = initialBoard[row][col];

        // Validate the move
        if (validMoves.some(move => move[0] === row && move[1] === col)) {
            const moveDetails = {
                from: { row: selectedRow, col: selectedCol },
                to: { row, col },
                piece: initialBoard[selectedRow][selectedCol]
            };

            // Perform the move
            initialBoard[row][col] = initialBoard[selectedRow][selectedCol];
            initialBoard[selectedRow][selectedCol] = '';

            // Check for check/checkmate after the move
            if (isKingInCheck(currentTurn === 'white' ? 'K' : 'k')) {
                initialBoard[selectedRow][selectedCol] = initialBoard[row][col];
                initialBoard[row][col] = '';
                alert("Move puts king in check! Try again.");
            } else {
                moveHistory.push(moveDetails); // Store the move in history
                currentTurn = currentTurn === 'white' ? 'black' : 'white'; // Switch turn
                isCheck = isKingInCheck(currentTurn === 'white' ? 'K' : 'k');

                if (isCheck) {
                    checkmate = isCheckmate();
                }
            }
            clearValidMoves();
            selectedSquare = null; // Deselect the square
        } else {
            selectedSquare = null;
            clearValidMoves();
        }
    } else {
        selectedSquare = `${row}-${col}`;
        const piece = initialBoard[row][col];

        if (isCurrentPlayersPiece(piece)) {
            validMoves = getValidMoves(row, col, piece);
        } else {
            clearValidMoves();
            selectedSquare = null; // Reset selected square
        }
    }
    drawBoard(); // Redraw the board after the move
}

// Check if the selected piece is of the current player's turn
function isCurrentPlayersPiece(piece) {
    return (currentTurn === 'white' && piece === piece.toUpperCase()) || 
           (currentTurn === 'black' && piece === piece.toLowerCase());
}

// Clear valid moves
function clearValidMoves() {
    validMoves = [];
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => square.style.backgroundColor = '');
}

// Check for Checkmate
function isCheckmate() {
    const kingPos = findKingPosition(currentTurn === 'white' ? 'K' : 'k');
    const kingMoves = getValidMoves(kingPos[0], kingPos[1], initialBoard[kingPos[0]][kingPos[1]]);
    return !kingMoves.some(move => {
        const originalPiece = initialBoard[move[0]][move[1]];
        initialBoard[move[0]][move[1]] = initialBoard[kingPos[0]][kingPos[1]];
        initialBoard[kingPos[0]][kingPos[1]] = '';
        const inCheck = isKingInCheck(currentTurn === 'white' ? 'K' : 'k');
        initialBoard[kingPos[0]][kingPos[1]] = initialBoard[move[0]][move[1]];
        initialBoard[move[0]][move[1]] = originalPiece;
        return !inCheck;
    });
}

// Find the position of the king of the current turn
function findKingPosition(king) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (initialBoard[row][col] === king) {
                return [row, col];
            }
        }
    }
    return null;
}

// Check if a king is in check
function isKingInCheck(king) {
    const kingPos = findKingPosition(king);
    return initialBoard.some((row, rIdx) => row.some((piece, cIdx) => {
        if (!piece || (king === 'K' && piece === piece.toUpperCase()) || (king === 'k' && piece === piece.toLowerCase())) {
            return false;
        }
        const moves = getValidMoves(rIdx, cIdx, piece);
        return moves.some(move => move[0] === kingPos[0] && move[1] === kingPos[1]);
    }));
}

// Undo last move
function undoLastMove() {
    if (moveHistory.length === 0) {
        alert("No moves to undo.");
        return;
    }
    const lastMove = moveHistory.pop();
    // Revert the last move
    initialBoard[lastMove.from.row][lastMove.from.col] = lastMove.piece;
    initialBoard[lastMove.to.row][lastMove.to.col] = '';
    currentTurn = currentTurn === 'white' ? 'black' : 'white'; // Switch turn back

    clearValidMoves();
    drawBoard();
}

document.getElementById('undo-move').addEventListener('click', undoLastMove);

// Draw move history
function drawMoveHistory() {
    const moveHistoryElement = document.getElementById('move-history');
    moveHistoryElement.innerHTML = '<strong>Move History:</strong><br>';
    moveHistory.forEach((move, index) => {
        moveHistoryElement.innerHTML += `Move ${index + 1}: ${pieces[move.piece]} from (${move.from.row}, ${move.from.col}) to (${move.to.row}, ${move.to.col})<br>`;
    });
}

// Get valid moves for a given piece
function getValidMoves(row, col, piece) {
    const moves = [];
    switch (piece.toUpperCase()) {
        case 'P':
            moves.push(...getPawnMoves(row, col, piece));
            break;
        case 'R':
            moves.push(...getRookMoves(row, col));
            break;
        case 'N':
            moves.push(...getKnightMoves(row, col));
            break;
        case 'B':
            moves.push(...getBishopMoves(row, col));
            break;
        case 'Q':
            moves.push(...getQueenMoves(row, col));
            break;
        case 'K':
            moves.push(...getKingMoves(row, col));
            break;
        default:
            break;
    }
    return moves;
}

// Pawn movement logic
function getPawnMoves(row, col, piece) {
    const moves = [];
    const direction = piece === 'P' ? -1 : 1; // White moves up, Black moves down
    const startRow = piece === 'P' ? 6 : 1;

    // Move forward
    const forward = row + direction;
    if (initialBoard[forward]?.[col] === '') {
        moves.push([forward, col]);
        // Double move from starting position
        if (row === startRow && initialBoard[forward + direction]?.[col] === '') {
            moves.push([forward + direction, col]);
        }
    }

    // Captures
    for (const dCol of [-1, 1]) {
        const captureRow = forward;
        const captureCol = col + dCol;
        if (isOpponentPiece(captureRow, captureCol, piece)) {
            moves.push([captureRow, captureCol]);
        }
    }

    return moves;
}

// Rook movement logic
function getRookMoves(row, col) {
    const moves = [];
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]; // vertical and horizontal

    for (const [dRow, dCol] of directions) {
        let targetRow = row;
        let targetCol = col;

        while (true) {
            targetRow += dRow;
            targetCol += dCol;

            if (targetRow < 0 || targetRow >= 8 || targetCol < 0 || targetCol >= 8) break;

            if (initialBoard[targetRow][targetCol] === '') {
                moves.push([targetRow, targetCol]); // Empty square
            } else if (isOpponentPiece(targetRow, targetCol, initialBoard[row][col])) {
                moves.push([targetRow, targetCol]); // Capture
                break; // Can't move further in this direction
            } else {
                break; // Blocked by own piece
            }
        }
    }

    return moves;
}

// Knight movement logic
function getKnightMoves(row, col) {
    const moves = [];
    const knightMoves = [
        [2, 1], [2, -1], [-2, 1], [-2, -1],
        [1, 2], [1, -2], [-1, 2], [-1, -2]
    ];

    for (const [dRow, dCol] of knightMoves) {
        const targetRow = row + dRow;
        const targetCol = col + dCol;

        if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
            if (initialBoard[targetRow][targetCol] === '' || isOpponentPiece(targetRow, targetCol, initialBoard[row][col])) {
                moves.push([targetRow, targetCol]);
            }
        }
    }

    return moves;
}

// Bishop movement logic
function getBishopMoves(row, col) {
    const moves = [];
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]]; // diagonal moves

    for (const [dRow, dCol] of directions) {
        let targetRow = row;
        let targetCol = col;

        while (true) {
            targetRow += dRow;
            targetCol += dCol;

            if (targetRow < 0 || targetRow >= 8 || targetCol < 0 || targetCol >= 8) break;

            if (initialBoard[targetRow][targetCol] === '') {
                moves.push([targetRow, targetCol]); // Empty square
            } else if (isOpponentPiece(targetRow, targetCol, initialBoard[row][col])) {
                moves.push([targetRow, targetCol]); // Capture
                break; // Can't move further in this direction
            } else {
                break; // Blocked by own piece
            }
        }
    }

    return moves;
}

// Queen movement logic
function getQueenMoves(row, col) {
    return [...getRookMoves(row, col), ...getBishopMoves(row, col)];
}

// King movement logic
function getKingMoves(row, col) {
    const moves = [];
    const kingMoves = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];

    for (const [dRow, dCol] of kingMoves) {
        const targetRow = row + dRow;
        const targetCol = col + dCol;

        if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
            if (initialBoard[targetRow][targetCol] === '' || isOpponentPiece(targetRow, targetCol, initialBoard[row][col])) {
                moves.push([targetRow, targetCol]);
            }
        }
    }

    return moves;
}

// Check if position is occupied by an opponent's piece
function isOpponentPiece(row, col, piece) {
    const targetPiece = initialBoard[row]?.[col];
    return targetPiece && (piece === piece.toUpperCase() ? targetPiece === targetPiece.toLowerCase() : targetPiece === targetPiece.toUpperCase());
}

// Initialize the chess board
drawBoard();