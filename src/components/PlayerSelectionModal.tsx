'use client';

import React from 'react';

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onSelect: (piece: 'X' | 'O') => void;
}

export default function PlayerSelectionModal({ isOpen, onSelect }: PlayerSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center">选择您的棋子</h2>
        <div className="flex justify-around mb-4">
          <button
            className="flex flex-col items-center p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => onSelect('X')}
          >
            <div className="w-10 h-10 bg-black rounded-full mb-2"></div>
            <span>黑棋先行</span>
          </button>
          <button
            className="flex flex-col items-center p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => onSelect('O')}
          >
            <div className="w-10 h-10 bg-white rounded-full border-2 border-black mb-2"></div>
            <span>白棋后行</span>
          </button>
        </div>
      </div>
    </div>
  );
}