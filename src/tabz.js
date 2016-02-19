// tabz node module
// https://github.com/joneit/tabz

/* eslint-env node, browser */

'use strict';

var cssInjector = require('css-injector');

/**
 * Register/deregister click handler on all tab collections.
 * @param {Element} [toot=document] - Where to look for `.tabz` elements containing tabs and folders..
 * @param {boolean} [register=true] - Add event listener to or remove from `.tabz` elements.
 * @param {Element} [referenceElement] - Passed to cssInjector's insertBefore() call.
 * @constructor
 */
function Tabz(root, register, referenceElement) {
    var i, el;

    root = root || document;
    register = register === undefined || register;

    if (register) {
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

        this.root = root;

        // enable first tab on each tab bar
        toArray(root.querySelectorAll('.tabz>header:first-of-type,.tabz>section:first-of-type')).forEach(function(el) {
            el.classList.add('tabz-enable');
        });

        // enable default tab and all its parents
        this.tabTo(root.querySelector('.tabz > header#default-tab'));
    }

    var method = register ? 'addEventListener' : 'removeEventListener';
    var boundClickHandler = onclick.bind(this);
    toArray(root.querySelectorAll('.tabz')).forEach(function(tabBar) {
        tabBar.style.visibility = 'visible';
        tabBar[method]('click', boundClickHandler);
    });
}

/**
 * @summary Selects the given tab.
 * @desc If it is a nested tab, also reveals all its ancestor tabs.
 * @param {string|Element} [tabElt] - May be one of:
 * * `Element`
 *   * `<header>` - tab element
 *   * `<section>` - folder element
 * * `string` - CSS selector to one of the above
 * * falsy - fails silently
 * @memberOf Tabz.prototype
 */
Tabz.prototype.tabTo = function(tabElt) {
    if (tabElt) {
        if (!(tabElt instanceof Element)) {
            tabElt = this.root.querySelector(tabElt);
        }
        while (tabElt) {
            if (tabElt.tagName === 'SECTION') {
                tabElt = tabElt.previousElementSibling;
            }
            if (tabElt.tagName === 'HEADER') {
                click.call(this, tabElt.parentElement, tabElt);
                tabElt = tabElt.parentElement.parentElement; // loop to click on each containing tab...
            } else {
                tabElt = null;
            }
        }
    }
};

/**
 * @typedef tabEvent
 * @type {function}
 * @param {Element} event.target - tab (`<header>` element)
 * @param {string} event.id - id of tab (`<header>` element's `id` attribute)
 */

/**
 * Called when a previously disabled tab is enabled.
 * @type {tabEvent}
 */
Tabz.prototype.tabEnabled = noop;

/**
 * Called when a previously enabled tab is disabled by another tab being enabled.
 * @type {tabEvent}
 */
Tabz.prototype.tabDisabled = noop;

function noop() {} // null pattern

function toArray(arrayLikeObject, start) {
    return Array.prototype.slice.call(arrayLikeObject, start);
}

/** Enables the tab/folder pair of the clicked tab.
 * Disables all the other pairs in this scope which will include the previously enabled pair.
 * @private
 * @this Tabz
 * @param {Element} div - The element that's handling the click event.
 * @param {Element} target - The element that received the click.
 * @param {boolean} [options.silent] - Don't fire events.
 * @returns {undefined|Element} The `<header>` element (tab) the was clicked; or `undefined` when click was not within a tab.
 */
function click(div, target, options) {
    var newTab, oldTab,
        disabledTabs = toArray(div.querySelectorAll(':scope>header:not(.tabz-enable)'));

    disabledTabs.forEach(function(tab) { // todo: use a .find() polyfill here
        if (tab.contains(target)) {
            newTab = tab;
        }
    });

    if (newTab) {
        oldTab = div.querySelector(':scope>header.tabz-enable');
        toggleTab.call(this, oldTab, false, options);
        toggleTab.call(this, newTab, true, options);
    }

    return newTab;
}

/**
 * @this Tabz
 * @private
 * @param {Element} tab - The `<header>` element of the tab to enable or disable.
 * @param {boolean} enable - Enable (vs. disable) the tab.
 * @param {boolean} [options.silent] - Don't fire events.
 */
function toggleTab(tab, enable, options) {
    if (tab) {
        var silent = options && options.silent;
        var method = enable ? 'tabEnabled' : 'tabDisabled';
        if (!silent) {
            this[method]({target: tab, id: tab.id});
        }
        tab.classList.toggle('tabz-enable', enable);
        tab.nextElementSibling.classList.toggle('tabz-enable', enable);
    }
}

/**
 * @private
 * @this Tabz
 * @param evt
 */
function onclick(evt) {
    click.call(this, evt.currentTarget, evt.target);
}

module.exports = Tabz;
