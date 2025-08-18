import { IRGB } from '../klecks/kl-types';
import { brushesUI } from '../klecks/brushes-ui/brushes-ui';
import { BRUSHES } from '../klecks/brushes/brushes';

/**
 * Comprehensive Tool Manager for Klecks Canvas
 * Manages all drawing and editing tools with their settings and operations
 */

export type TToolType = 
    // Main tools (match Klecks API)
    | 'brush' | 'hand' | 'paintBucket' | 'gradient' | 'text' | 'shape' | 'select' | 'eyedropper';

export type TBrushType =
    // Brush sub-types (within 'brush' tool)
    | 'penBrush' | 'blendBrush' | 'sketchyBrush' | 'pixelBrush' | 'chemyBrush' | 'smudgeBrush' | 'eraserBrush';

export interface IToolSettings {
    // Common brush settings
    size?: number;
    opacity?: number;
    color?: IRGB;
    
    // Brush-specific settings
    blending?: number;
    pressure?: boolean;
    stabilizer?: number;
    spacing?: number;
    scatter?: number;
    
    // Pen brush specific
    alphaId?: number; // circle, square, chalk, calligraphy
    lockAlpha?: boolean;
    
    // Sketchy brush specific
    scale?: number;
    
    // Pixel brush specific
    dither?: number;
    
    // Chemy brush specific
    mode?: 'fill' | 'stroke';
    distort?: number;
    xSymmetry?: boolean;
    ySymmetry?: boolean;
    gradient?: boolean;
    
    // Fill tool specific
    tolerance?: number;
    contiguous?: boolean;
    sampleMode?: 'all' | 'current' | 'above';
    grow?: number;
    
    // Selection tool specific
    feather?: number;
    antialias?: boolean;
    
    // Zoom/Pan settings
    fitToScreen?: boolean;
    zoomLevel?: number;
}

export interface IToolState {
    currentTool: TToolType;
    currentBrushType: TBrushType;
    isDrawing: boolean;
    lastPosition?: { x: number; y: number };
    settings: { [key in TToolType]?: IToolSettings };
    brushSettings: { [key in TBrushType]?: IToolSettings };
}

export class ToolManager {
    private state: IToolState;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private brushInstances: { [key: string]: any } = {};
    
    // Event handlers
    public onToolChanged: (tool: TToolType) => void = () => {};
    public onBrushChanged: (brushType: TBrushType) => void = () => {};
    public onSettingChanged: (tool: TToolType, setting: keyof IToolSettings, value: any) => void = () => {};
    public onFillRequested: (x: number, y: number) => void = () => {};
    public onColorPicked: (color: IRGB) => void = () => {};
    public onTextRequested: (x: number, y: number) => void = () => {};
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d')!;
        
        this.state = {
            currentTool: 'brush',
            currentBrushType: 'penBrush',
            isDrawing: false,
            settings: {
                brush: { size: 10, opacity: 1 },
                hand: {},
                paintBucket: { tolerance: 0, contiguous: true, sampleMode: 'all', grow: 0 },
                gradient: {},
                text: { size: 24 },
                shape: {},
                select: { feather: 0, antialias: true },
                eyedropper: {}
            },
            brushSettings: {
                penBrush: { size: 10, opacity: 1, pressure: true, alphaId: 0 },
                blendBrush: { size: 10, opacity: 1, blending: 0.5 },
                sketchyBrush: { size: 10, opacity: 0.2, blending: 0.5, scale: 1 },
                pixelBrush: { size: 10, opacity: 1, dither: 0 },
                chemyBrush: { size: 10, opacity: 1, mode: 'fill', distort: 0, xSymmetry: false, ySymmetry: false, gradient: false },
                smudgeBrush: { size: 10, opacity: 1 },
                eraserBrush: { size: 10, opacity: 1 }
            }
        };
        
        this.initializeBrushes();
    }
    
    private initializeBrushes(): void {
        // Initialize all brush instances
        this.brushInstances.pen = new BRUSHES.PenBrush();
        this.brushInstances.blend = new BRUSHES.BlendBrush();
        this.brushInstances.sketchy = new BRUSHES.SketchyBrush();
        this.brushInstances.pixel = new BRUSHES.PixelBrush();
        this.brushInstances.chemy = new BRUSHES.ChemyBrush();
        this.brushInstances.smudge = new BRUSHES.SmudgeBrush();
        this.brushInstances.eraser = new BRUSHES.EraserBrush();
        
        // Set context for all brushes
        Object.values(this.brushInstances).forEach((brush: any) => {
            if (brush.setContext) {
                brush.setContext(this.context);
            }
        });
    }
    
    // === Tool Management ===
    
    getCurrentTool(): TToolType {
        return this.state.currentTool;
    }
    
    getCurrentBrushType(): TBrushType {
        return this.state.currentBrushType;
    }
    
    setCurrentBrushType(brushType: TBrushType): void {
        if (this.state.currentBrushType === brushType) return;
        
        // Stop any current drawing operation
        if (this.state.isDrawing) {
            this.endDrawing();
        }
        
        this.state.currentBrushType = brushType;
        this.onBrushChanged(brushType);
        
        // Apply current settings to the new brush type
        if (this.state.currentTool === 'brush') {
            this.applylCurrentSettings();
        }
    }
    
    private getBrushInstance(brushType: TBrushType): any {
        const brushMap: { [key in TBrushType]: string } = {
            penBrush: 'pen',
            blendBrush: 'blend',
            sketchyBrush: 'sketchy',
            pixelBrush: 'pixel',
            chemyBrush: 'chemy',
            smudgeBrush: 'smudge',
            eraserBrush: 'eraser'
        };
        return this.brushInstances[brushMap[brushType]];
    }
    
    setCurrentTool(tool: TToolType): void {
        if (this.state.currentTool === tool) return;
        
        // Stop any current drawing operation
        if (this.state.isDrawing) {
            this.endDrawing();
        }
        
        this.state.currentTool = tool;
        this.onToolChanged(tool);
        
        // Apply current settings to the new tool
        this.applylCurrentSettings();
    }
    
    private applylCurrentSettings(): void {
        const tool = this.state.currentTool;
        
        if (tool === 'brush') {
            // For brush tool, apply settings to current brush type
            const brushType = this.state.currentBrushType;
            const brushSettings = this.state.brushSettings[brushType];
            const brush = this.getBrushInstance(brushType);
            
            if (!brushSettings || !brush) return;
            
            // Apply common settings
            if (brushSettings.size !== undefined && brush.setSize) {
                brush.setSize(brushSettings.size);
            }
            if (brushSettings.opacity !== undefined && brush.setOpacity) {
                brush.setOpacity(brushSettings.opacity);
            }
            if (brushSettings.color !== undefined && brush.setColor) {
                brush.setColor(brushSettings.color);
            }
            
            // Apply brush-specific settings
            if (brushSettings.blending !== undefined && brush.setBlending) {
                brush.setBlending(brushSettings.blending);
            }
            if (brushSettings.pressure !== undefined && brush.setPressure) {
                brush.setPressure(brushSettings.pressure);
            }
            
            // Pen brush specific
            if (brushType === 'penBrush' && brush.setAlphaId && brushSettings.alphaId !== undefined) {
                brush.setAlphaId(brushSettings.alphaId);
            }
            if (brushSettings.lockAlpha !== undefined && brush.setLockAlpha) {
                brush.setLockAlpha(brushSettings.lockAlpha);
            }
            
            // Sketchy brush specific
            if (brushType === 'sketchyBrush' && brush.setScale && brushSettings.scale !== undefined) {
                brush.setScale(brushSettings.scale);
            }
            
            // Pixel brush specific
            if (brushType === 'pixelBrush' && brush.setDither && brushSettings.dither !== undefined) {
                brush.setDither(brushSettings.dither);
            }
            
            // Chemy brush specific
            if (brushType === 'chemyBrush') {
                if (brush.setMode && brushSettings.mode) {
                    brush.setMode(brushSettings.mode);
                }
                if (brush.setDistort && brushSettings.distort !== undefined) {
                    brush.setDistort(brushSettings.distort);
                }
                if (brush.setXSymmetry && brushSettings.xSymmetry !== undefined) {
                    brush.setXSymmetry(brushSettings.xSymmetry);
                }
                if (brush.setYSymmetry && brushSettings.ySymmetry !== undefined) {
                    brush.setYSymmetry(brushSettings.ySymmetry);
                }
                if (brush.setGradient && brushSettings.gradient !== undefined) {
                    brush.setGradient(brushSettings.gradient);
                }
            }
            
            // Eraser specific
            if (brushType === 'eraserBrush' && brush.setIsEraser) {
                brush.setIsEraser(true);
            }
        }
    }
    
    // === Settings Management ===
    
    getToolSettings(tool?: TToolType): IToolSettings {
        const targetTool = tool || this.state.currentTool;
        return { ...this.state.settings[targetTool] } || {};
    }
    
    setToolSetting(setting: keyof IToolSettings, value: any, tool?: TToolType): void {
        const targetTool = tool || this.state.currentTool;
        
        if (!this.state.settings[targetTool]) {
            this.state.settings[targetTool] = {};
        }
        
        this.state.settings[targetTool]![setting] = value;
        
        // Apply setting immediately if it's the current tool
        if (targetTool === this.state.currentTool) {
            this.applylCurrentSettings();
        }
        
        this.onSettingChanged(targetTool, setting, value);
    }
    
    getBrushSettings(brushType?: TBrushType): IToolSettings {
        const targetBrush = brushType || this.state.currentBrushType;
        return { ...this.state.brushSettings[targetBrush] } || {};
    }
    
    setBrushSetting(setting: keyof IToolSettings, value: any, brushType?: TBrushType): void {
        const targetBrush = brushType || this.state.currentBrushType;
        
        if (!this.state.brushSettings[targetBrush]) {
            this.state.brushSettings[targetBrush] = {};
        }
        
        this.state.brushSettings[targetBrush]![setting] = value;
        
        // Apply setting immediately if it's the current brush and tool is brush
        if (targetBrush === this.state.currentBrushType && this.state.currentTool === 'brush') {
            this.applylCurrentSettings();
        }
    }
    
    // === Drawing Operations ===
    
    startDrawing(x: number, y: number, pressure: number = 1): void {
        const tool = this.state.currentTool;
        
        // Handle different tool types
        if (this.isBrushTool(tool)) {
            const brush = this.getBrushInstance(this.state.currentBrushType);
            if (brush && brush.startLine) {
                brush.startLine(x, y, pressure);
                this.state.isDrawing = true;
                this.state.lastPosition = { x, y };
            }
        } else if (tool === 'paintBucket') {
            this.onFillRequested(x, y);
        } else if (tool === 'eyedropper') {
            const color = this.sampleColor(x, y);
            this.onColorPicked(color);
        } else if (tool === 'text') {
            this.onTextRequested(x, y);
        }
    }
    
    continueDrawing(x: number, y: number, pressure: number = 1): void {
        if (!this.state.isDrawing) return;
        
        const tool = this.state.currentTool;
        
        if (this.isBrushTool(tool)) {
            const brush = this.getBrushInstance(this.state.currentBrushType);
            if (brush && brush.goLine) {
                brush.goLine(x, y, pressure);
                this.state.lastPosition = { x, y };
            }
        }
    }
    
    endDrawing(): void {
        if (!this.state.isDrawing) return;
        
        const tool = this.state.currentTool;
        
        if (this.isBrushTool(tool)) {
            const brush = this.getBrushInstance(this.state.currentBrushType);
            if (brush && brush.endLine) {
                brush.endLine();
            }
        }
        
        this.state.isDrawing = false;
        this.state.lastPosition = undefined;
    }
    
    drawLine(x1: number, y1: number, x2: number, y2: number, pressure: number = 1): void {
        const tool = this.state.currentTool;
        
        if (this.isBrushTool(tool)) {
            const brush = this.getBrushInstance(this.state.currentBrushType);
            if (brush && brush.drawLineSegment) {
                brush.drawLineSegment(x1, y1, x2, y2);
            } else if (brush) {
                // Fallback: simulate line with start/continue/end
                brush.startLine(x1, y1, pressure);
                brush.goLine(x2, y2, pressure);
                brush.endLine();
            }
        }
    }
    
    // === Utility Methods ===
    
    private isBrushTool(tool: TToolType): boolean {
        return tool === 'brush';
    }
    
    private sampleColor(x: number, y: number): IRGB {
        const imageData = this.context.getImageData(x, y, 1, 1);
        const data = imageData.data;
        return {
            r: data[0],
            g: data[1],
            b: data[2]
        };
    }
    
    // === Special Tool Operations ===
    
    fill(x: number, y: number, color: IRGB): void {
        const settings = this.getToolSettings('fill');
        // This would use the flood fill algorithm
        // For now, we'll trigger the event for the bridge to handle
        this.onFillRequested(x, y);
    }
    
    zoom(factor: number, centerX?: number, centerY?: number): void {
        const settings = this.getToolSettings('zoom');
        const currentZoom = settings.zoomLevel || 1;
        const newZoom = Math.max(0.1, Math.min(10, currentZoom * factor));
        this.setToolSetting('zoomLevel', newZoom, 'zoom');
    }
    
    resetZoom(): void {
        this.setToolSetting('zoomLevel', 1, 'zoom');
        this.setToolSetting('fitToScreen', false, 'zoom');
    }
    
    fitToScreen(): void {
        this.setToolSetting('fitToScreen', true, 'zoom');
    }
    
    // === Brush-Specific Methods ===
    
    setBrushSize(size: number): void {
        this.setToolSetting('size', size);
    }
    
    setBrushOpacity(opacity: number): void {
        this.setToolSetting('opacity', Math.max(0, Math.min(1, opacity)));
    }
    
    setBrushColor(color: IRGB): void {
        this.setToolSetting('color', color);
    }
    
    setBrushBlending(blending: number): void {
        this.setToolSetting('blending', Math.max(0, Math.min(1, blending)));
    }
    
    setPressureSensitivity(enabled: boolean): void {
        this.setToolSetting('pressure', enabled);
    }
    
    // === Pen Brush Specific ===
    
    setPenAlphaMode(alphaId: number): void {
        this.setToolSetting('alphaId', alphaId, 'pen');
    }
    
    setPenLockAlpha(locked: boolean): void {
        this.setToolSetting('lockAlpha', locked, 'pen');
    }
    
    // === Sketchy Brush Specific ===
    
    setSketchyScale(scale: number): void {
        this.setToolSetting('scale', scale, 'sketchy');
    }
    
    // === Pixel Brush Specific ===
    
    setPixelDither(dither: number): void {
        this.setToolSetting('dither', dither, 'pixel');
    }
    
    // === Chemy Brush Specific ===
    
    setChemyMode(mode: 'fill' | 'stroke'): void {
        this.setToolSetting('mode', mode, 'chemy');
    }
    
    setChemyDistort(distort: number): void {
        this.setToolSetting('distort', distort, 'chemy');
    }
    
    setChemySymmetry(xSymmetry: boolean, ySymmetry: boolean): void {
        this.setToolSetting('xSymmetry', xSymmetry, 'chemy');
        this.setToolSetting('ySymmetry', ySymmetry, 'chemy');
    }
    
    setChemyGradient(gradient: boolean): void {
        this.setToolSetting('gradient', gradient, 'chemy');
    }
    
    // === Fill Tool Specific ===
    
    setFillTolerance(tolerance: number): void {
        this.setToolSetting('tolerance', Math.max(0, Math.min(255, tolerance)), 'fill');
    }
    
    setFillContiguous(contiguous: boolean): void {
        this.setToolSetting('contiguous', contiguous, 'fill');
    }
    
    setFillSampleMode(mode: 'all' | 'current' | 'above'): void {
        this.setToolSetting('sampleMode', mode, 'fill');
    }
    
    setFillGrow(grow: number): void {
        this.setToolSetting('grow', Math.max(0, Math.min(10, grow)), 'fill');
    }
    
    // === State Queries ===
    
    isDrawing(): boolean {
        return this.state.isDrawing;
    }
    
    getLastPosition(): { x: number; y: number } | undefined {
        return this.state.lastPosition;
    }
    
    // === Available Tools and Settings ===
    
    getAvailableTools(): TToolType[] {
        return [
            'brush', 'hand', 'paintBucket', 'gradient', 'text', 'shape', 'select', 'eyedropper'
        ];
    }
    
    getAvailableBrushTypes(): TBrushType[] {
        return [
            'penBrush', 'blendBrush', 'sketchyBrush', 'pixelBrush', 'chemyBrush', 'smudgeBrush', 'eraserBrush'
        ];
    }
    
    getUtilityTools(): TToolType[] {
        return ['paintBucket', 'eyedropper', 'hand'];
    }
    
    getCreativeTools(): TToolType[] {
        return ['brush', 'text', 'shape', 'gradient'];
    }
    
    getSelectionTools(): TToolType[] {
        return ['select'];
    }
    
    // === Tool Information ===
    
    getToolInfo(tool: TToolType): { name: string; description: string; shortcut?: string } {
        const toolInfo: { [key in TToolType]: { name: string; description: string; shortcut?: string } } = {
            brush: { name: 'Brush', description: 'Drawing brush with multiple types', shortcut: 'B' },
            hand: { name: 'Hand', description: 'Pan and move the canvas view', shortcut: 'H' },
            paintBucket: { name: 'Paint Bucket', description: 'Fill areas with solid colors', shortcut: 'F' },
            gradient: { name: 'Gradient', description: 'Create gradient fills and effects', shortcut: 'G' },
            text: { name: 'Text', description: 'Add text to canvas', shortcut: 'T' },
            shape: { name: 'Shape', description: 'Draw geometric shapes', shortcut: 'S' },
            select: { name: 'Select', description: 'Selection tools for editing', shortcut: 'M' },
            eyedropper: { name: 'Eyedropper', description: 'Sample colors from canvas', shortcut: 'I' }
        };
        
        return toolInfo[tool];
    }
    
    getBrushTypeInfo(brushType: TBrushType): { name: string; description: string; shortcut?: string } {
        const brushInfo: { [key in TBrushType]: { name: string; description: string; shortcut?: string } } = {
            penBrush: { name: 'Pen', description: 'Standard pen brush with pressure sensitivity', shortcut: 'P' },
            blendBrush: { name: 'Blend', description: 'Watercolor-like blending brush', shortcut: 'W' },
            sketchyBrush: { name: 'Sketchy', description: 'Sketch-like brush with connecting lines', shortcut: 'K' },
            pixelBrush: { name: 'Pixel', description: 'Pixel art brush with optional dithering', shortcut: 'X' },
            chemyBrush: { name: 'Chemy', description: 'Special effects brush with symmetry', shortcut: 'C' },
            smudgeBrush: { name: 'Smudge', description: 'Smudge and blend existing colors', shortcut: 'D' },
            eraserBrush: { name: 'Eraser', description: 'Erase pixels or make transparent', shortcut: 'E' }
        };
        
        return brushInfo[brushType];
    }
    
    // === History Integration ===
    
    setHistory(klHistory: any): void {
        // Set history for all brush instances
        Object.values(this.brushInstances).forEach((brush: any) => {
            if (brush.setHistory) {
                brush.setHistory(klHistory);
            }
        });
    }
    
    // === Cleanup ===
    
    destroy(): void {
        // Clean up brush instances
        Object.values(this.brushInstances).forEach((brush: any) => {
            if (brush.destroy) {
                brush.destroy();
            }
        });
        this.brushInstances = {};
    }
}
