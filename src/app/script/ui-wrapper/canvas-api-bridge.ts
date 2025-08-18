import { KlecksManager } from '../headless/klecks-manager';
import { ITextInstance } from '../headless/managers/text-manager';
import { ILayerInfo } from '../headless/managers/layer-manager';
import { IRGB, IRGBA } from '../klecks/kl-types';

/**
 * Bridge between UI wrapper and headless canvas API
 * This ensures the UI remains decoupled from the canvas implementation
 */
export class CanvasApiBridge {
    private listeners: Map<string, Function[]> = new Map();
    
    constructor(private klecksManager: KlecksManager) {
        // Set up event forwarding from managers to UI
        this.setupEventForwarding();
    }
    
    private setupEventForwarding(): void {
        // Listen for canvas updates and forward to UI
        // This would be expanded as needed
    }
    
    /**
     * Event system for UI to listen to canvas changes
     */
    on(event: string, listener: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(listener);
    }
    
    off(event: string, listener: Function): void {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    private emit(event: string, ...args: any[]): void {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(listener => listener(...args));
        }
    }
    
    // ==========================================
    // CANVAS OPERATIONS
    // ==========================================
    
    getCanvasElement(): HTMLElement {
        return this.klecksManager.getCanvasElement();
    }
    
    resizeCanvas(width: number, height: number): void {
        this.klecksManager.resize(width, height);
        this.emit('canvas-resized', width, height);
    }
    
    clearCanvas(): void {
        this.klecksManager.clear();
        this.emit('canvas-cleared');
    }
    
    // ==========================================
    // HISTORY OPERATIONS
    // ==========================================
    
    undo(): boolean {
        const result = this.klecksManager.undo();
        this.emit('history-changed');
        return result;
    }
    
    redo(): boolean {
        const result = this.klecksManager.redo();
        this.emit('history-changed');
        return result;
    }
    
    canUndo(): boolean {
        return this.klecksManager.canUndo();
    }
    
    canRedo(): boolean {
        return this.klecksManager.canRedo();
    }
    
    // ==========================================
    // COLOR OPERATIONS
    // ==========================================
    
    setPrimaryColor(color: IRGB): void {
        this.klecksManager.setPrimaryColor(color);
        this.emit('color-changed', 'primary', color);
    }
    
    setSecondaryColor(color: IRGB): void {
        this.klecksManager.setSecondaryColor(color);
        this.emit('color-changed', 'secondary', color);
    }
    
    getPrimaryColor(): IRGB {
        return this.klecksManager.getPrimaryColor();
    }
    
    getSecondaryColor(): IRGB {
        return this.klecksManager.getSecondaryColor();
    }
    
    // ==========================================
    // TOOL OPERATIONS
    // ==========================================
    
    setCurrentTool(tool: string): void {
        this.klecksManager.setCurrentTool(tool);
        this.emit('tool-changed', tool);
    }
    
    getCurrentTool(): string {
        return this.klecksManager.getCurrentTool();
    }
    
    // ==========================================
    // TEXT OPERATIONS
    // ==========================================
    
    createText(options: {
        text: string;
        x?: number;
        y?: number;
        size?: number;
        font?: string;
        fillColor?: IRGBA;
    }): string {
        const textInstance = this.klecksManager.text.create(options);
        this.emit('text-created', textInstance.id);
        return textInstance.id;
    }
    
    getTextInstance(id: string): ITextInstance | null {
        return this.klecksManager.text.getInstance(id);
    }
    
    finalizeAllText(): void {
        this.klecksManager.text.finalizeAll();
        this.emit('text-finalized-all');
    }
    
    cancelAllText(): void {
        this.klecksManager.text.cancelAll();
        this.emit('text-cancelled-all');
    }
    
    getActiveTextInstances(): ITextInstance[] {
        return this.klecksManager.text.getActiveInstances();
    }
    
    // ==========================================
    // BRUSH OPERATIONS
    // ==========================================
    
    setBrushType(brushType: string): void {
        this.klecksManager.brush.setBrush(brushType);
        this.emit('brush-changed', 'type', brushType);
    }
    
    setBrushSize(size: number): void {
        this.klecksManager.brush.setSize(size);
        this.emit('brush-changed', 'size', size);
    }
    
    setBrushOpacity(opacity: number): void {
        this.klecksManager.brush.setOpacity(opacity);
        this.emit('brush-changed', 'opacity', opacity);
    }
    
    setBrushColor(color: IRGB): void {
        this.klecksManager.brush.setColor(color);
        this.emit('brush-changed', 'color', color);
    }
    
    getBrushType(): string {
        return this.klecksManager.brush.getBrush();
    }
    
    getBrushSize(): number {
        return this.klecksManager.brush.getSize();
    }
    
    getBrushOpacity(): number {
        return this.klecksManager.brush.getOpacity();
    }
    
    getBrushColor(): IRGB {
        return this.klecksManager.brush.getColor();
    }
    
    getAvailableBrushes(): string[] {
        return this.klecksManager.brush.getAvailableBrushes();
    }
    
    drawLine(x1: number, y1: number, x2: number, y2: number): void {
        this.klecksManager.brush.drawLine(x1, y1, x2, y2);
        this.emit('brush-stroke-complete');
    }
    
    // ==========================================
    // LAYER OPERATIONS
    // ==========================================
    
    createLayer(name?: string): number {
        const index = this.klecksManager.layers.create(name);
        this.emit('layer-created', index);
        return index;
    }
    
    deleteLayer(index: number): boolean {
        const result = this.klecksManager.layers.delete(index);
        if (result) {
            this.emit('layer-deleted', index);
        }
        return result;
    }
    
    duplicateLayer(index: number): number {
        const newIndex = this.klecksManager.layers.duplicate(index);
        this.emit('layer-duplicated', index, newIndex);
        return newIndex;
    }
    
    moveLayer(fromIndex: number, toIndex: number): boolean {
        const result = this.klecksManager.layers.move(fromIndex, toIndex);
        if (result) {
            this.emit('layer-moved', fromIndex, toIndex);
        }
        return result;
    }
    
    setLayerVisible(index: number, visible: boolean): void {
        this.klecksManager.layers.setVisible(index, visible);
        this.emit('layer-visibility-changed', index, visible);
    }
    
    setLayerOpacity(index: number, opacity: number): void {
        this.klecksManager.layers.setOpacity(index, opacity);
        this.emit('layer-opacity-changed', index, opacity);
    }
    
    setLayerMixMode(index: number, mixMode: string): void {
        this.klecksManager.layers.setMixMode(index, mixMode as any);
        this.emit('layer-mixmode-changed', index, mixMode);
    }
    
    renameLayer(index: number, name: string): void {
        this.klecksManager.layers.rename(index, name);
        this.emit('layer-renamed', index, name);
    }
    
    setActiveLayer(index: number): void {
        this.klecksManager.layers.setActive(index);
        this.emit('layer-activated', index);
    }
    
    getLayerInfo(index: number): ILayerInfo | null {
        return this.klecksManager.layers.getInfo(index);
    }
    
    getAllLayersInfo(): ILayerInfo[] {
        return this.klecksManager.layers.getAllInfo();
    }
    
    getLayerCount(): number {
        return this.klecksManager.layers.getCount();
    }
    
    getActiveLayerIndex(): number {
        return this.klecksManager.layers.getActiveIndex();
    }
    
    clearLayer(index: number): void {
        this.klecksManager.layers.clearLayer(index);
        this.emit('layer-cleared', index);
    }
    
    fillLayer(index: number, color: { r: number; g: number; b: number }): void {
        this.klecksManager.layers.fill(index, color);
        this.emit('layer-filled', index, color);
    }
    
    mergeLayerDown(index: number): boolean {
        const result = this.klecksManager.layers.mergeDown(index);
        if (result) {
            this.emit('layer-merged-down', index);
        }
        return result;
    }
    
    flattenLayers(): void {
        this.klecksManager.layers.flatten();
        this.emit('layers-flattened');
    }
    
    getAvailableMixModes(): string[] {
        return this.klecksManager.layers.getAvailableMixModes();
    }
    
    // ==========================================
    // FUTURE OPERATIONS (Stubs)
    // ==========================================
    
    // Shapes
    drawRectangle(x: number, y: number, width: number, height: number, options?: any): void {
        // TODO: Implement when ShapeManager is complete
        console.log('Bridge: drawRectangle not implemented');
    }
    
    drawEllipse(x: number, y: number, width: number, height: number, options?: any): void {
        // TODO: Implement when ShapeManager is complete
        console.log('Bridge: drawEllipse not implemented');
    }
    
    // Filters
    applyFilter(filterName: string, options: any): void {
        // TODO: Implement when FilterManager is complete
        console.log('Bridge: applyFilter not implemented');
    }
    
    // Gradients
    createLinearGradient(x1: number, y1: number, x2: number, y2: number, colors: any[]): void {
        // TODO: Implement when GradientManager is complete
        console.log('Bridge: createLinearGradient not implemented');
    }
    
    // ==========================================
    // ENGINE ACCESS FOR HEADLESS API
    // ==========================================
    
    /**
     * Get the underlying engine controllers for headless API
     * These methods expose the internal engine state needed for the KH API
     */
    getEngineControllers(): {
        tools: { setActive: (tool: string) => any; getActive: () => any };
        canvas: { getDomCanvas: () => HTMLCanvasElement | null };
        history: { begin: (name: string) => void; end: () => void; length: () => number };
        layers: { active: () => any; addRaster: (options: any) => number; select: (index: number) => void };
        text: { setStyle: (style: any) => void; commit: (options: any) => void; place: (pos: any) => void };
    } {
        return {
            tools: {
                setActive: (tool: string) => {
                    this.klecksManager.setCurrentTool(tool);
                    return this.klecksManager.tools.getActiveTool();
                },
                getActive: () => {
                    return {
                        name: this.klecksManager.getCurrentTool(),
                        setOptions: (opts: any) => {
                            if (opts.size) this.klecksManager.brush.setSize(opts.size);
                            if (opts.opacity) this.klecksManager.brush.setOpacity(opts.opacity);
                            if (opts.hardness && (this.klecksManager.brush as any).setHardness) {
                                (this.klecksManager.brush as any).setHardness(opts.hardness);
                            }
                        },
                        getOptions: () => ({
                            size: this.klecksManager.brush.getSize(),
                            opacity: this.klecksManager.brush.getOpacity()
                        })
                    };
                }
            },
            canvas: {
                getDomCanvas: () => {
                    const element = this.klecksManager.getCanvasElement();
                    return element.querySelector('canvas') as HTMLCanvasElement | null;
                }
            },
            history: {
                begin: (name: string) => {
                    // Use KlecksManager's history system
                    const history = this.klecksManager.getHistory();
                    (history as any).beginHistoryAction?.(name);
                },
                end: () => {
                    const history = this.klecksManager.getHistory();
                    (history as any).endHistoryAction?.();
                },
                length: () => {
                    return this.klecksManager.getHistory().canUndo() ? 1 : 0;
                }
            },
            layers: {
                active: () => {
                    const activeIndex = this.klecksManager.layers.getActiveIndex();
                    return activeIndex >= 0 ? this.klecksManager.layers.getInfo(activeIndex) : null;
                },
                addRaster: (options: any) => {
                    return this.klecksManager.layers.create(options.name || 'Layer');
                },
                select: (index: number) => {
                    this.klecksManager.layers.setActive(index);
                }
            },
            text: {
                setStyle: (style: any) => {
                    // Apply text style through text manager
                    // This will be used by the text tool
                },
                commit: (options: any) => {
                    this.klecksManager.text.create({
                        text: options.text,
                        x: options.x,
                        y: options.y,
                        size: 24,
                        font: 'Inter'
                    });
                },
                place: (pos: any) => {
                    // Position for text placement
                }
            }
        };
    }
    
    /**
     * Set device pixel ratio for proper canvas scaling
     */
    setDPR(dpr: number): void {
        (this.klecksManager as any).setDPR?.(dpr);
    }
    
    /**
     * Check if fonts are ready
     */
    async waitForFonts(): Promise<void> {
        if (typeof document !== 'undefined' && document.fonts?.ready) {
            await document.fonts.ready.catch(() => {});
        }
    }
    
    /**
     * Export canvas as PNG
     */
    exportToPNG(): string {
        const canvas = this.getCanvasElement().querySelector('canvas') as HTMLCanvasElement;
        return canvas ? canvas.toDataURL('image/png') : '';
    }
    
    // ==========================================
    // UTILITY
    // ==========================================
    
    destroy(): void {
        this.listeners.clear();
        this.klecksManager.destroy();
    }
}
