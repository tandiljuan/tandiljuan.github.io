import rrHighlight from './highlight.mjs'
import rrDetailsTabs from './details-tabs.mjs'
import rrMermaid from './mermaid.mjs'

// Run logic after the HTML document is fully loaded and parsed. Ensures all
// elements are accessible and prevents script execution errors.
window.addEventListener('DOMContentLoaded', () => {
    rrDetailsTabs.init('div.details.tabs');
    rrMermaid.init();
    rrHighlight.init();
});
