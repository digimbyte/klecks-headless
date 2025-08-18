import { CanvasApiBridge } from './canvas-api-bridge';
import { BB } from '../bb/bb';
import { IRGB } from '../klecks/kl-types';

/**
 * BASIC HTML DEV UI - NO STYLING, JUST RAW HTML ELEMENTS
 * Pure HTML buttons, inputs, and controls with minimal functionality
 */
export class BasicHtmlDevUI {
    private readonly rootEl: HTMLElement;
    private readonly canvasContainer: HTMLElement;
    private updateInterval: number = 0;
    
    constructor(private canvasApi: CanvasApiBridge) {
        this.rootEl = this.createBasicLayout();
        this.canvasContainer = this.rootEl.querySelector('#canvas-area') as HTMLElement;
        
        this.setupBasicControls();
        this.startBasicUpdates();
        
        // Add canvas to container
        this.canvasContainer.appendChild(this.canvasApi.getCanvasElement());
        // Wire canvas interactions so tools actually act on pointer events
        this.setupCanvasInteractions();
    }
    
    private createBasicLayout(): HTMLElement {
        const layout = BB.el({
            tagName: 'div',
            parent: document.body
        });
        
        // RAW HTML - NO CSS STYLING AT ALL
        layout.innerHTML = `
            <h1>BASIC HTML DEV UI</h1>
            <hr>
            
            <!-- STATUS -->
            <div>
                <strong>STATUS:</strong>
                Tool: <span id="current-tool">brush</span> | 
                Brush: <span id="brush-size">10</span>px | 
                Layer: <span id="active-layer">1</span>/<span id="total-layers">1</span> | 
                History: <span id="history-status">0/0</span>
            </div>
            <hr>
            
            <!-- ADVANCED TOOLS -->
            <fieldset>
                <legend>DRAWING TOOLS</legend>
                <h4>Main Tools</h4>
                <button id="tool-brush" data-tool="brush">Brush</button>
                <button id="engine-pen" data-brush-type="penBrush">Pencil</button>
                <button id="engine-pixel" data-brush-type="pixelBrush">Pixel</button>
                <button id="engine-eraser" data-brush-type="eraserBrush">Eraser</button>
                <button id="engine-smudge" data-brush-type="smudgeBrush">Smudge</button>
                <button id="engine-blend" data-brush-type="blendBrush">Blend</button>
                <button id="engine-sketchy" data-brush-type="sketchyBrush">Sketchy</button>
                <button id="engine-chemy" data-brush-type="chemyBrush">Chemy</button><br>
                <button id="tool-hand" data-tool="hand">Hand</button>
                <button id="tool-paintBucket" data-tool="paintBucket">Paint Bucket</button>
                <button id="tool-eyedropper" data-tool="eyedropper">Eyedropper</button><br>
                <button id="tool-text" data-tool="text">Text</button>
                <button id="tool-shape" data-tool="shape">Shape</button>
                <button id="tool-select" data-tool="select">Select</button>
                <button id="tool-gradient" data-tool="gradient">Gradient</button><br>
                
                Current Tool: <span id="current-active-tool">brush</span><br>
            </fieldset>
            
            <!-- BRUSH CONTROLS -->
            <fieldset>
                <legend>BRUSH CONTROLS</legend>
                <label>Size: <input type="number" id="brush-size-input" value="10" min="1" max="500"></label>
                <label>Opacity: <input type="range" id="brush-opacity-slider" value="100" min="1" max="100"><span id="brush-opacity-display">100</span>%</label><br>
                
                <label>Engine:
                    <select id="brush-engine">
                        <option value="penBrush">Pen</option>
                        <option value="pixelBrush">Pixel</option>
                        <option value="eraserBrush">Eraser</option>
                        <option value="smudgeBrush">Smudge</option>
                        <option value="blendBrush">Blend</option>
                        <option value="sketchyBrush">Sketchy</option>
                        <option value="chemyBrush">Chemy</option>
                    </select>
                </label><br>
                
                <label>Shape: 
                    <select id="brush-shape">
                        <option value="circle">Circle</option>
                        <option value="square">Square</option>
                    </select>
                </label>
                <label>Falloff: <input type="range" id="brush-falloff-slider" value="100" min="0" max="100"><span id="brush-falloff-display">100</span>%</label><br>
                
                <label>Hardness: <input type="range" id="brush-hardness" value="50" min="0" max="100"><span id="brush-hardness-display">50</span>%</label><br>
                <label>Flow: <input type="range" id="brush-flow" value="100" min="0" max="100"><span id="brush-flow-display">100</span>%</label><br>
                <label>Rotation: <input type="range" id="brush-rotation" value="0" min="0" max="360"><span id="brush-rotation-display">0</span>°</label><br>
                <label>Spacing: <input type="range" id="brush-spacing" value="25" min="1" max="200"><span id="brush-spacing-display">25</span>%</label><br>
                <label>Stabilizer: <input type="range" id="brush-stabilizer" value="0" min="0" max="100"><span id="brush-stabilizer-display">0</span>%</label><br>
                
                <label>Pressure Sensitivity: <input type="checkbox" id="brush-pressure"></label><br>
                <button id="test-draw-line">Test Draw Line</button><br>
            </fieldset>
            
            <!-- ENGINE EXTRAS -->
            <fieldset>
                <legend>ENGINE EXTRAS</legend>
                <h5>Blend Brush</h5>
                <label>Blending: <input type="range" id="brush-blending-slider" value="50" min="0" max="100"><span id="brush-blending-display">50</span>%</label><br>
                
                <h5>Pixel Brush</h5>
                <label>Dither: <input type="range" id="pixel-dither" value="0" min="0" max="100"><span id="pixel-dither-display">0</span>%</label><br>
                <button id="quick-pixel-1px">1px Hard Pixel</button>
                <button id="quick-soft-round">Soft Round Default</button><br>
                
                <h5>Sketchy Brush</h5>
                <label>Scale: <input type="range" id="sketchy-scale" value="100" min="10" max="300"><span id="sketchy-scale-display">100</span>%</label><br>
                
                <h5>Chemy Brush</h5>
                Mode: <select id="chemy-mode"><option value="fill">Fill</option><option value="stroke">Stroke</option></select><br>
                <label>Distort: <input type="range" id="chemy-distort" value="0" min="0" max="100"><span id="chemy-distort-display">0</span>%</label><br>
                <label>X Symmetry: <input type="checkbox" id="chemy-x-symmetry"></label>
                <label>Y Symmetry: <input type="checkbox" id="chemy-y-symmetry"></label>
                <label>Gradient: <input type="checkbox" id="chemy-gradient"></label>
            </fieldset>
            
            <!-- COLORS -->
            <fieldset>
                <legend>COLORS</legend>
                <label>Primary: <input type="color" id="primary-color" value="#000000"></label>
                RGB: <span id="primary-rgb">0,0,0</span><br>
                <label>Secondary: <input type="color" id="secondary-color" value="#ffffff"></label>
                RGB: <span id="secondary-rgb">255,255,255</span><br>
                <button id="swap-colors">Swap Colors</button>
                <button id="reset-colors">Reset</button>
            </fieldset>
            
            <!-- LINE DRAWING -->
            <fieldset>
                <legend>DRAW LINE</legend>
                <label>X1: <input type="number" id="line-x1" value="0"></label>
                <label>Y1: <input type="number" id="line-y1" value="0"></label>
                <label>X2: <input type="number" id="line-x2" value="100"></label>
                <label>Y2: <input type="number" id="line-y2" value="100"></label>
                <button id="draw-line">Draw Line</button>
            </fieldset>
            
            
            
            <!-- ADVANCED FILL TOOL -->
            <fieldset>
                <legend>FILL TOOL</legend>
                <label>Tolerance: <input type="number" id="fill-tolerance-input" value="0" min="0" max="255"></label>
                <label>Tolerance Slider: <input type="range" id="fill-tolerance-slider" value="0" min="0" max="255"><span id="fill-tolerance-display">0</span></label><br>
                <label>Contiguous: <input type="checkbox" id="fill-contiguous" checked></label>
                <label>Sample Mode: 
                    <select id="fill-sample-mode">
                        <option value="all">All Layers</option>
                        <option value="current">Current Layer</option>
                        <option value="above">Above Layer</option>
                    </select>
                </label><br>
                <label>Grow: <input type="number" id="fill-grow" value="0" min="0" max="10"></label><br>
                <button id="fill-test-100">Test Fill (100,100)</button>
                <button id="fill-center">Fill Center</button>
                <button id="fill-custom">Fill Custom Position</button><br>
                Custom Position: X:<input type="number" id="fill-x" value="50" style="width:60px"> Y:<input type="number" id="fill-y" value="50" style="width:60px">
                <br>
                <h4>Bucket Radial Gradient Fill</h4>
                Origin X: <input type="number" id="dg-x" value="100" style="width:70px">
                Origin Y: <input type="number" id="dg-y" value="100" style="width:70px"><br>
                Stops (JSON):
                <textarea id="dg-stops" rows="4" cols="60">[
  {"t":0, "color":{"r":255,"g":0,"b":0}},
  {"t":1, "color":{"r":0,"g":0,"b":255}}
]</textarea>
                <button id="apply-radial-bucket">Apply Radial Bucket Fill</button>
            </fieldset>
            
            <!-- EYEDROPPER TOOL -->
            <fieldset>
                <legend>EYEDROPPER</legend>
                <button id="eyedropper-test-100">Sample Color (100,100)</button>
                <button id="eyedropper-center">Sample Center</button>
                <button id="eyedropper-custom">Sample Custom Position</button><br>
                Custom Position: X:<input type="number" id="eyedropper-x" value="50" style="width:60px"> Y:<input type="number" id="eyedropper-y" value="50" style="width:60px"><br>
                Last Sampled: <span id="last-sampled-color">None</span>
            </fieldset>
            
            <!-- PAN/ZOOM CONTROLS -->
            <fieldset>
                <legend>PAN/ZOOM</legend>
                <h4>Pan Controls</h4>
                <button id="pan-left">← Left</button>
                <button id="pan-right">Right →</button>
                <button id="pan-up">↑ Up</button>
                <button id="pan-down">↓ Down</button><br>
                <label>Pan Distance: <input type="number" id="pan-distance" value="50" min="1" max="500"></label><br>
                
                <h4>Pan Sliders (Test Canvas Pan Tolerance)</h4>
                <label>Pan X: <input type="range" id="pan-x-slider" value="0" min="-200" max="200" step="5"><span id="pan-x-display">0</span>px</label><br>
                <label>Pan Y: <input type="range" id="pan-y-slider" value="0" min="-200" max="200" step="5"><span id="pan-y-display">0</span>px</label><br>
                <button id="reset-pan">Reset Pan</button><br>
                
                <h4>Zoom Controls</h4>
                <button id="zoom-in">Zoom In</button>
                <button id="zoom-out">Zoom Out</button>
                <button id="zoom-reset">Reset Zoom</button>
                <button id="zoom-fit">Fit to Screen</button><br>
                <label>Zoom Slider: <input type="range" id="zoom-slider" value="100" min="10" max="800" step="5"><span id="zoom-display">100</span>%</label><br>
                Current Zoom: <span id="current-zoom-level">100%</span><br>
                <label>Zoom Factor: <input type="number" id="zoom-factor" value="1.2" min="0.1" max="5" step="0.1"></label>
            </fieldset>
            
                					<!-- SELECTION TOOLS -->
            	<fieldset>
                	<legend>SELECTION TOOLS</legend>
                	<label>Feather: <input type="number" id="selection-feather" value="0" min="0" max="100"></label>
                	<label>Antialias: <input type="checkbox" id="selection-antialias" checked></label><br>
                	<button id="clear-selection">Clear Selection</button>
                	<button id="select-all">Select All</button>
                	Selection Info: <span id="selection-info">None</span>
            	</fieldset>
            
            <!-- CANVAS -->
            <fieldset>
                <legend>CANVAS</legend>
                <label>Width: <input type="number" id="canvas-width" value="800"></label>
                <label>Height: <input type="number" id="canvas-height" value="600"></label>
                <button id="resize-canvas">Resize</button><br>
                <button id="clear-canvas">Clear Canvas</button>
                <button id="undo-btn">Undo</button>
                <button id="redo-btn">Redo</button>
            </fieldset>
            
            <!-- LAYERS -->
            <fieldset>
                <legend>LAYERS</legend>
                <button id="add-layer">Add Layer</button>
                <button id="delete-layer">Delete Layer</button>
                <button id="duplicate-layer">Duplicate Layer</button>
                <button id="clear-layer">Clear Layer</button><br>
                <button id="merge-down">Merge Down</button>
                <button id="flatten-layers">Flatten All</button>
                <div id="layer-list">Loading layers...</div>
            </fieldset>
            
            <!-- TEXT -->
            <fieldset>
                <legend>TEXT</legend>
                <label>Text: <textarea id="text-content" rows="3" cols="30">Hello World</textarea></label><br>
                <label>X: <input type="number" id="text-x" value="100"></label>
                <label>Y: <input type="number" id="text-y" value="100"></label>
                <label>Size: <input type="number" id="text-size" value="24"></label><br>
                <label>Font: 
                    <select id="text-font">
                        <option value="sans-serif">Sans-serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                        <option value="cursive">Cursive</option>
                        <option value="fantasy">Fantasy</option>
                    </select>
                </label><br>
                <button id="create-text">Create Text</button>
                <button id="finalize-text">Finalize All</button>
                <button id="cancel-text">Cancel All</button><br>
                Active Text: <span id="active-text-count">0</span>
            </fieldset>
            
            <!-- QUICK ACTIONS -->
            <fieldset>
                <legend>QUICK ACTIONS</legend>
                <button id="test-brushes">Test All Brushes</button>
                <button id="create-test-layers">Create Test Layers</button>
                <button id="stress-test">Stress Test</button>
                <button id="random-drawing">Random Drawing</button>
            </fieldset>
            
            <!-- CANVAS AREA -->
            <fieldset>
                <legend>CANVAS</legend>
                <div id="canvas-area" style="border: 1px solid black; display: inline-block;"></div>
            </fieldset>
            
            <!-- API TESTER -->
            <fieldset>
                <legend>API TESTER</legend>
                <textarea id="api-command" rows="5" cols="80" placeholder="Enter API command (e.g., canvasApi.createLayer('test'))"></textarea><br>
                <button id="execute-api">Execute</button><br>
                <textarea id="api-result" rows="10" cols="80" readonly>Ready for commands...</textarea>
            </fieldset>
            
            					<!-- VECTOR STAMPS (SVG) -->
            <fieldset>
                <legend>VECTOR STAMPS (SVG)</legend>
                <label>Name: <input type="text" id="svg-stamp-name" value="myStamp"></label><br>
                <label>SVG Path Data:</label><br>
                <textarea id="svg-path-data" rows="4" cols="80" placeholder="M10 10 H 90 V 90 H 10 Z"></textarea><br>
                <button id="register-svg-stamp">Register Stamp</button>
                <button id="unregister-svg-stamp">Unregister Stamp</button>
                <button id="list-svg-stamps">List Stamps</button><br>
                Place: X:<input type="number" id="svg-stamp-x" value="100" style="width:70px"> Y:<input type="number" id="svg-stamp-y" value="100" style="width:70px"><br>
                Scale:<input type="number" id="svg-stamp-scale" value="1" step="0.1" style="width:80px">
                Rotation:<input type="number" id="svg-stamp-rot" value="0" step="1" style="width:80px">°
                Falloff(px):<input type="number" id="svg-stamp-falloff" value="0" min="0" style="width:80px">
                Opacity:<input type="number" id="svg-stamp-opacity" value="1" min="0" max="1" step="0.05" style="width:80px">
                Blend:<select id="svg-stamp-blend"><option>source-over</option><option>multiply</option><option>screen</option><option>overlay</option><option>darken</option><option>lighten</option></select>
                <button id="place-svg-stamp">Place Stamp</button>
            </fieldset>
            
            					<!-- DEBUG INFO -->
            <fieldset>
                <legend>DEBUG INFO</legend>
                <pre id="debug-info">Loading debug info...</pre>
            </fieldset>
        `;
        
        return layout;
    }
    
    private setupBasicControls(): void {
        const root = this.rootEl;
        
        // TOOLS: standardized to use data-tool with ToolManager bridge
        // (Removed id-based fallback to avoid ambiguity and non-functional mappings)
        
        // BRUSH ENGINE QUICK BUTTONS (ensure brush tool is active)
        root.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const engine = target.getAttribute('data-brush-type');
            if (engine) {
                // Switch engine
                this.canvasApi.setBrushType(engine);
                // Switch to brush tool for immediate effect if available
                (this.canvasApi as any).setToolManagerTool?.('brush');

                // Apply minimal, non-destructive presets so engines are visually distinct
                // - penBrush: soft round (circle + high falloff)
                // - pixelBrush: hard square (square + zero falloff)
                try {
                    if (engine === 'penBrush') {
                        (this.canvasApi as any).setBrushShape?.('circle');
                        (this.canvasApi as any).setBrushFalloff?.(1);
                    } else if (engine === 'pixelBrush') {
                        (this.canvasApi as any).setBrushShape?.('square');
                        (this.canvasApi as any).setBrushFalloff?.(0);
                        // Keep dither explicit for clarity
                        (this.canvasApi as any).setPixelDither?.(0);
                    }
                } catch {}

                this.highlightActiveBrush(engine);
                this.updateStatus();
            }
        });
        
        // Removed dead control: list-all-brushes (no corresponding HTML element)
        
        // BRUSH SIZE
        const sizeInput = root.querySelector('#brush-size-input') as HTMLInputElement;
        sizeInput.addEventListener('input', () => {
            this.canvasApi.setBrushSize(parseInt(sizeInput.value));
            this.updateStatus();
        });
        
        // BRUSH OPACITY - using the correct ID from HTML
        const opacityInput = root.querySelector('#brush-opacity-slider') as HTMLInputElement;
        opacityInput?.addEventListener('input', () => {
            this.canvasApi.setBrushOpacity(parseInt(opacityInput.value) / 100);
            this.updateStatus();
        });
        
        // BRUSH ENGINE TYPE
        const brushEngine = root.querySelector('#brush-engine') as HTMLSelectElement;
        brushEngine?.addEventListener('change', () => {
            this.canvasApi.setBrushType(brushEngine.value);
        });
        
        // COLORS
        const primaryColor = root.querySelector('#primary-color') as HTMLInputElement;
        const secondaryColor = root.querySelector('#secondary-color') as HTMLInputElement;
        
        primaryColor.addEventListener('change', () => {
            const rgb = this.hexToRgb(primaryColor.value);
            this.canvasApi.setPrimaryColor(rgb);
            this.canvasApi.setBrushColor(rgb);
            this.updateStatus();
        });
        
        secondaryColor.addEventListener('change', () => {
            const rgb = this.hexToRgb(secondaryColor.value);
            this.canvasApi.setSecondaryColor(rgb);
            this.updateStatus();
        });
        
        // COLOR ACTIONS
        root.querySelector('#swap-colors')?.addEventListener('click', () => {
            const primary = this.canvasApi.getPrimaryColor();
            const secondary = this.canvasApi.getSecondaryColor();
            this.canvasApi.setPrimaryColor(secondary);
            this.canvasApi.setSecondaryColor(primary);
            this.updateColors();
        });
        
        root.querySelector('#reset-colors')?.addEventListener('click', () => {
            this.canvasApi.setPrimaryColor({ r: 0, g: 0, b: 0 });
            this.canvasApi.setSecondaryColor({ r: 255, g: 255, b: 255 });
            this.updateColors();
        });
        
        // LINE DRAWING
        root.querySelector('#draw-line')?.addEventListener('click', () => {
            const x1 = parseInt((root.querySelector('#line-x1') as HTMLInputElement).value);
            const y1 = parseInt((root.querySelector('#line-y1') as HTMLInputElement).value);
            const x2 = parseInt((root.querySelector('#line-x2') as HTMLInputElement).value);
            const y2 = parseInt((root.querySelector('#line-y2') as HTMLInputElement).value);
            this.canvasApi.drawLine(x1, y1, x2, y2);
        });
        
        // CANVAS ACTIONS
        root.querySelector('#resize-canvas')?.addEventListener('click', () => {
            const width = parseInt((root.querySelector('#canvas-width') as HTMLInputElement).value);
            const height = parseInt((root.querySelector('#canvas-height') as HTMLInputElement).value);
            this.canvasApi.resizeCanvas(width, height);
        });
        
        root.querySelector('#clear-canvas')?.addEventListener('click', () => {
            if (confirm('Clear entire canvas?')) {
                this.canvasApi.clearCanvas();
            }
        });
        
        root.querySelector('#undo-btn')?.addEventListener('click', () => {
            this.canvasApi.undo();
        });
        
        root.querySelector('#redo-btn')?.addEventListener('click', () => {
            this.canvasApi.redo();
        });
        
        // LAYER ACTIONS
        root.querySelector('#add-layer')?.addEventListener('click', () => {
            const count = this.canvasApi.getLayerCount();
            this.canvasApi.createLayer(`Layer ${count + 1}`);
            this.updateLayers();
        });
        
        root.querySelector('#delete-layer')?.addEventListener('click', () => {
            if (this.canvasApi.getLayerCount() > 1) {
                this.canvasApi.deleteLayer(this.canvasApi.getActiveLayerIndex());
                this.updateLayers();
            } else {
                alert('Cannot delete last layer');
            }
        });
        
        root.querySelector('#duplicate-layer')?.addEventListener('click', () => {
            this.canvasApi.duplicateLayer(this.canvasApi.getActiveLayerIndex());
            this.updateLayers();
        });
        
        root.querySelector('#clear-layer')?.addEventListener('click', () => {
            this.canvasApi.clearLayer(this.canvasApi.getActiveLayerIndex());
        });
        
        root.querySelector('#merge-down')?.addEventListener('click', () => {
            this.canvasApi.mergeLayerDown(this.canvasApi.getActiveLayerIndex());
            this.updateLayers();
        });
        
        root.querySelector('#flatten-layers')?.addEventListener('click', () => {
            if (confirm('Flatten all layers?')) {
                this.canvasApi.flattenLayers();
                this.updateLayers();
            }
        });
        
        // TEXT
        root.querySelector('#create-text')?.addEventListener('click', () => {
            const text = (root.querySelector('#text-content') as HTMLTextAreaElement).value;
            const x = parseInt((root.querySelector('#text-x') as HTMLInputElement).value);
            const y = parseInt((root.querySelector('#text-y') as HTMLInputElement).value);
            const size = parseInt((root.querySelector('#text-size') as HTMLInputElement).value);
            const font = (root.querySelector('#text-font') as HTMLSelectElement).value;
            
            if (text.trim()) {
                this.canvasApi.createText({
                    text: text.trim(),
                    x, y, size, font
                });
                this.updateText();
            }
        });
        
        root.querySelector('#finalize-text')?.addEventListener('click', () => {
            this.canvasApi.finalizeAllText();
            this.updateText();
        });
        
        root.querySelector('#cancel-text')?.addEventListener('click', () => {
            this.canvasApi.cancelAllText();
            this.updateText();
        });
        
        // QUICK ACTIONS
        root.querySelector('#test-brushes')?.addEventListener('click', () => {
            const brushes = this.canvasApi.getAvailableBrushes();
            alert(`Available brushes: ${brushes.join(', ')}`);
        });
        
        root.querySelector('#create-test-layers')?.addEventListener('click', () => {
            for (let i = 0; i < 3; i++) {
                this.canvasApi.createLayer(`Test Layer ${i + 1}`);
            }
            this.updateLayers();
        });
        
        root.querySelector('#stress-test')?.addEventListener('click', () => {
            // Draw 100 random lines
            for (let i = 0; i < 100; i++) {
                this.canvasApi.setPrimaryColor({
                    r: Math.floor(Math.random() * 255),
                    g: Math.floor(Math.random() * 255),
                    b: Math.floor(Math.random() * 255)
                });
                this.canvasApi.drawLine(
                    Math.random() * 800,
                    Math.random() * 600,
                    Math.random() * 800,
                    Math.random() * 600
                );
            }
            alert('Stress test complete - 100 random lines drawn');
        });
        
        root.querySelector('#random-drawing')?.addEventListener('click', () => {
            // Random drawing pattern
            for (let i = 0; i < 10; i++) {
                this.canvasApi.setPrimaryColor({
                    r: Math.floor(Math.random() * 255),
                    g: Math.floor(Math.random() * 255),
                    b: Math.floor(Math.random() * 255)
                });
                this.canvasApi.setBrushSize(Math.floor(Math.random() * 50) + 5);
                this.canvasApi.drawLine(
                    Math.random() * 400 + 100,
                    Math.random() * 300 + 100,
                    Math.random() * 400 + 200,
                    Math.random() * 300 + 200
                );
            }
        });
        
        // API TESTER
        root.querySelector('#execute-api')?.addEventListener('click', () => {
            const command = (root.querySelector('#api-command') as HTMLTextAreaElement).value;
            const result = root.querySelector('#api-result') as HTMLTextAreaElement;
            
            try {
                const canvasApi = this.canvasApi;
                const evalResult = eval(command);
                result.value += `\n> ${command}\nResult: ${JSON.stringify(evalResult)}\n`;
            } catch (error) {
                result.value += `\n> ${command}\nError: ${error}\n`;
            }
            
            result.scrollTop = result.scrollHeight;
        });
        
        // VECTOR STAMPS (SVG)
        root.querySelector('#register-svg-stamp')?.addEventListener('click', () => {
            const name = (root.querySelector('#svg-stamp-name') as HTMLInputElement).value.trim();
            const data = (root.querySelector('#svg-path-data') as HTMLTextAreaElement).value.trim();
            if (!name || !data) { alert('Provide name and SVG path data'); return; }
            (this.canvasApi as any).registerSvgStamp(name, data);
            alert(`Registered stamp '${name}'`);
        });
        root.querySelector('#unregister-svg-stamp')?.addEventListener('click', () => {
            const name = (root.querySelector('#svg-stamp-name') as HTMLInputElement).value.trim();
            if (!name) { alert('Provide stamp name'); return; }
            (this.canvasApi as any).unregisterSvgStamp(name);
            alert(`Unregistered stamp '${name}'`);
        });
        root.querySelector('#list-svg-stamps')?.addEventListener('click', () => {
            const names = (this.canvasApi as any).listSvgStamps();
            alert(`Stamps: ${names.join(', ')}`);
        });
        root.querySelector('#place-svg-stamp')?.addEventListener('click', () => {
            const name = (root.querySelector('#svg-stamp-name') as HTMLInputElement).value.trim();
            const x = parseInt((root.querySelector('#svg-stamp-x') as HTMLInputElement).value);
            const y = parseInt((root.querySelector('#svg-stamp-y') as HTMLInputElement).value);
            const scale = parseFloat((root.querySelector('#svg-stamp-scale') as HTMLInputElement).value);
            const rotation = parseFloat((root.querySelector('#svg-stamp-rot') as HTMLInputElement).value);
            const falloff = parseInt((root.querySelector('#svg-stamp-falloff') as HTMLInputElement).value);
            const opacity = parseFloat((root.querySelector('#svg-stamp-opacity') as HTMLInputElement).value);
            const blend = (root.querySelector('#svg-stamp-blend') as HTMLSelectElement).value as GlobalCompositeOperation;
            const fill = this.canvasApi.getPrimaryColor();
            (this.canvasApi as any).stampSvg(name, x, y, { scale, rotation, falloffPx: falloff, opacity, blendMode: blend, fill });
        });

        // Removed dead control: get-brushes (no corresponding HTML element)
        
        // SLIDER VALUE UPDATES
        this.setupSliderUpdates();
        
        // ADVANCED TOOL CONTROLS
        this.setupAdvancedToolControls();
        
        // Delegate clicks for layer selection buttons to ensure they work
        const layerList = root.querySelector('#layer-list') as HTMLElement;
        layerList?.addEventListener('click', (ev) => {
            const btn = (ev.target as HTMLElement);
            if (btn && btn.classList.contains('select-layer')) {
                const idx = parseInt(btn.getAttribute('data-index') || '-1');
                if (!isNaN(idx) && idx >= 0) {
                    this.canvasApi.setActiveLayer(idx);
                    this.updateLayers();
                }
            }
        });
    }
    
    private hexToRgb(hex: string): IRGB {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }
    
    private rgbToHex(rgb: IRGB): string {
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
    }
    
    private startBasicUpdates(): void {
        this.updateInterval = window.setInterval(() => {
            this.updateStatus();
            this.updateDebugInfo();
        }, 500); // Update 2x per second
    }
    
    private updateStatus(): void {
        const root = this.rootEl;
        
        // Prefer ToolManager tool if available; fallback to engine tool
        const tool = (this.canvasApi as any).getToolManagerCurrentTool?.() || this.canvasApi.getCurrentTool();
        (root.querySelector('#current-tool') as HTMLElement).textContent = tool;
        (root.querySelector('#brush-size') as HTMLElement).textContent = this.canvasApi.getBrushSize().toString();
        (root.querySelector('#active-layer') as HTMLElement).textContent = (this.canvasApi.getActiveLayerIndex() + 1).toString();
        (root.querySelector('#total-layers') as HTMLElement).textContent = this.canvasApi.getLayerCount().toString();
        
        const canUndo = this.canvasApi.canUndo() ? '✓' : '✗';
        const canRedo = this.canvasApi.canRedo() ? '✓' : '✗';
        (root.querySelector('#history-status') as HTMLElement).textContent = `${canUndo}/${canRedo}`;
    }
    
    private updateColors(): void {
        const root = this.rootEl;
        const primary = this.canvasApi.getPrimaryColor();
        const secondary = this.canvasApi.getSecondaryColor();
        
        (root.querySelector('#primary-color') as HTMLInputElement).value = this.rgbToHex(primary);
        (root.querySelector('#secondary-color') as HTMLInputElement).value = this.rgbToHex(secondary);
        (root.querySelector('#primary-rgb') as HTMLElement).textContent = `${primary.r},${primary.g},${primary.b}`;
        (root.querySelector('#secondary-rgb') as HTMLElement).textContent = `${secondary.r},${secondary.g},${secondary.b}`;
    }
    
    private updateLayers(): void {
        const root = this.rootEl;
        const layers = this.canvasApi.getAllLayersInfo();
        const active = this.canvasApi.getActiveLayerIndex();
        
        const layerList = root.querySelector('#layer-list') as HTMLElement;
        layerList.innerHTML = layers.map((layer, index) => 
            `<div>
                ${index === active ? '→ ' : '&nbsp;&nbsp;'}
                Layer ${index + 1}: ${layer.name} 
                (${layer.isVisible ? 'visible' : 'hidden'}, 
                opacity: ${Math.round(layer.opacity * 100)}%)
                <button class="select-layer" data-index="${index}">Select</button>
            </div>`
        ).join('');
    }
    
    private updateText(): void {
        const root = this.rootEl;
        const activeTexts = this.canvasApi.getActiveTextInstances();
        (root.querySelector('#active-text-count') as HTMLElement).textContent = activeTexts.length.toString();
    }
    
    private updateDebugInfo(): void {
        const root = this.rootEl;
        const debugInfo = root.querySelector('#debug-info') as HTMLElement;
        
        debugInfo.textContent = `
Current Tool: ${this.canvasApi.getCurrentTool()}
Brush Size: ${this.canvasApi.getBrushSize()}px
Brush Opacity: ${Math.round(this.canvasApi.getBrushOpacity() * 100)}%
Layer Count: ${this.canvasApi.getLayerCount()}
Active Layer: ${this.canvasApi.getActiveLayerIndex()}
Can Undo: ${this.canvasApi.canUndo()}
Can Redo: ${this.canvasApi.canRedo()}
Active Text: ${this.canvasApi.getActiveTextInstances().length}
Available Brushes: ${this.canvasApi.getAvailableBrushes().join(', ')}
Available Mix Modes: ${this.canvasApi.getAvailableMixModes().join(', ')}
        `;
    }
    
    private setupSliderUpdates(): void {
        const root = this.rootEl;
        
        // Update slider display values
        const updateSliderValue = (sliderId: string, valueId: string) => {
            const slider = root.querySelector(`#${sliderId}`) as HTMLInputElement;
            const valueSpan = root.querySelector(`#${valueId}`) as HTMLElement;
            
            if (slider && valueSpan) {
                slider.addEventListener('input', () => {
                    valueSpan.textContent = slider.value;
                });
            }
        };
        
        updateSliderValue('brightness-slider', 'brightness-value');
        updateSliderValue('contrast-slider', 'contrast-value');
        updateSliderValue('hue-slider', 'hue-value');
        updateSliderValue('saturation-slider', 'saturation-value');
        updateSliderValue('gradient-opacity', 'gradient-opacity-value');
        updateSliderValue('noise-density', 'noise-density-value');
        updateSliderValue('brush-opacity-slider', 'brush-opacity-display');
        updateSliderValue('brush-falloff-slider', 'brush-falloff-display');
        updateSliderValue('brush-hardness', 'brush-hardness-display');
        updateSliderValue('brush-flow', 'brush-flow-display');
        updateSliderValue('brush-rotation', 'brush-rotation-display');
        updateSliderValue('brush-spacing', 'brush-spacing-display');
        updateSliderValue('brush-stabilizer', 'brush-stabilizer-display');
        updateSliderValue('brush-blending-slider', 'brush-blending-display');
        updateSliderValue('pixel-dither', 'pixel-dither-display');
        updateSliderValue('sketchy-scale', 'sketchy-scale-display');
        updateSliderValue('chemy-distort', 'chemy-distort-display');
        updateSliderValue('fill-tolerance-slider', 'fill-tolerance-display');
        updateSliderValue('pan-x-slider', 'pan-x-display');
        updateSliderValue('pan-y-slider', 'pan-y-display');
        updateSliderValue('zoom-slider', 'zoom-display');
    }
    
    private setupAdvancedToolControls(): void {
        const root = this.rootEl;
        
        // === TOOL SWITCHING ===
        
        // Advanced tool buttons with data-tool attribute
        root.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const toolType = target.getAttribute('data-tool');
            if (toolType && typeof (this.canvasApi as any).setToolManagerTool === 'function') {
                (this.canvasApi as any).setToolManagerTool(toolType);
                (root.querySelector('#current-active-tool') as HTMLElement).textContent = toolType;
                this.highlightActiveTool(toolType);
            }
        });
        
        // Removed dead control: list-all-tools (no corresponding HTML element)
        
        // === SIMPLIFIED BRUSH CONTROLS ===
        
        // Brush shape selector
        const brushShape = root.querySelector('#brush-shape') as HTMLSelectElement;
        brushShape?.addEventListener('change', () => {
            if (typeof (this.canvasApi as any).setBrushShape === 'function') {
                (this.canvasApi as any).setBrushShape(brushShape.value);
            } else {
                // Fallback for pen brush alpha mode (0=circle, 3=square)
                const alphaMode = brushShape.value === 'circle' ? 0 : 3;
                if (typeof (this.canvasApi as any).setAlpha === 'function') {
                    (this.canvasApi as any).setAlpha(alphaMode);
                }
            }
        });
        
        // Brush falloff slider
        const falloffSlider = root.querySelector('#brush-falloff-slider') as HTMLInputElement;
        falloffSlider?.addEventListener('input', () => {
            const falloff = parseInt(falloffSlider.value) / 100;
            if (typeof (this.canvasApi as any).setBrushFalloff === 'function') {
                (this.canvasApi as any).setBrushFalloff(falloff);
            } else {
                // Fallback to adjust spacing (affects brush falloff)
                const spacing = 0.5 + (falloff * 0.4); // Range 0.5-0.9
                if (typeof (this.canvasApi as any).setSpacing === 'function') {
                    (this.canvasApi as any).setSpacing(spacing);
                }
            }
        });
        
        // Pressure sensitivity
        const pressureCheckbox = root.querySelector('#brush-pressure') as HTMLInputElement;
        pressureCheckbox?.addEventListener('change', () => {
            if (typeof (this.canvasApi as any).setPressureSensitivity === 'function') {
                (this.canvasApi as any).setPressureSensitivity(pressureCheckbox.checked);
            }
        });
        
        // Hardness
        const hardnessSlider = root.querySelector('#brush-hardness') as HTMLInputElement;
        hardnessSlider?.addEventListener('input', () => {
            const hardness = parseInt(hardnessSlider.value);
            if ((this.canvasApi as any).setBrushHardness) (this.canvasApi as any).setBrushHardness(hardness);
        });
        // Flow
        const flowSlider = root.querySelector('#brush-flow') as HTMLInputElement;
        flowSlider?.addEventListener('input', () => {
            const flow = parseInt(flowSlider.value) / 100;
            if ((this.canvasApi as any).setBrushFlow) (this.canvasApi as any).setBrushFlow(flow);
        });
        // Rotation
        const rotationSlider = root.querySelector('#brush-rotation') as HTMLInputElement;
        rotationSlider?.addEventListener('input', () => {
            const rotation = parseInt(rotationSlider.value);
            if ((this.canvasApi as any).setBrushRotation) (this.canvasApi as any).setBrushRotation(rotation);
        });
        // Spacing
        const spacingSlider = root.querySelector('#brush-spacing') as HTMLInputElement;
        spacingSlider?.addEventListener('input', () => {
            const spacing = parseInt(spacingSlider.value);
            if ((this.canvasApi as any).setBrushSpacing) (this.canvasApi as any).setBrushSpacing(spacing);
        });
        // Stabilizer
        const stabilizerSlider = root.querySelector('#brush-stabilizer') as HTMLInputElement;
        stabilizerSlider?.addEventListener('input', () => {
            const stabilizer = parseInt(stabilizerSlider.value) / 100;
            if ((this.canvasApi as any).setBrushStabilizer) (this.canvasApi as any).setBrushStabilizer(stabilizer);
        });

        // Test drawing controls
        root.querySelector('#test-draw-line')?.addEventListener('click', () => {
            if (typeof (this.canvasApi as any).drawLine === 'function') {
                (this.canvasApi as any).drawLine(50, 50, 200, 150);
                alert('Test line drawn!');
            } else {
                this.canvasApi.drawLine(50, 50, 200, 150);
                alert('Test line drawn with basic API!');
            }
        });
        
        // Blend brush blending
        const blendingSlider = root.querySelector('#brush-blending-slider') as HTMLInputElement;
        blendingSlider?.addEventListener('input', () => {
            const blending = parseInt(blendingSlider.value) / 100;
            if (typeof (this.canvasApi as any).setBrushBlending === 'function') {
                (this.canvasApi as any).setBrushBlending(blending);
            }
        });
        
        // Pixel brush dither
        const pixelDither = root.querySelector('#pixel-dither') as HTMLInputElement;
        pixelDither?.addEventListener('input', () => {
            const dither = parseInt(pixelDither.value) / 100;
            if (typeof (this.canvasApi as any).setPixelDither === 'function') {
                (this.canvasApi as any).setPixelDither(dither);
            }
        });
        
        // Quick presets
        root.querySelector('#quick-pixel-1px')?.addEventListener('click', () => {
            // Use pixel brush engine and set hard, 1px, square
            if ((this.canvasApi as any).setBrushType) (this.canvasApi as any).setBrushType('pixelBrush');
            if ((this.canvasApi as any).setBrushShape) (this.canvasApi as any).setBrushShape('square');
            this.canvasApi.setBrushSize(1);
            if ((this.canvasApi as any).setBrushFalloff) (this.canvasApi as any).setBrushFalloff(0);
        });
        root.querySelector('#quick-soft-round')?.addEventListener('click', () => {
            if ((this.canvasApi as any).setBrushType) (this.canvasApi as any).setBrushType('penBrush');
            if ((this.canvasApi as any).setBrushShape) (this.canvasApi as any).setBrushShape('circle');
            this.canvasApi.setBrushSize(20);
            if ((this.canvasApi as any).setBrushFalloff) (this.canvasApi as any).setBrushFalloff(1);
        });
        
        // Sketchy scale
        const sketchyScale = root.querySelector('#sketchy-scale') as HTMLInputElement;
        sketchyScale?.addEventListener('input', () => {
            const scale = parseInt(sketchyScale.value) / 100;
            if (typeof (this.canvasApi as any).setSketchyScale === 'function') {
                (this.canvasApi as any).setSketchyScale(scale);
            }
        });
        
        // Chemy controls
        const chemyMode = root.querySelector('#chemy-mode') as HTMLSelectElement;
        chemyMode?.addEventListener('change', () => {
            if (typeof (this.canvasApi as any).setChemyMode === 'function') {
                (this.canvasApi as any).setChemyMode(chemyMode.value);
            }
        });
        const chemyDistort = root.querySelector('#chemy-distort') as HTMLInputElement;
        chemyDistort?.addEventListener('input', () => {
            const distort = parseInt(chemyDistort.value) / 100;
            if (typeof (this.canvasApi as any).setChemyDistort === 'function') {
                (this.canvasApi as any).setChemyDistort(distort);
            }
        });
        const chemyXSym = root.querySelector('#chemy-x-symmetry') as HTMLInputElement;
        const chemyYSym = root.querySelector('#chemy-y-symmetry') as HTMLInputElement;
        const updateChemySym = () => {
            if (typeof (this.canvasApi as any).setChemySymmetry === 'function') {
                (this.canvasApi as any).setChemySymmetry(chemyXSym.checked, chemyYSym.checked);
            }
        };
        chemyXSym?.addEventListener('change', updateChemySym);
        chemyYSym?.addEventListener('change', updateChemySym);
        const chemyGradient = root.querySelector('#chemy-gradient') as HTMLInputElement;
        chemyGradient?.addEventListener('change', () => {
            if (typeof (this.canvasApi as any).setChemyGradient === 'function') {
                (this.canvasApi as any).setChemyGradient(chemyGradient.checked);
            }
        });
        
        // === FILL TOOL CONTROLS ===
        
        const fillToleranceInput = root.querySelector('#fill-tolerance-input') as HTMLInputElement;
        const fillToleranceSlider = root.querySelector('#fill-tolerance-slider') as HTMLInputElement;
        
        const updateFillTolerance = (value: number) => {
            fillToleranceInput.value = value.toString();
            fillToleranceSlider.value = value.toString();
            (root.querySelector('#fill-tolerance-display') as HTMLElement).textContent = value.toString();
            if (typeof (this.canvasApi as any).setFillTolerance === 'function') {
                (this.canvasApi as any).setFillTolerance(value);
            }
        };
        
        fillToleranceInput?.addEventListener('change', () => {
            updateFillTolerance(parseInt(fillToleranceInput.value));
        });
        
        fillToleranceSlider?.addEventListener('input', () => {
            updateFillTolerance(parseInt(fillToleranceSlider.value));
        });
        
        const fillContiguous = root.querySelector('#fill-contiguous') as HTMLInputElement;
        fillContiguous?.addEventListener('change', () => {
            if (typeof (this.canvasApi as any).setFillContiguous === 'function') {
                (this.canvasApi as any).setFillContiguous(fillContiguous.checked);
            }
        });
        
        const fillSampleMode = root.querySelector('#fill-sample-mode') as HTMLSelectElement;
        fillSampleMode?.addEventListener('change', () => {
            if (typeof (this.canvasApi as any).setFillSampleMode === 'function') {
                (this.canvasApi as any).setFillSampleMode(fillSampleMode.value);
            }
        });
        
        const fillGrow = root.querySelector('#fill-grow') as HTMLInputElement;
        fillGrow?.addEventListener('change', () => {
            if (typeof (this.canvasApi as any).setFillGrow === 'function') {
                (this.canvasApi as any).setFillGrow(parseInt(fillGrow.value));
            }
        });
        
        // Fill operation buttons
        root.querySelector('#fill-test-100')?.addEventListener('click', () => {
            if (typeof (this.canvasApi as any).performFillOperation === 'function') {
                (this.canvasApi as any).performFillOperation(100, 100);
                alert('Fill operation performed at (100, 100)');
            } else {
                alert('Fill operation API unavailable');
            }
        });
        
        // Fill center
        root.querySelector('#fill-center')?.addEventListener('click', () => {
            const container = this.canvasApi.getCanvasElement();
            const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
            if (!canvas) { alert('Canvas not found'); return; }
            const cx = Math.floor(canvas.width / 2);
            const cy = Math.floor(canvas.height / 2);
            if (typeof (this.canvasApi as any).performFillOperation === 'function') {
                (this.canvasApi as any).performFillOperation(cx, cy);
                alert(`Fill operation performed at center (${cx}, ${cy})`);
            }
        });

        root.querySelector('#fill-custom')?.addEventListener('click', () => {
            const x = parseInt((root.querySelector('#fill-x') as HTMLInputElement).value);
            const y = parseInt((root.querySelector('#fill-y') as HTMLInputElement).value);
            if (typeof (this.canvasApi as any).performFillOperation === 'function') {
                (this.canvasApi as any).performFillOperation(x, y);
                alert(`Fill operation performed at (${x}, ${y})`);
            }
        });
        
        // Radial bucket gradient fill
        root.querySelector('#apply-radial-bucket')?.addEventListener('click', () => {
            const x = parseInt((root.querySelector('#dg-x') as HTMLInputElement).value);
            const y = parseInt((root.querySelector('#dg-y') as HTMLInputElement).value);
            const text = (root.querySelector('#dg-stops') as HTMLTextAreaElement).value;
            try {
                const stops = JSON.parse(text);
                if (Array.isArray(stops)) {
                    (this.canvasApi as any).radialBucketFill(x, y, stops, { opacity: 1, blendMode: 'source-over' });
                    alert('Radial bucket gradient applied.');
                } else {
                    alert('Stops must be an array');
                }
            } catch (e) {
                alert('Invalid JSON for stops: ' + e);
            }
        });

        // === EYEDROPPER CONTROLS ===
        
        root.querySelector('#eyedropper-test-100')?.addEventListener('click', () => {
            if (typeof (this.canvasApi as any).sampleColorAt === 'function') {
                const color = (this.canvasApi as any).sampleColorAt(100, 100);
                (root.querySelector('#last-sampled-color') as HTMLElement).textContent = 
                    `RGB(${color.r}, ${color.g}, ${color.b})`;
                alert(`Sampled color: RGB(${color.r}, ${color.g}, ${color.b})`);
            }
        });
        
        root.querySelector('#eyedropper-center')?.addEventListener('click', () => {
            const container = this.canvasApi.getCanvasElement();
            const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
            if (!canvas) { alert('Canvas not found'); return; }
            const centerX = Math.floor(canvas.width / 2);
            const centerY = Math.floor(canvas.height / 2);
            if (typeof (this.canvasApi as any).sampleColorAt === 'function') {
                const color = (this.canvasApi as any).sampleColorAt(centerX, centerY);
                (root.querySelector('#last-sampled-color') as HTMLElement).textContent = 
                    `RGB(${color.r}, ${color.g}, ${color.b})`;
                alert(`Sampled color at center: RGB(${color.r}, ${color.g}, ${color.b})`);
            }
        });
        
        root.querySelector('#eyedropper-custom')?.addEventListener('click', () => {
            const x = parseInt((root.querySelector('#eyedropper-x') as HTMLInputElement).value);
            const y = parseInt((root.querySelector('#eyedropper-y') as HTMLInputElement).value);
            if (typeof (this.canvasApi as any).sampleColorAt === 'function') {
                const color = (this.canvasApi as any).sampleColorAt(x, y);
                (root.querySelector('#last-sampled-color') as HTMLElement).textContent = 
                    `RGB(${color.r}, ${color.g}, ${color.b})`;
                alert(`Sampled color at (${x}, ${y}): RGB(${color.r}, ${color.g}, ${color.b})`);
            }
        });
        
        // === PAN/ZOOM CONTROLS ===
        
        const panDistance = root.querySelector('#pan-distance') as HTMLInputElement;
        
        root.querySelector('#pan-left')?.addEventListener('click', () => {
            const distance = parseInt(panDistance.value);
            if (typeof (this.canvasApi as any).panCanvas === 'function') {
                (this.canvasApi as any).panCanvas(-distance, 0);
            }
        });
        
        root.querySelector('#pan-right')?.addEventListener('click', () => {
            const distance = parseInt(panDistance.value);
            if (typeof (this.canvasApi as any).panCanvas === 'function') {
                (this.canvasApi as any).panCanvas(distance, 0);
            }
        });
        
        root.querySelector('#pan-up')?.addEventListener('click', () => {
            const distance = parseInt(panDistance.value);
            if (typeof (this.canvasApi as any).panCanvas === 'function') {
                (this.canvasApi as any).panCanvas(0, -distance);
            }
        });
        
        root.querySelector('#pan-down')?.addEventListener('click', () => {
            const distance = parseInt(panDistance.value);
            if (typeof (this.canvasApi as any).panCanvas === 'function') {
                (this.canvasApi as any).panCanvas(0, distance);
            }
        });
        
        const zoomFactor = root.querySelector('#zoom-factor') as HTMLInputElement;
        
        root.querySelector('#zoom-in')?.addEventListener('click', () => {
            const factor = parseFloat(zoomFactor.value);
            if (typeof (this.canvasApi as any).zoomCanvas === 'function') {
                (this.canvasApi as any).zoomCanvas(factor);
                this.updateZoomDisplay();
            }
        });
        
        root.querySelector('#zoom-out')?.addEventListener('click', () => {
            const factor = 1 / parseFloat(zoomFactor.value);
            if (typeof (this.canvasApi as any).zoomCanvas === 'function') {
                (this.canvasApi as any).zoomCanvas(factor);
                this.updateZoomDisplay();
            }
        });
        
        root.querySelector('#zoom-reset')?.addEventListener('click', () => {
            if (typeof (this.canvasApi as any).resetCanvasZoom === 'function') {
                (this.canvasApi as any).resetCanvasZoom();
                this.updateZoomDisplay();
            }
        });
        
        root.querySelector('#zoom-fit')?.addEventListener('click', () => {
            if (typeof (this.canvasApi as any).fitCanvasToScreen === 'function') {
                (this.canvasApi as any).fitCanvasToScreen();
                this.updateZoomDisplay();
            }
        });
        
        // === SELECTION CONTROLS ===
        
        const selectionFeather = root.querySelector('#selection-feather') as HTMLInputElement;
        selectionFeather?.addEventListener('change', () => {
            if (typeof (this.canvasApi as any).setToolSetting === 'function') {
                (this.canvasApi as any).setToolSetting('feather', parseInt(selectionFeather.value));
            }
        });
        
        const selectionAntialias = root.querySelector('#selection-antialias') as HTMLInputElement;
        selectionAntialias?.addEventListener('change', () => {
            if (typeof (this.canvasApi as any).setToolSetting === 'function') {
                (this.canvasApi as any).setToolSetting('antialias', selectionAntialias.checked);
            }
        });
        
        // Clear selection now calls a real API hook if available
        root.querySelector('#clear-selection')?.addEventListener('click', () => {
            if (typeof (this.canvasApi as any).setSelectionPath === 'function') {
                (this.canvasApi as any).setSelectionPath(null);
            }
            (root.querySelector('#selection-info') as HTMLElement).textContent = 'Cleared';
        });
        // Select All: sets selection to full canvas bounds
        root.querySelector('#select-all')?.addEventListener('click', () => {
            const dim = this.canvasApi.getCanvasDimensions();
            const w = dim.width; const h = dim.height;
            const path = [
                { x: 0, y: 0 }, { x: w - 1, y: 0 }, { x: w - 1, y: h - 1 }, { x: 0, y: h - 1 }, { x: 0, y: 0 }
            ];
            (this.canvasApi as any).setSelectionPath?.(path);
            (root.querySelector('#selection-info') as HTMLElement).textContent = `Full ${w}x${h}`;
        });
        
        // === PAN SLIDERS ===
        
        const panXSlider = root.querySelector('#pan-x-slider') as HTMLInputElement;
        const panYSlider = root.querySelector('#pan-y-slider') as HTMLInputElement;
        
        panXSlider?.addEventListener('input', () => {
            const panX = parseInt(panXSlider.value);
            this.applyPanToCanvas(panX, parseInt(panYSlider?.value || '0'));
        });
        
        panYSlider?.addEventListener('input', () => {
            const panY = parseInt(panYSlider.value);
            this.applyPanToCanvas(parseInt(panXSlider?.value || '0'), panY);
        });
        
        root.querySelector('#reset-pan')?.addEventListener('click', () => {
            if (panXSlider) panXSlider.value = '0';
            if (panYSlider) panYSlider.value = '0';
            (root.querySelector('#pan-x-display') as HTMLElement).textContent = '0';
            (root.querySelector('#pan-y-display') as HTMLElement).textContent = '0';
            this.applyPanToCanvas(0, 0);
        });
        
        // === ZOOM SLIDER ===
        
        const zoomSlider = root.querySelector('#zoom-slider') as HTMLInputElement;
        
        zoomSlider?.addEventListener('input', () => {
            const zoom = parseInt(zoomSlider.value);
            this.applyZoomToCanvas(zoom / 100); // Convert percentage to decimal
            this.updateZoomDisplay();
        });
    }
    
    private highlightActiveTool(toolType: string): void {
        const root = this.rootEl;
        // Remove active class from all tool buttons
        root.querySelectorAll('[data-tool]').forEach(btn => {
            (btn as HTMLElement).style.background = '';
            (btn as HTMLElement).style.color = '';
        });
        
        // Highlight active tool
        const activeBtn = root.querySelector(`[data-tool="${toolType}"]`) as HTMLElement;
        if (activeBtn) {
            activeBtn.style.background = '#007cba';
            activeBtn.style.color = 'white';
        }
    }
    
    private highlightActiveBrush(brushType: string): void {
        const root = this.rootEl;
        // Clear highlight on both legacy and new engine buttons
        root.querySelectorAll('[data-brush], [data-brush-type]').forEach(btn => {
            (btn as HTMLElement).style.background = '';
            (btn as HTMLElement).style.color = '';
        });
        
        // Highlight active engine button (new attribute)
        let activeBtn = root.querySelector(`[data-brush-type="${brushType}"]`) as HTMLElement | null;
        if (!activeBtn) {
            // fallback to legacy attribute if present
            activeBtn = root.querySelector(`[data-brush="${brushType}"]`) as HTMLElement | null;
        }
        if (activeBtn) {
            activeBtn.style.background = '#007cba';
            activeBtn.style.color = 'white';
        }
    }
    
    private updateZoomDisplay(): void {
        const root = this.rootEl;
        if (typeof (this.canvasApi as any).getCanvasZoomLevel === 'function') {
            const zoom = (this.canvasApi as any).getCanvasZoomLevel();
            (root.querySelector('#current-zoom-level') as HTMLElement).textContent = `${Math.round(zoom * 100)}%`;
        }
    }
    
    /**
     * Apply pan transformation to the canvas using the proper API
     * This properly sets pan through KlecksManager which handles coordinate transformation
     */
    private applyPanToCanvas(panX: number, panY: number): void {
        // Use the proper API method to set pan
        if (typeof (this.canvasApi as any).setPan === 'function') {
            (this.canvasApi as any).setPan(panX, panY);
        }
        
        // Update the pan display values
        const root = this.rootEl;
        (root.querySelector('#pan-x-display') as HTMLElement).textContent = panX.toString();
        (root.querySelector('#pan-y-display') as HTMLElement).textContent = panY.toString();
    }
    
    /**
     * Apply zoom transformation to the canvas via KlecksManager setScale method
     */
    private applyZoomToCanvas(scale: number): void {
        // Call the KlecksManager setScale method through the canvas API
        if (typeof (this.canvasApi as any).setScale === 'function') {
            (this.canvasApi as any).setScale(scale);
        }
        
        // Update the zoom slider to match
        const zoomSlider = this.rootEl.querySelector('#zoom-slider') as HTMLInputElement;
        const zoomDisplay = this.rootEl.querySelector('#zoom-display') as HTMLElement;
        if (zoomSlider && zoomDisplay) {
            const percentage = Math.round(scale * 100);
            zoomSlider.value = percentage.toString();
            zoomDisplay.textContent = percentage.toString();
        }
    }
    
    /**
     * Get the current scale from the canvas API
     */
    private getCurrentScaleFromCanvas(): number {
        if (typeof (this.canvasApi as any).getScale === 'function') {
            return (this.canvasApi as any).getScale();
        }
        return 1;
    }
    
    private setupCanvasInteractions(): void {
        const container = this.canvasApi.getCanvasElement();
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        if (!canvas) return;

        let isPanning = false;
        let lastClientX = 0;
        let lastClientY = 0;
        let selectionStart: { x: number; y: number } | null = null;
        let shapeStart: { x: number; y: number } | null = null;
        let gradientStart: { x: number; y: number } | null = null;

        const getCanvasXY = (evt: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (evt.clientX - rect.left) * scaleX;
            const y = (evt.clientY - rect.top) * scaleY;
            return { x: Math.round(x), y: Math.round(y) };
        };

        const getActiveTool = (): string => {
            return (this.canvasApi as any).getToolManagerCurrentTool?.() || this.canvasApi.getCurrentTool();
        };

        canvas.addEventListener('pointerdown', (evt: PointerEvent) => {
            canvas.setPointerCapture(evt.pointerId);
            const { x, y } = getCanvasXY(evt);
            lastClientX = evt.clientX;
            lastClientY = evt.clientY;

            const tool = getActiveTool();
            const pressure = (evt as any).pressure ?? 1;

            if (tool === 'brush') {
                this.canvasApi.startDrawing(x, y, pressure);
            } else if (tool === 'paintBucket') {
                (this.canvasApi as any).performFillOperation?.(x, y);
            } else if (tool === 'eyedropper') {
                const color = this.canvasApi.sampleColorAt(x, y);
                this.canvasApi.setPrimaryColor(color);
            } else if (tool === 'text') {
                // Create a simple text at click position to ensure functionality
                this.canvasApi.createText({ text: 'Text', x, y, size: 24, font: 'sans-serif' });
            } else if (tool === 'gradient') {
                // Start a gradient drag; apply on pointerup using distance gradient
                gradientStart = { x, y };
            } else if (tool === 'hand') {
                isPanning = true;
            } else if (tool === 'select') {
                selectionStart = { x, y };
                (this.canvasApi as any).setSelectionPath?.([{ x, y }]);
            } else if (tool === 'shape') {
                // Begin rectangle shape
                shapeStart = { x, y };
            }
        });

        canvas.addEventListener('pointermove', (evt: PointerEvent) => {
            const tool = getActiveTool();
            const { x, y } = getCanvasXY(evt);
            const pressure = (evt as any).pressure ?? 1;

            if (tool === 'brush' && (this.canvasApi as any).isToolDrawing?.()) {
                this.canvasApi.continueDrawing(x, y, pressure);
            } else if (tool === 'hand' && isPanning) {
                const dx = evt.clientX - lastClientX;
                const dy = evt.clientY - lastClientY;
                (this.canvasApi as any).panCanvas?.(dx, dy);
                lastClientX = evt.clientX;
                lastClientY = evt.clientY;
            } else if (tool === 'select' && selectionStart) {
                // Create a rectangular selection path from start to current
                const x1 = Math.min(selectionStart.x, x);
                const y1 = Math.min(selectionStart.y, y);
                const x2 = Math.max(selectionStart.x, x);
                const y2 = Math.max(selectionStart.y, y);
                const path = [
                    { x: x1, y: y1 },
                    { x: x2, y: y1 },
                    { x: x2, y: y2 },
                    { x: x1, y: y2 },
                    { x: x1, y: y1 },
                ];
                (this.canvasApi as any).setSelectionPath?.(path);
            } else if (tool === 'shape' && shapeStart) {
                // Optionally, could show a live preview by setting an overlay path; for now we defer to pointerup to draw
            } else if (tool === 'gradient' && gradientStart) {
                // No live preview; apply on release using distance gradient fill and stops
                const stopsText = (this.rootEl.querySelector('#dg-stops') as HTMLTextAreaElement)?.value;
                let stops: { t: number; color: IRGB }[] | null = null;
                try { stops = stopsText ? JSON.parse(stopsText) : null; } catch {}
                if (!stops) {
                    const p = this.canvasApi.getPrimaryColor();
                    const s = this.canvasApi.getSecondaryColor();
                    stops = [{ t: 0, color: p }, { t: 1, color: s }];
                }
                (this.canvasApi as any).distanceGradientFill?.(gradientStart.x, gradientStart.y, stops);
            }
        });

        canvas.addEventListener('pointerup', (evt: PointerEvent) => {
            const tool = getActiveTool();
            if (tool === 'brush' && (this.canvasApi as any).isToolDrawing?.()) {
                this.canvasApi.endDrawing();
            } else if (tool === 'hand') {
                isPanning = false;
            } else if (tool === 'select') {
                // finalize selection (no-op; path already set on move)
                selectionStart = null;
            } else if (tool === 'gradient' && gradientStart) {
                gradientStart = null;
            } else if (tool === 'shape' && shapeStart) {
                // Draw an axis-aligned rectangle outline using the current brush engine
                const { x, y } = getCanvasXY(evt);
                const x1 = Math.min(shapeStart.x, x);
                const y1 = Math.min(shapeStart.y, y);
                const x2 = Math.max(shapeStart.x, x);
                const y2 = Math.max(shapeStart.y, y);
                // Use drawLine via bridge to render 4 sides
                this.canvasApi.drawLine(x1, y1, x2, y1);
                this.canvasApi.drawLine(x2, y1, x2, y2);
                this.canvasApi.drawLine(x2, y2, x1, y2);
                this.canvasApi.drawLine(x1, y2, x1, y1);
                shapeStart = null;
            }
            canvas.releasePointerCapture(evt.pointerId);
        });
    }

    getElement(): HTMLElement {
        return this.rootEl;
    }
    
    destroy(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        BB.destroyEl(this.rootEl);
    }
}
