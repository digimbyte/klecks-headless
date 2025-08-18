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

    // Overlay states
    private showBrushPreview: boolean = false;
    private overlaySelectionPath: { x: number; y: number }[] | null = null;
    private overlayTextBounds: { x: number; y: number; w: number; h: number } | null = null;
    private antsOffset: number = 0;
    private overlayAnimHandle: number | null = null;

    // Vector stamps (SVG paths)
    private svgStamps: Map<string, { name: string; pathData: string; path: Path2D } > = new Map();

    // Snapping
    private brushSnapGridSize: number = 1; // pixels (1 = standard pixel grid)
    
    // Canvas scale state (zoom level)
    private canvasScale: number = 1;
    
    // Canvas pan offset state
    private canvasPanX: number = 0;
    private canvasPanY: number = 0;
    
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
        
        // Create canvas element - container div that expands for canvas
        this.canvasEl = BB.el({
            css: {
                display: 'inline-block',
                position: 'relative',
                minWidth: '200px',
                minHeight: '150px'
                // Remove width/height constraints to allow expansion
                // Remove overflow: auto to prevent cropping
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
            
            // Apply canvas styling - remove size constraints to prevent cropping
            displayCanvas.style.border = '2px solid #ccc';
            displayCanvas.style.background = 'white';
            displayCanvas.style.cursor = 'crosshair';
            displayCanvas.style.display = 'block';
            
            // Let canvas expand naturally, don't constrain size
            displayCanvas.style.width = 'auto';
            displayCanvas.style.height = 'auto';
            
            // Ensure canvas is focusable for keyboard events
            displayCanvas.tabIndex = 0;
            
            this.canvasEl.appendChild(displayCanvas);
            
            // Setup input event listeners
            this.setupCanvasEventListeners(displayCanvas);
        }
        
        // Update canvas size if needed
        if (displayCanvas.width !== this.klCanvas.getWidth() || displayCanvas.height !== this.klCanvas.getHeight()) {
            displayCanvas.width = this.klCanvas.getWidth();
            displayCanvas.height = this.klCanvas.getHeight();
        }
        
        // Apply both pan and scale to the canvas element
        displayCanvas.style.transform = `translate(${this.canvasPanX}px, ${this.canvasPanY}px) scale(${this.canvasScale})`;
        displayCanvas.style.transformOrigin = '0 0';
        
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

        // Draw overlays last
        this.drawOverlays(ctx);
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
        // Normalize tool aliases
        const normalized = tool === 'paintBucket' ? 'fill' : tool;
        switch (normalized) {
            case 'pen':
                // Pen tool - hard-edged, precise, like pencil but smoother
                this.brush.setBrushType('pen');
                this.brush.setHardness(90);
                this.brush.setFlow(1);
                this.brush.setBrushShape('circle');
                break;
            
            case 'brush':
                // Soft brush - default painting tool
                this.brush.setBrushType('brush');
                this.brush.setHardness(50);
                this.brush.setFlow(0.8);
                this.brush.setBrushShape('circle');
                break;
            
            case 'blend':
                // Blending brush - softer with lower flow for blending
                this.brush.setBrushType('brush');
                this.brush.setHardness(20);
                this.brush.setFlow(0.3);
                this.brush.setBrushShape('circle');
                break;
            
            case 'sketchy':
                // Sketchy brush - textured, artistic
                this.brush.setBrushType('brush');
                this.brush.setHardness(70);
                this.brush.setFlow(0.6);
                this.brush.setBrushShape('circle');
                // TODO: Add texture/noise effect
                break;
            
            case 'pixel':
            case 'pencil':
                // Pixel/Pencil tool - hard-edged, 1px precision
                this.brush.setBrushType('pencil');
                this.brush.setHardness(100);
                this.brush.setFlow(1);
                this.brush.setBrushShape('square'); // Square for pixel-perfect drawing
                this.brush.setSize(1); // Force 1px size for pixel tool
                break;
            
            case 'chemy':
                // Chemistry brush - special effects, mixing colors
                this.brush.setBrushType('brush');
                this.brush.setHardness(40);
                this.brush.setFlow(0.7);
                this.brush.setBrushShape('circle');
                // TODO: Add color mixing effects
                break;
            
            case 'smudge':
                // Smudge tool - moves existing colors around
                this.brush.setBrushType('smudge');
                this.brush.setHardness(30);
                this.brush.setFlow(0.8);
                this.brush.setBrushShape('circle');
                break;
            
            case 'eraser':
                // Eraser tool - removes paint
                this.brush.setBrushType('eraser');
                this.brush.setHardness(50);
                this.brush.setFlow(1);
                this.brush.setBrushShape('circle');
                break;
            
            default:
                // Default to brush for unknown tools
                this.brush.setBrushType('brush');
                this.brush.setHardness(50);
                this.brush.setFlow(0.8);
                this.brush.setBrushShape('circle');
                break;
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
     * Get mouse position relative to canvas accounting for pan and zoom transformations
     * Auto-detects the actual canvas position instead of relying on manual pan values
     */
    private getCanvasMousePos(event: MouseEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
        // Get the actual bounding rect of the transformed canvas
        const rect = canvas.getBoundingClientRect();
        
        // Get mouse position relative to the actual visible canvas bounds
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;
        
        // Since getBoundingClientRect() gives us the actual position after all transforms,
        // we need to account for the scale to get logical canvas coordinates
        // The rect already includes the pan offset, so we just need to undo the scale
        
        // Get the natural canvas dimensions
        const naturalWidth = canvas.width;
        const naturalHeight = canvas.height;
        
        // Get the actual rendered dimensions (after scale transform)
        const renderedWidth = rect.width;
        const renderedHeight = rect.height;
        
        // Calculate the actual scale factor from the rendered size
        const actualScaleX = renderedWidth / naturalWidth;
        const actualScaleY = renderedHeight / naturalHeight;
        
        // Convert screen coordinates to logical canvas coordinates
        const canvasX = screenX / actualScaleX;
        const canvasY = screenY / actualScaleY;
        
        return {
            x: canvasX,
            y: canvasY
        };
    }
    
    /**
     * Check if current tool is a brush-type tool that uses stroke input
     */
    private isBrushTool(): boolean {
        return ['pen', 'brush', 'blend', 'sketchy', 'pixel', 'pencil', 'chemy', 'smudge', 'eraser'].includes(this.currentTool);
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

        // Enable hover brush preview when brush tool selected
        if (this.isBrushTool() && !this.isMouseDown) {
            this.showBrushPreview = true;
            this.updateCanvasDisplay();
        }
        
        // Handle tool-specific behavior
        if (this.isBrushTool()) {
            // Snap to grid for pixel/pencil tools
            const isPixel = this.currentTool === 'pixel' || this.currentTool === 'pencil';
            const sx = isPixel ? Math.round(pos.x) : pos.x;
            const sy = isPixel ? Math.round(pos.y) : pos.y;

            // Show brush preview while mouse is down
            this.showBrushPreview = true;

            // All brush-type tools use the stroke system
            this.brush.startStroke(sx, sy, 1);
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
            if (this.isBrushTool()) {
                const isPixel = this.currentTool === 'pixel' || this.currentTool === 'pencil';
                const sx = isPixel ? this.snapToGrid(pos.x) : pos.x;
                const sy = isPixel ? this.snapToGrid(pos.y) : pos.y;
                // All brush-type tools use the stroke system
                this.brush.addToStroke(sx, sy, 1);
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
            if (this.isBrushTool()) {
                // All brush-type tools use the stroke system
                this.brush.endStroke();
                this.showBrushPreview = false;
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
     * Draw overlays (brush preview, selection marching ants, text bounds)
     */
    private drawOverlays(ctx: CanvasRenderingContext2D): void {
        // Brush preview
        if (this.showBrushPreview && this.isBrushTool()) {
            const size = this.brush.getSize ? (this.brush as any).getSize() : 10;
            const shape = (this.brush as any).getBrushShape ? (this.brush as any).getBrushShape() : 'circle';
            const x = this.isBrushTool() && (this.currentTool === 'pixel' || this.currentTool === 'pencil') ? this.snapToGrid(this.lastMousePos.x) : this.lastMousePos.x;
            const y = this.isBrushTool() && (this.currentTool === 'pixel' || this.currentTool === 'pencil') ? this.snapToGrid(this.lastMousePos.y) : this.lastMousePos.y;
            ctx.save();
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 2]);
            if (shape === 'square') {
                // Align to pixel grid with odd/even size handling for crisp preview
                const even = Math.round(size) % 2 === 0;
                const half = Math.floor(size / 2);
                const left = Math.round(x) - half;
                const top = Math.round(y) - half;
                const w = Math.round(size);
                const h = Math.round(size);
                // 0.5 offset for crisp 1px stroke
                ctx.strokeRect(left + 0.5, top + 0.5, w, h);
            } else {
                ctx.beginPath();
                ctx.arc(x + 0.5 * 0, y + 0.5 * 0, size / 2, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Selection marching ants
        if (this.overlaySelectionPath && this.overlaySelectionPath.length > 1) {
            this.antsOffset = (this.antsOffset + 1) % 12;
            ctx.save();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 6]);
            ctx.lineDashOffset = -this.antsOffset;
            ctx.beginPath();
            ctx.moveTo(this.overlaySelectionPath[0].x, this.overlaySelectionPath[0].y);
            for (let i = 1; i < this.overlaySelectionPath.length; i++) {
                ctx.lineTo(this.overlaySelectionPath[i].x, this.overlaySelectionPath[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            // White phase
            ctx.strokeStyle = '#fff';
            ctx.lineDashOffset = 6 - this.antsOffset;
            ctx.stroke();
            ctx.restore();
        }

        // Text bounds with 3x3 grid + handles
        if (this.overlayTextBounds) {
            const { x, y, w, h } = this.overlayTextBounds;
            ctx.save();
            ctx.strokeStyle = 'rgba(0,0,255,0.8)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 2]);
            ctx.strokeRect(x, y, w, h);
            // 3x3 grid
            ctx.setLineDash([]);
            ctx.strokeStyle = 'rgba(0,0,255,0.4)';
            ctx.beginPath();
            ctx.moveTo(x + w / 3, y); ctx.lineTo(x + w / 3, y + h);
            ctx.moveTo(x + (2 * w) / 3, y); ctx.lineTo(x + (2 * w) / 3, y + h);
            ctx.moveTo(x, y + h / 3); ctx.lineTo(x + w, y + h / 3);
            ctx.moveTo(x, y + (2 * h) / 3); ctx.lineTo(x + w, y + (2 * h) / 3);
            ctx.stroke();
            // Handles (8)
            const handle = (hx: number, hy: number) => { ctx.fillRect(hx - 3, hy - 3, 6, 6); };
            ctx.fillStyle = 'rgba(0,0,255,0.9)';
            handle(x, y); handle(x + w / 2, y); handle(x + w, y);
            handle(x, y + h / 2); handle(x + w, y + h / 2);
            handle(x, y + h); handle(x + w / 2, y + h); handle(x + w, y + h);
            ctx.restore();
        }
    }

    // Overlays API
    setSelectionPath(points: { x: number; y: number }[] | null): void {
        this.overlaySelectionPath = points && points.length ? points : null;
        this.ensureOverlayAnimation();
        this.updateCanvasDisplay();
    }

    setTextBoundsOverlay(rect: { x: number; y: number; w: number; h: number } | null): void {
        this.overlayTextBounds = rect || null;
        this.updateCanvasDisplay();
    }

    setBrushSnapGridSize(size: number): void {
        this.brushSnapGridSize = Math.max(1, Math.floor(size));
    }

    private snapToGrid(v: number): number {
        const g = this.brushSnapGridSize || 1;
        return Math.round(v / g) * g;
    }

    private ensureOverlayAnimation(): void {
        const needsAnim = !!(this.overlaySelectionPath && this.overlaySelectionPath.length > 1);
        if (needsAnim) {
            if (this.overlayAnimHandle == null) {
                const tick = () => {
                    // Advance ants and redraw
                    this.antsOffset = (this.antsOffset + 1) % 12;
                    this.updateCanvasDisplay();
                    this.overlayAnimHandle = requestAnimationFrame(tick);
                };
                this.overlayAnimHandle = requestAnimationFrame(tick);
            }
        } else {
            if (this.overlayAnimHandle != null) {
                cancelAnimationFrame(this.overlayAnimHandle);
                this.overlayAnimHandle = null;
            }
        }
    }

    // ============================
    // Vector Stamp (SVG Path) API
    // ============================

    registerSvgStamp(name: string, svgPathData: string): void {
        try {
            const path = new Path2D(svgPathData);
            this.svgStamps.set(name, { name, pathData: svgPathData, path });
        } catch (e) {
            console.warn('Invalid SVG path data for stamp', e);
        }
    }

    unregisterSvgStamp(name: string): void {
        this.svgStamps.delete(name);
    }

    listSvgStamps(): string[] {
        return Array.from(this.svgStamps.keys());
    }

    /**
     * Place a registered SVG stamp at x,y with options.
     * falloffPx controls edge feathering via alpha blur.
     */
    stampSvg(name: string, x: number, y: number, opts?: { scale?: number; rotation?: number; fill?: IRGB; opacity?: number; blendMode?: GlobalCompositeOperation; align?: 'center' | 'top-left'; falloffPx?: number }): void {
        const s = this.svgStamps.get(name);
        if (!s) { console.warn('SVG stamp not found:', name); return; }
        const composed = this.klHistory.getComposed();
        const layers = this.klCanvas.getLayers();
        const activeLayer = layers.find(layer => layer.id === composed.activeLayerId);
        if (!activeLayer) { console.warn('No active layer for stamp'); return; }
        const ctx = activeLayer.context; if (!ctx) return;

        const w = activeLayer.canvas.width; const h = activeLayer.canvas.height;
        const off = BB.canvas(w, h);
        const offCtx = BB.ctx(off);

        // Draw filled shape as alpha mask
        offCtx.save();
        offCtx.translate(x, y);
        const scale = opts?.scale ?? 1;
        if (opts?.rotation) offCtx.rotate((opts.rotation * Math.PI) / 180);
        if (scale !== 1) offCtx.scale(scale, scale);
        // Align: center vs top-left; for center, assume path is centered at (0,0) by authoring convention.
        // If top-left, users should include translation in their path or parameters; here we just honor translate(x,y).
        offCtx.fillStyle = 'rgba(255,255,255,1)';
        offCtx.fill(s.path);
        offCtx.restore();

        // Feather edges if falloffPx > 0 using simple separable box blur on alpha
        const falloff = Math.max(0, Math.floor(opts?.falloffPx ?? 0));
        if (falloff > 0) {
            const img = offCtx.getImageData(0, 0, w, h);
            this.blurAlpha(img, w, h, falloff);
            offCtx.putImageData(img, 0, 0);
        }

        // Tint the alpha mask with fill color
        const color = opts?.fill ?? this.primaryColor;
        const tint = offCtx.getImageData(0, 0, w, h);
        const d = tint.data;
        for (let i = 0; i < d.length; i += 4) {
            const a = d[i + 3] / 255;
            if (a === 0) continue;
            d[i] = color.r;
            d[i + 1] = color.g;
            d[i + 2] = color.b;
            // alpha preserved
        }
        offCtx.putImageData(tint, 0, 0);

        // Composite
        ctx.save();
        ctx.globalAlpha = opts?.opacity ?? 1;
        ctx.globalCompositeOperation = opts?.blendMode ?? 'source-over';
        ctx.drawImage(off, 0, 0);
        ctx.restore();

        this.updateCanvasDisplay();
    }

    /**
     * Separable box blur on alpha channel only.
     */
    private blurAlpha(img: ImageData, w: number, h: number, radius: number): void {
        const a = new Uint8ClampedArray(w * h);
        const src = img.data;
        for (let i = 0, p = 3; i < a.length; i++, p += 4) a[i] = src[p];

        const tmp = new Uint16Array(w * h);
        const div = radius * 2 + 1;

        // Horizontal
        for (let y = 0; y < h; y++) {
            let sum = 0;
            const row = y * w;
            for (let x = -radius; x <= radius; x++) {
                const xi = Math.min(w - 1, Math.max(0, x));
                sum += a[row + xi];
            }
            for (let x = 0; x < w; x++) {
                tmp[row + x] = sum;
                const x1 = x - radius;
                const x2 = x + radius + 1;
                sum += a[row + Math.min(w - 1, x2)] - a[row + Math.max(0, x1)];
            }
        }
        // Vertical
        for (let x = 0; x < w; x++) {
            let sum = 0;
            for (let y = -radius; y <= radius; y++) {
                const yi = Math.min(h - 1, Math.max(0, y));
                sum += tmp[yi * w + x];
            }
            for (let y = 0; y < h; y++) {
                const idx = (y * w + x) * 4 + 3;
                src[idx] = Math.round(sum / (div * div));
                const y1 = y - radius;
                const y2 = y + radius + 1;
                sum += tmp[Math.min(h - 1, y2) * w + x] - tmp[Math.max(0, y1) * w + x];
            }
        }
    }

    /**
     * Handle touch start events
     */
    private handleTouchStart(event: TouchEvent): void {
        event.preventDefault();
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const canvas = event.target as HTMLCanvasElement;
            
            // Create a mock MouseEvent to use the same coordinate calculation
            const mockEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY
            } as MouseEvent;
            
            const pos = this.getCanvasMousePos(mockEvent, canvas);
            
            this.isMouseDown = true;
            this.lastMousePos = pos;
            
            // Handle tool-specific behavior
            if (this.isBrushTool()) {
                // All brush-type tools use the stroke system
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
            
            // Create a mock MouseEvent to use the same coordinate calculation
            const mockEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY
            } as MouseEvent;
            
            const pos = this.getCanvasMousePos(mockEvent, canvas);
            
            // Handle tool-specific behavior
            if (this.isBrushTool()) {
                // All brush-type tools use the stroke system
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
            if (this.isBrushTool()) {
                // All brush-type tools use the stroke system
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
     * Internal implementation. Use public floodFill to trigger.
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
     * Public API: Flood fill at x,y using current primary color and tolerance.
     */
    floodFill(x: number, y: number): void {
        this.performFill(x, y);
    }

    /**
     * Compute contiguous flood region mask starting from (x,y) using current tolerance on active layer.
     * Returns a boolean mask (true=in region) and the targetColor that was matched.
     */
    private computeFloodRegionMask(x: number, y: number): { mask: Uint8Array; target: { r: number; g: number; b: number; a: number } } | null {
        const composed = this.klHistory.getComposed();
        const layers = this.klCanvas.getLayers();
        const activeLayer = layers.find(layer => layer.id === composed.activeLayerId);
        if (!activeLayer) return null;
        const ctx = activeLayer.context; if (!ctx) return null;

        const w = activeLayer.canvas.width; const h = activeLayer.canvas.height;
        const sx = Math.floor(x); const sy = Math.floor(y);
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) return null;

        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const mask = new Uint8Array(w * h);

        const startIdx = (sy * w + sx) * 4;
        const target = { r: data[startIdx], g: data[startIdx + 1], b: data[startIdx + 2], a: data[startIdx + 3] };

        const stack: { x: number; y: number }[] = [{ x: sx, y: sy }];
        while (stack.length) {
            const p = stack.pop()!;
            if (p.x < 0 || p.y < 0 || p.x >= w || p.y >= h) continue;
            const idx = p.y * w + p.x;
            if (mask[idx]) continue;

            const di = idx * 4;
            const col = { r: data[di], g: data[di + 1], b: data[di + 2], a: data[di + 3] };
            if (!this.colorsWithinTolerance(col, target)) continue;

            mask[idx] = 1;
            stack.push({ x: p.x + 1, y: p.y });
            stack.push({ x: p.x - 1, y: p.y });
            stack.push({ x: p.x, y: p.y + 1 });
            stack.push({ x: p.x, y: p.y - 1 });
        }

        return { mask, target };
    }

    /**
     * Radial bucket fill: flood region at (x,y) and fill only that region with a radial gradient
     * centered at (x,y) using provided color stops. Honors tolerance; contiguous region only.
     */
    applyRadialBucketFill(x: number, y: number, stops: { t: number; color: IRGB }[], options?: { opacity?: number; blendMode?: GlobalCompositeOperation }): void {
        const composed = this.klHistory.getComposed();
        const layers = this.klCanvas.getLayers();
        const activeLayer = layers.find(layer => layer.id === composed.activeLayerId);
        if (!activeLayer) { console.warn('No active layer for radial bucket fill'); return; }
        const ctx = activeLayer.context; if (!ctx) return;

        // Build region mask
        const region = this.computeFloodRegionMask(x, y);
        if (!region) return;
        const mask = region.mask;

        // Normalize and sort stops
        const sorted = (stops && stops.length ? stops : [
            { t: 0, color: this.primaryColor },
            { t: 1, color: this.secondaryColor }
        ]).map(s => ({ t: Math.max(0, Math.min(1, s.t)), color: s.color }))
          .sort((a, b) => a.t - b.t);

        const w = activeLayer.canvas.width; const h = activeLayer.canvas.height;

        // First pass: compute max distance within region
        let maxD = 0;
        for (let py = 0; py < h; py++) {
            const row = py * w;
            for (let px = 0; px < w; px++) {
                if (!mask[row + px]) continue;
                const dx = px - x; const dy = py - y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d > maxD) maxD = d;
            }
        }
        const invMax = maxD > 0 ? 1 / maxD : 1;
        const singlePixelRegion = maxD === 0;

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const colorAt = (t: number): IRGB => {
            if (t <= sorted[0].t) return sorted[0].color;
            if (t >= sorted[sorted.length - 1].t) return sorted[sorted.length - 1].color;
            for (let i = 0; i < sorted.length - 1; i++) {
                const s0 = sorted[i], s1 = sorted[i + 1];
                if (t >= s0.t && t <= s1.t) {
                    const lt = (t - s0.t) / Math.max(1e-6, (s1.t - s0.t));
                    return {
                        r: Math.round(lerp(s0.color.r, s1.color.r, lt)),
                        g: Math.round(lerp(s0.color.g, s1.color.g, lt)),
                        b: Math.round(lerp(s0.color.b, s1.color.b, lt))
                    };
                }
            }
            return sorted[sorted.length - 1].color;
        };

        // Render gradient only to masked pixels on an offscreen buffer
        const off = BB.canvas(w, h);
        const offCtx = BB.ctx(off);
        const out = offCtx.getImageData(0, 0, w, h);
        const outData = out.data;

        for (let py = 0; py < h; py++) {
            const row = py * w;
            for (let px = 0; px < w; px++) {
                const idx = row + px;
                if (!mask[idx]) continue;
                const dx = px - x; const dy = py - y;
                const d = Math.sqrt(dx * dx + dy * dy);
                const t = singlePixelRegion ? 1 : Math.max(0, Math.min(1, d * invMax));
                const c = colorAt(t);
                const di = idx * 4;
                outData[di] = c.r; outData[di + 1] = c.g; outData[di + 2] = c.b; outData[di + 3] = 255;
            }
        }
        offCtx.putImageData(out, 0, 0);

        // Composite onto active layer to respect opacity/blend
        const opacity = options?.opacity ?? 1;
        const blendMode = options?.blendMode ?? 'source-over';
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation = blendMode;
        ctx.drawImage(off, 0, 0);
        ctx.restore();

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
     * Distance gradient fill from a point using arbitrary color stops.
     * Color stops: array of { t: number (0..1), color: {r,g,b} }
     * t=0 at the start point, t=1 at the furthest pixel in the canvas from that point.
     */
    applyDistanceGradientFromPoint(origin: { x: number; y: number }, stops: { t: number; color: IRGB }[]): void {
        const composed = this.klHistory.getComposed();
        const layers = this.klCanvas.getLayers();
        const activeLayer = layers.find(layer => layer.id === composed.activeLayerId);
        if (!activeLayer) { console.warn('No active layer found for distance gradient'); return; }
        const ctx = activeLayer.context; if (!ctx) return;

        // Normalize and sort stops
        const sorted = stops
            .map(s => ({ t: Math.max(0, Math.min(1, s.t)), color: s.color }))
            .sort((a, b) => a.t - b.t);
        if (sorted.length === 0) return;

        const w = activeLayer.canvas.width; const h = activeLayer.canvas.height;
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Furthest distance to canvas corners
        const corners = [ {x:0,y:0}, {x:w-1,y:0}, {x:0,y:h-1}, {x:w-1,y:h-1} ];
        let maxD = 0;
        for (const c of corners) {
            const dx = c.x - origin.x; const dy = c.y - origin.y;
            const d = Math.sqrt(dx*dx + dy*dy);
            if (d > maxD) maxD = d;
        }
        const maxInv = maxD > 0 ? 1 / maxD : 1;

        // Helper: interpolate color for t in [0,1]
        const lerp = (a:number,b:number,t:number)=>a+(b-a)*t;
        const colorAt = (t:number): IRGB => {
            if (t <= sorted[0].t) return sorted[0].color;
            if (t >= sorted[sorted.length-1].t) return sorted[sorted.length-1].color;
            for (let i=0;i<sorted.length-1;i++) {
                const s0 = sorted[i]; const s1 = sorted[i+1];
                if (t >= s0.t && t <= s1.t) {
                    const lt = (t - s0.t) / Math.max(1e-6, (s1.t - s0.t));
                    return { r: Math.round(lerp(s0.color.r, s1.color.r, lt)),
                             g: Math.round(lerp(s0.color.g, s1.color.g, lt)),
                             b: Math.round(lerp(s0.color.b, s1.color.b, lt)) };
                }
            }
            return sorted[sorted.length-1].color;
        };

        for (let y=0; y<h; y++) {
            for (let x=0; x<w; x++) {
                const dx = x - origin.x; const dy = y - origin.y;
                const d = Math.sqrt(dx*dx + dy*dy);
                const t = Math.max(0, Math.min(1, d * maxInv));
                const c = colorAt(t);
                const idx = (y*w + x)*4;
                data[idx] = c.r; data[idx+1] = c.g; data[idx+2] = c.b; data[idx+3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        this.updateCanvasDisplay();
    }
    
    /**
     * Set the canvas scale (zoom level)
     * Called by the HTML UI slider to control zoom between 10% and 800%
     */
    setScale(scale: number): void {
        // Clamp scale between 0.1 (10%) and 8.0 (800%)
        this.canvasScale = Math.max(0.1, Math.min(8.0, scale));
        
        // Update the canvas display with the new scale
        this.updateCanvasDisplay();
    }
    
    /**
     * Get the current canvas scale
     */
    getScale(): number {
        return this.canvasScale;
    }
    
    /**
     * Set the canvas pan offset
     * Called by the HTML UI sliders to control pan offset
     */
    setPan(panX: number, panY: number): void {
        this.canvasPanX = panX;
        this.canvasPanY = panY;
        
        // Update the canvas display with the new pan offset
        this.updateCanvasDisplay();
    }
    
    /**
     * Get the current canvas pan offset
     */
    getPan(): { x: number; y: number } {
        return { x: this.canvasPanX, y: this.canvasPanY };
    }
    
    /**
     * Reset both pan and zoom to default values
     */
    resetTransform(): void {
        this.canvasScale = 1;
        this.canvasPanX = 0;
        this.canvasPanY = 0;
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
