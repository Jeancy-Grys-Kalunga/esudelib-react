import { useCallback, useState } from 'react';

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.2;

interface UseZoomReturn {
    scale: number;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    setScale: (scale: number) => void;
}

export function useZoom(initialScale: number = 1): UseZoomReturn {
    const [scale, setScaleState] = useState(initialScale);

    const setScale = useCallback((newScale: number) => {
        const clampedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
        setScaleState(clampedScale);
    }, []);

    const zoomIn = useCallback(() => {
        setScale(scale + SCALE_STEP);
    }, [scale, setScale]);

    const zoomOut = useCallback(() => {
        setScale(scale - SCALE_STEP);
    }, [scale, setScale]);

    const resetZoom = useCallback(() => {
        setScale(1);
    }, [setScale]);

    return {
        scale,
        zoomIn,
        zoomOut,
        resetZoom,
        setScale,
    };
}
