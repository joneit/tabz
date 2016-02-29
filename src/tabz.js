// tabz node module
// https://github.com/joneit/tabz

/* eslint-env node, browser */

'use strict';

var cssInjector = require('css-injector');

/**
 * Register/deregister click handler on all tab collections.
 * @param {Element} [options.root=document] - Where to look for tab panels (`.tabz` elements) containing tabs and folders.
 * @param {boolean} [options.unhook=false] - Remove event listener from tab panels (`.tabz` elements).
 * @param {Element} [options.referenceElement] - Passed to cssInjector's insertBefore() call.
 * @param {string} [options.defaultTabSelector='.default-tab'] - .classname or #id of the tab to select by default
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

        // Bug in older versions of Chrome (like v40) which was an implied break at mark-up location of an absolute positioned block. The work-around is to hide those blocks until after first render; then show them. I don't know why this works but it does. Seems to be durable.
        setTimeout(function() {
            forEachEl('.tabz > section', function(el) {
                el.style.display = 'block';
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
 * @param {string|Element} [el] - May be one of:
 * * `Element`
 *   * `<header>` - tab element
 *   * `<section>` - folder element
 * * `string` - CSS selector to one of the above
 * * falsy - fails silently
 * @memberOf Tabz.prototype
 */
Tabz.prototype.tabTo = function(el) {
    if (el) {
        if (!(el instanceof Element)) {
            el = this.root.querySelector(el);
        }
        while (el) {
            el = this.tab(el);
            if (el) {
                click.call(this, el.parentElement, el);
                el = el.parentElement.parentElement; // loop to click on each containing tab...
            }
        }
    }
};

/**
 * Current selected tab.
 * @param {HTMLElement|number} el - An element that is (or is within) the tab panel (`.tabz` element) to look in.
 * @returns {undefined|HTMLElement} Returns tab (`<header>`) element.  Returns `undefined` if `el` is neither of the above or an out of range index.
 */
Tabz.prototype.enabled = function(el) {
    while (el && !el.classList.contains('tabz')) {
        el = el.parentElement;
    }
    return el && el.querySelector(':scope>header.tabz-enable');
};

Tabz.prototype.tab = function(el) {
    return el.tagName === 'HEADER' ? el : el.tagName === 'SECTION' ? el.previousElementSibling : null;
};

Tabz.prototype.folder = function(el) {
    return el.tagName === 'SECTION' ? el : el.tagName === 'HEADER' ? el.nextElementSibling : null;
};

/** Enables the tab/folder pair of the clicked tab.
 * Disables all the other pairs in this scope which will include the previously enabled pair.
 * @private
 * @this Tabz
 * @param {Element} div - The tab panel (`.tabz` element) that's handling the click event.
 * @param {Element} target - The element that received the click.
 * @returns {undefined|Element} The `<header>` element (tab) the was clicked; or `undefined` when click was not within a tab.
 */
function click(div, target) {
    var newTab, oldTab;

    forEachEl(':scope>header:not(.tabz-enable)', function(tab) { // todo: use a .find() polyfill here
        if (tab.contains(target)) {
            newTab = tab;
        }
    }, div);

    if (newTab) {
        oldTab = this.enabled(div);
        toggleTab.call(this, oldTab, false);
        toggleTab.call(this, newTab, true);
    }

    return newTab;
}

/**
 * @private
 * @this Tabz
 * @param {Element} tab - The `<header>` element of the tab to enable or disable.
 * @param {boolean} enable - Enable (vs. disable) the tab.
 */
function toggleTab(tab, enable) {
    if (tab) {
        var folder = this.folder(tab),
            method = enable ? 'onEnable' : 'onDisable';

        this[method].call(this, tab, folder);

        tab.classList.toggle('tabz-enable', enable);
        folder.classList.toggle('tabz-enable', enable);

        method += 'd';
        this[method].call(this, tab, folder);
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
 */
Tabz.prototype.onEnable = noop;

/**
 * Called before a previously enabled tab is disabled by another tab being enabled.
 * @type {tabEvent}
 */
Tabz.prototype.onDisable = noop;

/**
 * Called after a previously disabled tab is enabled.
 * @type {tabEvent}
 */
Tabz.prototype.onEnabled = noop;

/**
 * Called after a previously enabled tab is disabled by another tab being enabled.
 * @type {tabEvent}
 */
Tabz.prototype.onDisabled = noop;

function noop() {} // null pattern

function forEachEl(selector, iteratee, context) {
    return Array.prototype.forEach.call((context || document).querySelectorAll(selector), iteratee);
}


module.exports = Tabz;
