/**
 * Headless Klecks - Canvas-only build with manager-based API
 * by bitbof (bitbof.com)
 */

import './app/script/polyfills/polyfills';
import { KlecksManager, IKlecksManagerOptions } from './app/script/headless/klecks-manager';
import { IKlProject } from './app/script/klecks/kl-types';
import { initLANG } from './app/script/language/language';

// Initialize language support
let langInitialized = false;
async function ensureLangInit() {
    if (!langInitialized) {
        await initLANG();
        langInitialized = true;
    }
}

/**
 * Create a new headless Klecks instance
 */
export async function createKlecks(options: IKlecksManagerOptions = {}): Promise<KlecksManager> {
    await ensureLangInit();
    return new KlecksManager(options);
}

/**
 * Create Klecks with an existing project
 */
export async function createKlecksWithProject(project: IKlProject, options: Omit<IKlecksManagerOptions, 'project'> = {}): Promise<KlecksManager> {
    await ensureLangInit();
    return new KlecksManager({ ...options, project });
}

// Export types and interfaces for external use
export { KlecksManager } from './app/script/headless/klecks-manager';
export type { IKlecksManagerOptions } from './app/script/headless/klecks-manager';
export type { ITextInstance, ICreateTextOptions } from './app/script/headless/managers/text-manager';
export type { IBrushStroke } from './app/script/headless/managers/brush-manager';
export type { ILayerInfo } from './app/script/headless/managers/layer-manager';
export type { IKlProject, IRGB, IRGBA, TMixMode } from './app/script/klecks/kl-types';

// Make it available globally if needed
if (typeof window !== 'undefined') {
    (window as any).KlecksHeadless = {
        createKlecks,
        createKlecksWithProject,
        KlecksManager
    };
}
