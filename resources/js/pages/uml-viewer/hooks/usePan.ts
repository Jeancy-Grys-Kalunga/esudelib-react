import { useCallback, useRef, useState } from 'react';

interface Position {
    x: number;
    y: number;
}

interface UsePanReturn {
    position: Position;
    isDragging: boolean;
    handleMouseDown: (e: React.MouseEvent) => void;
    resetPosition: () => void;
}

export function usePan(): UsePanReturn {
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPosRef = useRef<Position>({ x: 0, y: 0 });
    const initialPositionRef = useRef<Position>({ x: 0, y: 0 });

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            // Ignorer si c'est un clic droit
            if (e.button !== 0) return;

            setIsDragging(true);
            dragStartPosRef.current = { x: e.clientX, y: e.clientY };
            initialPositionRef.current = { ...position };

            const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - dragStartPosRef.current.x;
                const deltaY = moveEvent.clientY - dragStartPosRef.current.y;

                setPosition({
                    x: initialPositionRef.current.x + deltaX,
                    y: initialPositionRef.current.y + deltaY,
                });
            };

            const handleMouseUp = () => {
                setIsDragging(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        },
        [position],
    );

    const resetPosition = useCallback(() => {
        setPosition({ x: 0, y: 0 });
    }, []);

    return {
        position,
        isDragging,
        handleMouseDown,
        resetPosition,
    };
}
