/**
 * rrDetailsTabs Module
 *
 * This is an [IIFE](https://developer.mozilla.org/docs/Glossary/IIFE) module
 * that adds logic to interact with `<details>` and `<summary>` elements,
 * effectively creating a tab-like behavior.
 *
 * The expected HTML structure is:
 *
 * ```html
 * <div>
 *   <details>
 *      <summary></summary>
 *      <div></div>
 *   </details>
 * </div>
 * ```
 *
 * Features:
 *
 * - Tab Synchronization: Ensures that only one tab is open across all instances
 *   of the component on the page.
 * - URL-Based State: Updates the selected tab based on a URL parameter. This
 *   allows for linking directly to a specific tab.
 * - Optional "No Close" Behavior: Prevents a tab from closing when clicked
 *   again if it's already open (controlled by the `.no-close` class).
 */
const rrDetailsTabs = (() => {
    // Module variables / configuration.
    let conf = {
        // CSS selector to locate the root elements containing the
        // details/summary structure.
        selector: '',
    }

    /**
     * Handles 'click' events on the component.
     *
     * This function attaches click event listeners to all elements matching
     * the `selector`. It manages tab selection, URL updates, and the
     * "no close" behavior.
     */
    const initClickListener = () => {
        const selector = conf.selector;

        document.querySelectorAll(selector).forEach(matchElement => {
            matchElement.addEventListener("click", event => {
                const eventTarget = event.target;
                const isTab = eventTarget.matches(selector+' summary'); // Check if the clicked element is a 'summary' tag.

                if (isTab) {
                    const detailName = eventTarget.parentElement.getAttribute("data-id");
                    const url = new URL(location);
                    const oldTab = url.searchParams.get(detailName);
                    const newTab = eventTarget.getAttribute("data-id");

                    // Update the URL and propagate only if the tab has changed.
                    if (newTab !== oldTab) {
                        url.searchParams.set(detailName, newTab);
                        history.pushState({}, "", url); // Update the URL in the browser's history.
                        propagateSelectedTab(newTab); // Dispatch the custom event to update other components.
                    }
                }

                const noClose = eventTarget.matches('.no-close summary'); // Check if the clicked element has the 'no-close' class
                const isOpen = eventTarget.parentElement.open; // Check if the parent details element is currently open.

                if (noClose && isOpen) {
                    event.preventDefault(); // Prevent the default action, keeping the tab open.
                }
            });
        });
    }

    /**
     * Handles the custom "rrtabswitch" event.
     *
     * This event is used to synchronize tab states across multiple instances
     * of the component. When a component receives this event, it opens the tab
     * specified in the event's `detail`.
     */
    const initTabSwitchListener = () => {
        const selector = conf.selector;

        document.querySelectorAll(selector).forEach(matchElement => {
            matchElement.addEventListener("rrtabswitch", event => {
                const name = event.detail.name;
                const tab = event.detail.tab;

                // Open the target detail element.
                const targetDetail = matchElement.querySelector(`details[data-id="${name}"]:has(summary[data-id="${tab}"])`);

                // Check if data-id is valid.
                if (targetDetail) {
                    // Close all details elements within the current component.
                    matchElement.querySelectorAll('details[open]').forEach(detail => {
                        detail.removeAttribute('open');
                    });
                    // Open target detail element.
                    targetDetail.setAttribute('open', '');
                }
            });
        });
    }

    /**
     * Handles the window's "popstate" event.
     *
     * This event is fired when the user navigates through the browser's
     * history (back/forward buttons). It ensures that the component's state is
     * updated to reflect the URL.
     */
    const initWindowPopStateListener = () => {
        window.addEventListener('popstate', () => {
            propagateSelectedTab(); // Update the tab based on the URL.
        });
    }

    /**
     * Creates a custom "rrtabswitch" event.
     *
     * @param {string} name Detail name to switch to.
     * @param {string} tab Detail tab to switch to.
     * @returns {CustomEvent} The custom event object.
     */
    const rrTabSwitchEvent = (name, tab) => {
        return new CustomEvent('rrtabswitch', {
            bubbles: false,
            cancelable: true,
            detail: {
                name: name,
                tab: tab,
            },
        });
    }

    /**
     * Dispatches the "rrtabswitch" event to all components.
     *
     * This function ensures that all instances of the component on the page are
     * synchronized to the currently selected tab.
     *
     * @param {string} [selectedDetail] Detail name to select. If not
     * provided, it is read from the URL.
     * @param {string} [selectedTab] Detail tab to select. If not
     * provided, it is read from the URL.
     */
    const propagateSelectedTab = (selectedDetail, selectedTab) => {
        const selector = conf.selector;

        if (
            typeof selectedDetail === 'undefined'
            || typeof selectedTab === 'undefined'
        ) {
            // If detail or tab are not provided, read them from the URL.
            const detailNames = [];
            document.querySelectorAll(selector+' details').forEach(matchElement => {
                const name = matchElement.getAttribute('data-id');
                if (!detailNames.includes(name)) {
                    detailNames.push(name);
                }
            });
            const url = new URL(location);
            for (const [key, value] of url.searchParams.entries()) {
                if (detailNames.includes(key)) {
                    propagateSelectedTab(key, value);
                }
            }
        } else {
            // Dispatch the custom event if a tab is selected.
            const rrTabSwitch = rrTabSwitchEvent(selectedDetail, selectedTab);
            document.querySelectorAll(selector).forEach(matchElement => {
                matchElement.dispatchEvent(rrTabSwitch);
            });
        }
    }

    /**
     * Initializes the module.
     *
     * This function sets up the component by attaching event listeners and
     * synchronizing the initial state based on the URL.
     *
     * @param {string} selector The CSS selector to use to find the component elements.
     */
    const init = (selector) => {
        // Update global variables
        conf.selector = selector;
        // Call init/setup methods
        initClickListener();
        initTabSwitchListener();
        initWindowPopStateListener();
        propagateSelectedTab();
    };

    return {
        init,
    };
})();

export default rrDetailsTabs;
