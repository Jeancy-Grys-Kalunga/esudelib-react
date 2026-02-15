import React from 'react';

interface CircularProgressProps {
    value: number;
    size?: number;
    strokeWidth?: number;
    text?: string;
}

export function CircularProgress({ 
    value, 
    size = 100, 
    strokeWidth = 10,
    text 
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
            >
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0" // slate-200
                    strokeWidth={strokeWidth}
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#3b82f6" // blue-500
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-in-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-xl font-bold text-gray-700 dark:text-gray-200">
                    {Math.round(value)}%
                </span>
                {text && (
                    <span className="text-xs text-muted-foreground mt-1">
                        {text}
                    </span>
                )}
            </div>
        </div>
    );
}
