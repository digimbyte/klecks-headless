import { KlCanvas } from '../../klecks/canvas/kl-canvas';
import { KlHistory } from '../../klecks/history/kl-history';
import { IRGB } from '../../klecks/kl-types';
import { IVector2D } from '../../bb/bb-types';
import { BRUSHES } from '../../klecks/brushes/brushes';

export interface IBrushStroke {
    points: IVector2D[];
    pressure?: number[];
    brush: string;
    size: number;
    opacity: number;
    color: IRGB;
    hardness?: number;
    rotation?: number;
    flow?: number;
}

export interface IBrushSettings {
    type: 'brush' | 'pencil';
    shape: 'circle' | 'square' | 'custom';
    size: number;
    hardness: number; // 0-100, affects edge falloff
    opacity: number; // 0-1
    flow: number; // 0-1, affects paint buildup
    rotation: number; // 0-360 degrees
    spacing: number; // 1-100, affects stamp spacing
    color: IRGB;
}

/**
 * Manager for brush operations - drawing, configuration, strokes
 */
export class BrushManager {
    private currentBrush: string = 'penBrush';
    private brushSettings: IBrushSettings = {
        type: 'brush',
        shape: 'circle',
        size: 10,
        hardness: 50,
        opacity: 1,
        flow: 1,
        rotation: 0,
        spacing: 25,
        color: { r: 0, g: 0, b: 0 }
    };
    private isDrawing: boolean = false;
    private currentStroke: IBrushStroke | null = null;
    
    // Cache for brush stamps
    private brushStampCache: Map<string, HTMLCanvasElement> = new Map();
    
    constructor(
        private klCanvas: KlCanvas,
        private klHistory: KlHistory,
        private manager: any // KlecksManager
    ) {}
    
    /**
     * Set the active brush type
     */
    setBrush(brushType: string): void {
        if (BRUSHES[brushType]) {
            this.currentBrush = brushType;
        } else {
            throw new Error(`Unknown brush type: ${brushType}`);
        }
    }
    
    /**
     * Get the current brush type
     */
    getBrush(): string {
        return this.currentBrush;
    }
    
    /**
     * Get available brush types
     */
    getAvailableBrushes(): string[] {
        return Object.keys(BRUSHES);
    }
    
    /**
     * Set brush settings
     */
    setBrushSettings(settings: Partial<IBrushSettings>): void {
        this.brushSettings = { ...this.brushSettings, ...settings };
        this.brushStampCache.clear(); // Clear cache when settings change
    }
    
    /**
     * Get current brush settings
     */
    getBrushSettings(): IBrushSettings {
        return { ...this.brushSettings };
    }
    
    /**
     * Set brush size
     */
    setSize(size: number): void {
        this.brushSettings.size = Math.max(0.1, Math.min(1000, size));
        this.brushStampCache.clear();
    }
    
    /**
     * Get brush size
     */
    getSize(): number {
        return this.brushSettings.size;
    }
    
    /**
     * Increase brush size
     */
    increaseSize(factor: number = 1.1): void {
        this.setSize(this.brushSettings.size * factor);
    }
    
    /**
     * Decrease brush size
     */
    decreaseSize(factor: number = 0.9): void {
        this.setSize(this.brushSettings.size * factor);
    }
    
    /**
     * Set brush opacity
     */
    setOpacity(opacity: number): void {
        this.brushSettings.opacity = Math.max(0, Math.min(1, opacity));
    }
    
    /**
     * Get brush opacity
     */
    getOpacity(): number {
        return this.brushSettings.opacity;
    }
    
    /**
     * Set brush hardness (0-100)
     */
    setHardness(hardness: number): void {
        this.brushSettings.hardness = Math.max(0, Math.min(100, hardness));
        this.brushStampCache.clear();
    }
    
    /**
     * Get brush hardness
     */
    getHardness(): number {
        return this.brushSettings.hardness;
    }
    
    /**
     * Set brush flow (0-1)
     */
    setFlow(flow: number): void {
        this.brushSettings.flow = Math.max(0, Math.min(1, flow));
    }
    
    /**
     * Get brush flow
     */
    getFlow(): number {
        return this.brushSettings.flow;
    }
    
    /**
     * Set brush type (brush or pencil)
     */
    setBrushType(type: 'brush' | 'pencil'): void {
        this.brushSettings.type = type;
        this.brushStampCache.clear();
    }
    
    /**
     * Get brush type
     */
    getBrushType(): 'brush' | 'pencil' {
        return this.brushSettings.type;
    }
    
    /**
     * Set brush shape
     */
    setBrushShape(shape: 'circle' | 'square' | 'custom'): void {
        this.brushSettings.shape = shape;
        this.brushStampCache.clear();
    }
    
    /**
     * Get brush shape
     */
    getBrushShape(): 'circle' | 'square' | 'custom' {
        return this.brushSettings.shape;
    }
    
    /**
     * Set brush rotation (0-360 degrees)
     */
    setRotation(rotation: number): void {
        this.brushSettings.rotation = rotation % 360;
        this.brushStampCache.clear();
    }
    
    /**
     * Get brush rotation
     */
    getRotation(): number {
        return this.brushSettings.rotation;
    }
    
    /**
     * Set brush color
     */
    setColor(color: IRGB): void {
        this.brushSettings.color = { ...color };
    }
    
    /**
     * Get brush color
     */
    getColor(): IRGB {
        return { ...this.brushSettings.color };
    }
    
    /**
     * Start a new brush stroke
     */
    startStroke(x: number, y: number, pressure: number = 1): void {
        if (this.isDrawing) {
            this.endStroke();
        }
        
        this.isDrawing = true;
        this.currentStroke = {
            points: [{ x, y }],
            pressure: [pressure],
            brush: this.currentBrush,
            size: this.brushSettings.size,
            opacity: this.brushSettings.opacity,
            color: { ...this.brushSettings.color },
            hardness: this.brushSettings.hardness,
            rotation: this.brushSettings.rotation,
            flow: this.brushSettings.flow
        };
        
        // Draw the initial point
        this.applyStrokePoint(x, y, pressure);
    }
    
    /**
     * Add point to current stroke with smoothing
     */
    addToStroke(x: number, y: number, pressure: number = 1): void {
        if (!this.isDrawing || !this.currentStroke) {
            throw new Error('No stroke in progress. Call startStroke() first.');
        }
        
        // Skip points that are too close to avoid unnecessary processing
        const points = this.currentStroke.points;
        if (points.length > 0) {
            const lastPoint = points[points.length - 1];
            const distance = Math.sqrt((x - lastPoint.x) ** 2 + (y - lastPoint.y) ** 2);
            if (distance < 2) {
                return; // Skip this point if it's too close to the last one
            }
        }
        
        this.currentStroke.points.push({ x, y });
        this.currentStroke.pressure!.push(pressure);
        
        // Apply stroke with interpolation if there's a gap
        this.applyStrokeWithInterpolation(x, y, pressure);
    }
    
    /**
     * End current brush stroke
     */
    endStroke(): void {
        if (!this.isDrawing || !this.currentStroke) return;
        
        this.isDrawing = false;
        
        // Add to history - use proper KlCanvas approach
        // The brush strokes are automatically added to history by the individual draw operations
        
        this.currentStroke = null;
    }
    
    /**
     * Draw a complete stroke in one call
     */
    drawStroke(points: IVector2D[], pressure?: number[]): void {
        if (points.length === 0) return;
        
        this.startStroke(points[0].x, points[0].y, pressure?.[0] || 1);
        
        for (let i = 1; i < points.length; i++) {
            this.addToStroke(points[i].x, points[i].y, pressure?.[i] || 1);
        }
        
        this.endStroke();
    }
    
    /**
     * Draw a line between two points
     */
    drawLine(x1: number, y1: number, x2: number, y2: number, pressure: number = 1): void {
        // Generate points along the line
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const steps = Math.max(2, Math.ceil(distance / 2));
        const points: IVector2D[] = [];
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            points.push({
                x: x1 + (x2 - x1) * t,
                y: y1 + (y2 - y1) * t
            });
        }
        
        this.drawStroke(points, new Array(points.length).fill(pressure));
    }
    
    /**
     * Check if currently drawing
     */
    isCurrentlyDrawing(): boolean {
        return this.isDrawing;
    }
    
    /**
     * Get current stroke data
     */
    getCurrentStroke(): IBrushStroke | null {
        return this.currentStroke ? { ...this.currentStroke } : null;
    }
    
    /**
     * Apply stroke with interpolation for smoother lines
     */
    private applyStrokeWithInterpolation(x: number, y: number, pressure: number): void {
        if (!this.currentStroke || this.currentStroke.points.length <= 1) {
            this.applyStrokePoint(x, y, pressure);
            return;
        }
        
        const points = this.currentStroke.points;
        const lastPoint = points[points.length - 2];
        const distance = Math.sqrt((x - lastPoint.x) ** 2 + (y - lastPoint.y) ** 2);
        
        // If the distance is large, interpolate points
        if (distance > 5) {
            const steps = Math.ceil(distance / 3);
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const interpX = lastPoint.x + (x - lastPoint.x) * t;
                const interpY = lastPoint.y + (y - lastPoint.y) * t;
                const interpPressure = pressure; // Could interpolate pressure too
                this.applyStrokePoint(interpX, interpY, interpPressure);
            }
        } else {
            this.applyStrokePoint(x, y, pressure);
        }
    }
    
    /**
     * Apply stroke drawing with advanced brush rendering
     */
    private applyStrokePoint(x: number, y: number, pressure: number): void {
        // Get active layer through proper layer management
        const composed = this.klHistory.getComposed();
        const layers = this.klCanvas.getLayers();
        const activeLayer = layers.find(layer => layer.id === composed.activeLayerId);
        
        if (!activeLayer) {
            console.warn('No active layer found');
            return;
        }
        
        const ctx = activeLayer.context;
        if (!ctx) return;
        
        const settings = this.brushSettings;
        const effectiveSize = settings.size * pressure;
        const effectiveOpacity = settings.opacity * settings.flow * pressure;
        
        if (settings.type === 'brush') {
            // Use advanced brush rendering with stamp
            this.applyBrushStamp(ctx, x, y, effectiveSize, effectiveOpacity, pressure);
        } else if (settings.type === 'pencil') {
            // Use simple hard-edge rendering
            this.applyPencilStroke(ctx, x, y, effectiveSize, effectiveOpacity);
        }
        
        // Schedule display update to avoid too many redraws
        this.scheduleDisplayUpdate();
    }
    
    /**
     * Apply brush stamp with soft edges and alpha falloff
     */
    private applyBrushStamp(ctx: CanvasRenderingContext2D, x: number, y: number, 
                           size: number, opacity: number, pressure: number): void {
        const settings = this.brushSettings;
        
        // Create or get cached brush stamp
        const stampKey = `${settings.shape}-${Math.round(size)}-${settings.hardness}-${settings.rotation}`;
        let stamp = this.brushStampCache.get(stampKey);
        
        if (!stamp) {
            stamp = this.createBrushStamp(size, settings.hardness, settings.shape, settings.rotation);
            this.brushStampCache.set(stampKey, stamp);
        }
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation = 'source-over';
        
        // Apply color tint to stamp
        ctx.fillStyle = `rgb(${settings.color.r}, ${settings.color.g}, ${settings.color.b})`;
        ctx.globalCompositeOperation = 'multiply';
        
        // Draw the stamp
        ctx.drawImage(stamp, x - size / 2, y - size / 2);
        
        ctx.restore();
    }
    
    /**
     * Apply hard-edge pencil stroke
     */
    private applyPencilStroke(ctx: CanvasRenderingContext2D, x: number, y: number, 
                             size: number, opacity: number): void {
        const settings = this.brushSettings;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = `rgb(${settings.color.r}, ${settings.color.g}, ${settings.color.b})`;
        
        if (this.currentStroke && this.currentStroke.points.length > 1) {
            // Draw line for pencil strokes
            const points = this.currentStroke.points;
            const prevPoint = points[points.length - 2];
            
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(prevPoint.x, prevPoint.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        } else {
            // First point - draw hard circle
            if (settings.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(x, y, size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (settings.shape === 'square') {
                ctx.fillRect(x - size / 2, y - size / 2, size, size);
            }
        }
        
        ctx.restore();
    }
    
    /**
     * Create a brush stamp with soft edges
     */
    private createBrushStamp(size: number, hardness: number, shape: string, rotation: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const radius = size / 2;
        
        canvas.width = size;
        canvas.height = size;
        
        // Create radial gradient for soft brush
        const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
        
        if (hardness === 100) {
            // Hard brush - no falloff
            gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        } else {
            // Soft brush with falloff
            const innerRadius = hardness / 100;
            gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
            gradient.addColorStop(innerRadius, 'rgba(0, 0, 0, 1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
        
        ctx.fillStyle = gradient;
        
        if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(radius, radius, radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (shape === 'square') {
            // Apply rotation if needed
            if (rotation !== 0) {
                ctx.save();
                ctx.translate(radius, radius);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.fillRect(-radius, -radius, size, size);
                ctx.restore();
            } else {
                ctx.fillRect(0, 0, size, size);
            }
        }
        
        return canvas;
    }
    
    private displayUpdateScheduled = false;
    
    /**
     * Schedule a display update to avoid excessive redraws during fast drawing
     */
    private scheduleDisplayUpdate(): void {
        if (this.displayUpdateScheduled) return;
        
        this.displayUpdateScheduled = true;
        requestAnimationFrame(() => {
            if (this.manager && this.manager.updateCanvasDisplay) {
                this.manager.updateCanvasDisplay();
            }
            this.displayUpdateScheduled = false;
        });
    }
    
    /**
     * Destroy the manager
     */
    destroy(): void {
        if (this.isDrawing) {
            this.endStroke();
        }
    }
}
