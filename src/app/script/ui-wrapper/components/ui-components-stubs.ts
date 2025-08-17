import { CanvasApiBridge } from '../canvas-api-bridge';
import { BB } from '../../bb/bb';
import { IRGB } from '../../klecks/kl-types';

/**
 * Stub UI components - these provide basic functionality for development/testing
 * In a full implementation, these would be much more sophisticated
 */

export class ToolbarUI {
    private readonly rootEl: HTMLElement;
    private activeTool: string = 'brush';
    
    public onToolChanged: (tool: string) => void = () => {};
    
    constructor(private canvasApi: CanvasApiBridge) {
        this.rootEl = this.createToolbar();
    }
    
    private createToolbar(): HTMLElement {
        const toolbar = BB.el({
            className: 'toolbar',
            css: {
                padding: '10px',
                borderBottom: '1px solid #ccc',
                background: '#f0f0f0'
            }
        });
        
        const tools = [
            { id: 'brush', label: 'Brush (B)', icon: '🖌️' },
            { id: 'text', label: 'Text (T)', icon: '📝' },
            { id: 'hand', label: 'Hand (H)', icon: '✋' },
        ];
        
        tools.forEach(tool => {
            const button = BB.el({
                tagName: 'button',
                content: `${tool.icon} ${tool.label}`,
                css: {
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    margin: '2px 0',
                    border: '1px solid #999',
                    borderRadius: '3px',
                    background: tool.id === this.activeTool ? '#007cba' : '#fff',
                    color: tool.id === this.activeTool ? '#fff' : '#000',
                    cursor: 'pointer'
                },
                onClick: () => {
                    this.setActiveTool(tool.id);
                    this.onToolChanged(tool.id);
                }
            });
            toolbar.appendChild(button);
        });
        
        return toolbar;
    }
    
    setActiveTool(tool: string): void {
        this.activeTool = tool;
        // Update button styles
        const buttons = this.rootEl.querySelectorAll('button');
        buttons.forEach((btn, index) => {
            const tools = ['brush', 'text', 'hand'];
            const isActive = tools[index] === tool;
            BB.css(btn as HTMLElement, {
                background: isActive ? '#007cba' : '#fff',
                color: isActive ? '#fff' : '#000'
            });
        });
    }
    
    getElement(): HTMLElement { return this.rootEl; }
    destroy(): void { BB.destroyEl(this.rootEl); }
}

export class TextToolUI {
    private readonly rootEl: HTMLElement;
    private visible: boolean = false;
    
    constructor(private canvasApi: CanvasApiBridge) {
        this.rootEl = this.createTextUI();
    }
    
    private createTextUI(): HTMLElement {
        const panel = BB.el({
            className: 'text-tool-panel',
            css: {
                padding: '15px',
                borderBottom: '1px solid #ccc',
                display: 'none'
            }
        });
        
        panel.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">Text Tool</h3>
            <div style="margin-bottom: 10px;">
                <input type="text" id="text-input" placeholder="Enter text" value="Hello World!" 
                       style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
            </div>
            <div style="margin-bottom: 10px;">
                <label>Size: </label>
                <input type="number" id="text-size" value="24" min="8" max="200"
                       style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
            </div>
            <div style="margin-bottom: 10px;">
                <label>Font: </label>
                <select id="text-font" style="padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                    <option value="sans-serif">Sans-serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                </select>
            </div>
            <div>
                <button id="create-text-btn" style="padding: 5px 10px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px;">
                    Create Text
                </button>
                <button id="finalize-text-btn" style="padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px;">
                    Finalize All
                </button>
                <button id="cancel-text-btn" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    Cancel All
                </button>
            </div>
        `;
        
        // Add event listeners
        panel.querySelector('#create-text-btn')?.addEventListener('click', () => {
            const text = (panel.querySelector('#text-input') as HTMLInputElement).value;
            const size = parseInt((panel.querySelector('#text-size') as HTMLInputElement).value);
            const font = (panel.querySelector('#text-font') as HTMLSelectElement).value;
            
            this.canvasApi.createText({
                text,
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100,
                size,
                font,
                fillColor: { r: 0, g: 0, b: 0, a: 1 }
            });
        });
        
        panel.querySelector('#finalize-text-btn')?.addEventListener('click', () => {
            this.canvasApi.finalizeAllText();
        });
        
        panel.querySelector('#cancel-text-btn')?.addEventListener('click', () => {
            this.canvasApi.cancelAllText();
        });
        
        return panel;
    }
    
    setVisible(visible: boolean): void {
        this.visible = visible;
        this.rootEl.style.display = visible ? 'block' : 'none';
    }
    
    getElement(): HTMLElement { return this.rootEl; }
    destroy(): void { BB.destroyEl(this.rootEl); }
}

export class BrushToolUI {
    private readonly rootEl: HTMLElement;
    private visible: boolean = true;
    
    constructor(private canvasApi: CanvasApiBridge) {
        this.rootEl = this.createBrushUI();
    }
    
    private createBrushUI(): HTMLElement {
        const panel = BB.el({
            className: 'brush-tool-panel',
            css: {
                padding: '15px',
                borderBottom: '1px solid #ccc',
                display: 'block'
            }
        });
        
        panel.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">Brush Tool</h3>
            <div style="margin-bottom: 10px;">
                <label>Size: </label>
                <input type="range" id="brush-size" min="1" max="100" value="10"
                       style="width: 150px;">
                <span id="size-display">10</span>px
            </div>
            <div style="margin-bottom: 10px;">
                <label>Opacity: </label>
                <input type="range" id="brush-opacity" min="1" max="100" value="100"
                       style="width: 150px;">
                <span id="opacity-display">100</span>%
            </div>
            <div style="margin-bottom: 10px;">
                <label>Type: </label>
                <select id="brush-type" style="padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                    <option value="penBrush">Pen</option>
                    <option value="blendBrush">Blend</option>
                    <option value="sketchyBrush">Sketchy</option>
                </select>
            </div>
            <div>
                <button id="test-line-btn" style="padding: 5px 10px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px;">
                    Draw Test Line
                </button>
            </div>
        `;
        
        // Add event listeners
        const sizeSlider = panel.querySelector('#brush-size') as HTMLInputElement;
        const sizeDisplay = panel.querySelector('#size-display') as HTMLElement;
        const opacitySlider = panel.querySelector('#brush-opacity') as HTMLInputElement;
        const opacityDisplay = panel.querySelector('#opacity-display') as HTMLElement;
        const brushType = panel.querySelector('#brush-type') as HTMLSelectElement;
        
        sizeSlider.addEventListener('input', () => {
            const size = parseInt(sizeSlider.value);
            sizeDisplay.textContent = size.toString();
            this.canvasApi.setBrushSize(size);
        });
        
        opacitySlider.addEventListener('input', () => {
            const opacity = parseInt(opacitySlider.value);
            opacityDisplay.textContent = opacity.toString();
            this.canvasApi.setBrushOpacity(opacity / 100);
        });
        
        brushType.addEventListener('change', () => {
            this.canvasApi.setBrushType(brushType.value);
        });
        
        panel.querySelector('#test-line-btn')?.addEventListener('click', () => {
            this.canvasApi.drawLine(100, 100, 300, 200);
        });
        
        return panel;
    }
    
    setVisible(visible: boolean): void {
        this.visible = visible;
        this.rootEl.style.display = visible ? 'block' : 'none';
    }
    
    getElement(): HTMLElement { return this.rootEl; }
    destroy(): void { BB.destroyEl(this.rootEl); }
}

export class LayerPanelUI {
    private readonly rootEl: HTMLElement;
    
    constructor(private canvasApi: CanvasApiBridge) {
        this.rootEl = this.createLayerPanel();
        this.refresh();
    }
    
    private createLayerPanel(): HTMLElement {
        const panel = BB.el({
            className: 'layer-panel',
            css: {
                padding: '15px',
                borderBottom: '1px solid #ccc'
            }
        });
        
        panel.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">Layers</h3>
            <div style="margin-bottom: 10px;">
                <button id="add-layer-btn" style="padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px;">
                    Add Layer
                </button>
                <button id="delete-layer-btn" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    Delete Layer
                </button>
            </div>
            <div id="layer-list" style="border: 1px solid #ccc; border-radius: 3px; max-height: 200px; overflow-y: auto;">
            </div>
        `;
        
        // Add event listeners
        panel.querySelector('#add-layer-btn')?.addEventListener('click', () => {
            this.canvasApi.createLayer(`Layer ${this.canvasApi.getLayerCount() + 1}`);
        });
        
        panel.querySelector('#delete-layer-btn')?.addEventListener('click', () => {
            const activeIndex = this.canvasApi.getActiveLayerIndex();
            if (this.canvasApi.getLayerCount() > 1) {
                this.canvasApi.deleteLayer(activeIndex);
            }
        });
        
        return panel;
    }
    
    refresh(): void {
        const layerList = this.rootEl.querySelector('#layer-list') as HTMLElement;
        layerList.innerHTML = '';
        
        const layers = this.canvasApi.getAllLayersInfo();
        const activeIndex = this.canvasApi.getActiveLayerIndex();
        
        layers.forEach((layer, index) => {
            const layerItem = BB.el({
                className: 'layer-item',
                css: {
                    padding: '8px',
                    borderBottom: '1px solid #ddd',
                    background: index === activeIndex ? '#e6f3ff' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                },
                onClick: () => {
                    this.canvasApi.setActiveLayer(index);
                }
            });
            
            const layerInfo = BB.el({
                content: `${layer.name} (${Math.round(layer.opacity * 100)}%)`,
                css: {
                    fontSize: '12px',
                    flex: '1'
                }
            });
            
            const visibilityToggle = BB.el({
                tagName: 'button',
                content: layer.isVisible ? '👁️' : '🙈',
                css: {
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px'
                },
                onClick: (e: Event) => {
                    e.stopPropagation();
                    this.canvasApi.setLayerVisible(index, !layer.isVisible);
                }
            });
            
            layerItem.appendChild(layerInfo);
            layerItem.appendChild(visibilityToggle);
            layerList.appendChild(layerItem);
        });
    }
    
    getElement(): HTMLElement { return this.rootEl; }
    destroy(): void { BB.destroyEl(this.rootEl); }
}

export class ColorPickerUI {
    private readonly rootEl: HTMLElement;
    
    constructor(private canvasApi: CanvasApiBridge) {
        this.rootEl = this.createColorPicker();
    }
    
    private createColorPicker(): HTMLElement {
        const panel = BB.el({
            className: 'color-picker',
            css: {
                padding: '15px',
                borderBottom: '1px solid #ccc'
            }
        });
        
        panel.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">Colors</h3>
            <div style="margin-bottom: 10px;">
                <label>Primary: </label>
                <input type="color" id="primary-color" value="#000000" 
                       style="width: 40px; height: 30px; border: none; cursor: pointer;">
            </div>
            <div style="margin-bottom: 10px;">
                <label>Secondary: </label>
                <input type="color" id="secondary-color" value="#ffffff"
                       style="width: 40px; height: 30px; border: none; cursor: pointer;">
            </div>
        `;
        
        // Add event listeners
        const primaryColor = panel.querySelector('#primary-color') as HTMLInputElement;
        const secondaryColor = panel.querySelector('#secondary-color') as HTMLInputElement;
        
        primaryColor.addEventListener('change', () => {
            const color = this.hexToRgb(primaryColor.value);
            this.canvasApi.setPrimaryColor(color);
            this.canvasApi.setBrushColor(color);
        });
        
        secondaryColor.addEventListener('change', () => {
            const color = this.hexToRgb(secondaryColor.value);
            this.canvasApi.setSecondaryColor(color);
        });
        
        return panel;
    }
    
    private hexToRgb(hex: string): IRGB {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }
    
    private rgbToHex(color: IRGB): string {
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
    }
    
    updateColor(type: string, color: IRGB): void {
        const input = this.rootEl.querySelector(`#${type}-color`) as HTMLInputElement;
        if (input) {
            input.value = this.rgbToHex(color);
        }
    }
    
    getElement(): HTMLElement { return this.rootEl; }
    destroy(): void { BB.destroyEl(this.rootEl); }
}

export class StatusBarUI {
    private readonly rootEl: HTMLElement;
    
    constructor(private canvasApi: CanvasApiBridge) {
        this.rootEl = this.createStatusBar();
    }
    
    private createStatusBar(): HTMLElement {
        const bar = BB.el({
            className: 'status-bar',
            css: {
                padding: '5px 15px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f0f0f0'
            }
        });
        
        bar.innerHTML = `
            <div id="status-info">Ready</div>
            <div id="history-info">
                <button id="undo-btn" disabled style="margin-right: 5px; padding: 3px 8px; font-size: 11px;">Undo</button>
                <button id="redo-btn" disabled style="padding: 3px 8px; font-size: 11px;">Redo</button>
            </div>
        `;
        
        // Add event listeners
        bar.querySelector('#undo-btn')?.addEventListener('click', () => {
            this.canvasApi.undo();
        });
        
        bar.querySelector('#redo-btn')?.addEventListener('click', () => {
            this.canvasApi.redo();
        });
        
        return bar;
    }
    
    updateHistoryStatus(canUndo: boolean, canRedo: boolean): void {
        const undoBtn = this.rootEl.querySelector('#undo-btn') as HTMLButtonElement;
        const redoBtn = this.rootEl.querySelector('#redo-btn') as HTMLButtonElement;
        
        undoBtn.disabled = !canUndo;
        redoBtn.disabled = !canRedo;
    }
    
    setStatus(message: string): void {
        const statusInfo = this.rootEl.querySelector('#status-info') as HTMLElement;
        statusInfo.textContent = message;
    }
    
    getElement(): HTMLElement { return this.rootEl; }
    destroy(): void { BB.destroyEl(this.rootEl); }
}

// Re-export all components with proper file structure for TypeScript resolution
export { ToolbarUI as _ToolbarUI };
export { TextToolUI as _TextToolUI };
export { BrushToolUI as _BrushToolUI };
export { LayerPanelUI as _LayerPanelUI };
export { ColorPickerUI as _ColorPickerUI };
export { StatusBarUI as _StatusBarUI };
