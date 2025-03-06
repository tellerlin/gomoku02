// 定义棋型评分
const PATTERN_SCORES = {
  FIVE: 1000000,        // 连五
  OPEN_FOUR: 100000,    // 活四
  BLOCKED_FOUR: 50000,  // 冲四
  OPEN_THREE: 10000,    // 活三
  BLOCKED_THREE: 5000,  // 眠三
  OPEN_TWO: 1000,       // 活二
  BLOCKED_TWO: 500,     // 眠二
  CENTER: 10,           // 中心点权重
  DOUBLE_THREE: 20000,  // 双活三
  FOUR_THREE: 150000    // 冲四活三
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
  private moveHistory: number[] = [];

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
  ): { consecutive: number; openEnds: number; gaps: number } {
    let consecutive = 1;
    let openEnds = 0;
    let gaps = 0;
    let maxLength = 1;

    // 正向检查
    let gapFound = false;
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dy;
      const newCol = col + i * dx;
      if (!this.isValidPosition(newRow, newCol)) break;
      
      const square = squares[newRow * this.BOARD_SIZE + newCol];
      if (square === player) {
        consecutive++;
        if (gapFound) gaps++;
        maxLength++;
      }
      else if (square === null) {
        if (!gapFound && maxLength < 4) {
          gapFound = true;
          maxLength++;
          continue;
        }
        openEnds++;
        break;
      } else break;
    }

    // 反向检查
    gapFound = false;
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dy;
      const newCol = col - i * dx;
      if (!this.isValidPosition(newRow, newCol)) break;
      
      const square = squares[newRow * this.BOARD_SIZE + newCol];
      if (square === player) {
        consecutive++;
        if (gapFound) gaps++;
        maxLength++;
      }
      else if (square === null) {
        if (!gapFound && maxLength < 4) {
          gapFound = true;
          maxLength++;
          continue;
        }
        openEnds++;
        break;
      } else break;
    }

    return { consecutive, openEnds, gaps };
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
    let openFourCount = 0;

    for (const [dx, dy] of this.directions) {
      const pattern = this.checkPattern(squares, row, col, dx, dy, player);
      const { consecutive, openEnds, gaps } = pattern;

      // 评分
      if (consecutive >= 5) score += PATTERN_SCORES.FIVE;
      else if (consecutive === 4) {
        if (openEnds === 2) {
          score += PATTERN_SCORES.OPEN_FOUR;
          openFourCount++;
        }
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
      
      // 检查跳棋形式的活三
      if (consecutive === 2 && gaps === 1 && openEnds === 2) {
        score += PATTERN_SCORES.OPEN_THREE * 0.8;
        openThreeCount++;
      }
    }

    // 特殊棋型加分
    if (openThreeCount >= 2) score += PATTERN_SCORES.DOUBLE_THREE;
    if (blockedFourCount >= 1 && openThreeCount >= 1) score += PATTERN_SCORES.FOUR_THREE;
    if (openFourCount >= 1) score += PATTERN_SCORES.OPEN_FOUR * 1.5; // 活四权重提高

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

  private checkDoubleThree(squares: (string | null)[], pos: number, player: string): boolean {
    let threeCount = 0;
    const row = Math.floor(pos / this.BOARD_SIZE);
    const col = pos % this.BOARD_SIZE;
    
    for (const [dx, dy] of this.directions) {
      const pattern = this.checkPattern(squares, row, col, dx, dy, player);
      if ((pattern.consecutive === 3 && pattern.openEnds === 2) || 
          (pattern.consecutive === 2 && pattern.gaps === 1 && pattern.openEnds === 2)) {
        threeCount++;
        if (threeCount >= 2) return true;
      }
    }
    
    return false;
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
    
    // 检查AI是否有活四机会
    for (const move of moves) {
      const newSquares = [...squares];
      newSquares[move] = 'O';
      const row = Math.floor(move / this.BOARD_SIZE);
      const col = move % this.BOARD_SIZE;
      
      for (const [dx, dy] of this.directions) {
        const pattern = this.checkPattern(newSquares, row, col, dx, dy, 'O');
        if (pattern.consecutive === 4 && pattern.openEnds === 2) {
          return move;
        }
      }
    }
    
    // 检查是否需要防守对手的活四
    for (const move of moves) {
      const newSquares = [...squares];
      newSquares[move] = 'X';
      const row = Math.floor(move / this.BOARD_SIZE);
      const col = move % this.BOARD_SIZE;
      
      for (const [dx, dy] of this.directions) {
        const pattern = this.checkPattern(newSquares, row, col, dx, dy, 'X');
        if (pattern.consecutive === 4 && pattern.openEnds === 2) {
          return move;
        }
      }
    }
    
    // 检查是否需要防守对手的双活三
    for (const move of moves) {
      const newSquares = [...squares];
      newSquares[move] = 'X';
      if (this.checkDoubleThree(newSquares, move, 'X')) {
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

  private findDefensiveMove(squares: (string | null)[]): number {
    const moves = this.getPrioritizedMoves(squares);
    
    // 优先级1：己方连五
    for (const move of moves) {
      if (squares[move] !== null) continue;
      const newSquares = [...squares];
      newSquares[move] = 'O';
      if (this.checkWinner(newSquares, move) === 'O') return move;
    }
    
    // 优先级2：防守对手连五/冲四
    for (const move of moves) {
      if (squares[move] !== null) continue;
      const newSquares = [...squares];
      newSquares[move] = 'X';
      const row = Math.floor(move / this.BOARD_SIZE);
      const col = move % this.BOARD_SIZE;
      
      // 检查是否能形成五连
      if (this.checkWinner(newSquares, move) === 'X') return move;
      
      // 检查是否能形成冲四
      for (const [dx, dy] of this.directions) {
        const pattern = this.checkPattern(newSquares, row, col, dx, dy, 'X');
        if (pattern.consecutive === 4 || 
            (pattern.consecutive === 3 && pattern.gaps === 1)) {
          return move;
        }
      }
    }
    
    // 优先级3：己方活四
    for (const move of moves) {
      if (squares[move] !== null) continue;
      const newSquares = [...squares];
      newSquares[move] = 'O';
      const row = Math.floor(move / this.BOARD_SIZE);
      const col = move % this.BOARD_SIZE;
      
      for (const [dx, dy] of this.directions) {
        const pattern = this.checkPattern(newSquares, row, col, dx, dy, 'O');
        if (pattern.consecutive === 4 && pattern.openEnds === 2) {
          return move;
        }
      }
    }
    
    // 优先级4：防守对手活三
    for (const move of moves) {
      if (squares[move] !== null) continue;
      const newSquares = [...squares];
      newSquares[move] = 'X';
      const row = Math.floor(move / this.BOARD_SIZE);
      const col = move % this.BOARD_SIZE;
      
      for (const [dx, dy] of this.directions) {
        const pattern = this.checkPattern(newSquares, row, col, dx, dy, 'X');
        if ((pattern.consecutive === 3 && pattern.openEnds === 2) ||
            (pattern.consecutive === 2 && pattern.gaps === 1 && pattern.openEnds === 2)) {
          return move;
        }
      }
    }
   
    return -1;
  }

  findBestMove(squares: (string | null)[]): number {
    // 检查开局库
    const openingMove = this.openingBook(squares);
    if (openingMove !== null) return openingMove;
  
    // 检查AI是否有连五机会或需要防守对手的连五
    const threatMove = this.findThreatMove(squares);
    if (threatMove !== -1) return threatMove;
    
    // 检查对手是否有活四或活三
    const defensiveMove = this.findDefensiveMove(squares);
    if (defensiveMove !== -1) return defensiveMove;
  
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
    if (this.difficulty === 'easy' && Math.random() < 0.6) {
      const availableMoves = squares
        .map((square, index) => square === null ? index : null)
        .filter((index): index is number => index !== null);

      // 优先选择靠近已有棋子的位置
      const prioritizedMoves = availableMoves.sort((a, b) => {
        const hasNearbyStones = (pos: number) => {
          const row = Math.floor(pos / this.BOARD_SIZE);
          const col = pos % this.BOARD_SIZE;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
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
      });

      // 选择前几个优先级高的位置中的一个
      if (prioritizedMoves.length > 0) {
        const topMoves = prioritizedMoves.slice(0, Math.min(3, prioritizedMoves.length));
        return topMoves[Math.floor(Math.random() * topMoves.length)];
      }
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
  
    // 使用极小化极大算法找到最佳移动
    const { move } = this.minimax(squares, maxDepth, -Infinity, Infinity, true);
    return move!;
  }

  // 将棋盘坐标转换为标准坐标
  private convertToCoord(row: number, col: number): string {
    const colStr = String.fromCharCode(65 + col);
    const rowStr = this.BOARD_SIZE - row;
    return `${colStr}${rowStr}`;
  }

  // 导出棋谱
  exportGameRecord(squares: (string | null)[], playerIsBlack: boolean): string {
    const moves: {player: string, pos: number}[] = [];
    const moveHistory: string[] = [];
    
    // 收集所有已下的棋子
    squares.forEach((square, index) => {
      if (square !== null) {
        moves.push({
          player: square,
          pos: index
        });
      }
    });

    // 生成棋谱头部信息
    const header = [
      '[Game "Gomoku"]',
      '[Size "15"]',
      `[Date "${new Date().toISOString().split('T')[0]}"]`,
      '[Rule "Standard"]',
      '[Time "0"]'
    ].join('\n');

    // 生成每一步的记录
    moves.forEach((move, index) => {
      const row = Math.floor(move.pos / this.BOARD_SIZE);
      const col = move.pos % this.BOARD_SIZE;
      const coord = this.convertToCoord(row, col);
      const isBlack = (move.player === 'X') === playerIsBlack;
      const stepNum = Math.floor(index / 2) + 1;
      
      if (index % 2 === 0) {
        moveHistory.push(`${stepNum}. ${coord}`);
      } else {
        moveHistory[moveHistory.length - 1] += ` ${coord}`;
      }
    });

    return `${header}\n\n${moveHistory.join('\n')}`;
  }
}

export const gomokuAI = new GomokuAI();