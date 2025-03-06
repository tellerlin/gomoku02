type Difficulty = 'easy' | 'medium' | 'hard';
type Square = string | null;
type Position = { row: number; col: number };
type ThreatInfo = { type: string; score: number; positions: number[] };

class GomokuAI {
    private boardSize: number = 15;
    private difficulty: Difficulty = 'medium';
    private moveHistory: { x: number; y: number; color: string }[] = [];
    private playerPiece: string = 'X';  // 玩家默认使用黑棋
    private computerPiece: string = 'O'; // AI默认使用白棋
    private winCondition: number = 5;   // 连子数量

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
      // 创建棋盘副本，避免修改原始数据
      const boardCopy = [...squares];
      
      // 检查是否有立即获胜的着法
      const winningMove = this.findWinningMove(boardCopy, this.computerPiece);
      if (winningMove !== -1) {
          this.recordMove(winningMove);
          return winningMove;
      }
      
      // 检查是否需要阻止玩家获胜
      const blockingMove = this.findWinningMove(boardCopy, this.playerPiece);
      if (blockingMove !== -1) {
          this.recordMove(blockingMove);
          return blockingMove;
      }
      
      // 获取候选着法并按威胁程度排序
      const candidates = this.getPrioritizedMoves(boardCopy);
      
      // 根据难度确定搜索深度
      const searchDepth = this.getSearchDepth();
      
      let bestMove = candidates[0];
      let bestScore = -Infinity;
      const weights = this.getDifficultyWeights();

      // 对每个候选着法进行评估
      for (const move of candidates) {
          // 模拟这步棋
          boardCopy[move] = this.computerPiece;
          
          // 计算当前移动的分数
          let score: number;
          
          if (searchDepth > 1 && candidates.length < 10) {
              // 使用极小化极大算法进行深度搜索
              score = this.minimax(boardCopy, searchDepth - 1, false, -Infinity, Infinity);
          } else {
              // 使用启发式评估
              score = this.evaluateBoard(boardCopy, move, weights);
          }
          
          // 撤销模拟
          boardCopy[move] = null;
          
          // 更新最佳着法
          if (score > bestScore) {
              bestScore = score;
              bestMove = move;
          }
          
          // 在简单难度下，增加随机性
          if (this.difficulty === 'easy' && Math.random() < 0.3) {
              bestMove = candidates[Math.floor(Math.random() * Math.min(5, candidates.length))];
          }
      }

      this.recordMove(bestMove);
      return bestMove;
  }
  
  private recordMove(moveIndex: number): void {
      const row = Math.floor(moveIndex / this.boardSize);
      const col = moveIndex % this.boardSize;
      this.moveHistory.push({ x: row, y: col, color: this.computerPiece });
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
        // 终止条件：达到搜索深度或游戏结束
        if (depth === 0) {
            return this.evaluateBoard(board, -1, this.getDifficultyWeights());
        }
        
        const candidates = this.getPrioritizedMoves(board).slice(0, 5); // 限制分支因子
        
        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const move of candidates) {
                if (board[move] !== null) continue;
                
                board[move] = this.computerPiece;
                const score = this.minimax(board, depth - 1, false, alpha, beta);
                board[move] = null;
                
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break; // Alpha-Beta剪枝
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of candidates) {
                if (board[move] !== null) continue;
                
                board[move] = this.playerPiece;
                const score = this.minimax(board, depth - 1, true, alpha, beta);
                board[move] = null;
                
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break; // Alpha-Beta剪枝
            }
            return minScore;
        }
    }

    private findWinningMove(board: Square[], piece: string): number {
        const candidates = this.getCandidateMoves(board);
        
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

    private getDifficultyWeights() {
        switch (this.difficulty) {
            case 'easy':
                return {
                    offense: 0.8,
                    defense: 1.0,  // 防守权重提高，使AI更注重防守
                    position: 0.5,
                    threat: 0.7    // 威胁评估权重降低
                };
            case 'hard':
                return {
                    offense: 1.2,
                    defense: 1.0,
                    position: 0.8,
                    threat: 1.3    // 威胁评估权重提高
                };
            default: // medium
                return {
                    offense: 1.0,
                    defense: 1.0,
                    position: 0.6,
                    threat: 1.0
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
                totalScore += threat.score * 0.5;
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
      
      // 检查连续6个位置（可能形成五连）
      for (let i = 0; i < 6; i++) {
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
              maxLength = Math.max(maxLength, currentLength);
          } else if (squares[index] === null) {
              emptyPositions.push(index);
              currentLength = 0;
              openEnds++;
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
      
      // 根据棋型评估威胁
      if (count >= 5) {
          // 五连或更多，胜利
          return { threat: { type: 'win', score: 100000, positions } };
      } else if (count === 4 && openEnds >= 1) {
          // 活四或冲四
          return { 
              threat: { 
                  type: openEnds === 2 ? 'open-four' : 'four', 
                  score: openEnds === 2 ? 15000 : 4000, 
                  positions 
              } 
          };
      } else if (count === 3 && openEnds >= 1) {
          // 活三或眠三
          return { 
              threat: { 
                  type: openEnds === 2 ? 'open-three' : 'three', 
                  score: openEnds === 2 ? 3000 : 600, 
                  positions 
              } 
          };
      } else if (count === 2 && openEnds >= 1) {
          // 活二或眠二
          return { 
              threat: { 
                  type: openEnds === 2 ? 'open-two' : 'two', 
                  score: openEnds === 2 ? 500 : 100, 
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
    let record = '五子棋对局记录\n';
    record += `日期：${new Date().toLocaleDateString()}\n`;
    record += `玩家执子：${playerIsBlack ? '黑' : '白'}\n`;
    record += `难度级别：${
        this.difficulty === 'easy' ? '简单' :
        this.difficulty === 'medium' ? '中等' : '困难'
    }\n\n`;

    // 添加棋谱
    record += '棋谱：\n';
    
    // 确保棋谱记录正确
    const blackPiece = playerIsBlack ? this.playerPiece : this.computerPiece;
    const whitePiece = playerIsBlack ? this.computerPiece : this.playerPiece;
    
    this.moveHistory.forEach((move, index) => {
        const pieceColor = move.color === blackPiece ? '黑' : '白';
        record += `${index + 1}. ${pieceColor} (${move.x}, ${move.y})\n`;
    });

    return record;
}
}

export const gomokuAI = new GomokuAI();