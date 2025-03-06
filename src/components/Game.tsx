'use client';

import React, { useState, useEffect } from 'react';
import Board from './Board';
import PlayerSelectionModal from './PlayerSelectionModal';
import { gomokuAI } from '../utils/gomokuAI';
import { saveAs } from 'file-saver';

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
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [showHints, setShowHints] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const addGameLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setGameLog(prev => [`[${time}] ${message}`, ...prev]);
  };

  const handleDifficultyChange = (newDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(newDifficulty);
    addGameLog(`难度设置已更改为: ${
      newDifficulty === 'easy' ? '简单' : 
      newDifficulty === 'medium' ? '中等' : '困难'
    }`);
    
    if (gameStarted) {
      gomokuAI.setDifficulty(newDifficulty);
    }
  };

  const handleExportGameRecord = () => {
    console.log('导出棋谱按钮被点击');
    try {
      // 检查 playerIsBlack 是否为 null
      if (playerIsBlack === null) {
        addGameLog('无法导出棋谱：游戏尚未开始');
        return;
      }

      const gameRecord = gomokuAI.exportGameRecord(squares, playerIsBlack);
      const blob = new Blob([gameRecord], { type: 'text/plain;charset=utf-8' });
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(blob, `gomoku-game-${timestamp}.txt`);
      addGameLog('棋谱已导出');
    } catch (error) {
      console.error('导出棋谱失败:', error);
      addGameLog('导出棋谱失败，请检查控制台日志');
    }
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

  const makeComputerMove = () => {
    if (winner || (isBlackNext === playerIsBlack)) return;
    // 使用 gomokuAI 的 findBestMove 方法
    const bestMove = gomokuAI.findBestMove(squares);
    handleClick(bestMove);
  };

  useEffect(() => {
    if (!gameStarted || winner) return;
    
    if (!playerIsBlack && isBlackNext && totalMoves === 0) {
      const timer = setTimeout(() => {
        const centerPos = Math.floor(BOARD_SIZE * BOARD_SIZE / 2);
        handleClick(centerPos);
      }, 500);
      return () => clearTimeout(timer);
    }
    
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
    setLastMove(i);

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
    setGameLog([`游戏开始，玩家选择执${isBlack ? '黑' : '白'}子，难度：${
      difficulty === 'easy' ? '简单' : 
      difficulty === 'medium' ? '中等' : '困难'
    }`]);
    
    // 设置 AI 难度和棋子颜色
    gomokuAI.setDifficulty(difficulty);
    gomokuAI.setPieces(isBlack ? 'X' : 'O');  // 确保正确设置玩家棋子
    console.log(`游戏开始：玩家执${isBlack ? '黑' : '白'}子`);
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
    setLastMove(null);
  };

  const updateScores = (winner: string) => {
    if ((winner === 'X' && playerIsBlack) || (winner === 'O' && !playerIsBlack)) {
      setPlayerScore(prev => prev + 1);
    } else {
      setComputerScore(prev => prev + 1);
    }
  };

  const status = winner
    ? `获胜者: ${winner === 'X' ? '黑棋' : '白棋'}`
    : `下一步: ${isBlackNext ? '黑棋' : '白棋'}${isBlackNext !== playerIsBlack ? ' (AI思考中...)' : ' (请您落子)'}`;

  return (
    <div className="flex flex-col md:flex-row gap-8 p-4 max-w-7xl mx-auto">
      <div className="flex-shrink-0 w-full md:w-auto">
      {!gameStarted ? (
          <PlayerSelectionModal 
            isOpen={true} 
            onSelect={(piece) => handleColorSelect(piece === 'X')} 
          />
        ) : (
          <>
            <div className={`text-xl font-bold mb-4 p-2 rounded ${
              winner 
                ? 'bg-green-100 text-green-800' 
                : isBlackNext === playerIsBlack 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
            }`}>
              {status}
            </div>
            <div className="overflow-x-auto">
              <Board 
                size={BOARD_SIZE} 
                squares={squares} 
                onSquareClick={handleClick}
                lastMove={lastMove} 
              />
            </div>
            <div className="flex gap-4 mt-4 justify-center">
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                重新开始
              </button>
              <button
                onClick={handleExportGameRecord}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                style={{ border: '2px solid red' }} // 添加红色边框以确认按钮是否存在
              >
                导出棋谱
              </button>
            </div>
          </>
        )}
      </div>
      <div className="flex-1 max-w-md space-y-4 w-full">
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
        <div className="panel-card">
          <h3 className="text-lg font-bold mb-3">游戏设置</h3>
          <div className="space-y-2">
            {/* 显示提示开关 */}
            <div className="flex items-center justify-between">
              <span>显示提示</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showHints} 
                  onChange={() => setShowHints(!showHints)} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {/* 声音开关 */}
            <div className="flex items-center justify-between">
              <span>声音效果</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={soundEnabled} 
                  onChange={() => setSoundEnabled(!soundEnabled)} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {/* 添加难度选择 */}
            <div className="mt-4">
              <span className="block mb-2">难度设置</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDifficultyChange('easy')}
                  className={`px-3 py-1 rounded ${
                    difficulty === 'easy' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  简单
                </button>
                <button
                  onClick={() => handleDifficultyChange('medium')}
                  className={`px-3 py-1 rounded ${
                    difficulty === 'medium' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  中等
                </button>
                <button
                  onClick={() => handleDifficultyChange('hard')}
                  className={`px-3 py-1 rounded ${
                    difficulty === 'hard' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  困难
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 计算获胜者的函数
function calculateWinner(squares: (string | null)[]) {
  // 实现五子棋的获胜逻辑
  const lines = [];
  const size = Math.sqrt(squares.length);
  
  // 检查所有可能的五子连线
  // 横向
  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - 5; col++) {
      const line = [];
      for (let i = 0; i < 5; i++) {
        line.push(row * size + col + i);
      }
      lines.push(line);
    }
  }
  
  // 纵向
  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - 5; row++) {
      const line = [];
      for (let i = 0; i < 5; i++) {
        line.push((row + i) * size + col);
      }
      lines.push(line);
    }
  }
  
  // 右下斜
  for (let row = 0; row <= size - 5; row++) {
    for (let col = 0; col <= size - 5; col++) {
      const line = [];
      for (let i = 0; i < 5; i++) {
        line.push((row + i) * size + col + i);
      }
      lines.push(line);
    }
  }
  
  // 左下斜
  for (let row = 0; row <= size - 5; row++) {
    for (let col = 4; col < size; col++) {
      const line = [];
      for (let i = 0; i < 5; i++) {
        line.push((row + i) * size + col - i);
      }
      lines.push(line);
    }
  }
  
  // 检查是否有一方获胜
  for (const line of lines) {
    const [a, b, c, d, e] = line;
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c] &&
      squares[a] === squares[d] &&
      squares[a] === squares[e]
    ) {
      return squares[a];
    }
  }
  
  return null;
}