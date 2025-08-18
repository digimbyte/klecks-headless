import { CanvasApiBridge } from './canvas-api-bridge';

/**
 * Utility functions for responsive canvas integration
 */

export interface ResponsiveCanvasOptions {
    /** Container element to place canvas in */
    container: HTMLElement;
    /** Whether to auto-fit canvas to container on resize */
    autoFit?: boolean;
    /** CSS classes to add to container */
    containerClasses?: string[];
    /** Whether to watch for container resize events */
    watchResize?: boolean;
    /** Minimum scale factor (prevents canvas from becoming too small) */
    minScale?: number;
    /** Maximum scale factor (prevents canvas from becoming too large) */
    maxScale?: number;
}

/**
 * Sets up responsive canvas behavior within a container
 */
export function setupResponsiveCanvas(canvasApi: CanvasApiBridge, options: ResponsiveCanvasOptions): () => void {
    const { container, autoFit = true, containerClasses = [], watchResize = true, minScale = 0.1, maxScale = 2 } = options;

    // Add CSS classes to container
    containerClasses.forEach(className => {
        container.classList.add(className);
    });

    // Add default responsive container class if not present
    if (!container.classList.contains('klecks-canvas-container')) {
        container.classList.add('klecks-canvas-container');
    }

    // Insert canvas into container
    const canvasElement = canvasApi.getCanvasElement();
    container.appendChild(canvasElement);

    let resizeTimeout: number | undefined;

    // Auto-fit function with constraints
    function fitToContainer() {
        if (!autoFit) return;
        
        const containerRect = container.getBoundingClientRect();
        const { width: canvasWidth, height: canvasHeight } = canvasApi.getCanvasDimensions();
        
        if (containerRect.width <= 0 || containerRect.height <= 0) return;
        
        // Calculate scale to fit container while maintaining aspect ratio
        const scaleX = containerRect.width / canvasWidth;
        const scaleY = containerRect.height / canvasHeight;
        let scale = Math.min(scaleX, scaleY);
        
        // Apply constraints
        scale = Math.max(minScale, Math.min(maxScale, scale));
        
        canvasApi.setScale(scale);
    }

    // Resize observer for modern browsers
    let resizeObserver: ResizeObserver | undefined;
    
    if (watchResize && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
            // Debounce resize events
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = window.setTimeout(fitToContainer, 100);
        });
        resizeObserver.observe(container);
    } else if (watchResize) {
        // Fallback for older browsers
        window.addEventListener('resize', () => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = window.setTimeout(fitToContainer, 100);
        });
    }

    // Initial fit
    fitToContainer();

    // Return cleanup function
    return () => {
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        // Remove canvas from container
        if (canvasElement.parentNode === container) {
            container.removeChild(canvasElement);
        }
    };
}

/**
 * Creates a responsive canvas container with common presets
 */
export function createResponsiveCanvasContainer(preset: 'basic' | 'fullscreen' | 'sidebar' | 'card' | 'aspect-ratio'): HTMLElement {
    const container = document.createElement('div');
    
    switch (preset) {
        case 'basic':
            container.className = 'klecks-canvas-container';
            break;
        case 'fullscreen':
            container.className = 'klecks-canvas-container fullscreen';
            break;
        case 'sidebar':
            container.className = 'klecks-canvas-container sidebar-layout';
            break;
        case 'card':
            container.className = 'klecks-canvas-container card';
            break;
        case 'aspect-ratio':
            container.className = 'klecks-canvas-container aspect-ratio-16-9';
            break;
        default:
            container.className = 'klecks-canvas-container';
    }
    
    return container;
}

/**
 * Utility to make canvas fill its container while maintaining aspect ratio
 */
export function makeCanvasFillContainer(canvasApi: CanvasApiBridge, container: HTMLElement, options: {
    maintainAspectRatio?: boolean;
    centerCanvas?: boolean;
} = {}): void {
    const { maintainAspectRatio = true, centerCanvas = true } = options;
    
    // Set container styles
    container.style.display = 'flex';
    if (centerCanvas) {
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
    }
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.overflow = 'auto';

    const canvasElement = canvasApi.getCanvasElement();
    const canvas = canvasElement.querySelector('canvas') as HTMLCanvasElement;
    
    if (canvas) {
        if (maintainAspectRatio) {
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '100%';
            canvas.style.width = 'auto';
            canvas.style.height = 'auto';
        } else {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        }
    }
}

/**
 * Adds window resize listener that automatically adjusts canvas scale
 */
export function enableAutoScale(canvasApi: CanvasApiBridge, targetContainer: HTMLElement): () => void {
    function handleResize() {
        canvasApi.fitCanvasToContainer(targetContainer);
    }
    
    window.addEventListener('resize', handleResize);
    
    // Initial scale
    handleResize();
    
    // Return cleanup function
    return () => {
        window.removeEventListener('resize', handleResize);
    };
}

/**
 * Gets recommended container styles for different layout scenarios
 */
export function getRecommendedContainerStyles(scenario: 'dialog' | 'main-content' | 'sidebar' | 'mobile'): Partial<CSSStyleDeclaration> {
    switch (scenario) {
        case 'dialog':
            return {
                width: '80vw',
                height: '70vh',
                maxWidth: '1200px',
                maxHeight: '800px',
                minWidth: '400px',
                minHeight: '300px',
                margin: 'auto'
            };
        
        case 'main-content':
            return {
                width: '100%',
                height: 'calc(100vh - 100px)', // Account for header/footer
                minHeight: '400px'
            };
        
        case 'sidebar':
            return {
                width: 'calc(100vw - 320px)', // Account for sidebar
                height: '100vh',
                minWidth: '400px'
            };
        
        case 'mobile':
            return {
                width: '100vw',
                height: 'calc(100vh - 60px)', // Account for mobile header
                minHeight: '300px'
            };
        
        default:
            return {
                width: '100%',
                height: '100%'
            };
    }
}

/**
 * Example usage:
 * 
 * // Basic responsive setup
 * const container = document.getElementById('canvas-container');
 * const cleanup = setupResponsiveCanvas(canvasApi, {
 *     container: container,
 *     autoFit: true,
 *     containerClasses: ['card'],
 *     minScale: 0.2,
 *     maxScale: 3
 * });
 * 
 * // Create preset container
 * const container = createResponsiveCanvasContainer('card');
 * document.body.appendChild(container);
 * 
 * // Simple fill container
 * makeCanvasFillContainer(canvasApi, container);
 * 
 * // Enable auto-scaling
 * const cleanupAutoScale = enableAutoScale(canvasApi, container);
 * 
 * // Clean up when done
 * cleanup();
 * cleanupAutoScale();
 */
