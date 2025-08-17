import { CanvasApiBridge } from './canvas-api-bridge';
import { BB } from '../bb/bb';
import { IRGB } from '../klecks/kl-types';

/**
 * Comprehensive Development UI that exposes EVERY API feature
 * This is the exhaustive testing interface for the headless canvas
 */
export class ComprehensiveDevUI {
    private readonly rootEl: HTMLElement;
    private readonly canvasContainer: HTMLElement;
    private updateInterval: number = 0;
    
    constructor(private canvasApi: CanvasApiBridge) {
        this.rootEl = this.createLayout();
        this.canvasContainer = this.rootEl.querySelector('.canvas-container') as HTMLElement;
        
        this.setupAllControls();
        this.setupEventListeners();
        this.startRealTimeUpdates();
        
        // Add canvas to container
        this.canvasContainer.appendChild(this.canvasApi.getCanvasElement());
    }
    
    private createLayout(): HTMLElement {
        const layout = BB.el({
            className: 'comprehensive-dev-ui',
            css: {
                display: 'grid',
                gridTemplateColumns: '300px 1fr 300px',
                gridTemplateRows: '40px 1fr 120px',
                height: '100vh',
                width: '100vw',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '12px',
                overflow: 'hidden',
                background: '#f0f0f0',
                gap: '4px'
            }
        });
        
        layout.innerHTML = `
            <!-- Top Status Bar -->
            <div class="top-status" style="
                grid-column: 1 / -1;
                background: #333;
                color: white;
                padding: 8px 15px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 11px;
            ">
                <div class="canvas-info">Canvas: <span id="canvas-size">Loading...</span></div>
                <div class="tool-info">Tool: <span id="current-tool">brush</span></div>
                <div class="layer-info">Layer: <span id="active-layer">1</span>/<span id="total-layers">1</span></div>
                <div class="history-info">History: <span id="history-status">0 / 0</span></div>
            </div>
            
            <!-- Left Panel: Tools & Brush Controls -->
            <div class="left-panel" style="
                background: #e8e8e8;
                border-right: 1px solid #ccc;
                overflow-y: auto;
                padding: 10px;
            ">
                <div id="tool-controls"></div>
                <div id="brush-controls"></div>
                <div id="color-controls"></div>
                <div id="fill-controls"></div>
                <div id="gradient-controls"></div>
            </div>
            
            <!-- Center: Canvas -->
            <div class="canvas-container" style="
                background: #f8f8f8;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: auto;
                position: relative;
                border: 1px solid #ccc;
            "></div>
            
            <!-- Right Panel: Layers & Advanced -->
            <div class="right-panel" style="
                background: #e8e8e8;
                border-left: 1px solid #ccc;
                overflow-y: auto;
                padding: 10px;
            ">
                <div id="layer-controls"></div>
                <div id="text-controls"></div>
                <div id="canvas-controls"></div>
                <div id="debug-info"></div>
            </div>
            
            <!-- Bottom Panel: Real-time Status & Quick Actions -->
            <div class="bottom-panel" style="
                grid-column: 1 / -1;
                background: #ddd;
                border-top: 1px solid #ccc;
                padding: 10px;
                overflow-y: auto;
            ">
                <div id="status-display"></div>
                <div id="quick-actions"></div>
                <div id="api-tester"></div>
            </div>
        `;
        
        return layout;
    }
    
    private setupAllControls(): void {
        this.setupToolControls();
        this.setupBrushControls();
        this.setupColorControls();
        this.setupFillControls();
        this.setupGradientControls();
        this.setupLayerControls();
        this.setupTextControls();
        this.setupCanvasControls();
        this.setupStatusDisplay();
        this.setupQuickActions();
        this.setupAPITester();
        this.setupDebugInfo();
    }
    
    private setupToolControls(): void {
        const container = this.rootEl.querySelector('#tool-controls') as HTMLElement;
        container.innerHTML = `
            <div class="section-header">🛠️ Tools</div>
            <div class="button-grid">
                <button id="tool-brush" class="tool-btn active">Brush</button>
                <button id="tool-pencil" class="tool-btn">Pencil</button>
                <button id="tool-fill" class="tool-btn">Fill</button>
                <button id="tool-gradient" class="tool-btn">Gradient</button>
                <button id="tool-text" class="tool-btn">Text</button>
                <button id="tool-hand" class="tool-btn">Hand</button>
                <button id="tool-select" class="tool-btn">Select</button>
            </div>
        `;
        
        // Tool switching
        container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('tool-btn')) {
                const tool = target.id.replace('tool-', '');
                this.canvasApi.setCurrentTool(tool);
                
                // Update active button
                container.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
                target.classList.add('active');
            }
        });
    }
    
    private setupBrushControls(): void {
        const container = this.rootEl.querySelector('#brush-controls') as HTMLElement;
        container.innerHTML = `
            <div class="section-header">🎨 Brush</div>
            
            <!-- Brush Type Selection -->
            <div class="control-group">
                <label>Type:</label>
                <select id="brush-type">
                    <option value="brush">Soft Brush</option>
                    <option value="pencil">Hard Pencil</option>
                    <option value="pen">Pen</option>
                    <option value="marker">Marker</option>
                    <option value="airbrush">Airbrush</option>
                </select>
                <button id="get-available-brushes">List All</button>
            </div>
            
            <!-- Brush Size -->
            <div class="control-group">
                <label>Size: <span id="brush-size-value">10</span>px</label>
                <input type="range" id="brush-size" min="1" max="100" value="10">
                <div class="button-row">
                    <input type="number" id="brush-size-input" value="10" min="1" max="500" style="width: 60px;">
                    <button id="brush-decrease" title="Decrease Size [">-</button>
                    <button id="brush-increase" title="Increase Size ]">+</button>
                </div>
            </div>
            
            <!-- Brush Opacity -->
            <div class="control-group">
                <label>Opacity: <span id="brush-opacity-value">100</span>%</label>
                <input type="range" id="brush-opacity" min="0" max="100" value="100">
                <input type="number" id="brush-opacity-input" value="100" min="0" max="100" style="width: 60px;">
            </div>
            
            <!-- Line Drawing -->
            <div class="control-group">
                <label>Quick Line:</label>
                <div class="input-row">
                    <input type="number" id="line-x1" placeholder="X1" style="width: 45px;">
                    <input type="number" id="line-y1" placeholder="Y1" style="width: 45px;">
                    <input type="number" id="line-x2" placeholder="X2" style="width: 45px;">
                    <input type="number" id="line-y2" placeholder="Y2" style="width: 45px;">
                    <button id="draw-line">Draw</button>
                </div>
            </div>
            
            <!-- Real-time Brush Info -->
            <div class="info-display" id="brush-info">
                Current: <span id="current-brush-info">Loading...</span>
            </div>
        `;
        
        // Brush type change
        container.querySelector('#brush-type')?.addEventListener('change', (e) => {
            const type = (e.target as HTMLSelectElement).value;
            this.canvasApi.setBrushType(type);
        });
        
        // Brush size controls
        const sizeSlider = container.querySelector('#brush-size') as HTMLInputElement;
        const sizeInput = container.querySelector('#brush-size-input') as HTMLInputElement;
        const sizeValue = container.querySelector('#brush-size-value') as HTMLElement;
        
        const updateSize = (size: number) => {
            this.canvasApi.setBrushSize(size);
            sizeSlider.value = size.toString();
            sizeInput.value = size.toString();
            sizeValue.textContent = size.toString();
        };
        
        sizeSlider.addEventListener('input', (e) => {
            updateSize(parseInt((e.target as HTMLInputElement).value));
        });
        
        sizeInput.addEventListener('change', (e) => {
            updateSize(parseInt((e.target as HTMLInputElement).value));
        });
        
        // Size buttons
        container.querySelector('#brush-decrease')?.addEventListener('click', () => {
            const current = this.canvasApi.getBrushSize();
            updateSize(Math.max(1, current - 1));
        });
        
        container.querySelector('#brush-increase')?.addEventListener('click', () => {
            const current = this.canvasApi.getBrushSize();
            updateSize(Math.min(500, current + 1));
        });
        
        // Opacity controls
        const opacitySlider = container.querySelector('#brush-opacity') as HTMLInputElement;
        const opacityInput = container.querySelector('#brush-opacity-input') as HTMLInputElement;
        const opacityValue = container.querySelector('#brush-opacity-value') as HTMLElement;
        
        const updateOpacity = (opacity: number) => {
            this.canvasApi.setBrushOpacity(opacity / 100);
            opacitySlider.value = opacity.toString();
            opacityInput.value = opacity.toString();
            opacityValue.textContent = opacity.toString();
        };
        
        opacitySlider.addEventListener('input', (e) => {
            updateOpacity(parseInt((e.target as HTMLInputElement).value));
        });
        
        opacityInput.addEventListener('change', (e) => {
            updateOpacity(parseInt((e.target as HTMLInputElement).value));
        });
        
        // Line drawing
        container.querySelector('#draw-line')?.addEventListener('click', () => {
            const x1 = parseInt((container.querySelector('#line-x1') as HTMLInputElement).value) || 0;
            const y1 = parseInt((container.querySelector('#line-y1') as HTMLInputElement).value) || 0;
            const x2 = parseInt((container.querySelector('#line-x2') as HTMLInputElement).value) || 100;
            const y2 = parseInt((container.querySelector('#line-y2') as HTMLInputElement).value) || 100;
            this.canvasApi.drawLine(x1, y1, x2, y2);
        });
        
        // Get available brushes
        container.querySelector('#get-available-brushes')?.addEventListener('click', () => {
            const brushes = this.canvasApi.getAvailableBrushes();
            alert(`Available brushes: ${brushes.join(', ')}`);
        });
    }
    
    private setupColorControls(): void {
        const container = this.rootEl.querySelector('#color-controls') as HTMLElement;
        container.innerHTML = `
            <div class="section-header">🎨 Colors</div>
            
            <div class="control-group">
                <div class="color-row">
                    <div class="color-item">
                        <label>Primary:</label>
                        <input type="color" id="primary-color" value="#000000">
                        <span id="primary-rgb">0, 0, 0</span>
                    </div>
                </div>
                <div class="color-row">
                    <div class="color-item">
                        <label>Secondary:</label>
                        <input type="color" id="secondary-color" value="#ffffff">
                        <span id="secondary-rgb">255, 255, 255</span>
                    </div>
                </div>
            </div>
            
            <div class="button-row">
                <button id="swap-colors">Swap (X)</button>
                <button id="reset-colors">Reset</button>
            </div>
            
            <!-- Color Presets -->
            <div class="control-group">
                <label>Presets:</label>
                <div class="color-presets">
                    <div class="color-preset" data-primary="#ff0000" data-secondary="#ffffff" style="background: linear-gradient(45deg, #ff0000, #ffffff)"></div>
                    <div class="color-preset" data-primary="#00ff00" data-secondary="#000000" style="background: linear-gradient(45deg, #00ff00, #000000)"></div>
                    <div class="color-preset" data-primary="#0000ff" data-secondary="#ffffff" style="background: linear-gradient(45deg, #0000ff, #ffffff)"></div>
                    <div class="color-preset" data-primary="#ffff00" data-secondary="#ff0000" style="background: linear-gradient(45deg, #ffff00, #ff0000)"></div>
                </div>
            </div>
        `;
        
        const primaryColor = container.querySelector('#primary-color') as HTMLInputElement;
        const secondaryColor = container.querySelector('#secondary-color') as HTMLInputElement;
        const primaryRgb = container.querySelector('#primary-rgb') as HTMLElement;
        const secondaryRgb = container.querySelector('#secondary-rgb') as HTMLElement;
        
        const hexToRgb = (hex: string): IRGB => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        };
        
        const rgbToHex = (rgb: IRGB): string => {
            const toHex = (n: number) => n.toString(16).padStart(2, '0');
            return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
        };
        
        const updatePrimaryColor = (color: IRGB) => {
            this.canvasApi.setPrimaryColor(color);
            this.canvasApi.setBrushColor(color);
            primaryColor.value = rgbToHex(color);
            primaryRgb.textContent = `${color.r}, ${color.g}, ${color.b}`;
        };
        
        const updateSecondaryColor = (color: IRGB) => {
            this.canvasApi.setSecondaryColor(color);
            secondaryColor.value = rgbToHex(color);
            secondaryRgb.textContent = `${color.r}, ${color.g}, ${color.b}`;
        };
        
        primaryColor.addEventListener('change', () => {
            updatePrimaryColor(hexToRgb(primaryColor.value));
        });
        
        secondaryColor.addEventListener('change', () => {
            updateSecondaryColor(hexToRgb(secondaryColor.value));
        });
        
        // Color presets
        container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('color-preset')) {
                const primary = target.getAttribute('data-primary')!;
                const secondary = target.getAttribute('data-secondary')!;
                updatePrimaryColor(hexToRgb(primary));
                updateSecondaryColor(hexToRgb(secondary));
            }
        });
        
        // Swap colors
        container.querySelector('#swap-colors')?.addEventListener('click', () => {
            const primary = this.canvasApi.getPrimaryColor();
            const secondary = this.canvasApi.getSecondaryColor();
            updatePrimaryColor(secondary);
            updateSecondaryColor(primary);
        });
        
        // Reset colors
        container.querySelector('#reset-colors')?.addEventListener('click', () => {
            updatePrimaryColor({ r: 0, g: 0, b: 0 });
            updateSecondaryColor({ r: 255, g: 255, b: 255 });
        });
    }
    
    private setupFillControls(): void {
        const container = this.rootEl.querySelector('#fill-controls') as HTMLElement;
        container.innerHTML = `
            <div class="section-header">🪣 Fill Tool</div>
            
            <div class="control-group">
                <label>Tolerance: <span id="fill-tolerance-value">0</span></label>
                <input type="range" id="fill-tolerance" min="0" max="255" value="0">
                <input type="number" id="fill-tolerance-input" value="0" min="0" max="255" style="width: 60px;">
            </div>
            
            <div class="button-row">
                <button id="fill-test" title="Test fill at 100,100">Test Fill</button>
                <button id="fill-center" title="Fill canvas center">Fill Center</button>
            </div>
            
            <div class="info-display">
                <div>Current Tolerance: <span id="current-tolerance">0</span></div>
                <div>Click canvas to fill area</div>
            </div>
        `;
        
        const toleranceSlider = container.querySelector('#fill-tolerance') as HTMLInputElement;
        const toleranceInput = container.querySelector('#fill-tolerance-input') as HTMLInputElement;
        const toleranceValue = container.querySelector('#fill-tolerance-value') as HTMLElement;
        const currentTolerance = container.querySelector('#current-tolerance') as HTMLElement;
        
        const updateTolerance = (tolerance: number) => {
            // Note: Need to add this method to CanvasApiBridge
            // this.canvasApi.setFillTolerance(tolerance);
            toleranceSlider.value = tolerance.toString();
            toleranceInput.value = tolerance.toString();
            toleranceValue.textContent = tolerance.toString();
            currentTolerance.textContent = tolerance.toString();
        };
        
        toleranceSlider.addEventListener('input', (e) => {
            updateTolerance(parseInt((e.target as HTMLInputElement).value));
        });
        
        toleranceInput.addEventListener('change', (e) => {
            updateTolerance(parseInt((e.target as HTMLInputElement).value));
        });
    }
    
    private setupGradientControls(): void {
        const container = this.rootEl.querySelector('#gradient-controls') as HTMLElement;
        container.innerHTML = `
            <div class="section-header">🌈 Gradients</div>
            
            <!-- Gradient Presets -->
            <div class="control-group">
                <label>Presets:</label>
                <select id="gradient-preset">
                    <option value="">Select preset...</option>
                    <option value="black-white">Black to White</option>
                    <option value="white-black">White to Black</option>
                    <option value="red-blue">Red to Blue</option>
                    <option value="blue-red">Blue to Red</option>
                    <option value="rainbow">Rainbow</option>
                    <option value="sunset">Sunset</option>
                    <option value="ocean">Ocean</option>
                    <option value="forest">Forest</option>
                </select>
            </div>
            
            <!-- Direction Controls -->
            <div class="control-group">
                <label>Canvas Fill:</label>
                <div class="button-grid">
                    <button id="gradient-horizontal">Horizontal</button>
                    <button id="gradient-vertical">Vertical</button>
                    <button id="gradient-diagonal">Diagonal</button>
                </div>
            </div>
            
            <!-- Custom Gradient -->
            <div class="control-group">
                <label>Custom:</label>
                <div class="input-row">
                    <input type="number" id="grad-x1" placeholder="X1" style="width: 40px;" value="0">
                    <input type="number" id="grad-y1" placeholder="Y1" style="width: 40px;" value="0">
                    <input type="number" id="grad-x2" placeholder="X2" style="width: 40px;" value="100">
                    <input type="number" id="grad-y2" placeholder="Y2" style="width: 40px;" value="100">
                    <button id="apply-custom-gradient">Apply</button>
                </div>
            </div>
            
            <div class="info-display">
                <div>Drag on canvas to create gradient</div>
                <div>Or use presets for quick results</div>
            </div>
        `;
        
        // Gradient presets with full canvas application
        const presetSelect = container.querySelector('#gradient-preset') as HTMLSelectElement;
        presetSelect.addEventListener('change', () => {
            const preset = presetSelect.value;
            if (preset) {
                // Note: Need to add this method to CanvasApiBridge
                // this.canvasApi.applyGradientPresetToCanvas(preset, 'horizontal');
                console.log(`Would apply gradient preset: ${preset}`);
            }
        });
        
        // Direction buttons
        container.querySelector('#gradient-horizontal')?.addEventListener('click', () => {
            const preset = presetSelect.value || 'black-white';
            // this.canvasApi.applyGradientPresetToCanvas(preset, 'horizontal');
            console.log(`Would apply ${preset} gradient horizontally`);
        });
        
        container.querySelector('#gradient-vertical')?.addEventListener('click', () => {
            const preset = presetSelect.value || 'black-white';
            // this.canvasApi.applyGradientPresetToCanvas(preset, 'vertical');
            console.log(`Would apply ${preset} gradient vertically`);
        });
        
        container.querySelector('#gradient-diagonal')?.addEventListener('click', () => {
            const preset = presetSelect.value || 'black-white';
            // this.canvasApi.applyGradientPresetToCanvas(preset, 'diagonal');
            console.log(`Would apply ${preset} gradient diagonally`);
        });
    }
    
    private setupLayerControls(): void {
        const container = this.rootEl.querySelector('#layer-controls') as HTMLElement;
        container.innerHTML = `
            <div class="section-header">📄 Layers</div>
            
            <!-- Layer Actions -->
            <div class="button-grid">
                <button id="layer-add">Add Layer</button>
                <button id="layer-duplicate">Duplicate</button>
                <button id="layer-delete">Delete</button>
                <button id="layer-clear">Clear</button>
            </div>
            
            <div class="button-grid">
                <button id="layer-merge-down">Merge Down</button>
                <button id="layer-flatten">Flatten All</button>
                <button id="layer-fill">Fill Layer</button>
            </div>
            
            <!-- Layer List with Full Controls -->
            <div class="control-group">
                <div id="layer-list-advanced"></div>
            </div>
            
            <!-- Layer Move Controls -->
            <div class="control-group">
                <label>Move Layer:</label>
                <div class="input-row">
                    <select id="layer-from"></select>
                    <span>to</span>
                    <select id="layer-to"></select>
                    <button id="move-layer">Move</button>
                </div>
            </div>
            
            <!-- Mix Mode Selection -->
            <div class="control-group">
                <label>Mix Mode:</label>
                <select id="layer-mix-mode">
                    <option value="source-over">Normal</option>
                    <option value="multiply">Multiply</option>
                    <option value="screen">Screen</option>
                    <option value="overlay">Overlay</option>
                    <option value="darken">Darken</option>
                    <option value="lighten">Lighten</option>
                    <option value="color-dodge">Color Dodge</option>
                    <option value="color-burn">Color Burn</option>
                    <option value="hard-light">Hard Light</option>
                    <option value="soft-light">Soft Light</option>
                    <option value="difference">Difference</option>
                    <option value="exclusion">Exclusion</option>
                </select>
                <button id="apply-mix-mode">Apply</button>
            </div>
        `;
        
        // Layer actions
        container.querySelector('#layer-add')?.addEventListener('click', () => {
            const count = this.canvasApi.getLayerCount();
            this.canvasApi.createLayer(`Layer ${count + 1}`);
        });
        
        container.querySelector('#layer-duplicate')?.addEventListener('click', () => {
            const active = this.canvasApi.getActiveLayerIndex();
            this.canvasApi.duplicateLayer(active);
        });
        
        container.querySelector('#layer-delete')?.addEventListener('click', () => {
            if (this.canvasApi.getLayerCount() > 1) {
                const active = this.canvasApi.getActiveLayerIndex();
                this.canvasApi.deleteLayer(active);
            } else {
                alert('Cannot delete the last layer');
            }
        });
        
        container.querySelector('#layer-clear')?.addEventListener('click', () => {
            const active = this.canvasApi.getActiveLayerIndex();
            this.canvasApi.clearLayer(active);
        });
        
        container.querySelector('#layer-merge-down')?.addEventListener('click', () => {
            const active = this.canvasApi.getActiveLayerIndex();
            this.canvasApi.mergeLayerDown(active);
        });
        
        container.querySelector('#layer-flatten')?.addEventListener('click', () => {
            if (confirm('Flatten all layers?')) {
                this.canvasApi.flattenLayers();
            }
        });
        
        container.querySelector('#layer-fill')?.addEventListener('click', () => {
            const active = this.canvasApi.getActiveLayerIndex();
            const color = this.canvasApi.getPrimaryColor();
            this.canvasApi.fillLayer(active, color);
        });
    }
    
    private setupTextControls(): void {
        const container = this.rootEl.querySelector('#text-controls') as HTMLElement;
        container.innerHTML = `
            <div class="section-header">📝 Text</div>
            
            <!-- Text Creation -->
            <div class="control-group">
                <label>Create Text:</label>
                <textarea id="text-content" rows="3" placeholder="Enter text here..." style="width: 100%; margin-bottom: 5px;"></textarea>
                <div class="input-row">
                    <input type="number" id="text-x" placeholder="X" value="100" style="width: 50px;">
                    <input type="number" id="text-y" placeholder="Y" value="100" style="width: 50px;">
                    <input type="number" id="text-size" placeholder="Size" value="24" style="width: 50px;">
                    <button id="create-text">Create</button>
                </div>
            </div>
            
            <!-- Font Selection -->
            <div class="control-group">
                <label>Font:</label>
                <select id="text-font">
                    <option value="sans-serif">Sans-serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="cursive">Cursive</option>
                    <option value="fantasy">Fantasy</option>
                </select>
            </div>
            
            <!-- Active Text Instances -->
            <div class="control-group">
                <label>Active Text:</label>
                <div id="active-text-list"></div>
                <div class="button-row">
                    <button id="finalize-all-text">Finalize All</button>
                    <button id="cancel-all-text">Cancel All</button>
                </div>
            </div>
        `;
        
        // Text creation
        container.querySelector('#create-text')?.addEventListener('click', () => {
            const text = (container.querySelector('#text-content') as HTMLTextAreaElement).value;
            const x = parseInt((container.querySelector('#text-x') as HTMLInputElement).value) || 100;
            const y = parseInt((container.querySelector('#text-y') as HTMLInputElement).value) || 100;
            const size = parseInt((container.querySelector('#text-size') as HTMLInputElement).value) || 24;
            const font = (container.querySelector('#text-font') as HTMLSelectElement).value;
            
            if (text.trim()) {
                const textId = this.canvasApi.createText({
                    text: text.trim(),
                    x,
                    y,
                    size,
                    font
                });
                console.log(`Created text instance: ${textId}`);
                this.updateActiveTextList();
            }
        });
        
        // Text management
        container.querySelector('#finalize-all-text')?.addEventListener('click', () => {
            this.canvasApi.finalizeAllText();
            this.updateActiveTextList();
        });
        
        container.querySelector('#cancel-all-text')?.addEventListener('click', () => {
            this.canvasApi.cancelAllText();
            this.updateActiveTextList();
        });
    }
    
    private updateActiveTextList(): void {
        const container = this.rootEl.querySelector('#active-text-list') as HTMLElement;
        const activeTexts = this.canvasApi.getActiveTextInstances();
        
        container.innerHTML = activeTexts.length 
            ? `<div>${activeTexts.length} active text instance(s)</div>`
            : '<div>No active text</div>';
    }
    
    private setupCanvasControls(): void {
        const container = this.rootEl.querySelector('#canvas-controls') as HTMLElement;
        container.innerHTML = `
            <div class="section-header">🖼️ Canvas</div>
            
            <!-- Canvas Size -->
            <div class="control-group">
                <label>Resize:</label>
                <div class="input-row">
                    <input type="number" id="canvas-width" placeholder="Width" value="800" style="width: 60px;">
                    <input type="number" id="canvas-height" placeholder="Height" value="600" style="width: 60px;">
                    <button id="resize-canvas">Resize</button>
                </div>
            </div>
            
            <!-- Canvas Actions -->
            <div class="button-grid">
                <button id="clear-canvas">Clear All</button>
                <button id="reset-view">Reset View</button>
            </div>
            
            <!-- History -->
            <div class="control-group">
                <label>History:</label>
                <div class="button-row">
                    <button id="undo-btn">Undo (Ctrl+Z)</button>
                    <button id="redo-btn">Redo (Ctrl+Y)</button>
                </div>
                <div class="history-info">
                    <span id="history-details">Can Undo: No | Can Redo: No</span>
                </div>
            </div>
        `;
        
        // Canvas resize
        container.querySelector('#resize-canvas')?.addEventListener('click', () => {
            const width = parseInt((container.querySelector('#canvas-width') as HTMLInputElement).value);
            const height = parseInt((container.querySelector('#canvas-height') as HTMLInputElement).value);
            if (width > 0 && height > 0) {
                this.canvasApi.resizeCanvas(width, height);
            }
        });
        
        // Canvas actions
        container.querySelector('#clear-canvas')?.addEventListener('click', () => {
            if (confirm('Clear entire canvas?')) {
                this.canvasApi.clearCanvas();
            }
        });
        
        // History
        container.querySelector('#undo-btn')?.addEventListener('click', () => {
            this.canvasApi.undo();
        });
        
        container.querySelector('#redo-btn')?.addEventListener('click', () => {
            this.canvasApi.redo();
        });
    }
    
    private setupStatusDisplay(): void {
        const container = this.rootEl.querySelector('#status-display') as HTMLElement;
        container.innerHTML = `
            <div class="section-header">📊 Real-time Status</div>
            <div id="live-status" style="
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 10px; 
                font-size: 11px;
            "></div>
        `;
    }
    
    private setupQuickActions(): void {
        const container = this.rootEl.querySelector('#quick-actions') as HTMLElement;
        container.innerHTML = `
            <div class="section-header">⚡ Quick Actions</div>
            <div class="button-grid">
                <button id="test-all-brushes">Test All Brushes</button>
                <button id="create-test-layers">Create Test Layers</button>
                <button id="fill-gradient-test">Gradient Test</button>
                <button id="performance-test">Performance Test</button>
                <button id="export-state">Export State</button>
                <button id="stress-test">Stress Test</button>
            </div>
        `;
        
        // Quick action implementations
        container.querySelector('#test-all-brushes')?.addEventListener('click', () => {
            const brushes = this.canvasApi.getAvailableBrushes();
            console.log(`Testing ${brushes.length} brushes...`);
            // Implement brush testing logic
        });
        
        container.querySelector('#create-test-layers')?.addEventListener('click', () => {
            for (let i = 0; i < 3; i++) {
                this.canvasApi.createLayer(`Test Layer ${i + 1}`);
            }
        });
    }
    
    private setupAPITester(): void {
        const container = this.rootEl.querySelector('#api-tester') as HTMLElement;
        container.innerHTML = `
            <div class="section-header">🔧 API Tester</div>
            <div style="display: flex; gap: 10px; align-items: stretch;">
                <textarea id="api-command" 
                    placeholder="Enter API command (e.g., canvasApi.createLayer('test'))" 
                    style="flex: 1; height: 60px; font-family: monospace; font-size: 11px;"></textarea>
                <button id="execute-api" style="padding: 10px;">Execute</button>
            </div>
            <div id="api-result" style="
                margin-top: 5px; 
                padding: 5px; 
                background: #000; 
                color: #0f0; 
                font-family: monospace; 
                font-size: 10px;
                height: 40px;
                overflow-y: auto;
            ">Ready for API commands...</div>
        `;
        
        container.querySelector('#execute-api')?.addEventListener('click', () => {
            const command = (container.querySelector('#api-command') as HTMLTextAreaElement).value;
            const result = container.querySelector('#api-result') as HTMLElement;
            
            try {
                // Make canvasApi available in scope
                const canvasApi = this.canvasApi;
                const evalResult = eval(command);
                result.innerHTML += `<div>> ${command}</div><div>Result: ${JSON.stringify(evalResult)}</div>`;
            } catch (error) {
                result.innerHTML += `<div>> ${command}</div><div style="color: #f00;">Error: ${error}</div>`;
            }
            
            result.scrollTop = result.scrollHeight;
        });
    }
    
    private setupDebugInfo(): void {
        const container = this.rootEl.querySelector('#debug-info') as HTMLElement;
        container.innerHTML = `
            <div class="section-header">🐛 Debug Info</div>
            <div id="debug-content" style="font-family: monospace; font-size: 10px; white-space: pre-wrap;"></div>
        `;
    }
    
    private setupEventListeners(): void {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        if (e.shiftKey) {
                            this.canvasApi.redo();
                        } else {
                            this.canvasApi.undo();
                        }
                        e.preventDefault();
                        break;
                    case 'y':
                        this.canvasApi.redo();
                        e.preventDefault();
                        break;
                }
            }
            
            // Tool shortcuts
            switch (e.key.toLowerCase()) {
                case 'b':
                    this.canvasApi.setCurrentTool('brush');
                    e.preventDefault();
                    break;
                case 't':
                    this.canvasApi.setCurrentTool('text');
                    e.preventDefault();
                    break;
                case 'f':
                    this.canvasApi.setCurrentTool('fill');
                    e.preventDefault();
                    break;
                case 'g':
                    this.canvasApi.setCurrentTool('gradient');
                    e.preventDefault();
                    break;
                case '[':
                    const currentSize = this.canvasApi.getBrushSize();
                    this.canvasApi.setBrushSize(Math.max(1, currentSize - 1));
                    e.preventDefault();
                    break;
                case ']':
                    const currentSizeInc = this.canvasApi.getBrushSize();
                    this.canvasApi.setBrushSize(Math.min(500, currentSizeInc + 1));
                    e.preventDefault();
                    break;
                case 'x':
                    // Swap colors
                    const primary = this.canvasApi.getPrimaryColor();
                    const secondary = this.canvasApi.getSecondaryColor();
                    this.canvasApi.setPrimaryColor(secondary);
                    this.canvasApi.setSecondaryColor(primary);
                    e.preventDefault();
                    break;
            }
        });
        
        // Canvas API event listeners
        this.canvasApi.on('layer-created', () => this.updateLayerControls());
        this.canvasApi.on('layer-deleted', () => this.updateLayerControls());
        this.canvasApi.on('layer-activated', () => this.updateLayerControls());
        this.canvasApi.on('tool-changed', (tool) => this.updateToolDisplay(tool));
        this.canvasApi.on('color-changed', () => this.updateColorDisplay());
    }
    
    private updateLayerControls(): void {
        // Update layer list and controls
        const container = this.rootEl.querySelector('#layer-list-advanced') as HTMLElement;
        const layers = this.canvasApi.getAllLayersInfo();
        const activeIndex = this.canvasApi.getActiveLayerIndex();
        
        container.innerHTML = layers.map((layer, index) => `
            <div class="layer-item-advanced ${index === activeIndex ? 'active' : ''}" 
                 data-index="${index}" 
                 style="
                     border: 1px solid ${index === activeIndex ? '#007acc' : '#ccc'};
                     padding: 8px;
                     margin: 4px 0;
                     background: ${index === activeIndex ? '#e6f3ff' : '#fff'};
                     border-radius: 4px;
                 ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: ${index === activeIndex ? 'bold' : 'normal'};">
                        ${layer.name}
                    </span>
                    <div>
                        <button onclick="this.canvasApi.setActiveLayer(${index})" style="font-size: 10px; padding: 2px 6px;">Select</button>
                        <button onclick="this.canvasApi.setLayerVisible(${index}, ${!layer.isVisible})" 
                                style="font-size: 10px; padding: 2px 6px;">
                            ${layer.isVisible ? '👁️' : '🙈'}
                        </button>
                    </div>
                </div>
                <div style="font-size: 10px; color: #666; margin-top: 4px;">
                    Opacity: <input type="range" min="0" max="100" value="${Math.round(layer.opacity * 100)}" 
                                   onchange="this.canvasApi.setLayerOpacity(${index}, this.value / 100)" 
                                   style="width: 60px;">
                    <span>${Math.round(layer.opacity * 100)}%</span>
                </div>
                <div style="font-size: 10px; margin-top: 2px;">
                    <input type="text" value="${layer.name}" 
                           onchange="this.canvasApi.renameLayer(${index}, this.value)"
                           style="width: 100%; font-size: 10px;">
                </div>
            </div>
        `).join('');
        
        // Update layer move selects
        const fromSelect = this.rootEl.querySelector('#layer-from') as HTMLSelectElement;
        const toSelect = this.rootEl.querySelector('#layer-to') as HTMLSelectElement;
        
        const layerOptions = layers.map((layer, index) => 
            `<option value="${index}">${index}: ${layer.name}</option>`
        ).join('');
        
        fromSelect.innerHTML = layerOptions;
        toSelect.innerHTML = layerOptions;
    }
    
    private updateToolDisplay(tool: string): void {
        // Update active tool button
        this.rootEl.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = this.rootEl.querySelector(`#tool-${tool}`) as HTMLElement;
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Update top status
        const toolDisplay = this.rootEl.querySelector('#current-tool') as HTMLElement;
        toolDisplay.textContent = tool;
    }
    
    private updateColorDisplay(): void {
        const primary = this.canvasApi.getPrimaryColor();
        const secondary = this.canvasApi.getSecondaryColor();
        
        const primaryColorInput = this.rootEl.querySelector('#primary-color') as HTMLInputElement;
        const secondaryColorInput = this.rootEl.querySelector('#secondary-color') as HTMLInputElement;
        const primaryRgb = this.rootEl.querySelector('#primary-rgb') as HTMLElement;
        const secondaryRgb = this.rootEl.querySelector('#secondary-rgb') as HTMLElement;
        
        if (primaryColorInput) {
            const toHex = (n: number) => n.toString(16).padStart(2, '0');
            primaryColorInput.value = `#${toHex(primary.r)}${toHex(primary.g)}${toHex(primary.b)}`;
            secondaryColorInput.value = `#${toHex(secondary.r)}${toHex(secondary.g)}${toHex(secondary.b)}`;
            primaryRgb.textContent = `${primary.r}, ${primary.g}, ${primary.b}`;
            secondaryRgb.textContent = `${secondary.r}, ${secondary.g}, ${secondary.b}`;
        }
    }
    
    private startRealTimeUpdates(): void {
        this.updateInterval = window.setInterval(() => {
            this.updateStatusDisplay();
            this.updateDebugInfo();
        }, 100); // Update 10 times per second
    }
    
    private updateStatusDisplay(): void {
        const container = this.rootEl.querySelector('#live-status') as HTMLElement;
        const layers = this.canvasApi.getAllLayersInfo();
        const activeIndex = this.canvasApi.getActiveLayerIndex();
        const currentTool = this.canvasApi.getCurrentTool();
        const brushSize = this.canvasApi.getBrushSize();
        const brushOpacity = Math.round(this.canvasApi.getBrushOpacity() * 100);
        const canUndo = this.canvasApi.canUndo();
        const canRedo = this.canvasApi.canRedo();
        const primary = this.canvasApi.getPrimaryColor();
        
        // Update top status bar
        const canvasSize = this.rootEl.querySelector('#canvas-size') as HTMLElement;
        const currentToolDisplay = this.rootEl.querySelector('#current-tool') as HTMLElement;
        const activeLayerDisplay = this.rootEl.querySelector('#active-layer') as HTMLElement;
        const totalLayersDisplay = this.rootEl.querySelector('#total-layers') as HTMLElement;
        const historyStatus = this.rootEl.querySelector('#history-status') as HTMLElement;
        
        if (canvasSize) {
            // Note: Need to add getCanvasSize method to API
            canvasSize.textContent = '800 x 600'; // Placeholder
        }
        if (currentToolDisplay) currentToolDisplay.textContent = currentTool;
        if (activeLayerDisplay) activeLayerDisplay.textContent = (activeIndex + 1).toString();
        if (totalLayersDisplay) totalLayersDisplay.textContent = layers.length.toString();
        if (historyStatus) historyStatus.textContent = `${canUndo ? '✓' : '✗'} / ${canRedo ? '✓' : '✗'}`;
        
        // Update detailed status
        container.innerHTML = `
            <div><strong>Current Tool:</strong> ${currentTool}</div>
            <div><strong>Brush:</strong> ${brushSize}px, ${brushOpacity}% opacity</div>
            <div><strong>Active Layer:</strong> ${layers[activeIndex]?.name || 'None'} (${activeIndex + 1}/${layers.length})</div>
            <div><strong>Primary Color:</strong> rgb(${primary.r}, ${primary.g}, ${primary.b})</div>
            <div><strong>History:</strong> Undo: ${canUndo ? 'Yes' : 'No'}, Redo: ${canRedo ? 'Yes' : 'No'}</div>
            <div><strong>Text Instances:</strong> ${this.canvasApi.getActiveTextInstances().length}</div>
        `;
    }
    
    private updateDebugInfo(): void {
        const container = this.rootEl.querySelector('#debug-content') as HTMLElement;
        
        container.textContent = `
Canvas API State:
- Current Tool: ${this.canvasApi.getCurrentTool()}
- Brush Size: ${this.canvasApi.getBrushSize()}
- Brush Opacity: ${Math.round(this.canvasApi.getBrushOpacity() * 100)}%
- Layer Count: ${this.canvasApi.getLayerCount()}
- Active Layer: ${this.canvasApi.getActiveLayerIndex()}
- Can Undo: ${this.canvasApi.canUndo()}
- Can Redo: ${this.canvasApi.canRedo()}
- Active Text: ${this.canvasApi.getActiveTextInstances().length}

Available Brushes:
${this.canvasApi.getAvailableBrushes().join(', ')}

Available Mix Modes:
${this.canvasApi.getAvailableMixModes().join(', ')}
        `;
    }
    
    getElement(): HTMLElement {
        return this.rootEl;
    }
    
    destroy(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        // Clean up event listeners and DOM
        document.removeEventListener('keydown', this.setupEventListeners);
        BB.destroyEl(this.rootEl);
    }
}

// CSS Styles
const styles = `
<style>
.comprehensive-dev-ui .section-header {
    font-weight: bold;
    margin: 10px 0 8px 0;
    padding: 4px 8px;
    background: #333;
    color: white;
    border-radius: 3px;
    font-size: 11px;
}

.comprehensive-dev-ui .control-group {
    margin-bottom: 12px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fafafa;
}

.comprehensive-dev-ui .button-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    margin-bottom: 8px;
}

.comprehensive-dev-ui .button-row {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
}

.comprehensive-dev-ui .input-row {
    display: flex;
    gap: 4px;
    align-items: center;
}

.comprehensive-dev-ui .tool-btn {
    padding: 6px 10px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
}

.comprehensive-dev-ui .tool-btn:hover {
    background: #e0e0e0;
}

.comprehensive-dev-ui .tool-btn.active {
    background: #007acc;
    color: white;
}

.comprehensive-dev-ui .info-display {
    background: #f8f8f8;
    padding: 6px;
    border-radius: 3px;
    font-size: 10px;
    color: #666;
    margin-top: 8px;
}

.comprehensive-dev-ui .color-presets {
    display: flex;
    gap: 4px;
    margin-top: 4px;
}

.comprehensive-dev-ui .color-preset {
    width: 20px;
    height: 20px;
    border: 1px solid #ccc;
    border-radius: 3px;
    cursor: pointer;
}

.comprehensive-dev-ui .color-preset:hover {
    border-color: #007acc;
}

.comprehensive-dev-ui button {
    padding: 4px 8px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
}

.comprehensive-dev-ui button:hover {
    background: #e0e0e0;
}

.comprehensive-dev-ui button:active {
    background: #d0d0d0;
}

.comprehensive-dev-ui input, .comprehensive-dev-ui select, .comprehensive-dev-ui textarea {
    font-size: 11px;
    padding: 2px 4px;
    border: 1px solid #ccc;
    border-radius: 2px;
}

.comprehensive-dev-ui label {
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 4px;
    display: block;
}
</style>
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);
}
