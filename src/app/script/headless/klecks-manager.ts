import { KlCanvas } from '../klecks/canvas/kl-canvas';
import { KlHistory } from '../klecks/history/kl-history';
import { IKlProject, IRGB } from '../klecks/kl-types';
import { TextManager } from './managers/text-manager';
import { BrushManager } from './managers/brush-manager';
import { LayerManager } from './managers/layer-manager';
import { FilterManager, ShapeManager, GradientManager, ToolManager, ProjectManager } from './managers/stub-managers';
import { BB } from '../bb/bb';
import { projectToComposed } from '../klecks/history/push-helpers/project-to-composed';
import { LANG } from '../language/language';
import { ERASE_COLOR } from '../klecks/brushes/erase-color';

export interface IKlecksManagerOptions {
    project?: IKlProject;
    width?: number;
    height?: number;
    onUpdate?: () => void;
}

/**
 * Main headless manager for Klecks functionality.
 * Provides access to all features through managers while only rendering the canvas.
 */
export class KlecksManager {
    private readonly klCanvas: KlCanvas;
    private readonly klHistory: KlHistory;
    private readonly canvasEl: HTMLElement;
    
    // Managers for all functionality
    public readonly text: TextManager;
    public readonly brush: BrushManager;
    public readonly layers: LayerManager;
    public readonly filters: FilterManager;
    public readonly shapes: ShapeManager;
    public readonly gradients: GradientManager;
    public readonly tools: ToolManager;
    public readonly project: ProjectManager;

    private currentTool: string = 'brush';
    private primaryColor: IRGB = { r: 0, g: 0, b: 0 };
    private secondaryColor: IRGB = { r: 255, g: 255, b: 255 };
    
    // Input handling state
    private isMouseDown: boolean = false;
    private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
    private gradientStartPos: { x: number; y: number } | null = null;
    
    constructor(options: IKlecksManagerOptions = {}) {
        const width = options.width || 800;
        const height = options.height || 600;
        
        // Create default project if not provided
        const project = options.project || {
            width,
            height,
            layers: [{
                name: LANG('layers-layer') + ' 1',
                opacity: 1,
                isVisible: true,
                mixModeStr: 'source-over' as const,
                image: {
                    fill: BB.ColorConverter.toRgbStr({
                        r: ERASE_COLOR,
                        g: ERASE_COLOR,
                        b: ERASE_COLOR,
                    }),
                },
            }],
        };
        
        // Initialize history with proper oldest parameter
        this.klHistory = new KlHistory({
            oldest: projectToComposed(project),
        });
        
        // Initialize canvas with history
        this.klCanvas = new KlCanvas(this.klHistory);
        
        // Create canvas element - just a container div for now
        this.canvasEl = BB.el({
            css: {
                display: 'block',
                position: 'relative'
            }
        });
        
        // Initialize all managers
        this.text = new TextManager(this.klCanvas, this.klHistory, this);
        this.brush = new BrushManager(this.klCanvas, this.klHistory, this);
        this.layers = new LayerManager(this.klCanvas, this.klHistory, this);
        this.filters = new FilterManager(this.klCanvas, this.klHistory, this);
        this.shapes = new ShapeManager(this.klCanvas, this.klHistory, this);
        this.gradients = new GradientManager(this.klCanvas, this.klHistory, this);
        this.tools = new ToolManager(this);
        this.project = new ProjectManager(this.klCanvas, this.klHistory, this);
        
        // Set up update callbacks
        if (options.onUpdate) {
            this.klHistory.addListener(options.onUpdate);
        }
    }
    
    /**
     * Get the canvas DOM element for rendering
     */
    getCanvasElement(): HTMLElement {
        this.updateCanvasDisplay();
        return this.canvasEl;
    }
    
    /**
     * Update the display canvas with current layers
     */
    updateCanvasDisplay(): void {
        // Create or get the display canvas
        let displayCanvas = this.canvasEl.querySelector('canvas') as HTMLCanvasElement;
        if (!displayCanvas) {
            displayCanvas = BB.canvas(this.klCanvas.getWidth(), this.klCanvas.getHeight());
            displayCanvas.style.border = '2px solid #ccc';
            displayCanvas.style.background = 'white';
            displayCanvas.style.maxWidth = '100%';
            displayCanvas.style.maxHeight = '100%';
            displayCanvas.style.cursor = 'crosshair';
            displayCanvas.tabIndex = 0; // Make focusable for keyboard events
            this.canvasEl.appendChild(displayCanvas);
            
            // Setup input event listeners
            this.setupCanvasEventListeners(displayCanvas);
        }
        
        // Update canvas size if needed
        if (displayCanvas.width !== this.klCanvas.getWidth() || displayCanvas.height !== this.klCanvas.getHeight()) {
            displayCanvas.width = this.klCanvas.getWidth();
            displayCanvas.height = this.klCanvas.getHeight();
        }
        
        // Render all layers to display canvas
        const ctx = BB.ctx(displayCanvas);
        ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        
        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);
        
        // Draw all visible layers in order
        const layers = this.klCanvas.getLayers();
        for (const layer of layers) {
            if (layer.isVisible && layer.opacity > 0) {
                ctx.save();
                ctx.globalAlpha = layer.opacity;
                ctx.globalCompositeOperation = layer.mixModeStr;
                ctx.drawImage(layer.canvas, 0, 0);
                ctx.restore();
            }
        }
    }
    
    /**
     * Get the underlying KlCanvas instance
     */
    getKlCanvas(): KlCanvas {
        return this.klCanvas;
    }
    
    /**
     * Get the history instance
     */
    getHistory(): KlHistory {
        return this.klHistory;
    }
    
    /**
     * Set the current primary color
     */
    setPrimaryColor(color: IRGB): void {
        this.primaryColor = color;
        this.brush.setColor(color);
    }
    
    /**
     * Get the current primary color
     */
    getPrimaryColor(): IRGB {
        return { ...this.primaryColor };
    }
    
    /**
     * Set the current secondary color
     */
    setSecondaryColor(color: IRGB): void {
        this.secondaryColor = color;
    }
    
    /**
     * Get the current secondary color
     */
    getSecondaryColor(): IRGB {
        return { ...this.secondaryColor };
    }
    
    /**
     * Set the current tool
     */
    setCurrentTool(tool: string): void {
        this.currentTool = tool;
        this.tools.setActiveTool(tool);
        this.updateCursor();
        
        // Configure brush settings based on tool
        if (tool === 'pencil') {
            // Configure for hard-edged, precise drawing
            this.brush.setBrushType('pencil');
            this.brush.setHardness(100); // Full hardness for pencil
            this.brush.setFlow(1); // Full flow
            this.brush.setBrushShape('circle');
        } else if (tool === 'brush') {
            // Configure for soft, blendable drawing
            this.brush.setBrushType('brush');
            this.brush.setHardness(50); // Medium hardness for brush
            this.brush.setFlow(0.8); // Slightly reduced flow for blending
            this.brush.setBrushShape('circle');
        }
    }
    
    /**
     * Update cursor based on current tool
     */
    private updateCursor(): void {
        const canvas = this.canvasEl.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return;
        
        switch (this.currentTool) {
            case 'brush':
                canvas.style.cursor = 'crosshair';
                break;
            case 'fill':
                canvas.style.cursor = 'crosshair'; // TODO: Use fill cursor
                break;
            case 'hand':
                canvas.style.cursor = 'grab';
                break;
            case 'select':
                canvas.style.cursor = 'crosshair';
                break;
            default:
                canvas.style.cursor = 'default';
        }
    }
    
    /**
     * Get the current tool
     */
    getCurrentTool(): string {
        return this.currentTool;
    }
    
    /**
     * Resize the canvas
     */
    resize(width: number, height: number): void {
        this.klCanvas.resize(width, height);
    }
    
    /**
     * Clear the entire canvas
     */
    clear(): void {
        this.layers.clearLayer(0);
    }
    
    /**
     * Undo the last action
     */
    undo(): boolean {
        return this.klHistory.decreaseIndex() !== null;
    }
    
    /**
     * Redo the last undone action
     */
    redo(): boolean {
        return this.klHistory.increaseIndex() !== null;
    }
    
    /**
     * Check if undo is available
     */
    canUndo(): boolean {
        return this.klHistory.canUndo();
    }
    
    /**
     * Check if redo is available
     */
    canRedo(): boolean {
        return this.klHistory.canRedo();
    }
    
    /**
     * Setup event listeners for canvas input
     */
    private setupCanvasEventListeners(canvas: HTMLCanvasElement): void {
        // Mouse events
        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Keyboard events
        canvas.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Prevent context menu
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Get mouse position relative to canvas
     */
    private getCanvasMousePos(event: MouseEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }
    
    /**
     * Handle mouse down events
     */
    private handleMouseDown(event: MouseEvent): void {
        event.preventDefault();
        const canvas = event.target as HTMLCanvasElement;
        const pos = this.getCanvasMousePos(event, canvas);
        
        this.isMouseDown = true;
        this.lastMousePos = pos;
        
        // Handle tool-specific behavior
        if (this.currentTool === 'brush') {
            this.brush.startStroke(pos.x, pos.y, 1);
        } else if (this.currentTool === 'pencil') {
            this.brush.startStroke(pos.x, pos.y, 1);
        } else if (this.currentTool === 'fill') {
            this.performFill(pos.x, pos.y);
        } else if (this.currentTool === 'gradient') {
            this.gradientStartPos = pos;
        }
        // TODO: Add other tools (select, etc.)
    }
    
    /**
     * Handle mouse move events
     */
    private handleMouseMove(event: MouseEvent): void {
        event.preventDefault();
        const canvas = event.target as HTMLCanvasElement;
        const pos = this.getCanvasMousePos(event, canvas);
        
        if (this.isMouseDown) {
            // Handle tool-specific behavior
            if (this.currentTool === 'brush') {
                this.brush.addToStroke(pos.x, pos.y, 1);
            } else if (this.currentTool === 'pencil') {
                this.brush.addToStroke(pos.x, pos.y, 1);
            } else if (this.currentTool === 'gradient') {
                // Show gradient preview while dragging (optional)
            }
            // TODO: Add other tools
        }
        
        this.lastMousePos = pos;
    }
    
    /**
     * Handle mouse up events
     */
    private handleMouseUp(event: MouseEvent): void {
        event.preventDefault();
        
        if (this.isMouseDown) {
            // Handle tool-specific behavior
            if (this.currentTool === 'brush') {
                this.brush.endStroke();
            } else if (this.currentTool === 'gradient' && this.gradientStartPos) {
                const canvas = event.target as HTMLCanvasElement;
                const endPos = this.getCanvasMousePos(event, canvas);
                this.performGradientFill(this.gradientStartPos, endPos);
                this.gradientStartPos = null;
            }
            // TODO: Add other tools
        }
        
        this.isMouseDown = false;
    }
    
    /**
     * Handle mouse leave events
     */
    private handleMouseLeave(event: MouseEvent): void {
        this.handleMouseUp(event);
    }
    
    /**
     * Handle touch start events
     */
    private handleTouchStart(event: TouchEvent): void {
        event.preventDefault();
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const canvas = event.target as HTMLCanvasElement;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const pos = {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY
            };
            
            this.isMouseDown = true;
            this.lastMousePos = pos;
            
            // Handle tool-specific behavior
            if (this.currentTool === 'brush') {
                this.brush.startStroke(pos.x, pos.y, touch.force || 1);
            } else if (this.currentTool === 'pencil') {
                this.brush.startStroke(pos.x, pos.y, touch.force || 1);
            }
        }
    }
    
    /**
     * Handle touch move events
     */
    private handleTouchMove(event: TouchEvent): void {
        event.preventDefault();
        if (event.touches.length > 0 && this.isMouseDown) {
            const touch = event.touches[0];
            const canvas = event.target as HTMLCanvasElement;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const pos = {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY
            };
            
            // Handle tool-specific behavior
            if (this.currentTool === 'brush') {
                this.brush.addToStroke(pos.x, pos.y, touch.force || 1);
            }
            
            this.lastMousePos = pos;
        }
    }
    
    /**
     * Handle touch end events
     */
    private handleTouchEnd(event: TouchEvent): void {
        event.preventDefault();
        
        if (this.isMouseDown) {
            // Handle tool-specific behavior
            if (this.currentTool === 'brush') {
                this.brush.endStroke();
            }
        }
        
        this.isMouseDown = false;
    }
    
    /**
     * Handle keyboard events
     */
    private handleKeyDown(event: KeyboardEvent): void {
        // Keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key.toLowerCase()) {
                case 'z':
                    if (event.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    event.preventDefault();
                    break;
                case 'y':
                    this.redo();
                    event.preventDefault();
                    break;
            }
        } else {
            // Tool shortcuts
            switch (event.key.toLowerCase()) {
                case 'b':
                    this.setCurrentTool('brush');
                    event.preventDefault();
                    break;
                case 'f':
                    this.setCurrentTool('fill');
                    event.preventDefault();
                    break;
                case '[':
                    this.brush.decreaseSize();
                    event.preventDefault();
                    break;
                case ']':
                    this.brush.increaseSize();
                    event.preventDefault();
                    break;
            }
        }
    }
    
    private fillTolerance: number = 0; // Color tolerance for fill (0-255)
    private gradientFillSettings = {
        type: 'linear' as 'linear' | 'radial',
        startColor: { r: 0, g: 0, b: 0 },
        endColor: { r: 255, g: 255, b: 255 },
        opacity: 1,
        blendMode: 'source-over' as GlobalCompositeOperation
    };
    
    // Gradient presets for quick access
    private gradientPresets = {
        'black-white': { start: { r: 0, g: 0, b: 0 }, end: { r: 255, g: 255, b: 255 } },
        'white-black': { start: { r: 255, g: 255, b: 255 }, end: { r: 0, g: 0, b: 0 } },
        'red-blue': { start: { r: 255, g: 0, b: 0 }, end: { r: 0, g: 0, b: 255 } },
        'blue-red': { start: { r: 0, g: 0, b: 255 }, end: { r: 255, g: 0, b: 0 } },
        'rainbow': { start: { r: 255, g: 0, b: 0 }, end: { r: 128, g: 0, b: 128 } },
        'sunset': { start: { r: 255, g: 165, b: 0 }, end: { r: 255, g: 69, b: 0 } },
        'ocean': { start: { r: 0, g: 191, b: 255 }, end: { r: 0, g: 100, b: 200 } },
        'forest': { start: { r: 34, g: 139, b: 34 }, end: { r: 0, g: 100, b: 0 } }
    };
    
    /**
     * Set the fill tolerance (similar to Photoshop's tolerance)
     */
    setFillTolerance(tolerance: number): void {
        this.fillTolerance = Math.max(0, Math.min(255, tolerance));
    }
    
    /**
     * Get the current fill tolerance
     */
    getFillTolerance(): number {
        return this.fillTolerance;
    }
    
    /**
     * Get available gradient presets
     */
    getGradientPresets(): string[] {
        return Object.keys(this.gradientPresets);
    }
    
    /**
     * Apply a gradient preset by name
     */
    applyGradientPreset(presetName: string, startPos: { x: number; y: number }, endPos: { x: number; y: number }): void {
        const preset = this.gradientPresets[presetName as keyof typeof this.gradientPresets];
        if (!preset) {
            console.warn(`Gradient preset '${presetName}' not found`);
            return;
        }
        
        // Temporarily set colors to preset values
        const originalPrimary = this.primaryColor;
        const originalSecondary = this.secondaryColor;
        
        this.setPrimaryColor(preset.start);
        this.setSecondaryColor(preset.end);
        
        // Apply the gradient
        this.performGradientFill(startPos, endPos);
        
        // Restore original colors
        this.setPrimaryColor(originalPrimary);
        this.setSecondaryColor(originalSecondary);
    }
    
    /**
     * Apply a gradient preset to the entire canvas
     */
    applyGradientPresetToCanvas(presetName: string, type: 'horizontal' | 'vertical' | 'diagonal' = 'horizontal'): void {
        const width = this.klCanvas.getWidth();
        const height = this.klCanvas.getHeight();
        
        let startPos: { x: number; y: number };
        let endPos: { x: number; y: number };
        
        switch (type) {
            case 'horizontal':
                startPos = { x: 0, y: height / 2 };
                endPos = { x: width, y: height / 2 };
                break;
            case 'vertical':
                startPos = { x: width / 2, y: 0 };
                endPos = { x: width / 2, y: height };
                break;
            case 'diagonal':
                startPos = { x: 0, y: 0 };
                endPos = { x: width, y: height };
                break;
        }
        
        this.applyGradientPreset(presetName, startPos, endPos);
    }
    
    /**
     * Check if two colors are similar within the tolerance threshold
     */
    private colorsWithinTolerance(color1: {r: number, g: number, b: number, a: number}, 
                                  color2: {r: number, g: number, b: number, a: number}): boolean {
        if (this.fillTolerance === 0) {
            return color1.r === color2.r && color1.g === color2.g && 
                   color1.b === color2.b && color1.a === color2.a;
        }
        
        // Calculate color distance using weighted RGB difference
        const rDiff = Math.abs(color1.r - color2.r);
        const gDiff = Math.abs(color1.g - color2.g);
        const bDiff = Math.abs(color1.b - color2.b);
        const aDiff = Math.abs(color1.a - color2.a);
        
        // Use weighted color distance (human eye is more sensitive to green)
        const distance = Math.sqrt(
            0.299 * (rDiff * rDiff) +
            0.587 * (gDiff * gDiff) +
            0.114 * (bDiff * bDiff) +
            0.1 * (aDiff * aDiff) // Alpha has less weight
        );
        
        return distance <= this.fillTolerance;
    }
    
    /**
     * Perform flood fill at the specified position with tolerance support
     */
    private performFill(x: number, y: number): void {
        const composed = this.klHistory.getComposed();
        const layers = this.klCanvas.getLayers();
        const activeLayer = layers.find(layer => layer.id === composed.activeLayerId);
        
        if (!activeLayer) {
            console.warn('No active layer found for fill operation');
            return;
        }
        
        const ctx = activeLayer.context;
        if (!ctx) return;
        
        const fillColor = this.primaryColor;
        const targetPixel = Math.floor(x) + Math.floor(y) * activeLayer.canvas.width;
        
        // Get the image data
        const imageData = ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
        const data = imageData.data;
        
        // Get the color at the target pixel
        const startIndex = targetPixel * 4;
        const targetColor = {
            r: data[startIndex],
            g: data[startIndex + 1],
            b: data[startIndex + 2],
            a: data[startIndex + 3]
        };
        
        const fillColorWithAlpha = {
            r: fillColor.r,
            g: fillColor.g,
            b: fillColor.b,
            a: 255
        };
        
        // Don't fill if the target color is the same as fill color (within tolerance)
        if (this.colorsWithinTolerance(targetColor, fillColorWithAlpha)) {
            return;
        }
        
        // Enhanced flood fill algorithm with tolerance
        const stack: { x: number; y: number }[] = [{ x: Math.floor(x), y: Math.floor(y) }];
        const visited = new Set<number>();
        
        while (stack.length > 0) {
            const { x: px, y: py } = stack.pop()!;
            
            // Check bounds
            if (px < 0 || px >= activeLayer.canvas.width || 
                py < 0 || py >= activeLayer.canvas.height) {
                continue;
            }
            
            const pixelIndex = px + py * activeLayer.canvas.width;
            if (visited.has(pixelIndex)) {
                continue;
            }
            
            const index = pixelIndex * 4;
            const currentColor = {
                r: data[index],
                g: data[index + 1],
                b: data[index + 2],
                a: data[index + 3]
            };
            
            // Check if pixel color matches target color within tolerance
            if (!this.colorsWithinTolerance(currentColor, targetColor)) {
                continue;
            }
            
            // Fill the pixel
            data[index] = fillColor.r;
            data[index + 1] = fillColor.g;
            data[index + 2] = fillColor.b;
            data[index + 3] = 255;
            
            visited.add(pixelIndex);
            
            // Add neighboring pixels to stack
            stack.push({ x: px + 1, y: py });
            stack.push({ x: px - 1, y: py });
            stack.push({ x: px, y: py + 1 });
            stack.push({ x: px, y: py - 1 });
        }
        
        // Apply the changes back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Update the display
        this.updateCanvasDisplay();
    }
    
    /**
     * Perform gradient fill between two points
     */
    private performGradientFill(startPos: { x: number; y: number }, endPos: { x: number; y: number }): void {
        const composed = this.klHistory.getComposed();
        const layers = this.klCanvas.getLayers();
        const activeLayer = layers.find(layer => layer.id === composed.activeLayerId);
        
        if (!activeLayer) {
            console.warn('No active layer found for gradient operation');
            return;
        }
        
        const ctx = activeLayer.context;
        if (!ctx) return;
        
        // Create linear gradient
        const gradient = ctx.createLinearGradient(startPos.x, startPos.y, endPos.x, endPos.y);
        
        // Use primary and secondary colors for the gradient
        const startColor = this.primaryColor;
        const endColor = this.secondaryColor;
        
        gradient.addColorStop(0, `rgb(${startColor.r}, ${startColor.g}, ${startColor.b})`);
        gradient.addColorStop(1, `rgb(${endColor.r}, ${endColor.g}, ${endColor.b})`);
        
        // Fill the entire layer with the gradient
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = this.gradientFillSettings.blendMode;
        ctx.globalAlpha = this.gradientFillSettings.opacity;
        ctx.fillRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
        ctx.restore();
        
        // Update the display
        this.updateCanvasDisplay();
    }
    
    /**
     * Destroy the manager and clean up resources
     */
    destroy(): void {
        this.text.destroy();
        this.brush.destroy();
        this.layers.destroy();
        this.filters.destroy();
        this.shapes.destroy();
        this.gradients.destroy();
        this.tools.destroy();
        this.project.destroy();
        
        this.klCanvas.destroy();
        // Canvas element cleanup - remove from DOM if attached
        if (this.canvasEl.parentNode) {
            this.canvasEl.parentNode.removeChild(this.canvasEl);
        }
    }
}
