'use client';

import { useEffect, useState } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getStyles = () => {
    const baseStyles = "border-l-4 shadow-lg backdrop-blur-sm";
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50/90 border-green-400 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50/90 border-red-400 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50/90 border-yellow-400 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50/90 border-blue-400 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50/90 border-gray-400 text-gray-800`;
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isLeaving ? 'transform translate-x-full opacity-0' : 'transform translate-x-0 opacity-100'
    }`}>
      <div className={`flex items-center p-4 rounded-lg min-w-72 max-w-md ${getStyles()}`}>
        <div className="flex-shrink-0">
          <span className="text-lg mr-3">{getIcon()}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(() => {
              setIsVisible(false);
              onClose();
            }, 300);
          }}
          className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}