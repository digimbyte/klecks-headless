import { KlCanvas, TKlCanvasLayer } from '../../klecks/canvas/kl-canvas';
import { KlHistory } from '../../klecks/history/kl-history';
import { renderText, TRenderTextParam, TTextFormat, TTextFont } from '../../klecks/image-operations/render-text';
import { IRGB, IRGBA } from '../../klecks/kl-types';
import { BB } from '../../bb/bb';

export interface ITextInstance {
    readonly id: string;
    setText(text: string): void;
    move(x: number, y: number): void;
    setPosition(x: number, y: number): void;
    rotate(angleRad: number): void;
    changeFont(font: TTextFont): void;
    changeSize(size: number): void;
    setAlign(align: TTextFormat): void;
    setBold(isBold: boolean): void;
    setItalic(isItalic: boolean): void;
    setLineHeight(lineHeight: number): void;
    setLetterSpacing(letterSpacing: number): void;
    setFillColor(color: IRGBA): void;
    setStrokeColor(color: IRGBA, lineWidth?: number): void;
    removeFill(): void;
    removeStroke(): void;
    getPreviewCanvas(): HTMLCanvasElement;
    getBounds(): { x: number, y: number, width: number, height: number };
    getParams(): TRenderTextParam;
    finalize(): void;
    cancel(): void;
    isFinalized(): boolean;
}

export interface ICreateTextOptions {
    text: string;
    x?: number;
    y?: number;
    angleRad?: number;
    size?: number;
    align?: TTextFormat;
    isBold?: boolean;
    isItalic?: boolean;
    font?: TTextFont;
    letterSpacing?: number;
    lineHeight?: number;
    fillColor?: IRGBA;
    strokeColor?: IRGBA;
    strokeWidth?: number;
    layerIndex?: number;
}

class TextInstance implements ITextInstance {
    public readonly id: string;
    private params: TRenderTextParam;
    private previewCanvas: HTMLCanvasElement;
    private finalized: boolean = false;
    private layerIndex: number;
    
    constructor(
        private klCanvas: KlCanvas,
        private klHistory: KlHistory,
        private manager: any, // KlecksManager
        options: ICreateTextOptions
    ) {
        this.id = 'text_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.layerIndex = options.layerIndex ?? klCanvas.getLayerIndex();
        
        // Initialize parameters
        this.params = {
            text: options.text,
            x: options.x ?? 100,
            y: options.y ?? 100,
            angleRad: options.angleRad ?? 0,
            size: options.size ?? 24,
            align: options.align ?? 'left',
            isBold: options.isBold ?? false,
            isItalic: options.isItalic ?? false,
            font: options.font ?? 'sans-serif',
            letterSpacing: options.letterSpacing,
            lineHeight: options.lineHeight,
            fill: options.fillColor ? { color: options.fillColor } : undefined,
            stroke: (options.strokeColor && options.strokeWidth) ? {
                color: options.strokeColor,
                lineWidth: options.strokeWidth
            } : undefined
        };
        
        // Create preview canvas
        this.previewCanvas = BB.canvas(klCanvas.getWidth(), klCanvas.getHeight());
        this.updatePreview();
    }
    
    private updatePreview(): void {
        if (this.finalized) return;
        
        // Clear and render text to preview canvas
        const ctx = BB.ctx(this.previewCanvas);
        ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        renderText(this.previewCanvas, this.params);
    }
    
    setText(text: string): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.text = text;
        this.updatePreview();
    }
    
    move(x: number, y: number): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.x += x;
        this.params.y += y;
        this.updatePreview();
    }
    
    setPosition(x: number, y: number): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.x = x;
        this.params.y = y;
        this.updatePreview();
    }
    
    rotate(angleRad: number): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.angleRad = angleRad;
        this.updatePreview();
    }
    
    changeFont(font: TTextFont): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.font = font;
        this.updatePreview();
    }
    
    changeSize(size: number): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.size = size;
        this.updatePreview();
    }
    
    setAlign(align: TTextFormat): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.align = align;
        this.updatePreview();
    }
    
    setBold(isBold: boolean): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.isBold = isBold;
        this.updatePreview();
    }
    
    setItalic(isItalic: boolean): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.isItalic = isItalic;
        this.updatePreview();
    }
    
    setLineHeight(lineHeight: number): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.lineHeight = lineHeight;
        this.updatePreview();
    }
    
    setLetterSpacing(letterSpacing: number): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.letterSpacing = letterSpacing;
        this.updatePreview();
    }
    
    setFillColor(color: IRGBA): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.fill = { color };
        this.updatePreview();
    }
    
    setStrokeColor(color: IRGBA, lineWidth: number = 2): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.stroke = { color, lineWidth };
        this.updatePreview();
    }
    
    removeFill(): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.fill = undefined;
        this.updatePreview();
    }
    
    removeStroke(): void {
        if (this.finalized) throw new Error('Text instance is finalized');
        this.params.stroke = undefined;
        this.updatePreview();
    }
    
    getPreviewCanvas(): HTMLCanvasElement {
        return this.previewCanvas;
    }
    
    getBounds(): { x: number, y: number, width: number, height: number } {
        const tempCanvas = BB.canvas(this.klCanvas.getWidth(), this.klCanvas.getHeight());
        return renderText(tempCanvas, this.params);
    }
    
    getParams(): TRenderTextParam {
        return { ...this.params };
    }
    
    finalize(): void {
        if (this.finalized) throw new Error('Text instance already finalized');
        
        // Get target layer
        const targetLayer = this.klCanvas.getLayerByIndex(this.layerIndex);
        if (!targetLayer) {
            throw new Error('Target layer not found');
        }
        
        // Render text directly to the layer
        renderText(targetLayer.canvas, this.params);
        
        // Mark as finalized
        this.finalized = true;
        
        // Update canvas
        this.klCanvas.requestRedraw();
        
        // Add to history
        this.klHistory.push({
            title: 'Text',
            snapshot: this.klCanvas.getSnapshot()
        });
    }
    
    cancel(): void {
        this.finalized = true; // Mark as finalized to prevent further operations
    }
    
    isFinalized(): boolean {
        return this.finalized;
    }
}

/**
 * Manager for text operations - creation, editing, positioning, styling
 */
export class TextManager {
    private activeInstances: Map<string, TextInstance> = new Map();
    
    constructor(
        private klCanvas: KlCanvas,
        private klHistory: KlHistory,
        private manager: any // KlecksManager
    ) {}
    
    /**
     * Create a new text instance
     */
    create(options: ICreateTextOptions): ITextInstance {
        const instance = new TextInstance(this.klCanvas, this.klHistory, this.manager, options);
        this.activeInstances.set(instance.id, instance);
        return instance;
    }
    
    /**
     * Get all active text instances
     */
    getActiveInstances(): ITextInstance[] {
        return Array.from(this.activeInstances.values()).filter(instance => !instance.isFinalized());
    }
    
    /**
     * Get text instance by ID
     */
    getInstance(id: string): ITextInstance | null {
        return this.activeInstances.get(id) || null;
    }
    
    /**
     * Finalize all active text instances
     */
    finalizeAll(): void {
        for (const instance of this.activeInstances.values()) {
            if (!instance.isFinalized()) {
                instance.finalize();
            }
        }
    }
    
    /**
     * Cancel all active text instances
     */
    cancelAll(): void {
        for (const instance of this.activeInstances.values()) {
            if (!instance.isFinalized()) {
                instance.cancel();
            }
        }
    }
    
    /**
     * Clean up finalized instances
     */
    cleanup(): void {
        for (const [id, instance] of this.activeInstances) {
            if (instance.isFinalized()) {
                this.activeInstances.delete(id);
            }
        }
    }
    
    /**
     * Destroy the manager
     */
    destroy(): void {
        this.cancelAll();
        this.activeInstances.clear();
    }
}
