'use client';

import React, { useState, useEffect } from 'react';
import Board from '../components/Board';
import PlayerSelectionModal from '../components/PlayerSelectionModal';

export default function Game() {
  const [history, setHistory] = useState([Array(225).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [isPlayerX, setIsPlayerX] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(true);
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
  const size = 15; // 15x15 棋盘
  
  // AI落子逻辑 - 默认开启AI模式
  useEffect(() => {
    if (isPlayerX !== xIsNext && !winner && !isAIThinking && isPlayerX !== null) {
      setIsAIThinking(true);
      
      // 模拟AI思考时间
      const timeoutId = setTimeout(() => {
        makeAIMove();
        setIsAIThinking(false);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentMove, isPlayerX, xIsNext]);
  
  // 评估棋盘状态函数
  function evaluateBoard(squares: (string | null)[], player: string) {
    const opponent = player === 'X' ? 'O' : 'X';
    let score = 0;
    
    // 检查所有可能的五子连线
    const lines = getAllLines();
    
    for (const line of lines) {
      const lineSquares = line.map(i => squares[i]);
      
      // 计算该线上的棋子数量
      const playerCount = lineSquares.filter(s => s === player).length;
      const opponentCount = lineSquares.filter(s => s === opponent).length;
      const emptyCount = lineSquares.filter(s => s === null).length;
      
      // 根据棋子分布评分
      if (opponentCount === 0) { // 只有己方棋子的情况
        if (playerCount === 5) score += 100000; // 五连
        else if (playerCount === 4) score += 10000; // 四连
        else if (playerCount === 3) score += 1000; // 三连
        else if (playerCount === 2) score += 100; // 二连
        else if (playerCount === 1) score += 10; // 单子
      }
      
      if (playerCount === 0) { // 只有对方棋子的情况
        if (opponentCount === 4) score -= 5000; // 阻止对方四连
        else if (opponentCount === 3) score -= 500; // 阻止对方三连
      }
    }
    
    return score;
  }
  
  // 获取所有可能的五子连线
  function getAllLines() {
    const lines = [];
    
    // 水平线
    for (let row = 0; row < size; row++) {
      for (let col = 0; col <= size - 5; col++) {
        lines.push([
          row * size + col,
          row * size + col + 1,
          row * size + col + 2,
          row * size + col + 3,
          row * size + col + 4
        ]);
      }
    }
    
    // 垂直线
    for (let col = 0; col < size; col++) {
      for (let row = 0; row <= size - 5; row++) {
        lines.push([
          row * size + col,
          (row + 1) * size + col,
          (row + 2) * size + col,
          (row + 3) * size + col,
          (row + 4) * size + col
        ]);
      }
    }
    
    // 对角线 (左上到右下)
    for (let row = 0; row <= size - 5; row++) {
      for (let col = 0; col <= size - 5; col++) {
        lines.push([
          row * size + col,
          (row + 1) * size + col + 1,
          (row + 2) * size + col + 2,
          (row + 3) * size + col + 3,
          (row + 4) * size + col + 4
        ]);
      }
    }
    
    // 对角线 (右上到左下)
    for (let row = 0; row <= size - 5; row++) {
      for (let col = size - 1; col >= 4; col--) {
        lines.push([
          row * size + col,
          (row + 1) * size + col - 1,
          (row + 2) * size + col - 2,
          (row + 3) * size + col - 3,
          (row + 4) * size + col - 4
        ]);
      }
    }
    
    return lines;
  }
  
  // 寻找最佳落子位置
  function findBestMove(squares: (string | null)[]) {
    const player = xIsNext ? 'X' : 'O';
    let bestScore = -Infinity;
    let bestMove = -1;
    
    // 获取所有空位置
    const emptySquares = squares.map((square, index) => 
      square === null ? index : null
    ).filter(index => index !== null) as number[];
    
    // 如果是第一步，优先选择天元
    if (emptySquares.length === 225) {
      const center = Math.floor(size / 2) * size + Math.floor(size / 2);
      return center;
    }
    
    // 只考虑已有棋子周围的空位
    const candidateMoves = new Set<number>();
    
    for (let i = 0; i < squares.length; i++) {
      if (squares[i] !== null) {
        const row = Math.floor(i / size);
        const col = i % size;
        
        // 检查周围8个方向的空位
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
              const newIndex = newRow * size + newCol;
              if (squares[newIndex] === null) {
                candidateMoves.add(newIndex);
              }
            }
          }
        }
      }
    }
    
    // 如果没有候选位置，则考虑所有空位
    const movesToEvaluate = candidateMoves.size > 0 
      ? Array.from(candidateMoves) 
      : emptySquares;
    
    // 评估每个候选位置
    for (const move of movesToEvaluate) {
      // 模拟落子
      squares[move] = player;
      
      // 评估落子后的局面
      const score = evaluateBoard(squares, player);
      
      // 恢复棋盘
      squares[move] = null;
      
      // 更新最佳落子
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
  
  function makeAIMove() {
    const nextSquares = currentSquares.slice();
    const bestMove = findBestMove(nextSquares);
    
    if (bestMove !== -1) {
      nextSquares[bestMove] = xIsNext ? 'X' : 'O';
      handlePlay(nextSquares);
    }
  }
  
  function handlePlay(nextSquares: (string | null)[]) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }
  
  function handleSquareClick(i: number) {
    if (calculateWinner(currentSquares) || currentSquares[i] || 
        isPlayerX !== xIsNext || isAIThinking) {
      return;
    }
    
    const nextSquares = currentSquares.slice();
    nextSquares[i] = xIsNext ? 'X' : 'O';
    handlePlay(nextSquares);
  }
  
  function handlePlayerSelection(piece: 'X' | 'O') {
    setIsPlayerX(piece === 'X');
    setShowModal(false);
  }
  
  // 修改悔棋功能，回退2步（玩家和AI各一步）
  function undoMove() {
    // 确保至少有2步可以回退，否则回退到游戏开始
    if (currentMove >= 2) {
      setCurrentMove(currentMove - 2);
    } else if (currentMove === 1) {
      // 如果只有1步，则回退到游戏开始
      setCurrentMove(0);
    }
    // 如果currentMove为0，则不执行任何操作
  }
  
  function restartGame() {
    setHistory([Array(225).fill(null)]);
    setCurrentMove(0);
    setShowModal(true);
  }
  
  const winner = calculateWinner(currentSquares);
  let status;
  if (winner) {
    status = `获胜者: ${winner === 'X' ? '黑棋' : '白棋'}`;
  } else if (currentMove === 225) {
    status = '平局!';
  } else {
    status = `下一步: ${xIsNext ? '黑棋' : '白棋'}${isPlayerX !== xIsNext ? ' (AI思考中...)' : ''}`;
  }
  
  // 删除原有的moves变量和相关代码
  
  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-4">五子棋</h1>
      
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="flex flex-col items-center">
          <div className="mb-4 text-xl">{status}</div>
          <Board 
            size={size} 
            squares={currentSquares} 
            onSquareClick={handleSquareClick} 
          />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md min-w-[250px]">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">游戏控制</h2>
              <div className="flex gap-2 mb-4">
                <button 
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  onClick={restartGame}
                >
                  重新开始
                </button>
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  onClick={undoMove}
                  disabled={currentMove <= 0 || isAIThinking}
                >
                  悔棋
                </button>
              </div>
            </div>
            
            {isPlayerX !== null && (
              <div>
                <h2 className="text-lg font-semibold mb-2">您的棋子</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${isPlayerX ? 'bg-black' : 'bg-white border border-black'}`}></div>
                  <span>{isPlayerX ? '黑棋' : '白棋'}</span>
                </div>
              </div>
            )}
            
            <div>
              <h2 className="text-lg font-semibold mb-2">当前步数</h2>
              <div>第 {currentMove} 步</div>
            </div>
          </div>
        </div>
      </div>
      
      <PlayerSelectionModal 
        isOpen={showModal} 
        onSelect={handlePlayerSelection} 
      />
    </div>
  );
}

// 计算获胜者的函数
function calculateWinner(squares: (string | null)[]) {
  const size = 15;
  const lines = [];
  
  // 检查水平线
  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - 5; col++) {
      lines.push([
        row * size + col,
        row * size + col + 1,
        row * size + col + 2,
        row * size + col + 3,
        row * size + col + 4
      ]);
    }
  }
  
  // 检查垂直线
  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - 5; row++) {
      lines.push([
        row * size + col,
        (row + 1) * size + col,
        (row + 2) * size + col,
        (row + 3) * size + col,
        (row + 4) * size + col
      ]);
    }
  }
  
  // 检查对角线 (左上到右下)
  for (let row = 0; row <= size - 5; row++) {
    for (let col = 0; col <= size - 5; col++) {
      lines.push([
        row * size + col,
        (row + 1) * size + col + 1,
        (row + 2) * size + col + 2,
        (row + 3) * size + col + 3,
        (row + 4) * size + col + 4
      ]);
    }
  }
  
  // 检查对角线 (右上到左下)
  for (let row = 0; row <= size - 5; row++) {
    for (let col = size - 1; col >= 4; col--) {
      lines.push([
        row * size + col,
        (row + 1) * size + col - 1,
        (row + 2) * size + col - 2,
        (row + 3) * size + col - 3,
        (row + 4) * size + col - 4
      ]);
    }
  }
  
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
