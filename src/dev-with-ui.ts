/**
 * Development entry point - Headless canvas with UI wrapper for testing
 * This build includes both the headless canvas and a testing UI
 * Production builds will only export the headless canvas
 */

import './app/script/polyfills/polyfills';
import { KlecksManager } from './app/script/headless/klecks-manager';
import { CanvasApiBridge } from './app/script/ui-wrapper/canvas-api-bridge';
import { UIWrapper } from './app/script/ui-wrapper/ui-wrapper-fixed';
import { ComprehensiveDevUI } from './app/script/ui-wrapper/comprehensive-dev-ui';
import { initLANG } from './app/script/language/language';

interface IDevKlecksOptions {
    width?: number;
    height?: number;
    showUI?: boolean;
    useComprehensiveUI?: boolean; // NEW: Use the exhaustive dev UI instead of basic UI
    uiOptions?: {
        showToolbar?: boolean;
        showLayerPanel?: boolean;
        showColorPicker?: boolean;
        showStatusBar?: boolean;
    };
}

/**
 * Development version of Klecks with UI wrapper for testing
 */
class DevKlecks {
    private klecksManager: KlecksManager;
    private canvasApiBridge: CanvasApiBridge;
    private uiWrapper: UIWrapper | null = null;
    private comprehensiveUI: ComprehensiveDevUI | null = null;
    
    constructor(
        klecksManager: KlecksManager, 
        canvasApiBridge: CanvasApiBridge, 
        uiWrapper?: UIWrapper,
        comprehensiveUI?: ComprehensiveDevUI
    ) {
        this.klecksManager = klecksManager;
        this.canvasApiBridge = canvasApiBridge;
        this.uiWrapper = uiWrapper || null;
        this.comprehensiveUI = comprehensiveUI || null;
    }
    
    /**
     * Get the main element to add to DOM
     * If UI is enabled, this is the full UI wrapper
     * If UI is disabled, this is just the canvas
     */
    getElement(): HTMLElement {
        if (this.comprehensiveUI) {
            return this.comprehensiveUI.getElement();
        }
        return this.uiWrapper ? this.uiWrapper.getElement() : this.canvasApiBridge.getCanvasElement();
    }
    
    /**
     * Get the canvas API bridge for programmatic access
     */
    getApi(): CanvasApiBridge {
        return this.canvasApiBridge;
    }
    
    /**
     * Get the underlying headless manager (for advanced use)
     */
    getManager(): KlecksManager {
        return this.klecksManager;
    }
    
    /**
     * Get the UI wrapper (if enabled)
     */
    getUI(): UIWrapper | null {
        return this.uiWrapper;
    }
    
    /**
     * Get the comprehensive dev UI (if enabled)
     */
    getComprehensiveUI(): ComprehensiveDevUI | null {
        return this.comprehensiveUI;
    }
    
    /**
     * Toggle UI visibility (if UI is enabled)
     */
    setUIVisible(visible: boolean): void {
        if (this.uiWrapper) {
            this.uiWrapper.setVisible(visible);
        }
        // Note: ComprehensiveDevUI doesn't have setVisible method - it's always visible
    }
    
    /**
     * Destroy the development instance
     */
    destroy(): void {
        if (this.uiWrapper) {
            this.uiWrapper.destroy();
        }
        if (this.comprehensiveUI) {
            this.comprehensiveUI.destroy();
        }
        this.canvasApiBridge.destroy();
    }
}

/**
 * Create development Klecks instance with optional UI wrapper
 */
export async function createDevKlecks(options: IDevKlecksOptions = {}): Promise<DevKlecks> {
    // Initialize language support
    await initLANG();
    
    // Create headless manager
    const klecksManager = new KlecksManager({
        width: options.width || 800,
        height: options.height || 600,
        onUpdate: () => {
            console.log('Canvas updated');
        }
    });
    
    // Create API bridge
    const canvasApiBridge = new CanvasApiBridge(klecksManager);
    
    // Create UI wrapper if requested
    let uiWrapper: UIWrapper | undefined;
    let comprehensiveUI: ComprehensiveDevUI | undefined;
    
    if (options.showUI !== false) {
        if (options.useComprehensiveUI) {
            // Use the comprehensive dev UI with ALL API features exposed
            comprehensiveUI = new ComprehensiveDevUI(canvasApiBridge);
        } else {
            // Use the basic UI wrapper (original implementation)
            uiWrapper = new UIWrapper(canvasApiBridge, {
                width: options.width,
                height: options.height,
                ...options.uiOptions
            });
        }
    }
    
    return new DevKlecks(klecksManager, canvasApiBridge, uiWrapper, comprehensiveUI);
}

/**
 * Quick setup function for common development scenarios
 */
export async function setupDevEnvironment(containerId: string, options: IDevKlecksOptions = {}): Promise<DevKlecks> {
    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`Container element with id "${containerId}" not found`);
    }
    
    const devKlecks = await createDevKlecks(options);
    container.appendChild(devKlecks.getElement());
    
    return devKlecks;
}

// Make available globally for development
if (typeof window !== 'undefined') {
    (window as any).DevKlecks = {
        createDevKlecks,
        setupDevEnvironment
    };
}

// Export types for external use
export type { IDevKlecksOptions };
export { DevKlecks };

// Re-export headless components for direct access
export { KlecksManager } from './app/script/headless/klecks-manager';
export { CanvasApiBridge } from './app/script/ui-wrapper/canvas-api-bridge';
export type { IKlecksManagerOptions } from './app/script/headless/klecks-manager';
export type { ITextInstance, ICreateTextOptions } from './app/script/headless/managers/text-manager';
export type { IBrushStroke } from './app/script/headless/managers/brush-manager';
export type { ILayerInfo } from './app/script/headless/managers/layer-manager';
