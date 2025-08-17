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
        
        // Create layout structure
        const leftPanel = BB.el({
            className: 'left-panel',
            css: {
                width: '280px',
                background: '#e8e8e8',
                borderRight: '1px solid #ccc',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
            }
        });
        
        const mainArea = BB.el({
            className: 'main-area',
            css: {
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                minWidth: '0'
            }
        });
        
        const rightPanel = BB.el({
            className: 'right-panel',
            css: {
                width: '250px',
                background: '#e8e8e8',
                borderLeft: '1px solid #ccc',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
            }
        });
        
        // Left panel sections
        leftPanel.appendChild(BB.el({ className: 'toolbar-container' }));
        leftPanel.appendChild(BB.el({ className: 'tool-panels' }));
        leftPanel.appendChild(BB.el({ className: 'color-picker-container' }));
        
        // Main area sections
        const canvasContainer = BB.el({
            className: 'canvas-container',
            css: {
                flex: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                background: '#f8f8f8',
                position: 'relative'
            }
        });
        
        const statusBarContainer = BB.el({
            className: 'status-bar-container',
            css: {
                height: '30px',
                background: '#ddd',
                borderTop: '1px solid #ccc'
            }
        });
        
        mainArea.appendChild(canvasContainer);
        mainArea.appendChild(statusBarContainer);
        
        // Right panel sections
        rightPanel.appendChild(BB.el({ className: 'layer-panel-container' }));
        
        // Assemble layout
        layout.appendChild(leftPanel);
        layout.appendChild(mainArea);
        layout.appendChild(rightPanel);
        
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
            switch (event.key.toLowerCase()) {
                case 'z':
                    if (event.shiftKey) {
                        this.canvasApi.redo();
                    } else {
                        this.canvasApi.undo();
                    }
                    event.preventDefault();
                    break;
                case 'y':
                    this.canvasApi.redo();
                    event.preventDefault();
                    break;
                case 'n':
                    // New layer
                    this.canvasApi.createLayer();
                    event.preventDefault();
                    break;
            }
        }
        
        // Tool shortcuts
        switch (event.key.toLowerCase()) {
            case 'b':
                this.setTool('brush');
                event.preventDefault();
                break;
            case 't':
                this.setTool('text');
                event.preventDefault();
                break;
            case 'h':
                this.setTool('hand');
                event.preventDefault();
                break;
        }
    }
    
    /**
     * Get the root UI element
     */
    getElement(): HTMLElement {
        return this.rootEl;
    }
    
    /**
     * Show/hide the UI wrapper
     */
    setVisible(visible: boolean): void {
        this.rootEl.style.display = visible ? 'flex' : 'none';
    }
    
    /**
     * Resize the UI wrapper
     */
    resize(width?: number, height?: number): void {
        if (width) {
            this.rootEl.style.width = `${width}px`;
        }
        if (height) {
            this.rootEl.style.height = `${height}px`;
        }
    }
    
    /**
     * Focus the canvas area
     */
    focusCanvas(): void {
        const canvas = this.canvasContainer.querySelector('canvas');
        if (canvas) {
            (canvas as HTMLCanvasElement).focus();
        }
    }
    
    /**
     * Get current tool
     */
    getCurrentTool(): string {
        return this.currentTool;
    }
    
    /**
     * Update UI theme (light/dark)
     */
    setTheme(theme: 'light' | 'dark'): void {
        this.rootEl.setAttribute('data-theme', theme);
        // TODO: Apply theme styles
    }
    
    /**
     * Destroy the UI wrapper
     */
    destroy(): void {
        document.removeEventListener('keydown', this.handleKeyDown);
        
        this.toolbar.destroy();
        this.textTool.destroy();
        this.brushTool.destroy();
        this.layerPanel.destroy();
        this.colorPicker.destroy();
        this.statusBar.destroy();
        
        BB.destroyEl(this.rootEl);
    }
}
