import { CanvasApiBridge } from './canvas-api-bridge';
import { TextToolUI } from './components/text-tool-ui';
import { BrushToolUI } from './components/brush-tool-ui';
import { LayerPanelUI } from './components/layer-panel-ui';
import { ToolbarUI } from './components/toolbar-ui';
import { ColorPickerUI } from './components/color-picker-ui';
import { StatusBarUI } from './components/status-bar-ui';
import { BB } from '../bb/bb';

export interface IUIWrapperOptions {
    width?: number;
    height?: number;
    showToolbar?: boolean;
    showLayerPanel?: boolean;
    showColorPicker?: boolean;
    showStatusBar?: boolean;
}

/**
 * Main UI wrapper that provides a development interface around the headless canvas
 * This is used only for testing and development - not included in production builds
 */
export class UIWrapper {
    private readonly rootEl: HTMLElement;
    private readonly canvasContainer: HTMLElement;
    private readonly leftPanel: HTMLElement;
    private readonly rightPanel: HTMLElement;
    
    // UI Components
    private readonly toolbar: ToolbarUI;
    private readonly textTool: TextToolUI;
    private readonly brushTool: BrushToolUI;
    private readonly layerPanel: LayerPanelUI;
    private readonly colorPicker: ColorPickerUI;
    private readonly statusBar: StatusBarUI;
    
    private currentTool: string = 'brush';
    
    constructor(
        private canvasApi: CanvasApiBridge,
        options: IUIWrapperOptions = {}
    ) {
        // Create main layout
        this.rootEl = this.createLayout();
        
        // Get layout elements
        this.canvasContainer = this.rootEl.querySelector('.canvas-container') as HTMLElement;
        this.leftPanel = this.rootEl.querySelector('.left-panel') as HTMLElement;
        this.rightPanel = this.rootEl.querySelector('.right-panel') as HTMLElement;
        
        // Initialize UI components
        this.toolbar = new ToolbarUI(this.canvasApi);
        this.textTool = new TextToolUI(this.canvasApi);
        this.brushTool = new BrushToolUI(this.canvasApi);
        this.layerPanel = new LayerPanelUI(this.canvasApi);
        this.colorPicker = new ColorPickerUI(this.canvasApi);
        this.statusBar = new StatusBarUI(this.canvasApi);
        
        // Setup UI
        this.setupUI(options);
        this.setupEventListeners();
        
        // Add canvas to container
        this.canvasContainer.appendChild(this.canvasApi.getCanvasElement());
        
        // Set initial tool
        this.setTool('brush');
    }
    
    private createLayout(): HTMLElement {
        const layout = BB.el({
            className: 'ui-wrapper',
            css: {
                display: 'flex',
                height: '100vh',
                width: '100vw',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                overflow: 'hidden',
                background: '#f0f0f0'
            }
        });
        
        layout.innerHTML = `
            <div class="left-panel" style="
                width: 280px;
                background: #e8e8e8;
                border-right: 1px solid #ccc;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
            ">
                <div class="toolbar-container"></div>
                <div class="tool-panels"></div>
                <div class="color-picker-container"></div>
            </div>
            
            <div class="main-area" style="
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
            ">
                <div class="canvas-container" style="
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: auto;
                    background: #f8f8f8;
                    position: relative;
                "></div>
                <div class="status-bar-container" style="
                    height: 30px;
                    background: #ddd;
                    border-top: 1px solid #ccc;
                "></div>
            </div>
            
            <div class="right-panel" style="
                width: 250px;
                background: #e8e8e8;
                border-left: 1px solid #ccc;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
            ">
                <div class="layer-panel-container"></div>
            </div>
        `;
        
        return layout;
    }
    
    private setupUI(options: IUIWrapperOptions): void {
        // Add components to their containers
        const toolbarContainer = this.rootEl.querySelector('.toolbar-container') as HTMLElement;
        const toolPanelsContainer = this.rootEl.querySelector('.tool-panels') as HTMLElement;
        const colorPickerContainer = this.rootEl.querySelector('.color-picker-container') as HTMLElement;
        const layerPanelContainer = this.rootEl.querySelector('.layer-panel-container') as HTMLElement;
        const statusBarContainer = this.rootEl.querySelector('.status-bar-container') as HTMLElement;
        
        // Toolbar
        if (options.showToolbar !== false) {
            toolbarContainer.appendChild(this.toolbar.getElement());
        }
        
        // Tool panels
        toolPanelsContainer.appendChild(this.textTool.getElement());
        toolPanelsContainer.appendChild(this.brushTool.getElement());
        
        // Color picker
        if (options.showColorPicker !== false) {
            colorPickerContainer.appendChild(this.colorPicker.getElement());
        }
        
        // Layer panel
        if (options.showLayerPanel !== false) {
            layerPanelContainer.appendChild(this.layerPanel.getElement());
        }
        
        // Status bar
        if (options.showStatusBar !== false) {
            statusBarContainer.appendChild(this.statusBar.getElement());
        }
        
        // Apply sizing options
        if (options.width || options.height) {
            BB.css(this.rootEl, {
                width: options.width ? `${options.width}px` : '100vw',
                height: options.height ? `${options.height}px` : '100vh'
            });
        }
    }
    
    private setupEventListeners(): void {
        // Listen to toolbar tool changes
        this.toolbar.onToolChanged = (tool: string) => {
            this.setTool(tool);
        };
        
        // Listen to canvas API events for UI updates
        this.canvasApi.on('tool-changed', (tool: string) => {
            this.currentTool = tool;
            this.updateToolPanels();
        });
        
        this.canvasApi.on('layer-created', () => {
            this.layerPanel.refresh();
        });
        
        this.canvasApi.on('layer-deleted', () => {
            this.layerPanel.refresh();
        });
        
        this.canvasApi.on('layer-activated', () => {
            this.layerPanel.refresh();
        });
        
        this.canvasApi.on('color-changed', (type: string, color: any) => {
            this.colorPicker.updateColor(type, color);
        });
        
        this.canvasApi.on('history-changed', () => {
            this.statusBar.updateHistoryStatus(
                this.canvasApi.canUndo(),
                this.canvasApi.canRedo()
            );
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    private setTool(tool: string): void {
        this.canvasApi.setCurrentTool(tool);
        this.currentTool = tool;
        this.toolbar.setActiveTool(tool);
        this.updateToolPanels();
    }
    
    private updateToolPanels(): void {
        // Show/hide tool panels based on current tool
        this.textTool.setVisible(this.currentTool === 'text');
        this.brushTool.setVisible(this.currentTool === 'brush');
    }
    
    private handleKeyDown(event: KeyboardEvent): void {
        // Global shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key.toLowerCase()) {\n                case 'z':\n                    if (event.shiftKey) {\n                        this.canvasApi.redo();\n                    } else {\n                        this.canvasApi.undo();\n                    }\n                    event.preventDefault();\n                    break;\n                case 'y':\n                    this.canvasApi.redo();\n                    event.preventDefault();\n                    break;\n                case 'n':\n                    // New layer\n                    this.canvasApi.createLayer();\n                    event.preventDefault();\n                    break;\n            }\n        }\n        \n        // Tool shortcuts\n        switch (event.key.toLowerCase()) {\n            case 'b':\n                this.setTool('brush');\n                event.preventDefault();\n                break;\n            case 't':\n                this.setTool('text');\n                event.preventDefault();\n                break;\n            case 'h':\n                this.setTool('hand');\n                event.preventDefault();\n                break;\n        }\n    }\n    \n    /**\n     * Get the root UI element\n     */\n    getElement(): HTMLElement {\n        return this.rootEl;\n    }\n    \n    /**\n     * Show/hide the UI wrapper\n     */\n    setVisible(visible: boolean): void {\n        this.rootEl.style.display = visible ? 'flex' : 'none';\n    }\n    \n    /**\n     * Resize the UI wrapper\n     */\n    resize(width?: number, height?: number): void {\n        if (width) {\n            this.rootEl.style.width = `${width}px`;\n        }\n        if (height) {\n            this.rootEl.style.height = `${height}px`;\n        }\n    }\n    \n    /**\n     * Focus the canvas area\n     */\n    focusCanvas(): void {\n        const canvas = this.canvasContainer.querySelector('canvas');\n        if (canvas) {\n            (canvas as HTMLCanvasElement).focus();\n        }\n    }\n    \n    /**\n     * Get current tool\n     */\n    getCurrentTool(): string {\n        return this.currentTool;\n    }\n    \n    /**\n     * Update UI theme (light/dark)\n     */\n    setTheme(theme: 'light' | 'dark'): void {\n        this.rootEl.setAttribute('data-theme', theme);\n        // TODO: Apply theme styles\n    }\n    \n    /**\n     * Destroy the UI wrapper\n     */\n    destroy(): void {\n        document.removeEventListener('keydown', this.handleKeyDown);\n        \n        this.toolbar.destroy();\n        this.textTool.destroy();\n        this.brushTool.destroy();\n        this.layerPanel.destroy();\n        this.colorPicker.destroy();\n        this.statusBar.destroy();\n        \n        BB.destroyEl(this.rootEl);\n    }\n}
