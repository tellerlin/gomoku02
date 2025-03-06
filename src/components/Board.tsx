'use client';

import React from 'react';

interface BoardProps {
  size: number;
  squares: (string | null)[];
  onSquareClick: (index: number) => void;
  lastMove?: number | null;
}

export default function Board({ size, squares, onSquareClick, lastMove }: BoardProps) {
  // 判断是否是星位
  const isStarPoint = (row: number, col: number) => {
    // 定义星位的位置（按照标准围棋棋盘的星位）
    const starPoints = [
      [3, 3], [3, size-4], [size-4, 3], [size-4, size-4], // 四角星
      [3, Math.floor(size/2)], [size-4, Math.floor(size/2)], // 边星
      [Math.floor(size/2), 3], [Math.floor(size/2), size-4], // 边星
      [Math.floor(size/2), Math.floor(size/2)] // 天元
    ];
    return starPoints.some(([r, c]) => r === row && c === col);
  };

  // 渲染整个棋盘
  return (
    <div className="inline-block bg-board-bg p-8 rounded-lg shadow-lg">
      <div 
        className="relative" 
        style={{
          width: `${30 * (size - 1)}px`, // 确保棋盘尺寸正确
          height: `${30 * (size - 1)}px`,
          backgroundColor: '#DEB887'
        }}
      >
        {/* 绘制横线 */}
        {Array(size).fill(null).map((_, i) => (
          <div 
            key={`h-${i}`} 
            className="absolute bg-board-lines" 
            style={{
              left: 0,
              top: `${i * 30}px`,
              width: '100%',
              height: '1px'
            }}
          />
        ))}

        {/* 绘制竖线 */}
        {Array(size).fill(null).map((_, i) => (
          <div 
            key={`v-${i}`} 
            className="absolute bg-board-lines" 
            style={{
              top: 0,
              left: `${i * 30}px`,
              height: '100%',
              width: '1px'
            }}
          />
        ))}

        {/* 绘制星位 */}
        {Array(size).fill(null).map((_, row) => (
          Array(size).fill(null).map((_, col) => (
            isStarPoint(row, col) && (
              <div 
                key={`star-${row}-${col}`}
                className="absolute bg-board-lines rounded-full z-10"
                style={{
                  width: '6px',
                  height: '6px',
                  left: `${col * 30}px`,
                  top: `${row * 30}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            )
          ))
        ))}

        {/* 绘制棋子和交互区域 */}
        {Array(size).fill(null).map((_, row) => (
          Array(size).fill(null).map((_, col) => {
            const index = row * size + col;
            return (
              <div
                key={`point-${row}-${col}`}
                className="absolute cursor-pointer group"
                style={{
                  width: '30px',
                  height: '30px',
                  left: `${col * 30}px`,
                  top: `${row * 30}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20
                }}
                onClick={() => !squares[index] && onSquareClick(index)}
              >
                {!squares[index] && (
                  <div
                    className={`absolute rounded-full opacity-0 group-hover:opacity-30 transition-opacity ${
                      squares.filter(Boolean).length % 2 === 0
                        ? 'bg-black-piece'
                        : 'bg-white-piece border border-gray-400'
                    }`}
                    style={{
                      width: '26px',
                      height: '26px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )}
                {index === lastMove && (
                  <div className="absolute w-full h-full bg-yellow-300 opacity-30 rounded-full" />
                )}
                
                {squares[index] && (
                  <div
                    className={`absolute rounded-full ${
                      squares[index] === 'X' 
                        ? 'bg-black-piece shadow-lg' // 增强阴影效果
                        : 'bg-white-piece border-2 border-gray-400'  // 增加边框宽度并调整颜色
                    }`}
                    style={{
                      width: '26px', // 增加棋子尺寸
                      height: '26px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      boxShadow: squares[index] === 'X' 
                        ? '2px 2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.2)' 
                        : '2px 2px 4px rgba(0,0,0,0.2), inset -2px -2px 4px rgba(0,0,0,0.1)' // 添加内外阴影效果
                    }}
                  />
                )}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}