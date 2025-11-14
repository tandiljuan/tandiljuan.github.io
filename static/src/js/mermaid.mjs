import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.9.0/dist/mermaid.esm.min.mjs';
import elkLayouts from 'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0.1.8/dist/mermaid-layout-elk.esm.min.mjs';

/**
 * rrMermaid Module
 *
 * This is an [IIFE](https://developer.mozilla.org/docs/Glossary/IIFE) module
 * that is in charge of the initialization of `mermaid.js`.
 *
 * @returns {object} - An object containing the init function.
 */
const rrMermaid = (() => {
    /**
     * Update the DOM to be ready for mermaid.js
     *
     * Zola, the static site generator, typically wraps code blocks in
     * `<pre><code>` tags. Mermaid.js, however, expects diagrams to be directly
     * within `<pre class="mermaid">` tags. This function finds all
     * `<pre data-lang=mermaid>` elements and moves the diagram content to the
     * correct format for Mermaid.js to render them.
     */
    const updateDOM = () => {
        document.querySelectorAll('pre[data-lang=mermaid]').forEach(matchElement => {
            let diagram = matchElement.firstChild.innerHTML;
            matchElement.innerHTML = diagram;
        });
    };

    /**
     * Init mermaid.js with ELK layout
     *
     * @see https://github.com/mermaid-js/mermaid/issues/5782
     */
    const initMermaid = () => {
        mermaid.registerLayoutLoaders(elkLayouts);
        mermaid.initialize({
            startOnLoad: false,
            layout: 'elk',
            elk: {
                mergeEdges: false,
                nodePlacementStrategy: 'NETWORK_SIMPLEX'
            },
            theme: 'neutral',
            htmlLabels: false,
            flowchart: {
                htmlLabels: false
            }
        });
        mermaid.run({
            querySelector: '.language-mermaid',
        });
    };

    const init = () => {
        updateDOM();
        initMermaid();
    };

    return {
        init,
    };
})();

export default rrMermaid;
