// tabz node module
// https://github.com/joneit/tabz

/* eslint-env node, browser */

'use strict';

var cssInjector = require('css-injector');

/**
 * Register/de-register click handler on all tab collections.
 * @param {Element} [options.root=document] - Where to look for tab panels (`.tabz` elements) containing tabs and folders.
 * @param {boolean} [options.unhook=false] - Remove event listener from tab panels (`.tabz` elements).
 * @param {Element} [options.referenceElement] - Passed to cssInjector's insertBefore() call.
 * @param {string} [options.defaultTabSelector='.default-tab'] - .classname or #id of the tab to select by default
 * @param {object} [options.onEnable] - Handler implementation. See {@link Tabz#onEnable|onEnable}.
 * @param {object} [options.onDisable] - Handler implementation. See {@link Tabz#onDisable|onEnable}.
 * @param {object} [options.onEnabled] - Handler implementation. See {@link Tabz#onEnabled|onEnable}.
 * @param {object} [options.onDisabled] - Handler implementation. See {@link Tabz#onDisabled|onEnable}.
 * @constructor
 */
function Tabz(options) {
    var i, el;

    options = options || {};
    var root = options.root || document,
        unhook = options.unhook,
        referenceElement = options.referenceElement,
        defaultTabSelector = options.defaultTabSelector || '.default-tab';

    if (!unhook) {
        var css;
        /* inject:css */
        /* endinject */

        if (!referenceElement) {
            // find first <link> or <style> in <head>
            var headStuff = document.querySelector('head').children;
            for (i = 0; !referenceElement && i < headStuff.length; ++i) {
                el = headStuff[i];
                if (el.tagName === 'STYLE' || el.tagName === 'LINK' && el.rel === 'stylesheet') {
                    referenceElement = el;
                }
            }
        }
        cssInjector(css, 'tabz-css-base', referenceElement);

        for (var key in options) {
            if (this[key] === noop) {
                this[key] = options[key];
            }
        }

        /**
         * @summary The context of this tab object.
         * @desc The context may encompass any number of tab panels (`.tabz` elements).
         * @type {HTMLDocumen|HTMLElement}
         */
        this.root = root;

        // enable first tab on each tab panel (`.tabz` element)
        forEachEl('.tabz>header:first-of-type,.tabz>section:first-of-type', function(el) {
            el.classList.add('tabz-enable');
        }, root);

        // enable default tab and all its parents (must be a tab)
        this.tabTo(root.querySelector('.tabz > header' + defaultTabSelector));

        setTimeout(function() {
            forEachEl('.tabz > section', function(el) {

                // Step 1: A bug in older versions of Chrome (like v40) that inserted a break at mark-up location of an absolute positioned block. The work-around is to hide those blocks until after first render; then show them. I don't know why this works but it does. Seems to be durable.
                el.style.display = 'block';

                // Step 2: Adjust absolute top of each rendered folder to the bottom of its tab
                el.style.top = el.previousElementSibling.getBoundingClientRect().bottom - el.parentElement.getBoundingClientRect().top + 'px';

            }, root);
        }, 0);
    }

    var method = unhook ? 'removeEventListener' : 'addEventListener';
    var boundClickHandler = onclick.bind(this);
    forEachEl('.tabz', function(tabBar) {
        tabBar.style.visibility = 'visible';
        tabBar[method]('click', boundClickHandler);
    }, root);
}

function onclick(evt) {
    click.call(this, evt.currentTarget, evt.target);
}

/**
 * @summary Selects the given tab.
 * @desc If it is a nested tab, also reveals all its ancestor tabs.
 * @param {string|HTMLElement} [el] - May be one of:
 * * `HTMLElement`
 *   * `<header>` - tab element
 *   * `<section>` - folder element
 * * `string` - CSS selector to one of the above
 * * falsy - fails silently
 * @memberOf Tabz.prototype
 */
Tabz.prototype.tabTo = function(el) {
    while ((el = this.tab(el))) {
        click.call(this, el.parentElement, el);
        el = el.parentElement.parentElement; // loop to click on each containing tab...
    }
};

/**
 * Current selected tab.
 * @param {HTMLElement|number} el - An element that is (or is within) the tab panel (`.tabz` element) to look in.
 * @returns {undefined|HTMLElement} Returns tab (`<header>`) element.  Returns `undefined` if `el` is neither of the above or an out of range index.
 */
Tabz.prototype.enabledTab = function(el) {
    el = this.panel(el);
    return el && el.querySelector(':scope>header.tabz-enable');
};

/**
 * @summary Get tab element.
 * @desc Get tab element if given tab or folder element; or an element within such; or find tab.
 * @param {string|Element} [el] - May be one of:
 * * a tab (a `<header>` element)
 * * a folder (a `<section>` element)
 * * an element within one of the above
 * * `string` - CSS selector to one of the above, searching within the root or document
 * @returns {null|Element} tab (`<header>...</header>`) element or `null` if not found
 * @memberOf Tabz.prototype
 */
Tabz.prototype.tab = function(el) {
    el = lookForEl.call(this, el);
    return !(el instanceof HTMLElement) ? null : el.tagName === 'HEADER' ? el : el.tagName === 'SECTION' ? el.previousElementSibling : null;
};

/**
 * @summary Get folder element.
 * @desc Get folder element if given tab or folder element; or an element within such; or find folder.
 * @param {string|Element} [el] - May be one of:
 * * a tab (a `<header>` element)
 * * a folder (a `<section>` element)
 * * an element within one of the above
 * * `string` - CSS selector to one of the above, searching within the root or document
 * @returns {null|Element} tab (`<header>...</header>`) element or `null` if not found
 * @memberOf Tabz.prototype
 */
Tabz.prototype.folder = function(el) {
    el = lookForEl.call(this, el);
    return !(el instanceof HTMLElement) ? null : el.tagName === 'SECTION' ? el : el.tagName === 'HEADER' ? el.nextElementSibling : null;
};

/**
 * @summary Get tab panel element.
 * @desc Get panel element if given tab panel element; or an element within a tab panel; or find tab panel.
 * @param {string|Element} [el] - May be one of:
 * * a tab panel (an `HTMLElement` with class `tabz`)
 * * an element within a tab panel
 * * `string` - CSS selector to one a tab panel, searching within the root or document
 * @returns {null|Element} tab panel element or `null` if not found
 * @memberOf Tabz.prototype
 */
Tabz.prototype.panel = function(el) {
    while (el && !el.classList.contains('tabz')) {
        el = el.parentElement;
    }
    return !(el instanceof HTMLElement) ? null : el.classList.contains('tabz') ? el : null;
};

function lookForEl(el) {
    if (el instanceof Element) {
        while (el && el.tagName !== 'HEADER' && el.tagName !== 'SECTION') {
            el = el.parentElement;
        }
    } else {
        el = this.root.querySelector(el);
    }
    return el;
}

/** @summary Switch to the clicked tab.
 * Disable the previously enabled pair and, if sucessful, enable the new tab.
 *
 * If the disable is fails (`onDisable` returns truthy), no visible UI change occurs. This would be the typical failure. However, if the disable is successful but the enable fails (`onEnable` returns truthy), the panel will be left in an undefined state with no tabs enabled. (This is it's "natural" state with all objects depth-sorted with last folder on top but all tabs behind.) In this case, returns `null`  in which casae you should enable some tab.
 * @private
 * @this Tabz
 * @param {Element} div - The tab panel (`.tabz` element) that's handling the click event.
 * @param {Element} target - The element that received the click.
 */
function click(div, target) {
    var newTab, oldTab, oldTabError;

    forEachEl(':scope>header:not(.tabz-enable)', function(tab) { // todo: use a .find() polyfill here
        if (tab.contains(target)) {
            newTab = tab;
        }
    }, div);

    if (newTab) {
        oldTab = this.enabledTab(div);
        if (!oldTab || !toggleTab.call(this, oldTab, false)) {
            toggleTab.call(this, newTab, true);
        }
    }
}

/**
 * @summary Enable or disable a tab.
 * @desc Three steps:
 * # Issues the onEnable or onDisable event; aborts on truthy return, returning that value.
 * # Toggles the tab.
 * # Issues the onEnabled or onDisabled event.
 * @private
 * @this Tabz
 * @param {Element} tab - The `<header>` element of the tab to enable or disable.
 * @param {boolean} enable - Enable (vs. disable) the tab.
 */
function toggleTab(tab, enable) {
    if (tab) {
        var folder = this.folder(tab),
            panel = this.panel(tab),
            method = enable ? 'onEnable' : 'onDisable',
            error = this[method].call(this, tab, folder, panel);

        if (!error) {
            tab.classList.toggle('tabz-enable', enable);
            folder.classList.toggle('tabz-enable', enable);

            method += 'd';
            this[method].call(this, tab, folder, panel);
        }

        return error;
    }
}

/**
 * @typedef tabEvent
 * @type {function}
 * @param {tabEventObject}
 */

/**
 * @typedef tabEventObject
 * @property {Tabz} tabz - The tab object issuing the callback.
 * @property {Element} target - The tab (`<header>` element).
 */

/**
 * Called before a previously disabled tab is enabled.
 * @type {tabEvent}
 * @abstract
 * @memberOf Tabz.prototype
 */
Tabz.prototype.onEnable = noop;

/**
 * Called before a previously enabled tab is disabled by another tab being enabled.
 * @type {tabEvent}
 * @abstract
 * @memberOf Tabz.prototype
 */
Tabz.prototype.onDisable = noop;

/**
 * Called after a previously disabled tab is enabled.
 * @type {tabEvent}
 * @abstract
 * @memberOf Tabz.prototype
 */
Tabz.prototype.onEnabled = noop;

/**
 * Called after a previously enabled tab is disabled by another tab being enabled.
 * @type {tabEvent}
 * @abstract
 * @memberOf Tabz.prototype
 */
Tabz.prototype.onDisabled = noop;

function noop() {} // null pattern

function forEachEl(selector, iteratee, context) {
    return Array.prototype.forEach.call((context || document).querySelectorAll(selector), iteratee);
}


module.exports = Tabz;
