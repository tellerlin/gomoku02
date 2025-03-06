// 定义棋型评分
const PATTERN_SCORES = {
  FIVE: 100000,        // 连五
  OPEN_FOUR: 10000,    // 活四
  BLOCKED_FOUR: 5000,  // 冲四
  OPEN_THREE: 2000,    // 活三
  BLOCKED_THREE: 500,  // 眠三
  OPEN_TWO: 300,       // 活二
  BLOCKED_TWO: 100,    // 眠二
  CENTER: 10,          // 中心点权重
};

interface Position {
  row: number;
  col: number;
}

export class GomokuAI {
  private readonly BOARD_SIZE: number;
  private readonly WIN_CONDITION: number;
  private readonly directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  private difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  private positionCache = new Map<string, number>();

  constructor(boardSize: number = 15, winCondition: number = 5) {
    this.BOARD_SIZE = boardSize;
    this.WIN_CONDITION = winCondition;
  }

  setDifficulty(level: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = level;
  }

  private getBoardHash(squares: (string | null)[]): string {
    return squares.map(s => s === null ? '.' : s).join('');
  }

  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE;
  }

  private checkPattern(
    squares: (string | null)[],
    row: number,
    col: number,
    dx: number,
    dy: number,
    player: string
  ): { consecutive: number; openEnds: number } {
    let consecutive = 1;
    let openEnds = 0;

    // 正向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dy;
      const newCol = col + i * dx;
      if (!this.isValidPosition(newRow, newCol)) break;
      
      const square = squares[newRow * this.BOARD_SIZE + newCol];
      if (square === player) consecutive++;
      else if (square === null) {
        openEnds++;
        break;
      } else break;
    }

    // 反向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dy;
      const newCol = col - i * dx;
      if (!this.isValidPosition(newRow, newCol)) break;
      
      const square = squares[newRow * this.BOARD_SIZE + newCol];
      if (square === player) consecutive++;
      else if (square === null) {
        openEnds++;
        break;
      } else break;
    }

    return { consecutive, openEnds };
  }

  private evaluatePosition(squares: (string | null)[], pos: number, player: string): number {
    const cacheKey = `${pos}-${player}-${this.getBoardHash(squares)}`;
    if (this.positionCache.has(cacheKey)) {
      return this.positionCache.get(cacheKey)!;
    }

    let score = 0;
    const row = Math.floor(pos / this.BOARD_SIZE);
    const col = pos % this.BOARD_SIZE;

    // 计算中心点权重
    const centerDist = Math.abs(row - 7) + Math.abs(col - 7);
    score += (14 - centerDist) * PATTERN_SCORES.CENTER;

    let openThreeCount = 0;
    let blockedFourCount = 0;

    for (const [dx, dy] of this.directions) {
      const pattern = this.checkPattern(squares, row, col, dx, dy, player);
      const { consecutive, openEnds } = pattern;

      // 评分
      if (consecutive >= 5) score += PATTERN_SCORES.FIVE;
      else if (consecutive === 4) {
        if (openEnds === 2) score += PATTERN_SCORES.OPEN_FOUR;
        else if (openEnds === 1) {
          score += PATTERN_SCORES.BLOCKED_FOUR;
          blockedFourCount++;
        }
      }
      else if (consecutive === 3) {
        if (openEnds === 2) {
          score += PATTERN_SCORES.OPEN_THREE;
          openThreeCount++;
        }
        else if (openEnds === 1) score += PATTERN_SCORES.BLOCKED_THREE;
      }
      else if (consecutive === 2) {
        if (openEnds === 2) score += PATTERN_SCORES.OPEN_TWO;
        else if (openEnds === 1) score += PATTERN_SCORES.BLOCKED_TWO;
      }
    }

    // 特殊棋型加分
    if (openThreeCount >= 2) score += PATTERN_SCORES.OPEN_FOUR;
    if (blockedFourCount >= 1 && openThreeCount >= 1) score += PATTERN_SCORES.OPEN_FOUR;

    this.positionCache.set(cacheKey, score);
    return score;
  }

  private checkWinner(squares: (string | null)[], pos: number): string | null {
    const player = squares[pos];
    if (!player) return null;

    const row = Math.floor(pos / this.BOARD_SIZE);
    const col = pos % this.BOARD_SIZE;

    for (const [dx, dy] of this.directions) {
      let count = 1;

      // 正向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dy;
        const newCol = col + i * dx;
        if (!this.isValidPosition(newRow, newCol)) break;
        if (squares[newRow * this.BOARD_SIZE + newCol] !== player) break;
        count++;
      }

      // 反向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row - i * dy;
        const newCol = col - i * dx;
        if (!this.isValidPosition(newRow, newCol)) break;
        if (squares[newRow * this.BOARD_SIZE + newCol] !== player) break;
        count++;
      }

      if (count >= 5) return player;
    }

    return null;
  }

  private getPrioritizedMoves(squares: (string | null)[]): number[] {
    const moves = squares
      .map((square, index) => square === null ? index : null)
      .filter((index): index is number => index !== null);

    return moves.sort((a, b) => {
      const hasNearbyStones = (pos: number) => {
        const row = Math.floor(pos / this.BOARD_SIZE);
        const col = pos % this.BOARD_SIZE;
        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            if (i === 0 && j === 0) continue;
            const newRow = row + i;
            const newCol = col + j;
            if (this.isValidPosition(newRow, newCol)) {
              if (squares[newRow * this.BOARD_SIZE + newCol]) return true;
            }
          }
        }
        return false;
      };
      return (hasNearbyStones(b) ? 1 : 0) - (hasNearbyStones(a) ? 1 : 0);
    }).slice(0, 15); // 只保留最优的15个位置
  }

  private findThreatMove(squares: (string | null)[]): number {
    const moves = this.getPrioritizedMoves(squares);
    
    // 检查AI是否有连五机会
    for (const move of moves) {
      const newSquares = [...squares];
      newSquares[move] = 'O';
      if (this.checkWinner(newSquares, move) === 'O') {
        return move;
      }
    }
    
    // 检查是否需要防守对手的连五
    for (const move of moves) {
      const newSquares = [...squares];
      newSquares[move] = 'X';
      if (this.checkWinner(newSquares, move) === 'X') {
        return move;
      }
    }
    
    return -1;
  }

  private minimax(
    squares: (string | null)[],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): { score: number; move?: number } {
    // 检查是否有获胜者
    const moves = this.getPrioritizedMoves(squares);
    for (const move of moves) {
      if (squares[move]) continue;
      const newSquares = [...squares];
      newSquares[move] = isMaximizing ? 'O' : 'X';
      if (this.checkWinner(newSquares, move)) {
        return { 
          score: isMaximizing ? PATTERN_SCORES.FIVE : -PATTERN_SCORES.FIVE,
          move 
        };
      }
    }

    if (depth === 0) {
      return { score: 0 };
    }

    if (moves.length === 0) {
      return { score: 0 };
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      let bestMove = moves[0];
      for (const move of moves) {
        const newSquares = [...squares];
        newSquares[move] = 'O';
        const score = this.evaluatePosition(newSquares, move, 'O') +
                     this.minimax(newSquares, depth - 1, alpha, beta, false).score * 0.9;
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break;
      }
      return { score: bestScore, move: bestMove };
    } else {
      let bestScore = Infinity;
      let bestMove = moves[0];
      for (const move of moves) {
        const newSquares = [...squares];
        newSquares[move] = 'X';
        const score = this.evaluatePosition(newSquares, move, 'X') +
                     this.minimax(newSquares, depth - 1, alpha, beta, true).score * 0.9;
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) break;
      }
      return { score: bestScore, move: bestMove };
    }
  }

  private openingBook(squares: (string | null)[]): number | null {
    const totalPieces = squares.filter(square => square !== null).length;
    
    // 空棋盘，下在天元
    if (totalPieces === 0) {
      return Math.floor(this.BOARD_SIZE * this.BOARD_SIZE / 2);
    }
    
    // 第二手
    if (totalPieces === 1) {
      const firstMove = squares.findIndex(s => s !== null);
      const row = Math.floor(firstMove / this.BOARD_SIZE);
      const col = firstMove % this.BOARD_SIZE;
      
      // 如果对手下在天元，选择靠近的位置
      if (firstMove === Math.floor(this.BOARD_SIZE * this.BOARD_SIZE / 2)) {
        return (row - 1) * this.BOARD_SIZE + col;
      }
      
      // 如果对手不在天元，下在天元
      return Math.floor(this.BOARD_SIZE * this.BOARD_SIZE / 2);
    }
    
    return null;
  }

  findBestMove(squares: (string | null)[]): number {
    // 检查开局库
    const openingMove = this.openingBook(squares);
    if (openingMove !== null) return openingMove;

    // 检查威胁
    const threatMove = this.findThreatMove(squares);
    if (threatMove !== -1) return threatMove;

    // 根据难度调整搜索深度
    const totalPieces = squares.filter(square => square !== null).length;
    let maxDepth;
    switch (this.difficulty) {
      case 'easy':
        maxDepth = 1;
        break;
      case 'medium':
        maxDepth = 2;
        break;
      case 'hard':
        maxDepth = totalPieces < 10 ? 4 : 3;
        break;
      default:
        maxDepth = 2;
    }

    // 简单难度时有概率随机下棋
    if (this.difficulty === 'easy' && Math.random() < 0.3) {
      const availableMoves = squares
        .map((square, index) => square === null ? index : null)
        .filter((index): index is number => index !== null);
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    // 使用极小化极大算法找到最佳移动
    const { move } = this.minimax(squares, maxDepth, -Infinity, Infinity, true);
    return move!;
  }
}

export const gomokuAI = new GomokuAI();