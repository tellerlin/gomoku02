'use client';

import React, { useState } from 'react';

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onSelect: (piece: 'X' | 'O', difficulty: 'easy' | 'medium' | 'hard') => void;
}

export default function PlayerSelectionModal({ isOpen, onSelect }: PlayerSelectionModalProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4 text-center">选择您的棋子</h2>
        <div className="flex justify-around mb-6">
          <button
            className="flex flex-col items-center p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => onSelect('X', selectedDifficulty)}
          >
            <div className="w-10 h-10 bg-black rounded-full mb-2"></div>
            <span>黑棋先行</span>
          </button>
          <button
            className="flex flex-col items-center p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => onSelect('O', selectedDifficulty)}
          >
            <div className="w-10 h-10 bg-white rounded-full border-2 border-black mb-2"></div>
            <span>白棋后行</span>
          </button>
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium mb-2 text-center">选择难度</h3>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setSelectedDifficulty('easy')}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedDifficulty === 'easy' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              简单
            </button>
            <button
              onClick={() => setSelectedDifficulty('medium')}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedDifficulty === 'medium' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              中等
            </button>
            <button
              onClick={() => setSelectedDifficulty('hard')}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedDifficulty === 'hard' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              困难
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}