import { KlCanvas, TKlCanvasLayer } from '../../klecks/canvas/kl-canvas';
import { KlHistory } from '../../klecks/history/kl-history';
import { TMixMode, IKlProjectLayer } from '../../klecks/kl-types';
import { BB } from '../../bb/bb';

export interface ILayerInfo {
    index: number;
    name: string;
    isVisible: boolean;
    opacity: number;
    mixMode: TMixMode;
    width: number;
    height: number;
}

/**
 * Manager for layer operations - creation, deletion, reordering, properties
 */
export class LayerManager {
    constructor(
        private klCanvas: KlCanvas,
        private klHistory: KlHistory,
        private manager: any // KlecksManager
    ) {}
    
    /**
     * Create a new layer
     */
    create(name?: string, index?: number): number {
        const layerName = name || `Layer ${this.getCount() + 1}`;
        const result = this.klCanvas.addLayer(index, {
            name: layerName,
            isVisible: true,
            opacity: 1,
            mixModeStr: 'source-over',
            image: () => {} // empty drawing function
        });
        
        return result !== false ? result : -1;
    }
    
    /**
     * Delete a layer by index
     */
    delete(index: number): boolean {
        if (this.getCount() <= 1) {
            throw new Error('Cannot delete the last layer');
        }
        
        const result = this.klCanvas.removeLayer(index);
        return result !== false;
    }
    
    /**
     * Duplicate a layer
     */
    duplicate(index: number): number {
        return this.klCanvas.duplicateLayer(index) || index;
    }
    
    /**
     * Move a layer to a new position
     */
    move(fromIndex: number, toIndex: number): boolean {
        if (fromIndex === toIndex) return true;
        
        const delta = toIndex - fromIndex;
        const result = this.klCanvas.moveLayer(fromIndex, delta);
        return result !== undefined;
    }
    
    /**
     * Set layer visibility
     */
    setVisible(index: number, isVisible: boolean): void {
        this.klCanvas.setLayerIsVisible(index, isVisible);
    }
    
    /**
     * Set layer opacity
     */
    setOpacity(index: number, opacity: number): void {
        const clampedOpacity = Math.max(0, Math.min(1, opacity));
        this.klCanvas.setOpacity(index, clampedOpacity);
    }
    
    /**
     * Set layer blend mode
     */
    setMixMode(index: number, mixMode: TMixMode): void {
        this.klCanvas.setMixMode(index, mixMode);
    }
    
    /**
     * Rename a layer
     */
    rename(index: number, name: string): void {
        this.klCanvas.renameLayer(index, name);
    }
    
    /**
     * Get layer information
     */
    getInfo(index: number): ILayerInfo | null {
        const layer = this.klCanvas.getLayer(index);
        if (!layer) return null;
        
        return {
            index,
            name: layer.name,
            isVisible: layer.isVisible,
            opacity: layer.opacity,
            mixMode: layer.mixModeStr,
            width: layer.canvas.width,
            height: layer.canvas.height
        };
    }
    
    /**
     * Get all layers information
     */
    getAllInfo(): ILayerInfo[] {
        const layers: ILayerInfo[] = [];
        const count = this.klCanvas.getLayerCount();
        
        for (let i = 0; i < count; i++) {
            const info = this.getInfo(i);
            if (info) {
                layers.push(info);
            }
        }
        
        return layers;
    }
    
    /**
     * Get the number of layers
     */
    getCount(): number {
        return this.klCanvas.getLayerCount();
    }
    
    /**
     * Get the active layer index
     */
    getActiveIndex(): number {
        // KlCanvas doesn't track active layer, so we'll use the composed data
        const composed = this.klHistory.getComposed();
        const activeLayerId = composed.activeLayerId;
        // Find the layer with this ID
        const layers = this.klCanvas.getLayers();
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].id === activeLayerId) {
                return i;
            }
        }
        return 0; // fallback to first layer
    }
    
    /**
     * Set the active layer
     */
    setActive(index: number): void {
        if (index < 0 || index >= this.getCount()) {
            throw new Error(`Layer index ${index} out of bounds`);
        }
        
        const layer = this.klCanvas.getLayer(index);
        if (layer) {
            this.klHistory.push({
                activeLayerId: layer.id
            });
        }
    }
    
    /**
     * Clear a layer (make it transparent)
     */
    clearLayer(index: number): void {
        this.klCanvas.eraseLayer({
            layerIndex: index,
            useAlphaLock: false,
            useSelection: false
        });
    }
    
    /**
     * Fill a layer with a solid color
     */
    fill(index: number, color: { r: number; g: number; b: number }): void {
        this.klCanvas.layerFill(index, color);
    }
    
    /**
     * Merge layer down (combine with layer below)
     */
    mergeDown(index: number): boolean {
        if (index <= 0) {
            throw new Error('Cannot merge down the bottom layer');
        }
        
        const upperLayer = this.klCanvas.getLayer(index);
        const lowerLayer = this.klCanvas.getLayer(index - 1);
        
        if (!upperLayer || !lowerLayer) return false;
        
        const result = this.klCanvas.mergeLayers(index - 1, index, upperLayer.mixModeStr);
        return result !== undefined;
    }
    
    /**
     * Flatten all visible layers into one
     */
    flatten(): void {
        if (this.getCount() <= 1) return;
        
        this.klCanvas.mergeAll();
        this.setActive(0);
    }
    
    /**
     * Get available blend modes
     */
    getAvailableMixModes(): TMixMode[] {
        return [
            'source-over',
            'darken',
            'multiply',
            'color-burn',
            'lighten',
            'screen',
            'color-dodge',
            'overlay',
            'soft-light',
            'hard-light',
            'difference',
            'exclusion',
            'hue',
            'saturation',
            'color',
            'luminosity'
        ];
    }
    
    /**
     * Destroy the manager
     */
    destroy(): void {
        // Nothing specific to clean up
    }
}
