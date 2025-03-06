type Difficulty = 'easy' | 'medium' | 'hard';
type Square = string | null;
type Position = { row: number; col: number };
type ThreatInfo = { type: string; score: number; positions: number[] };

class GomokuAI {
  private boardSize: number = 15;
  private difficulty: Difficulty = 'medium';
  private moveHistory: { x: number; y: number; color: string }[] = [];
  private playerPiece: string = 'X';
  private computerPiece: string = 'O';
  private winCondition: number = 5;

  resetMoveHistory(): void {
    this.moveHistory = [];
}
  // 将 recordMove 方法改为公共方法
  recordMove(moveIndex: number, pieceColor: string): void {
      const row = Math.floor(moveIndex / this.boardSize);
      const col = moveIndex % this.boardSize;
      this.moveHistory.push({ x: row, y: col, color: pieceColor });
  }

  setDifficulty(difficulty: Difficulty) {
      this.difficulty = difficulty;
  }

  // 修改设置棋子的方法，确保正确设置
  setPieces(playerPiece: string) {
      this.playerPiece = playerPiece;
      this.computerPiece = playerPiece === 'X' ? 'O' : 'X';
      console.log(`AI设置：玩家使用 ${this.playerPiece}，AI使用 ${this.computerPiece}`);
      // 重置移动历史
      this.moveHistory = [];
  }

findBestMove(squares: Square[]): number {
  const boardCopy = [...squares];
  
  // 检查是否有立即获胜的着法
  const winningMove = this.findWinningMove(boardCopy, this.computerPiece);
  if (winningMove !== -1 && boardCopy[winningMove] === null) {
      this.recordMove(winningMove, this.computerPiece);
      return winningMove;
  }
  
  // 检查是否需要阻止玩家获胜
  const blockingMove = this.findWinningMove(boardCopy, this.playerPiece);
  if (blockingMove !== -1 && boardCopy[blockingMove] === null) {
      this.recordMove(blockingMove, this.computerPiece);
      return blockingMove;
  }
  
  // 获取候选着法
  const candidates = this.getPrioritizedMoves(boardCopy)
      .filter(move => boardCopy[move] === null)
      .slice(0, 8);  // 限制候选数量以提高效率
  
  if (candidates.length === 0) {
      console.error('No valid moves available');
      return -1;
  }
  
  const searchDepth = this.getSearchDepth();
  let bestMove = candidates[0];
  let bestScore = -Infinity;
  
  // 使用 minimax 算法评估每个候选着法
  for (const move of candidates) {
      if (boardCopy[move] !== null) continue;
      
      boardCopy[move] = this.computerPiece;
      const score = this.minimax(
          boardCopy, 
          searchDepth - 1, 
          false, 
          -Infinity, 
          Infinity
      );
      boardCopy[move] = null;
      
      // 更新最佳着法
      if (score > bestScore) {
          bestScore = score;
          bestMove = move;
      }
      
      // 在简单难度下增加随机性
      if (this.difficulty === 'easy' && Math.random() < 0.3) {
          const validRandomMoves = candidates.filter(m => boardCopy[m] === null);
          bestMove = validRandomMoves[Math.floor(Math.random() * validRandomMoves.length)];
      }
  }
  
  // 记录并返回最佳着法
  if (boardCopy[bestMove] === null) {
      this.recordMove(bestMove, this.computerPiece);
  }
  
  return bestMove;
}

    private getSearchDepth(): number {
        switch (this.difficulty) {
            case 'easy': return 1;
            case 'medium': return 2;
            case 'hard': return 3;
            default: return 2;
        }
    }
    
    private minimax(
      board: Square[], 
      depth: number, 
      isMaximizing: boolean, 
      alpha: number, 
      beta: number
  ): number {
      // 检查是否达到终止条件
      if (depth === 0) {
          return this.evaluateBoard(board, -1, this.getDifficultyWeights());
      }
      
      // 获取并过滤候选着法
      const candidates = this.getPrioritizedMoves(board)
          .filter(move => board[move] === null)
          .slice(0, 6); // 进一步限制搜索分支
      
      if (isMaximizing) {
          let maxScore = -Infinity;
          for (const move of candidates) {
              // 模拟落子
              board[move] = this.computerPiece;
              const score = this.minimax(board, depth - 1, false, alpha, beta);
              board[move] = null;
              
              maxScore = Math.max(maxScore, score);
              alpha = Math.max(alpha, score);
              
              // Alpha-Beta 剪枝
              if (beta <= alpha) break;
          }
          return maxScore;
      } else {
          let minScore = Infinity;
          for (const move of candidates) {
              // 模拟落子
              board[move] = this.playerPiece;
              const score = this.minimax(board, depth - 1, true, alpha, beta);
              board[move] = null;
              
              minScore = Math.min(minScore, score);
              beta = Math.min(beta, score);
              
              // Alpha-Beta 剪枝
              if (beta <= alpha) break;
          }
          return minScore;
      }
  }
    
  private findWinningMove(board: Square[], piece: string): number {
    // 获取所有空位而不仅仅是候选位置，确保不会漏掉关键防守点
    const allEmptyPositions = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            allEmptyPositions.push(i);
        }
    }
    
    // 先检查候选位置（效率更高）
    const candidates = this.getCandidateMoves(board);
    
    // 检查候选位置
    for (const move of candidates) {
        if (board[move] !== null) continue;
        
        // 模拟落子
        board[move] = piece;
        
        // 检查是否形成五连
        if (this.checkWin(board, move)) {
            board[move] = null;
            return move;
        }
        
        board[move] = null;
    }
    
    // 检查所有空位（确保不会漏掉关键防守点）
    for (const move of allEmptyPositions) {
        // 跳过已经检查过的候选位置
        if (candidates.includes(move) || board[move] !== null) continue;
        
        // 模拟落子
        board[move] = piece;
        
        // 检查是否形成五连
        if (this.checkWin(board, move)) {
            board[move] = null;
            return move;
        }
        
        board[move] = null;
    }
    
    return -1;
}

    private checkWin(board: Square[], moveIndex: number): boolean {
        const piece = board[moveIndex];
        if (!piece) return false;
        
        const row = Math.floor(moveIndex / this.boardSize);
        const col = moveIndex % this.boardSize;
        const directions = [
            [1, 0],   // 横向
            [0, 1],   // 纵向
            [1, 1],   // 右下斜
            [1, -1],  // 右上斜
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            // 正向检查
            for (let i = 1; i < this.winCondition; i++) {
                const newRow = row + i * dy;
                const newCol = col + i * dx;
                
                if (
                    newRow < 0 || newRow >= this.boardSize ||
                    newCol < 0 || newCol >= this.boardSize ||
                    board[newRow * this.boardSize + newCol] !== piece
                ) break;
                
                count++;
            }
            
            // 反向检查
            for (let i = 1; i < this.winCondition; i++) {
                const newRow = row - i * dy;
                const newCol = col - i * dx;
                
                if (
                    newRow < 0 || newRow >= this.boardSize ||
                    newCol < 0 || newCol >= this.boardSize ||
                    board[newRow * this.boardSize + newCol] !== piece
                ) break;
                
                count++;
            }
            
            if (count >= this.winCondition) return true;
        }
        
        return false;
    }

// 新增：评估连续威胁的方法
private evaluateConsecutiveThreats(board: Square[], lastMove: number, depth: number): number {
  if (depth === 0) return 0;
  
  let score = 0;
  const threats = this.detectThreats(board, this.computerPiece);
  
  // 评估己方威胁
  for (const threat of threats) {
      if (threat.type.includes('four')) {
          score += 5000;
      } else if (threat.type.includes('three')) {
          score += 1000;
      }
  }
  
  // 评估对手威胁
  const opponentThreats = this.detectThreats(board, this.playerPiece);
  for (const threat of opponentThreats) {
      if (threat.type.includes('four')) {
          score -= 8000;  // 增加防守权重
      } else if (threat.type.includes('three')) {
          score -= 2000;  // 增加对活三的重视
      }
  }
  
  return score;
}

private getDifficultyWeights() {
  switch (this.difficulty) {
      case 'easy':
          return {
              offense: 0.8,
              defense: 1.5,  // 提高防守权重
              position: 0.5,
              threat: 0.7
          };
      case 'hard':
          return {
              offense: 1.2,
              defense: 2.0,  // 显著提高防守权重
              position: 0.8,
              threat: 2.0    // 提高威胁评估权重
          };
      default: // medium
          return {
              offense: 1.0,
              defense: 1.8,  // 提高防守权重
              position: 0.6,
              threat: 1.5    // 提高威胁评估权重
          };
  }
}

    private getPrioritizedMoves(squares: Square[]): number[] {
        const candidates = this.getCandidateMoves(squares);
        const moveScores: { index: number; score: number }[] = [];
        
        // 为每个候选着法计算威胁分数
        for (const move of candidates) {
            if (squares[move] !== null) continue;
            
            // 计算AI的威胁分数
            const offensiveScore = this.evaluateThreats(squares, move, this.computerPiece);
            
            // 计算玩家的威胁分数
            const defensiveScore = this.evaluateThreats(squares, move, this.playerPiece);
            
            // 计算位置分数
            const positionScore = this.evaluatePosition(move);
            
            // 综合评分
            const totalScore = offensiveScore * 1.2 + defensiveScore + positionScore * 0.5;
            
            moveScores.push({ index: move, score: totalScore });
        }
        
        // 按分数降序排序
        moveScores.sort((a, b) => b.score - a.score);
        
        // 返回排序后的着法索引
        return moveScores.map(item => item.index);
    }

    private getCandidateMoves(squares: Square[]): number[] {
        const candidates: number[] = [];
        const visited: boolean[] = Array(this.boardSize * this.boardSize).fill(false);
        
        // 检查棋盘是否为空
        const isEmpty = squares.every(square => square === null);
        if (isEmpty) {
            // 如果棋盘为空，返回中心点及其周围位置
            const center = Math.floor(this.boardSize / 2) * this.boardSize + Math.floor(this.boardSize / 2);
            return [center];
        }
        
        // 遍历棋盘寻找已有棋子周围的空位
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const index = i * this.boardSize + j;
                if (squares[index] !== null) {
                    // 搜索周围的空位，距离越近优先级越高
                    for (let distance = 1; distance <= 2; distance++) {
                        for (let dx = -distance; dx <= distance; dx++) {
                            for (let dy = -distance; dy <= distance; dy++) {
                                // 跳过当前位置
                                if (dx === 0 && dy === 0) continue;
                                
                                const newI = i + dx;
                                const newJ = j + dy;
                                const newIndex = newI * this.boardSize + newJ;
                                
                                if (
                                    newI >= 0 && newI < this.boardSize &&
                                    newJ >= 0 && newJ < this.boardSize &&
                                    squares[newIndex] === null &&
                                    !visited[newIndex]
                                ) {
                                    candidates.push(newIndex);
                                    visited[newIndex] = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return candidates.length > 0 ? candidates : [Math.floor(this.boardSize * this.boardSize / 2)];
    }

    private evaluateBoard(squares: Square[], lastMove: number, weights: any): number {
        let score = 0;
        
        // 评估所有可能的威胁
        const aiThreats = this.detectThreats(squares, this.computerPiece);
        const playerThreats = this.detectThreats(squares, this.playerPiece);
        
        // 计算AI的威胁分数
        for (const threat of aiThreats) {
            score += threat.score * weights.offense;
        }
        
        // 计算玩家的威胁分数（防守价值）
        for (const threat of playerThreats) {
            score -= threat.score * weights.defense;
        }
        
        // 如果指定了最后一步，评估该位置
        if (lastMove >= 0) {
            score += this.evaluatePosition(lastMove) * weights.position;
        }
        
        return score;
    }


    private evaluateThreats(squares: Square[], moveIndex: number, piece: string): number {
      // 模拟落子
      squares[moveIndex] = piece;
      
      // 检测威胁
      const threats = this.detectThreats(squares, piece);
      
      // 撤销模拟
      squares[moveIndex] = null;
      
      // 计算威胁总分
      let totalScore = 0;
      for (const threat of threats) {
          totalScore += threat.score;
          
          // 如果威胁包含当前位置，额外加分
          if (threat.positions.includes(moveIndex)) {
              totalScore += threat.score * 0.8;  // 增加权重
          }
          
          // 对潜在获胜威胁额外加分
          if (threat.type === 'potential-win') {
              totalScore += 2000;  // 额外加分
          }
      }
      
      return totalScore;
  }

    private detectThreats(squares: Square[], piece: string): ThreatInfo[] {
        const threats: ThreatInfo[] = [];
        const directions = [
            [1, 0],   // 横向
            [0, 1],   // 纵向
            [1, 1],   // 右下斜
            [1, -1],  // 右上斜
        ];
        
        // 遍历棋盘
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const index = row * this.boardSize + col;
                
                // 检查每个方向
                for (const [dx, dy] of directions) {
                    // 只检查每个线段的起始点
                    if (
                        row - dy >= 0 && row - dy < this.boardSize &&
                        col - dx >= 0 && col - dx < this.boardSize &&
                        squares[(row - dy) * this.boardSize + (col - dx)] === piece
                    ) {
                        continue;
                    }
                    
                    // 分析当前方向的线段
                    const lineInfo = this.analyzeLineSegment(squares, row, col, dx, dy, piece);
                    
                    if (lineInfo.threat) {
                        threats.push(lineInfo.threat);
                    }
                }
            }
        }
        
        return threats;
    }

private analyzeLineSegment(
  squares: Square[], 
  startRow: number, 
  startCol: number, 
  dx: number, 
  dy: number, 
  piece: string
): { threat: ThreatInfo | null } {
  const positions: number[] = [];
  const emptyPositions: number[] = [];
  let count = 0;
  let maxLength = 0;
  let currentLength = 0;
  let openEnds = 0;
  let consecutiveCount = 0;
  let maxConsecutiveCount = 0;
  
  // 增加检查长度，确保能捕捉到更长的连线威胁
  for (let i = 0; i < 9; i++) {  // 增加检查长度从7到9
      const row = startRow + i * dy;
      const col = startCol + i * dx;
      
      // 超出边界
      if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
          break;
      }
      
      const index = row * this.boardSize + col;
      positions.push(index);
      
      if (squares[index] === piece) {
          count++;
          currentLength++;
          consecutiveCount++;
          maxLength = Math.max(maxLength, currentLength);
          maxConsecutiveCount = Math.max(maxConsecutiveCount, consecutiveCount);
      } else if (squares[index] === null) {
          emptyPositions.push(index);
          currentLength = 0;
          // 修改这里，不要重置consecutiveCount，而是允许跳过一个空位继续计数
          if (consecutiveCount > 0) {
              // 检查是否已经有一个空位
              const hasGap = positions.slice(-2, -1).some(pos => squares[pos] === null);
              if (hasGap) {
                  consecutiveCount = 0; // 如果已经有一个空位，则重置
              }
          }
      } else {
          // 遇到对方棋子
          break;
      }
  }
  
  // 检查起始点前一个位置是否为空（判断是否有开放端点）
  const prevRow = startRow - dy;
  const prevCol = startCol - dx;
  if (
      prevRow >= 0 && prevRow < this.boardSize &&
      prevCol >= 0 && prevCol < this.boardSize &&
      squares[prevRow * this.boardSize + prevCol] === null
  ) {
      openEnds++;
      positions.unshift(prevRow * this.boardSize + prevCol);
      emptyPositions.push(prevRow * this.boardSize + prevCol);
  }
  
  // 增加对非连续棋型的识别，如 X_XX_X 这种跳棋形式
  // 计算总长度内的棋子数量
  const totalPieces = positions.filter(pos => squares[pos] === piece).length;
  
  // 分析棋型中的间隔模式
  let gapPattern = '';
  for (const pos of positions) {
      gapPattern += squares[pos] === piece ? 'X' : (squares[pos] === null ? '_' : 'O');
  }
  
  // 增强跳棋形式的检测
  const jumpPatterns = [
      'X_XXX', 'XX_XX', 'XXX_X',  // 原有模式
      'X__XXX', 'XXX__X', 'XX__XX', // 原有模式
      'X_X_XX', 'XX_X_X', 'X_XX_X', // 新增模式
      'X__X_XX', 'XX_X__X'          // 新增更复杂的模式
  ];
  const hasJumpPattern = jumpPatterns.some(pattern => gapPattern.includes(pattern));
  
  // 根据棋型评估威胁
  if (hasJumpPattern || (totalPieces >= 4 && emptyPositions.length >= 1)) {
      // 四子或更多且有空位，可能形成五连，提高威胁评分
      return { 
          threat: { 
              type: 'potential-win', 
              score: 12000, // 进一步提高分数
              positions 
          } 
      };
  } else if (count >= 5 || maxConsecutiveCount >= 5) {
      // 五连或更多，胜利
      return { threat: { type: 'win', score: 100000, positions } };
  } else if (count === 4 && openEnds >= 1) {
      // 活四或冲四
      return { 
          threat: { 
              type: openEnds === 2 ? 'open-four' : 'four', 
              score: openEnds === 2 ? 20000 : 8000, // 提高冲四和活四的分数
              positions 
          } 
      };
  } else if (count === 3 && openEnds >= 1) {
      // 活三或眠三
      return { 
          threat: { 
              type: openEnds === 2 ? 'open-three' : 'three', 
              score: openEnds === 2 ? 5000 : 1500, // 提高眠三和活三的分数
              positions 
          } 
      };
  } else if (count === 2 && openEnds >= 1) {
      // 活二或眠二
      return { 
          threat: { 
              type: openEnds === 2 ? 'open-two' : 'two', 
              score: openEnds === 2 ? 800 : 200, // 提高分数
              positions 
          } 
      };
  }
  
  return { threat: null };
}

  private evaluatePosition(moveIndex: number): number {
      const row = Math.floor(moveIndex / this.boardSize);
      const col = moveIndex % this.boardSize;
      const centerX = this.boardSize / 2;
      const centerY = this.boardSize / 2;
      const distanceFromCenter = Math.sqrt(Math.pow(row - centerX, 2) + Math.pow(col - centerY, 2));
      
      // 距离中心越近，分数越高
      return Math.max(0, 30 - distanceFromCenter * 2);
  }

exportGameRecord(squares: Square[], playerIsBlack: boolean): string {
  // 创建 SGF 格式的棋谱
  let sgf = `(;GM[4]FF[4]SZ[${this.boardSize}]GN[Gomoku]DT[${new Date().toISOString().split('T')[0]}]`;
  sgf += `\nPB[${playerIsBlack ? 'Player' : 'AI'}]PW[${playerIsBlack ? 'AI' : 'Player'}]`;
  sgf += `\nRU[Standard]`;
  sgf += `\nDI[${this.difficulty}]`;
  sgf += `\nPL[B]`; // 黑方永远先手

  // 按照移动历史顺序添加落子记录
  this.moveHistory.forEach((move, index) => {
      const x = String.fromCharCode(97 + move.y); // 注意：这里需要交换 x 和 y
      const y = String.fromCharCode(97 + move.x);
      // 根据实际的棋子颜色确定 SGF 中的颜色标记
      const color = (playerIsBlack && move.color === 'X') || (!playerIsBlack && move.color === 'O') ? 'B' : 'W';
      sgf += `\n;${color}[${x}${y}]`;
  });

  sgf += ')';
  return sgf;
}

}

export const gomokuAI = new GomokuAI();