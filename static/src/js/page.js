/**
 * Function to set up code highlighting and enable copy button
 *
 * @see https://highlightjs.readthedocs.io/en/latest/readme.html#in-the-browser
 */
function initializeCodeHighlighting() {
    // Add a copy button feature to all code blocks
    // The 'autohide: false' means the copy button will always be visible
    hljs.addPlugin(
        new CopyButtonPlugin({
            autohide: false,
        })
    );

    // Apply syntax highlighting to all code elements on the page. This will
    // automatically highlight any code blocks using the 'highlight.js' library.
    hljs.highlightAll();
}

// Set up the code highlighting once the page content is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    initializeCodeHighlighting();
});
