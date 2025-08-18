import { KlCanvas } from '../../klecks/canvas/kl-canvas';
import { KlHistory } from '../../klecks/history/kl-history';
import { drawShape } from '../../klecks/image-operations/shape-tool';
import { IShapeToolObject, TShapeToolType, TShapeToolMode, IRGB } from '../../klecks/kl-types';
import { canvasToLayerTiles } from '../../klecks/history/push-helpers/canvas-to-layer-tiles';

/**
 * Complete ShapeManager implementation for headless Klecks usage.
 * Provides access to all shape drawing tools with simplified interface.
 */
export class ShapeManager {
    constructor(
        private klCanvas: KlCanvas,
        private klHistory: KlHistory,
        private manager: any
    ) {}

    /**
     * Draw a rectangle
     */
    drawRectangle(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        options: {
            mode?: TShapeToolMode;
            fillColor?: IRGB;
            strokeColor?: IRGB;
            lineWidth?: number;
            opacity?: number;
            isEraser?: boolean;
            doLockAlpha?: boolean;
            isFixedRatio?: boolean;
            isOutwards?: boolean;
            angleRad?: number;
            layerIndex?: number;
        } = {}
    ): boolean {
        const shapeObj: IShapeToolObject = {
            type: 'rect',
            x1,
            y1,
            x2,
            y2,
            fillRgb: options.fillColor,
            strokeRgb: options.strokeColor,
            lineWidth: options.lineWidth || 1,
            opacity: options.opacity || 1,
            isEraser: options.isEraser || false,
            doLockAlpha: options.doLockAlpha || false,
            isFixedRatio: options.isFixedRatio || false,
            isOutwards: options.isOutwards || false,
            angleRad: options.angleRad || 0,
        };

        return this.drawShapeToLayer(shapeObj, options.layerIndex);
    }

    /**
     * Draw an ellipse
     */
    drawEllipse(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        options: {
            mode?: TShapeToolMode;
            fillColor?: IRGB;
            strokeColor?: IRGB;
            lineWidth?: number;
            opacity?: number;
            isEraser?: boolean;
            doLockAlpha?: boolean;
            isFixedRatio?: boolean;
            isOutwards?: boolean;
            angleRad?: number;
            layerIndex?: number;
        } = {}
    ): boolean {
        const shapeObj: IShapeToolObject = {
            type: 'ellipse',
            x1,
            y1,
            x2,
            y2,
            fillRgb: options.fillColor,
            strokeRgb: options.strokeColor,
            lineWidth: options.lineWidth || 1,
            opacity: options.opacity || 1,
            isEraser: options.isEraser || false,
            doLockAlpha: options.doLockAlpha || false,
            isFixedRatio: options.isFixedRatio || false,
            isOutwards: options.isOutwards || false,
            angleRad: options.angleRad || 0,
        };

        return this.drawShapeToLayer(shapeObj, options.layerIndex);
    }

    /**
     * Draw a line
     */
    drawLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        options: {
            strokeColor?: IRGB;
            lineWidth?: number;
            opacity?: number;
            isEraser?: boolean;
            doLockAlpha?: boolean;
            isAngleSnap?: boolean;
            angleRad?: number;
            layerIndex?: number;
        } = {}
    ): boolean {
        const shapeObj: IShapeToolObject = {
            type: 'line',
            x1,
            y1,
            x2,
            y2,
            strokeRgb: options.strokeColor || { r: 0, g: 0, b: 0 },
            lineWidth: options.lineWidth || 1,
            opacity: options.opacity || 1,
            isEraser: options.isEraser || false,
            doLockAlpha: options.doLockAlpha || false,
            isAngleSnap: options.isAngleSnap || false,
            angleRad: options.angleRad || 0,
        };

        return this.drawShapeToLayer(shapeObj, options.layerIndex);
    }

    /**
     * Draw a filled rectangle
     */
    drawFilledRectangle(
        x: number,
        y: number,
        width: number,
        height: number,
        color: IRGB,
        options: {
            opacity?: number;
            isEraser?: boolean;
            doLockAlpha?: boolean;
            isFixedRatio?: boolean;
            isOutwards?: boolean;
            angleRad?: number;
            layerIndex?: number;
        } = {}
    ): boolean {
        return this.drawRectangle(x, y, x + width, y + height, {
            fillColor: color,
            ...options
        });
    }

    /**
     * Draw a stroked rectangle
     */
    drawStrokedRectangle(
        x: number,
        y: number,
        width: number,
        height: number,
        color: IRGB,
        lineWidth: number = 1,
        options: {
            opacity?: number;
            isEraser?: boolean;
            doLockAlpha?: boolean;
            isFixedRatio?: boolean;
            isOutwards?: boolean;
            angleRad?: number;
            layerIndex?: number;
        } = {}
    ): boolean {
        return this.drawRectangle(x, y, x + width, y + height, {
            strokeColor: color,
            lineWidth,
            ...options
        });
    }

    /**
     * Draw a filled ellipse/circle
     */
    drawFilledEllipse(
        centerX: number,
        centerY: number,
        radiusX: number,
        radiusY: number,
        color: IRGB,
        options: {
            opacity?: number;
            isEraser?: boolean;
            doLockAlpha?: boolean;
            isFixedRatio?: boolean;
            angleRad?: number;
            layerIndex?: number;
        } = {}
    ): boolean {
        return this.drawEllipse(
            centerX - radiusX,
            centerY - radiusY,
            centerX + radiusX,
            centerY + radiusY,
            {
                fillColor: color,
                isOutwards: false,
                ...options
            }
        );
    }

    /**
     * Draw a stroked ellipse/circle
     */
    drawStrokedEllipse(
        centerX: number,
        centerY: number,
        radiusX: number,
        radiusY: number,
        color: IRGB,
        lineWidth: number = 1,
        options: {
            opacity?: number;
            isEraser?: boolean;
            doLockAlpha?: boolean;
            isFixedRatio?: boolean;
            angleRad?: number;
            layerIndex?: number;
        } = {}
    ): boolean {
        return this.drawEllipse(
            centerX - radiusX,
            centerY - radiusY,
            centerX + radiusX,
            centerY + radiusY,
            {
                strokeColor: color,
                lineWidth,
                isOutwards: false,
                ...options
            }
        );
    }

    /**
     * Draw a circle (ellipse with equal radii)
     */
    drawCircle(
        centerX: number,
        centerY: number,
        radius: number,
        color: IRGB,
        options: {
            mode?: 'fill' | 'stroke';
            lineWidth?: number;
            opacity?: number;
            isEraser?: boolean;
            doLockAlpha?: boolean;
            angleRad?: number;
            layerIndex?: number;
        } = {}
    ): boolean {
        const mode = options.mode || 'fill';
        
        if (mode === 'fill') {
            return this.drawFilledEllipse(centerX, centerY, radius, radius, color, {
                ...options,
                isFixedRatio: true
            });
        } else {
            return this.drawStrokedEllipse(centerX, centerY, radius, radius, color, options.lineWidth || 1, {
                ...options,
                isFixedRatio: true
            });
        }
    }

    /**
     * Draw a square
     */
    drawSquare(
        centerX: number,
        centerY: number,
        size: number,
        color: IRGB,
        options: {
            mode?: 'fill' | 'stroke';
            lineWidth?: number;
            opacity?: number;
            isEraser?: boolean;
            doLockAlpha?: boolean;
            angleRad?: number;
            layerIndex?: number;
        } = {}
    ): boolean {
        const halfSize = size / 2;
        const mode = options.mode || 'fill';
        
        if (mode === 'fill') {
            return this.drawFilledRectangle(centerX - halfSize, centerY - halfSize, size, size, color, {
                ...options,
                isFixedRatio: true
            });
        } else {
            return this.drawStrokedRectangle(centerX - halfSize, centerY - halfSize, size, size, color, options.lineWidth || 1, {
                ...options,
                isFixedRatio: true
            });
        }
    }

    /**
     * Draw a path/polygon from points
     */
    drawPath(
        points: Array<{ x: number; y: number }>,
        options: {
            color?: IRGB;
            lineWidth?: number;
            opacity?: number;
            isEraser?: boolean;
            doLockAlpha?: boolean;
            closed?: boolean;
            layerIndex?: number;
        } = {}
    ): boolean {
        if (points.length < 2) {
            console.error('Path must have at least 2 points');
            return false;
        }

        const layerIndex = options.layerIndex ?? this.klCanvas.getActiveLayerIndex();
        const layers = this.klCanvas.getLayers();
        
        if (layerIndex < 0 || layerIndex >= layers.length) {
            console.error(`Invalid layer index: ${layerIndex}`);
            return false;
        }

        const layer = layers[layerIndex];
        const ctx = layer.context;

        ctx.save();
        ctx.globalAlpha = options.opacity || 1;
        if (options.isEraser) {
            ctx.globalCompositeOperation = 'destination-out';
        }
        if (options.doLockAlpha) {
            ctx.globalCompositeOperation = 'source-atop';
        }

        ctx.strokeStyle = `rgb(${options.color?.r || 0}, ${options.color?.g || 0}, ${options.color?.b || 0})`;
        ctx.lineWidth = options.lineWidth || 1;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        
        if (options.closed) {
            ctx.closePath();
        }
        
        ctx.stroke();
        ctx.restore();

        // Update history
        this.updateHistory(layerIndex);
        return true;
    }

    /**
     * Generic method to draw any shape to a specific layer
     */
    private drawShapeToLayer(shapeObj: IShapeToolObject, layerIndex?: number): boolean {
        const targetLayerIndex = layerIndex ?? this.klCanvas.getActiveLayerIndex();
        const layers = this.klCanvas.getLayers();
        
        if (targetLayerIndex < 0 || targetLayerIndex >= layers.length) {
            console.error(`Invalid layer index: ${targetLayerIndex}`);
            return false;
        }

        const layer = layers[targetLayerIndex];
        const ctx = layer.context;

        try {
            drawShape(ctx, shapeObj);
            this.updateHistory(targetLayerIndex);
            return true;
        } catch (error) {
            console.error('Error drawing shape:', error);
            return false;
        }
    }

    /**
     * Get available shape types
     */
    getAvailableShapeTypes(): TShapeToolType[] {
        return ['rect', 'ellipse', 'line'];
    }

    /**
     * Get available shape modes
     */
    getAvailableShapeModes(): TShapeToolMode[] {
        return ['fill', 'stroke'];
    }

    /**
     * Batch draw multiple shapes
     */
    batchDrawShapes(operations: Array<{
        type: 'rectangle' | 'ellipse' | 'line' | 'circle' | 'square' | 'path';
        params: any;
        options?: any;
    }>): boolean {
        let allSuccessful = true;

        for (const operation of operations) {
            let success = false;

            switch (operation.type) {
                case 'rectangle':
                    success = this.drawRectangle(
                        operation.params.x1,
                        operation.params.y1,
                        operation.params.x2,
                        operation.params.y2,
                        operation.options || {}
                    );
                    break;
                case 'ellipse':
                    success = this.drawEllipse(
                        operation.params.x1,
                        operation.params.y1,
                        operation.params.x2,
                        operation.params.y2,
                        operation.options || {}
                    );
                    break;
                case 'line':
                    success = this.drawLine(
                        operation.params.x1,
                        operation.params.y1,
                        operation.params.x2,
                        operation.params.y2,
                        operation.options || {}
                    );
                    break;
                case 'circle':
                    success = this.drawCircle(
                        operation.params.centerX,
                        operation.params.centerY,
                        operation.params.radius,
                        operation.params.color,
                        operation.options || {}
                    );
                    break;
                case 'square':
                    success = this.drawSquare(
                        operation.params.centerX,
                        operation.params.centerY,
                        operation.params.size,
                        operation.params.color,
                        operation.options || {}
                    );
                    break;
                case 'path':
                    success = this.drawPath(
                        operation.params.points,
                        operation.options || {}
                    );
                    break;
                default:
                    console.error(`Unknown shape type: ${operation.type}`);
                    success = false;
            }

            if (!success) {
                allSuccessful = false;
                console.error(`Failed to draw shape: ${operation.type}`);
            }
        }

        return allSuccessful;
    }

    /**
     * Create a shape configuration template
     */
    getShapeTemplate(shapeType: string): any {
        const templates = {
            rectangle: {
                x1: 10,
                y1: 10,
                x2: 100,
                y2: 60,
                options: {
                    fillColor: { r: 255, g: 0, b: 0 },
                    opacity: 1
                }
            },
            ellipse: {
                x1: 10,
                y1: 10,
                x2: 100,
                y2: 60,
                options: {
                    fillColor: { r: 0, g: 255, b: 0 },
                    opacity: 1
                }
            },
            line: {
                x1: 10,
                y1: 10,
                x2: 100,
                y2: 60,
                options: {
                    strokeColor: { r: 0, g: 0, b: 255 },
                    lineWidth: 2,
                    opacity: 1
                }
            },
            circle: {
                centerX: 50,
                centerY: 50,
                radius: 30,
                color: { r: 255, g: 255, b: 0 },
                options: {
                    mode: 'fill',
                    opacity: 1
                }
            },
            square: {
                centerX: 50,
                centerY: 50,
                size: 50,
                color: { r: 255, g: 0, b: 255 },
                options: {
                    mode: 'fill',
                    opacity: 1
                }
            }
        };

        return templates[shapeType] || null;
    }

    /**
     * Update history after shape operation
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
