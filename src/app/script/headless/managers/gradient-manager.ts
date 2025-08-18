import { KlCanvas } from '../../klecks/canvas/kl-canvas';
import { KlHistory } from '../../klecks/history/kl-history';
import { drawGradient } from '../../klecks/image-operations/gradient-tool';
import { IGradient, TGradientType, IRGB } from '../../klecks/kl-types';
import { canvasToLayerTiles } from '../../klecks/history/push-helpers/canvas-to-layer-tiles';

/**
 * Complete GradientManager implementation for headless Klecks usage.
 * Provides access to all gradient tools with simplified interface.
 */
export class GradientManager {
    constructor(
        private klCanvas: KlCanvas,
        private klHistory: KlHistory,
        private manager: any
    ) {}

    /**
     * Create a linear gradient
     */
    createLinearGradient(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: IRGB,
        options: {
            opacity?: number;
            doLockAlpha?: boolean;
            doSnap?: boolean;
            isReversed?: boolean;
            isEraser?: boolean;
            angleRad?: number;
            layerIndex?: number;
        } = {}
    ): boolean {
        const gradientObj: IGradient = {
            type: 'linear',
            color1: color,
            isReversed: options.isReversed || false,
            opacity: options.opacity || 1,
            doLockAlpha: options.doLockAlpha || false,
            doSnap: options.doSnap || false,
            x1,
            y1,
            x2,
            y2,
            angleRad: options.angleRad || 0,
            isEraser: options.isEraser || false,
        };

        return this.drawGradientToLayer(gradientObj, options.layerIndex);
    }

    /**
     * Create a linear mirror gradient (symmetric)
     */
    createLinearMirrorGradient(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: IRGB,
        options: {
            opacity?: number;
            doLockAlpha?: boolean;
            doSnap?: boolean;
            isReversed?: boolean;
            isEraser?: boolean;
            angleRad?: number;
            layerIndex?: number;
        } = {}
    ): boolean {
        const gradientObj: IGradient = {
            type: 'linear-mirror',
            color1: color,
            isReversed: options.isReversed || false,
            opacity: options.opacity || 1,
            doLockAlpha: options.doLockAlpha || false,
            doSnap: options.doSnap || false,
            x1,
            y1,
            x2,
            y2,
            angleRad: options.angleRad || 0,
            isEraser: options.isEraser || false,
        };

        return this.drawGradientToLayer(gradientObj, options.layerIndex);
    }

    /**
     * Create a radial gradient
     */
    createRadialGradient(
        centerX: number,
        centerY: number,
        radiusX: number,
        radiusY: number,
        color: IRGB,
        options: {
            opacity?: number;
            doLockAlpha?: boolean;
            isReversed?: boolean;
            isEraser?: boolean;
            angleRad?: number;
            layerIndex?: number;
        } = {}
    ): boolean {
        const gradientObj: IGradient = {
            type: 'radial',
            color1: color,
            isReversed: options.isReversed || false,
            opacity: options.opacity || 1,
            doLockAlpha: options.doLockAlpha || false,
            doSnap: false, // Not applicable for radial gradients
            x1: centerX,
            y1: centerY,
            x2: centerX + radiusX,
            y2: centerY + radiusY,
            angleRad: options.angleRad || 0,
            isEraser: options.isEraser || false,
        };

        return this.drawGradientToLayer(gradientObj, options.layerIndex);
    }

    /**
     * Create a radial gradient with equal radius (circular)
     */
    createCircularGradient(
        centerX: number,
        centerY: number,
        radius: number,
        color: IRGB,
        options: {
            opacity?: number;
            doLockAlpha?: boolean;
            isReversed?: boolean;
            isEraser?: boolean;
            layerIndex?: number;
        } = {}
    ): boolean {
        return this.createRadialGradient(centerX, centerY, radius, 0, color, options);
    }

    /**
     * Create a horizontal linear gradient
     */
    createHorizontalGradient(
        x: number,
        y: number,
        width: number,
        color: IRGB,
        options: {
            opacity?: number;
            doLockAlpha?: boolean;
            isReversed?: boolean;
            isEraser?: boolean;
            layerIndex?: number;
        } = {}
    ): boolean {
        return this.createLinearGradient(x, y, x + width, y, color, options);
    }

    /**
     * Create a vertical linear gradient
     */
    createVerticalGradient(
        x: number,
        y: number,
        height: number,
        color: IRGB,
        options: {
            opacity?: number;
            doLockAlpha?: boolean;
            isReversed?: boolean;
            isEraser?: boolean;
            layerIndex?: number;
        } = {}
    ): boolean {
        return this.createLinearGradient(x, y, x, y + height, color, options);
    }

    /**
     * Create a diagonal linear gradient
     */
    createDiagonalGradient(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: IRGB,
        options: {
            opacity?: number;
            doLockAlpha?: boolean;
            isReversed?: boolean;
            isEraser?: boolean;
            doSnap?: boolean;
            layerIndex?: number;
        } = {}
    ): boolean {
        return this.createLinearGradient(x1, y1, x2, y2, color, {
            ...options,
            doSnap: options.doSnap !== undefined ? options.doSnap : true
        });
    }

    /**
     * Generic method to draw any gradient to a specific layer
     */
    private drawGradientToLayer(gradientObj: IGradient, layerIndex?: number): boolean {
        const targetLayerIndex = layerIndex ?? this.klCanvas.getActiveLayerIndex();
        const layers = this.klCanvas.getLayers();
        
        if (targetLayerIndex < 0 || targetLayerIndex >= layers.length) {
            console.error(`Invalid layer index: ${targetLayerIndex}`);
            return false;
        }

        const layer = layers[targetLayerIndex];
        const ctx = layer.context;

        try {
            drawGradient(ctx, gradientObj);
            this.updateHistory(targetLayerIndex);
            return true;
        } catch (error) {
            console.error('Error drawing gradient:', error);
            return false;
        }
    }

    /**
     * Get available gradient types
     */
    getAvailableGradientTypes(): TGradientType[] {
        return ['linear', 'linear-mirror', 'radial'];
    }

    /**
     * Create gradient fill for entire layer
     */
    fillLayerWithGradient(
        gradientType: TGradientType,
        color: IRGB,
        options: {
            opacity?: number;
            doLockAlpha?: boolean;
            isReversed?: boolean;
            isEraser?: boolean;
            layerIndex?: number;
        } = {}
    ): boolean {
        const targetLayerIndex = options.layerIndex ?? this.klCanvas.getActiveLayerIndex();
        const layers = this.klCanvas.getLayers();
        
        if (targetLayerIndex < 0 || targetLayerIndex >= layers.length) {
            console.error(`Invalid layer index: ${targetLayerIndex}`);
            return false;
        }

        const layer = layers[targetLayerIndex];
        const width = layer.canvas.width;
        const height = layer.canvas.height;

        let gradientObj: IGradient;

        switch (gradientType) {
            case 'linear':
                gradientObj = {
                    type: 'linear',
                    color1: color,
                    isReversed: options.isReversed || false,
                    opacity: options.opacity || 1,
                    doLockAlpha: options.doLockAlpha || false,
                    doSnap: false,
                    x1: 0,
                    y1: 0,
                    x2: width,
                    y2: 0,
                    angleRad: 0,
                    isEraser: options.isEraser || false,
                };
                break;
            case 'linear-mirror':
                gradientObj = {
                    type: 'linear-mirror',
                    color1: color,
                    isReversed: options.isReversed || false,
                    opacity: options.opacity || 1,
                    doLockAlpha: options.doLockAlpha || false,
                    doSnap: false,
                    x1: width / 4,
                    y1: height / 2,
                    x2: (3 * width) / 4,
                    y2: height / 2,
                    angleRad: 0,
                    isEraser: options.isEraser || false,
                };
                break;
            case 'radial':
                const centerX = width / 2;
                const centerY = height / 2;
                const radius = Math.min(width, height) / 2;
                gradientObj = {
                    type: 'radial',
                    color1: color,
                    isReversed: options.isReversed || false,
                    opacity: options.opacity || 1,
                    doLockAlpha: options.doLockAlpha || false,
                    doSnap: false,
                    x1: centerX,
                    y1: centerY,
                    x2: centerX + radius,
                    y2: centerY,
                    angleRad: 0,
                    isEraser: options.isEraser || false,
                };
                break;
            default:
                console.error(`Unknown gradient type: ${gradientType}`);
                return false;
        }

        return this.drawGradientToLayer(gradientObj, targetLayerIndex);
    }

    /**
     * Batch create multiple gradients
     */
    batchCreateGradients(operations: Array<{
        type: 'linear' | 'linear-mirror' | 'radial' | 'circular' | 'horizontal' | 'vertical' | 'diagonal';
        params: any;
        options?: any;
    }>): boolean {
        let allSuccessful = true;

        for (const operation of operations) {
            let success = false;

            switch (operation.type) {
                case 'linear':
                    success = this.createLinearGradient(
                        operation.params.x1,
                        operation.params.y1,
                        operation.params.x2,
                        operation.params.y2,
                        operation.params.color,
                        operation.options || {}
                    );
                    break;
                case 'linear-mirror':
                    success = this.createLinearMirrorGradient(
                        operation.params.x1,
                        operation.params.y1,
                        operation.params.x2,
                        operation.params.y2,
                        operation.params.color,
                        operation.options || {}
                    );
                    break;
                case 'radial':
                    success = this.createRadialGradient(
                        operation.params.centerX,
                        operation.params.centerY,
                        operation.params.radiusX,
                        operation.params.radiusY,
                        operation.params.color,
                        operation.options || {}
                    );
                    break;
                case 'circular':
                    success = this.createCircularGradient(
                        operation.params.centerX,
                        operation.params.centerY,
                        operation.params.radius,
                        operation.params.color,
                        operation.options || {}
                    );
                    break;
                case 'horizontal':
                    success = this.createHorizontalGradient(
                        operation.params.x,
                        operation.params.y,
                        operation.params.width,
                        operation.params.color,
                        operation.options || {}
                    );
                    break;
                case 'vertical':
                    success = this.createVerticalGradient(
                        operation.params.x,
                        operation.params.y,
                        operation.params.height,
                        operation.params.color,
                        operation.options || {}
                    );
                    break;
                case 'diagonal':
                    success = this.createDiagonalGradient(
                        operation.params.x1,
                        operation.params.y1,
                        operation.params.x2,
                        operation.params.y2,
                        operation.params.color,
                        operation.options || {}
                    );
                    break;
                default:
                    console.error(`Unknown gradient type: ${operation.type}`);
                    success = false;
            }

            if (!success) {
                allSuccessful = false;
                console.error(`Failed to create gradient: ${operation.type}`);
            }
        }

        return allSuccessful;
    }

    /**
     * Create a gradient configuration template
     */
    getGradientTemplate(gradientType: string): any {
        const templates = {
            linear: {
                x1: 10,
                y1: 10,
                x2: 200,
                y2: 10,
                color: { r: 255, g: 0, b: 0 },
                options: {
                    opacity: 1,
                    isReversed: false
                }
            },
            'linear-mirror': {
                x1: 50,
                y1: 50,
                x2: 150,
                y2: 50,
                color: { r: 0, g: 255, b: 0 },
                options: {
                    opacity: 1,
                    isReversed: false
                }
            },
            radial: {
                centerX: 100,
                centerY: 100,
                radiusX: 50,
                radiusY: 50,
                color: { r: 0, g: 0, b: 255 },
                options: {
                    opacity: 1,
                    isReversed: false
                }
            },
            circular: {
                centerX: 100,
                centerY: 100,
                radius: 50,
                color: { r: 255, g: 255, b: 0 },
                options: {
                    opacity: 1,
                    isReversed: false
                }
            },
            horizontal: {
                x: 10,
                y: 50,
                width: 180,
                color: { r: 255, g: 0, b: 255 },
                options: {
                    opacity: 1,
                    isReversed: false
                }
            },
            vertical: {
                x: 50,
                y: 10,
                height: 180,
                color: { r: 0, g: 255, b: 255 },
                options: {
                    opacity: 1,
                    isReversed: false
                }
            }
        };

        return templates[gradientType] || null;
    }

    /**
     * Update history after gradient operation
     */
    private updateHistory(layerIndex: number): void {
        const layers = this.klCanvas.getLayers();
        const layerMap = Object.fromEntries(
            layers.map((layerItem, index) => {
                if (index === layerIndex) {
                    return [
                        layerItem.id,
                        {
                            tiles: canvasToLayerTiles(layerItem.canvas),
                        },
                    ];
                }
                return [layerItem.id, {}];
            })
        );

        this.klHistory.push({
            layerMap,
        });
    }

    destroy(): void {
        // Clean up resources if needed
    }
}
