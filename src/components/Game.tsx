'use client';

import React, { useState, useEffect } from 'react';
import Board from './Board';
import PlayerSelectionModal from './PlayerSelectionModal';

const BOARD_SIZE = 15;
const WIN_CONDITION = 5;

export default function Game() {
  const [squares, setSquares] = useState<(string | null)[]>(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
  const [isBlackNext, setIsBlackNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [playerIsBlack, setPlayerIsBlack] = useState<boolean | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [lastMoveTime, setLastMoveTime] = useState<number | null>(null);
  const [totalMoves, setTotalMoves] = useState(0);
  const [averageMoveTime, setAverageMoveTime] = useState(0);
  const [maxMoveTime, setMaxMoveTime] = useState(0);
  const [gameLog, setGameLog] = useState<string[]>(['请选择执黑或执白']);

  const addGameLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setGameLog(prev => [`[${time}] ${message}`, ...prev]);
  };

  const checkWinner = (squares: (string | null)[], pos: number): string | null => {
    const currentPlayer = squares[pos];
    if (!currentPlayer) return null;

    const directions = [
      [1, 0],   // 横向
      [0, 1],   // 纵向
      [1, 1],   // 右下斜
      [1, -1],  // 右上斜
    ];

    for (const [dx, dy] of directions) {
      let count = 1;
      const row = Math.floor(pos / BOARD_SIZE);
      const col = pos % BOARD_SIZE;

      // 正向检查
      for (let i = 1; i < WIN_CONDITION; i++) {
        const newRow = row + i * dy;
        const newCol = col + i * dx;
        if (
          newRow < 0 || newRow >= BOARD_SIZE ||
          newCol < 0 || newCol >= BOARD_SIZE ||
          squares[newRow * BOARD_SIZE + newCol] !== currentPlayer
        ) break;
        count++;
      }

      // 反向检查
      for (let i = 1; i < WIN_CONDITION; i++) {
        const newRow = row - i * dy;
        const newCol = col - i * dx;
        if (
          newRow < 0 || newRow >= BOARD_SIZE ||
          newCol < 0 || newCol >= BOARD_SIZE ||
          squares[newRow * BOARD_SIZE + newCol] !== currentPlayer
        ) break;
        count++;
      }

      if (count >= WIN_CONDITION) return currentPlayer;
    }

    return null;
  };

  const getAvailableMoves = (squares: (string | null)[]) => {
    return squares
      .map((square, index) => (square === null ? index : null))
      .filter((index): index is number => index !== null);
  };

  const evaluatePosition = (squares: (string | null)[], pos: number, player: string) => {
    let score = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    const row = Math.floor(pos / BOARD_SIZE);
    const col = pos % BOARD_SIZE;

    for (const [dx, dy] of directions) {
      let count = 1;
      let blocked = 0;

      // 正向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dy;
        const newCol = col + i * dx;
        if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
          blocked++;
          break;
        }
        const square = squares[newRow * BOARD_SIZE + newCol];
        if (square === player) count++;
        else if (square !== null) {
          blocked++;
          break;
        } else break;
      }

      // 反向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row - i * dy;
        const newCol = col - i * dx;
        if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
          blocked++;
          break;
        }
        const square = squares[newRow * BOARD_SIZE + newCol];
        if (square === player) count++;
        else if (square !== null) {
          blocked++;
          break;
        } else break;
      }

      // 评分
      if (count >= 5) score += 100000;
      else if (count === 4 && blocked === 0) score += 10000;
      else if (count === 4 && blocked === 1) score += 1000;
      else if (count === 3 && blocked === 0) score += 1000;
      else if (count === 3 && blocked === 1) score += 100;
      else if (count === 2 && blocked === 0) score += 100;
    }

    return score;
  };

  const findBestMove = (squares: (string | null)[]) => {
    const availableMoves = getAvailableMoves(squares);
    let bestScore = -Infinity;
    let bestMove = availableMoves[0];

    for (const move of availableMoves) {
      const score = evaluatePosition(squares, move, 'O');
      const defensiveScore = evaluatePosition(squares, move, 'X') * 0.9;
      const finalScore = score + defensiveScore;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestMove = move;
      }
    }

    return bestMove;
  };

  const makeComputerMove = () => {
    if (winner || (isBlackNext === playerIsBlack)) return;

    const bestMove = findBestMove(squares);
    handleClick(bestMove);
  };

  useEffect(() => {
    if (!gameStarted || winner) return;
    
    // 如果玩家选择白棋（playerIsBlack为false），AI先下一步黑棋
    if (!playerIsBlack && isBlackNext && totalMoves === 0) {
      const timer = setTimeout(() => {
        // 计算棋盘中心点位置
        const centerPos = Math.floor(BOARD_SIZE * BOARD_SIZE / 2);
        handleClick(centerPos);
      }, 500);
      return () => clearTimeout(timer);
    }
    
    // 在游戏进行中，当轮到AI时才下棋
    if (isBlackNext !== playerIsBlack && totalMoves > 0) {
      const timer = setTimeout(makeComputerMove, 500);
      return () => clearTimeout(timer);
    }
  }, [isBlackNext, playerIsBlack, winner, gameStarted, totalMoves]);

  const handleClick = (i: number) => {
    if (winner || squares[i]) return;

    const currentTime = Date.now();
    if (lastMoveTime) {
      const moveTime = (currentTime - lastMoveTime) / 1000;
      addGameLog(`上一步耗时：${moveTime.toFixed(1)}秒`);
      setMaxMoveTime(prev => Math.max(prev, moveTime));
      setAverageMoveTime(prev => (prev * totalMoves + moveTime) / (totalMoves + 1));
    }

    const newSquares = squares.slice();
    newSquares[i] = isBlackNext ? 'X' : 'O';
    setSquares(newSquares);
    setLastMoveTime(currentTime);
    setTotalMoves(prev => prev + 1);

    const newWinner = checkWinner(newSquares, i);
    if (newWinner) {
      setWinner(newWinner);
      updateScores(newWinner);
      addGameLog(`${newWinner === 'X' ? '黑棋' : '白棋'}获胜！`);
    } else {
      setIsBlackNext(!isBlackNext);
      addGameLog(`${isBlackNext ? '黑棋' : '白棋'}落子于 ${Math.floor(i / BOARD_SIZE)},${i % BOARD_SIZE}`);
    }
  };

  const handleColorSelect = (isBlack: boolean) => {
    setPlayerIsBlack(isBlack);
    setGameStarted(true);
    setGameLog([`游戏开始，玩家选择执${isBlack ? '黑' : '白'}子`]);
  };

  const resetGame = () => {
    setSquares(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
    setIsBlackNext(true);
    setWinner(null);
    setLastMoveTime(null);
    setTotalMoves(0);
    setAverageMoveTime(0);
    setMaxMoveTime(0);
    setGameStarted(false);
    setPlayerIsBlack(null);
    setGameLog(['请选择执黑或执白']);
  };

  const updateScores = (winner: string) => {
    if (winner === 'X') {
      setPlayerScore(prev => prev + 1);
    } else if (winner === 'O') {
      setComputerScore(prev => prev + 1);
    }
  };

  const status = winner
    ? `获胜者: ${winner === 'X' ? '黑棋' : '白棋'}`
    : `下一步: ${isBlackNext ? '黑棋' : '白棋'}`;

  return (
    <div className="flex gap-8 p-4 max-w-7xl mx-auto">
      <div className="flex-shrink-0">
        {!gameStarted ? (
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-4">请选择您要执的棋子</h2>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleColorSelect(true)}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                执黑先行
              </button>
              <button
                onClick={() => handleColorSelect(false)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                执白后行
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-xl font-bold mb-4">{status}</div>
            <Board size={BOARD_SIZE} squares={squares} onSquareClick={handleClick} />
            <div className="flex gap-4 mt-4 justify-center">
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                重新开始
              </button>
            </div>
          </>
        )}
      </div>
      <div className="flex-1 max-w-md space-y-4">
        <div className="panel-card">
          <h3 className="text-lg font-bold mb-3">比分</h3>
          <div className="flex gap-4 justify-center">
            <div className="score-box flex-1 text-center">
              <span className="score-label block mb-1">{playerIsBlack ? '玩家' : 'AI'}</span>
              <span className="player-score text-2xl">{playerIsBlack ? playerScore : computerScore}</span>
            </div>
            <div className="score-box flex-1 text-center">
              <span className="score-label block mb-1">{playerIsBlack ? 'AI' : '玩家'}</span>
              <span className="computer-score text-2xl">{playerIsBlack ? computerScore : playerScore}</span>
            </div>
          </div>
        </div>
        <div className="panel-card">
          <h3 className="text-lg font-bold mb-3">统计信息</h3>
          <div className="space-y-2">
            <p>总步数：{totalMoves}</p>
            <p>平均步时：{averageMoveTime.toFixed(1)}秒</p>
            <p>最长步时：{maxMoveTime.toFixed(1)}秒</p>
          </div>
        </div>
        <div className="panel-card flex-1">
          <h3 className="text-lg font-bold mb-3">游戏日志</h3>
          <div className="h-48 overflow-y-auto space-y-1 text-sm">
            {gameLog.map((log, index) => (
              <p key={index} className="py-1 border-b border-gray-100 last:border-0">{log}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 计算获胜者的函数
function calculateWinner(squares: (string | null)[]) {
  // 实现五子棋的获胜逻辑
  // ...
  return null;
}