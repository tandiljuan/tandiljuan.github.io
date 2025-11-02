import rrHighlight from './highlight.mjs'

// Run logic after the HTML document is fully loaded and parsed. Ensures all
// elements are accessible and prevents script execution errors.
window.addEventListener('DOMContentLoaded', () => {
    rrHighlight.init();
});
