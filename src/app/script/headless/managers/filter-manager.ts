import { KlCanvas } from '../../klecks/canvas/kl-canvas';
import { KlHistory } from '../../klecks/history/kl-history';
import { filterLib, filterLibStatus } from '../../klecks/filters/filters';
import { importFilters } from '../../klecks/filters/filters-lazy';
import { IFilterApply } from '../../klecks/kl-types';

/**
 * Complete FilterManager implementation for headless Klecks usage.
 * Provides access to all Klecks filters with simplified parameter-based interface.
 */
export class FilterManager {
    constructor(
        private klCanvas: KlCanvas,
        private klHistory: KlHistory,
        private manager: any
    ) {
        // Initialize filters if not already loaded
        if (!filterLibStatus.isLoaded) {
            importFilters();
        }
    }

    /**
     * Get list of all available filters
     */
    getAvailableFilters(): string[] {
        return Object.keys(filterLib);
    }

    /**
     * Get filter information
     */
    getFilterInfo(filterName: string) {
        const filter = filterLib[filterName];
        if (!filter) return null;

        return {
            name: filterName,
            isInstant: filter.isInstant || false,
            updatePos: filter.updatePos,
            hasDialog: !!filter.getDialog,
            webGL: filter.webGL || false,
            lang: filter.lang,
        };
    }

    /**
     * Apply blur filter
     */
    applyBlur(radius: number = 10): boolean {
        return this.applyFilterToActiveLayer('blur', { radius });
    }

    /**
     * Apply brightness-contrast filter
     */
    applyBrightnessContrast(brightness: number = 0, contrast: number = 0): boolean {
        return this.applyFilterToActiveLayer('brightnessContrast', { brightness, contrast });
    }

    /**
     * Apply hue-saturation filter
     */
    applyHueSaturation(hue: number = 0, saturation: number = 0): boolean {
        return this.applyFilterToActiveLayer('hueSaturation', { hue, saturation });
    }

    /**
     * Apply invert filter (no parameters)
     */
    applyInvert(): boolean {
        return this.applyFilterToActiveLayer('invert', null);
    }

    /**
     * Apply unsharp mask filter
     */
    applyUnsharpMask(radius: number = 10, strength: number = 1): boolean {
        return this.applyFilterToActiveLayer('unsharpMask', { radius, strength });
    }

    /**
     * Apply tilt shift filter
     */
    applyTiltShift(focusY: number = 0.5, strength: number = 0.5, gradientHeight: number = 0.5): boolean {
        return this.applyFilterToActiveLayer('tiltShift', { focusY, strength, gradientHeight });
    }

    /**
     * Apply curves filter
     */
    applyCurves(curvesInput: any): boolean {
        return this.applyFilterToActiveLayer('curves', curvesInput);
    }

    /**
     * Apply distort filter
     */
    applyDistort(points: any[]): boolean {
        return this.applyFilterToActiveLayer('distort', { points });
    }

    /**
     * Apply flip filter
     */
    applyFlip(isX: boolean = false): boolean {
        return this.applyFilterToActiveLayer('flip', { isX });
    }

    /**
     * Apply perspective filter
     */
    applyPerspective(corners: any[]): boolean {
        return this.applyFilterToActiveLayer('perspective', { corners });
    }

    /**
     * Apply crop/extend filter
     */
    applyCropExtend(left: number, top: number, right: number, bottom: number): boolean {
        return this.applyFilterToActiveLayer('cropExtend', { left, top, right, bottom });
    }

    /**
     * Apply resize filter
     */
    applyResize(width: number, height: number, algorithm: string = 'smooth'): boolean {
        return this.applyFilterToActiveLayer('resize', { width, height, algorithm });
    }

    /**
     * Apply rotate filter
     */
    applyRotate(angleDeg: number): boolean {
        return this.applyFilterToActiveLayer('rotate', { angleDeg });
    }

    /**
     * Apply transform filter
     */
    applyTransform(transformMatrix: number[]): boolean {
        return this.applyFilterToActiveLayer('transform', { transformMatrix });
    }

    /**
     * Apply to alpha filter
     */
    applyToAlpha(colorRgb: { r: number; g: number; b: number }, threshold: number = 0): boolean {
        return this.applyFilterToActiveLayer('toAlpha', { colorRgb, threshold });
    }

    /**
     * Apply grid filter
     */
    applyGrid(size: number = 10, color: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 }, opacity: number = 1): boolean {
        return this.applyFilterToActiveLayer('grid', { size, color, opacity });
    }

    /**
     * Apply noise filter
     */
    applyNoise(seed: number = 0, density: number = 0.5, colorful: boolean = false, strength: number = 1): boolean {
        return this.applyFilterToActiveLayer('noise', { seed, density, colorful, strength });
    }

    /**
     * Apply pattern filter
     */
    applyPattern(patternType: string = 'dots', color: any = null): boolean {
        return this.applyFilterToActiveLayer('pattern', { patternType, color });
    }

    /**
     * Apply vanish point filter
     */
    applyVanishPoint(x: number = 0.5, y: number = 0.5, strength: number = 0.5): boolean {
        return this.applyFilterToActiveLayer('vanishPoint', { x, y, strength });
    }

    /**
     * Generic method to apply any filter to the active layer
     */
    applyFilterToActiveLayer(filterName: string, params: any): boolean {
        const filter = filterLib[filterName];
        if (!filter || !filter.apply) {
            console.error(`Filter ${filterName} not found or not available`);
            return false;
        }

        const activeLayer = this.klCanvas.getLayerContext(this.klCanvas.getActiveLayerIndex());
        if (!activeLayer) {
            console.error('No active layer found');
            return false;
        }

        const filterParams: IFilterApply = {
            layer: this.klCanvas.getLayers()[this.klCanvas.getActiveLayerIndex()],
            klCanvas: this.klCanvas,
            input: params,
            klHistory: this.klHistory,
        };

        try {
            return filter.apply(filterParams);
        } catch (error) {
            console.error(`Error applying filter ${filterName}:`, error);
            return false;
        }
    }

    /**
     * Apply filter to specific layer by index
     */
    applyFilterToLayer(filterName: string, layerIndex: number, params: any): boolean {
        const filter = filterLib[filterName];
        if (!filter || !filter.apply) {
            console.error(`Filter ${filterName} not found or not available`);
            return false;
        }

        const layers = this.klCanvas.getLayers();
        if (layerIndex < 0 || layerIndex >= layers.length) {
            console.error(`Invalid layer index: ${layerIndex}`);
            return false;
        }

        const filterParams: IFilterApply = {
            layer: layers[layerIndex],
            klCanvas: this.klCanvas,
            input: params,
            klHistory: this.klHistory,
        };

        try {
            return filter.apply(filterParams);
        } catch (error) {
            console.error(`Error applying filter ${filterName} to layer ${layerIndex}:`, error);
            return false;
        }
    }

    /**
     * Get parameters schema for a specific filter (for UI generation)
     */
    getFilterParameterSchema(filterName: string): any {
        const schemas: { [key: string]: any } = {
            blur: {
                radius: { type: 'number', min: 1, max: 200, default: 10, label: 'Radius' }
            },
            brightnessContrast: {
                brightness: { type: 'number', min: -1, max: 1, default: 0, label: 'Brightness' },
                contrast: { type: 'number', min: -1, max: 1, default: 0, label: 'Contrast' }
            },
            hueSaturation: {
                hue: { type: 'number', min: -1, max: 1, default: 0, label: 'Hue' },
                saturation: { type: 'number', min: -1, max: 1, default: 0, label: 'Saturation' }
            },
            invert: null, // No parameters
            unsharpMask: {
                radius: { type: 'number', min: 1, max: 100, default: 10, label: 'Radius' },
                strength: { type: 'number', min: 0, max: 10, default: 1, label: 'Strength' }
            },
            tiltShift: {
                focusY: { type: 'number', min: 0, max: 1, default: 0.5, label: 'Focus Y' },
                strength: { type: 'number', min: 0, max: 1, default: 0.5, label: 'Strength' },
                gradientHeight: { type: 'number', min: 0, max: 1, default: 0.5, label: 'Gradient Height' }
            },
            flip: {
                isX: { type: 'boolean', default: false, label: 'Flip Horizontal' }
            },
            cropExtend: {
                left: { type: 'number', min: -1000, max: 1000, default: 0, label: 'Left' },
                top: { type: 'number', min: -1000, max: 1000, default: 0, label: 'Top' },
                right: { type: 'number', min: -1000, max: 1000, default: 0, label: 'Right' },
                bottom: { type: 'number', min: -1000, max: 1000, default: 0, label: 'Bottom' }
            },
            resize: {
                width: { type: 'number', min: 1, max: 8000, default: 800, label: 'Width' },
                height: { type: 'number', min: 1, max: 8000, default: 600, label: 'Height' },
                algorithm: { type: 'select', options: ['smooth', 'pixelated'], default: 'smooth', label: 'Algorithm' }
            },
            rotate: {
                angleDeg: { type: 'number', min: -360, max: 360, default: 90, label: 'Angle (degrees)' }
            },
            toAlpha: {
                colorRgb: { type: 'color', default: { r: 255, g: 255, b: 255 }, label: 'Target Color' },
                threshold: { type: 'number', min: 0, max: 255, default: 0, label: 'Threshold' }
            },
            grid: {
                size: { type: 'number', min: 1, max: 100, default: 10, label: 'Grid Size' },
                color: { type: 'color', default: { r: 0, g: 0, b: 0 }, label: 'Grid Color' },
                opacity: { type: 'number', min: 0, max: 1, default: 1, label: 'Opacity' }
            },
            noise: {
                seed: { type: 'number', min: 0, max: 1000, default: 0, label: 'Seed' },
                density: { type: 'number', min: 0, max: 1, default: 0.5, label: 'Density' },
                colorful: { type: 'boolean', default: false, label: 'Colorful' },
                strength: { type: 'number', min: 0, max: 2, default: 1, label: 'Strength' }
            },
            pattern: {
                patternType: { type: 'select', options: ['dots', 'lines', 'grid'], default: 'dots', label: 'Pattern Type' }
            },
            vanishPoint: {
                x: { type: 'number', min: 0, max: 1, default: 0.5, label: 'X Position' },
                y: { type: 'number', min: 0, max: 1, default: 0.5, label: 'Y Position' },
                strength: { type: 'number', min: 0, max: 1, default: 0.5, label: 'Strength' }
            }
        };

        return schemas[filterName] || null;
    }

    /**
     * Batch apply multiple filters in sequence
     */
    batchApplyFilters(filterOperations: Array<{ filterName: string; params: any; layerIndex?: number }>): boolean {
        let allSuccessful = true;

        for (const operation of filterOperations) {
            const success = operation.layerIndex !== undefined 
                ? this.applyFilterToLayer(operation.filterName, operation.layerIndex, operation.params)
                : this.applyFilterToActiveLayer(operation.filterName, operation.params);
            
            if (!success) {
                allSuccessful = false;
                console.error(`Failed to apply filter: ${operation.filterName}`);
            }
        }

        return allSuccessful;
    }

    destroy(): void {
        // Clean up resources if needed
    }
}
