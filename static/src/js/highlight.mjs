/**
 * rrHighlight Module
 *
 * This is an [IIFE](https://developer.mozilla.org/docs/Glossary/IIFE) module
 * that is in charge of the initialization of `highlight.js`.
 *
 * @returns {object} - An object containing the init function.
 */
const rrHighlight = (() => {
    /**
     * Function to set up code highlighting and enable copy button
     *
     * @see https://highlightjs.readthedocs.io/en/latest/readme.html#in-the-browser
     */
    const init = () => {
        // Add a copy button feature to all code blocks. The 'autohide: false'
        // means the copy button will always be visible.
        hljs.addPlugin(
            new CopyButtonPlugin({
                autohide: false,
            })
        );

        // Apply syntax highlighting to all code elements on the page. This will
        // automatically highlight any code blocks using the 'highlight.js' library.
        //
        // @TODO: Add error handling for highlightAll() if necessary.
        hljs.highlightAll();
    };

    return {
        init,
    };
})();

export default rrHighlight;
