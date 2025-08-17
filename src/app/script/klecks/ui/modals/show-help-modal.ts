import { BB } from '../../../bb/bb';
import { DynamicModal } from './base/dynamic-modal';
import { LANG } from '../../../language/language';
import { HELP_CONTENT_HTML, HELP_CONTENT_CSS } from '../../../help-content';

/**
 * Show inline help modal instead of iframe modal
 * This replaces the need for a separate help.html file
 */
export function showHelpModal() {
    // Create help content container
    const helpContainer = BB.el({
        className: 'inline-help-modal',
        innerHTML: HELP_CONTENT_HTML
    });

    // Add CSS styles for help content
    const styleEl = document.createElement('style');
    styleEl.textContent = HELP_CONTENT_CSS;
    document.head.appendChild(styleEl);

    // Create title with external link option
    const titleEl = BB.el({
        content: 'Help & Shortcuts'
    });

    const popup = new DynamicModal({
        title: titleEl,
        content: helpContainer,
        width: 880,
        isMaxHeight: true,
        onClose: () => {
            // Clean up styles when modal closes
            if (styleEl.parentNode) {
                styleEl.parentNode.removeChild(styleEl);
            }
        },
    });

    // Handle clicks on links within the help content
    helpContainer.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('http')) {
            // External links should open in new tab
            event.preventDefault();
            window.open(target.getAttribute('href')!, '_blank', 'noopener,noreferrer');
        } else if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
            // Internal anchor links should scroll to section
            const anchor = target.getAttribute('href')!.substring(1);
            const targetElement = helpContainer.querySelector(`#${anchor}`);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    return popup;
}
