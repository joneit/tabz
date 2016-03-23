(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/* eslint-env browser */

/** @namespace cssInjector */

/**
 * @summary Insert base stylesheet into DOM
 *
 * @desc Creates a new `<style>...</style>` element from the named text string(s) and inserts it but only if it does not already exist in the specified container as per `referenceElement`.
 *
 * > Caveat: If stylesheet is for use in a shadow DOM, you must specify a local `referenceElement`.
 *
 * @returns A reference to the newly created `<style>...</style>` element.
 *
 * @param {string|string[]} cssRules
 * @param {string} [ID]
 * @param {undefined|null|Element|string} [referenceElement] - Container for insertion. Overloads:
 * * `undefined` type (or omitted): injects stylesheet at top of `<head>...</head>` element
 * * `null` value: injects stylesheet at bottom of `<head>...</head>` element
 * * `Element` type: injects stylesheet immediately before given element, wherever it is found.
 * * `string` type: injects stylesheet immediately before given first element found that matches the given css selector.
 *
 * @memberOf cssInjector
 */
function cssInjector(cssRules, ID, referenceElement) {
    if (typeof referenceElement === 'string') {
        referenceElement = document.querySelector(referenceElement);
        if (!referenceElement) {
            throw 'Cannot find reference element for CSS injection.';
        }
    } else if (referenceElement && !(referenceElement instanceof Element)) {
        throw 'Given value not a reference element.';
    }

    var container = referenceElement && referenceElement.parentNode || document.head || document.getElementsByTagName('head')[0];

    if (ID) {
        ID = cssInjector.idPrefix + ID;

        if (container.querySelector('#' + ID)) {
            return; // stylesheet already in DOM
        }
    }

    var style = document.createElement('style');
    style.type = 'text/css';
    if (ID) {
        style.id = ID;
    }
    if (cssRules instanceof Array) {
        cssRules = cssRules.join('\n');
    }
    cssRules = '\n' + cssRules + '\n';
    if (style.styleSheet) {
        style.styleSheet.cssText = cssRules;
    } else {
        style.appendChild(document.createTextNode(cssRules));
    }

    if (referenceElement === undefined) {
        referenceElement = container.firstChild;
    }

    container.insertBefore(style, referenceElement);

    return style;
}

/**
 * @summary Optional prefix for `<style>` tag IDs.
 * @desc Defaults to `'injected-stylesheet-'`.
 * @type {string}
 * @memberOf cssInjector
 */
cssInjector.idPrefix = 'injected-stylesheet-';

// Interface
module.exports = cssInjector;

},{}],2:[function(require,module,exports){
// tabz node module
// https://github.com/joneit/tabz

/* eslint-env node, browser */

'use strict';

window.Tabz = (function(){

var cssInjector = require('css-injector');

/**
 * Register/deregister click handler on all tab collections.
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
        css = '.tabz{position:relative;visibility:hidden;height:100%}.tabz>header{position:relative;display:inline-block;background-color:#fff;margin-left:1em;padding:5px .6em;border:1px solid #666;border-bottom-color:transparent;border-radius:6px 6px 0 0;cursor:default;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none}.tabz>header+section{position:absolute;display:none;background-color:#fff;margin-top:-1px;padding:8px;border:1px solid #666;border-radius:6px;left:0;right:0;bottom:0;top:0;z-index:0}.tabz>header+section.tabz-enable{z-index:1}.tabz>header.tabz-enable{z-index:2}.tabz-bg0{background-color:#eee!important}.tabz-bg1{background-color:#eef!important}.tabz-bg2{background-color:#efe!important}.tabz-bg3{background-color:#eff!important}.tabz-bg4{background-color:#fee!important}.tabz-bg5{background-color:#fef!important}.tabz-bg6{background-color:#ffe!important}';
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
        oldTab = this.enabledTab(div);
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


return  Tabz;

})();

},{"css-injector":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy90YWJ6L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvdGFiei9ub2RlX21vZHVsZXMvY3NzLWluamVjdG9yL2luZGV4LmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL3RhYnovc3JjL2Zha2VfYjdkODNkODUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKiogQG5hbWVzcGFjZSBjc3NJbmplY3RvciAqL1xuXG4vKipcbiAqIEBzdW1tYXJ5IEluc2VydCBiYXNlIHN0eWxlc2hlZXQgaW50byBET01cbiAqXG4gKiBAZGVzYyBDcmVhdGVzIGEgbmV3IGA8c3R5bGU+Li4uPC9zdHlsZT5gIGVsZW1lbnQgZnJvbSB0aGUgbmFtZWQgdGV4dCBzdHJpbmcocykgYW5kIGluc2VydHMgaXQgYnV0IG9ubHkgaWYgaXQgZG9lcyBub3QgYWxyZWFkeSBleGlzdCBpbiB0aGUgc3BlY2lmaWVkIGNvbnRhaW5lciBhcyBwZXIgYHJlZmVyZW5jZUVsZW1lbnRgLlxuICpcbiAqID4gQ2F2ZWF0OiBJZiBzdHlsZXNoZWV0IGlzIGZvciB1c2UgaW4gYSBzaGFkb3cgRE9NLCB5b3UgbXVzdCBzcGVjaWZ5IGEgbG9jYWwgYHJlZmVyZW5jZUVsZW1lbnRgLlxuICpcbiAqIEByZXR1cm5zIEEgcmVmZXJlbmNlIHRvIHRoZSBuZXdseSBjcmVhdGVkIGA8c3R5bGU+Li4uPC9zdHlsZT5gIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8c3RyaW5nW119IGNzc1J1bGVzXG4gKiBAcGFyYW0ge3N0cmluZ30gW0lEXVxuICogQHBhcmFtIHt1bmRlZmluZWR8bnVsbHxFbGVtZW50fHN0cmluZ30gW3JlZmVyZW5jZUVsZW1lbnRdIC0gQ29udGFpbmVyIGZvciBpbnNlcnRpb24uIE92ZXJsb2FkczpcbiAqICogYHVuZGVmaW5lZGAgdHlwZSAob3Igb21pdHRlZCk6IGluamVjdHMgc3R5bGVzaGVldCBhdCB0b3Agb2YgYDxoZWFkPi4uLjwvaGVhZD5gIGVsZW1lbnRcbiAqICogYG51bGxgIHZhbHVlOiBpbmplY3RzIHN0eWxlc2hlZXQgYXQgYm90dG9tIG9mIGA8aGVhZD4uLi48L2hlYWQ+YCBlbGVtZW50XG4gKiAqIGBFbGVtZW50YCB0eXBlOiBpbmplY3RzIHN0eWxlc2hlZXQgaW1tZWRpYXRlbHkgYmVmb3JlIGdpdmVuIGVsZW1lbnQsIHdoZXJldmVyIGl0IGlzIGZvdW5kLlxuICogKiBgc3RyaW5nYCB0eXBlOiBpbmplY3RzIHN0eWxlc2hlZXQgaW1tZWRpYXRlbHkgYmVmb3JlIGdpdmVuIGZpcnN0IGVsZW1lbnQgZm91bmQgdGhhdCBtYXRjaGVzIHRoZSBnaXZlbiBjc3Mgc2VsZWN0b3IuXG4gKlxuICogQG1lbWJlck9mIGNzc0luamVjdG9yXG4gKi9cbmZ1bmN0aW9uIGNzc0luamVjdG9yKGNzc1J1bGVzLCBJRCwgcmVmZXJlbmNlRWxlbWVudCkge1xuICAgIGlmICh0eXBlb2YgcmVmZXJlbmNlRWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmVmZXJlbmNlRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocmVmZXJlbmNlRWxlbWVudCk7XG4gICAgICAgIGlmICghcmVmZXJlbmNlRWxlbWVudCkge1xuICAgICAgICAgICAgdGhyb3cgJ0Nhbm5vdCBmaW5kIHJlZmVyZW5jZSBlbGVtZW50IGZvciBDU1MgaW5qZWN0aW9uLic7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHJlZmVyZW5jZUVsZW1lbnQgJiYgIShyZWZlcmVuY2VFbGVtZW50IGluc3RhbmNlb2YgRWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgJ0dpdmVuIHZhbHVlIG5vdCBhIHJlZmVyZW5jZSBlbGVtZW50Lic7XG4gICAgfVxuXG4gICAgdmFyIGNvbnRhaW5lciA9IHJlZmVyZW5jZUVsZW1lbnQgJiYgcmVmZXJlbmNlRWxlbWVudC5wYXJlbnROb2RlIHx8IGRvY3VtZW50LmhlYWQgfHwgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcblxuICAgIGlmIChJRCkge1xuICAgICAgICBJRCA9IGNzc0luamVjdG9yLmlkUHJlZml4ICsgSUQ7XG5cbiAgICAgICAgaWYgKGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjJyArIElEKSkge1xuICAgICAgICAgICAgcmV0dXJuOyAvLyBzdHlsZXNoZWV0IGFscmVhZHkgaW4gRE9NXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHN0eWxlLnR5cGUgPSAndGV4dC9jc3MnO1xuICAgIGlmIChJRCkge1xuICAgICAgICBzdHlsZS5pZCA9IElEO1xuICAgIH1cbiAgICBpZiAoY3NzUnVsZXMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBjc3NSdWxlcyA9IGNzc1J1bGVzLmpvaW4oJ1xcbicpO1xuICAgIH1cbiAgICBjc3NSdWxlcyA9ICdcXG4nICsgY3NzUnVsZXMgKyAnXFxuJztcbiAgICBpZiAoc3R5bGUuc3R5bGVTaGVldCkge1xuICAgICAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3NSdWxlcztcbiAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3NSdWxlcykpO1xuICAgIH1cblxuICAgIGlmIChyZWZlcmVuY2VFbGVtZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmVmZXJlbmNlRWxlbWVudCA9IGNvbnRhaW5lci5maXJzdENoaWxkO1xuICAgIH1cblxuICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUoc3R5bGUsIHJlZmVyZW5jZUVsZW1lbnQpO1xuXG4gICAgcmV0dXJuIHN0eWxlO1xufVxuXG4vKipcbiAqIEBzdW1tYXJ5IE9wdGlvbmFsIHByZWZpeCBmb3IgYDxzdHlsZT5gIHRhZyBJRHMuXG4gKiBAZGVzYyBEZWZhdWx0cyB0byBgJ2luamVjdGVkLXN0eWxlc2hlZXQtJ2AuXG4gKiBAdHlwZSB7c3RyaW5nfVxuICogQG1lbWJlck9mIGNzc0luamVjdG9yXG4gKi9cbmNzc0luamVjdG9yLmlkUHJlZml4ID0gJ2luamVjdGVkLXN0eWxlc2hlZXQtJztcblxuLy8gSW50ZXJmYWNlXG5tb2R1bGUuZXhwb3J0cyA9IGNzc0luamVjdG9yO1xuIiwiLy8gdGFieiBub2RlIG1vZHVsZVxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC90YWJ6XG5cbi8qIGVzbGludC1lbnYgbm9kZSwgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbndpbmRvdy5UYWJ6ID0gKGZ1bmN0aW9uKCl7XG5cbnZhciBjc3NJbmplY3RvciA9IHJlcXVpcmUoJ2Nzcy1pbmplY3RvcicpO1xuXG4vKipcbiAqIFJlZ2lzdGVyL2RlcmVnaXN0ZXIgY2xpY2sgaGFuZGxlciBvbiBhbGwgdGFiIGNvbGxlY3Rpb25zLlxuICogQHBhcmFtIHtFbGVtZW50fSBbb3B0aW9ucy5yb290PWRvY3VtZW50XSAtIFdoZXJlIHRvIGxvb2sgZm9yIHRhYiBwYW5lbHMgKGAudGFiemAgZWxlbWVudHMpIGNvbnRhaW5pbmcgdGFicyBhbmQgZm9sZGVycy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudW5ob29rPWZhbHNlXSAtIFJlbW92ZSBldmVudCBsaXN0ZW5lciBmcm9tIHRhYiBwYW5lbHMgKGAudGFiemAgZWxlbWVudHMpLlxuICogQHBhcmFtIHtFbGVtZW50fSBbb3B0aW9ucy5yZWZlcmVuY2VFbGVtZW50XSAtIFBhc3NlZCB0byBjc3NJbmplY3RvcidzIGluc2VydEJlZm9yZSgpIGNhbGwuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGVmYXVsdFRhYlNlbGVjdG9yPScuZGVmYXVsdC10YWInXSAtIC5jbGFzc25hbWUgb3IgI2lkIG9mIHRoZSB0YWIgdG8gc2VsZWN0IGJ5IGRlZmF1bHRcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5vbkVuYWJsZV0gLSBIYW5kbGVyIGltcGxlbWVudGF0aW9uLiBTZWUge0BsaW5rIFRhYnojb25FbmFibGV8b25FbmFibGV9LlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLm9uRGlzYWJsZV0gLSBIYW5kbGVyIGltcGxlbWVudGF0aW9uLiBTZWUge0BsaW5rIFRhYnojb25EaXNhYmxlfG9uRW5hYmxlfS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5vbkVuYWJsZWRdIC0gSGFuZGxlciBpbXBsZW1lbnRhdGlvbi4gU2VlIHtAbGluayBUYWJ6I29uRW5hYmxlZHxvbkVuYWJsZX0uXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMub25EaXNhYmxlZF0gLSBIYW5kbGVyIGltcGxlbWVudGF0aW9uLiBTZWUge0BsaW5rIFRhYnojb25EaXNhYmxlZHxvbkVuYWJsZX0uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGFieihvcHRpb25zKSB7XG4gICAgdmFyIGksIGVsO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdmFyIHJvb3QgPSBvcHRpb25zLnJvb3QgfHwgZG9jdW1lbnQsXG4gICAgICAgIHVuaG9vayA9IG9wdGlvbnMudW5ob29rLFxuICAgICAgICByZWZlcmVuY2VFbGVtZW50ID0gb3B0aW9ucy5yZWZlcmVuY2VFbGVtZW50LFxuICAgICAgICBkZWZhdWx0VGFiU2VsZWN0b3IgPSBvcHRpb25zLmRlZmF1bHRUYWJTZWxlY3RvciB8fCAnLmRlZmF1bHQtdGFiJztcblxuICAgIGlmICghdW5ob29rKSB7XG4gICAgICAgIHZhciBjc3M7XG4gICAgICAgIC8qIGluamVjdDpjc3MgKi9cbiAgICAgICAgY3NzID0gJy50YWJ6e3Bvc2l0aW9uOnJlbGF0aXZlO3Zpc2liaWxpdHk6aGlkZGVuO2hlaWdodDoxMDAlfS50YWJ6PmhlYWRlcntwb3NpdGlvbjpyZWxhdGl2ZTtkaXNwbGF5OmlubGluZS1ibG9jaztiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7bWFyZ2luLWxlZnQ6MWVtO3BhZGRpbmc6NXB4IC42ZW07Ym9yZGVyOjFweCBzb2xpZCAjNjY2O2JvcmRlci1ib3R0b20tY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLXJhZGl1czo2cHggNnB4IDAgMDtjdXJzb3I6ZGVmYXVsdDt1c2VyLXNlbGVjdDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmV9LnRhYno+aGVhZGVyK3NlY3Rpb257cG9zaXRpb246YWJzb2x1dGU7ZGlzcGxheTpub25lO2JhY2tncm91bmQtY29sb3I6I2ZmZjttYXJnaW4tdG9wOi0xcHg7cGFkZGluZzo4cHg7Ym9yZGVyOjFweCBzb2xpZCAjNjY2O2JvcmRlci1yYWRpdXM6NnB4O2xlZnQ6MDtyaWdodDowO2JvdHRvbTowO3RvcDowO3otaW5kZXg6MH0udGFiej5oZWFkZXIrc2VjdGlvbi50YWJ6LWVuYWJsZXt6LWluZGV4OjF9LnRhYno+aGVhZGVyLnRhYnotZW5hYmxle3otaW5kZXg6Mn0udGFiei1iZzB7YmFja2dyb3VuZC1jb2xvcjojZWVlIWltcG9ydGFudH0udGFiei1iZzF7YmFja2dyb3VuZC1jb2xvcjojZWVmIWltcG9ydGFudH0udGFiei1iZzJ7YmFja2dyb3VuZC1jb2xvcjojZWZlIWltcG9ydGFudH0udGFiei1iZzN7YmFja2dyb3VuZC1jb2xvcjojZWZmIWltcG9ydGFudH0udGFiei1iZzR7YmFja2dyb3VuZC1jb2xvcjojZmVlIWltcG9ydGFudH0udGFiei1iZzV7YmFja2dyb3VuZC1jb2xvcjojZmVmIWltcG9ydGFudH0udGFiei1iZzZ7YmFja2dyb3VuZC1jb2xvcjojZmZlIWltcG9ydGFudH0nO1xuICAgICAgICAvKiBlbmRpbmplY3QgKi9cblxuICAgICAgICBpZiAoIXJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIC8vIGZpbmQgZmlyc3QgPGxpbms+IG9yIDxzdHlsZT4gaW4gPGhlYWQ+XG4gICAgICAgICAgICB2YXIgaGVhZFN0dWZmID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaGVhZCcpLmNoaWxkcmVuO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgIXJlZmVyZW5jZUVsZW1lbnQgJiYgaSA8IGhlYWRTdHVmZi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGVsID0gaGVhZFN0dWZmW2ldO1xuICAgICAgICAgICAgICAgIGlmIChlbC50YWdOYW1lID09PSAnU1RZTEUnIHx8IGVsLnRhZ05hbWUgPT09ICdMSU5LJyAmJiBlbC5yZWwgPT09ICdzdHlsZXNoZWV0Jykge1xuICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VFbGVtZW50ID0gZWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNzc0luamVjdG9yKGNzcywgJ3RhYnotY3NzLWJhc2UnLCByZWZlcmVuY2VFbGVtZW50KTtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKHRoaXNba2V5XSA9PT0gbm9vcCkge1xuICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAc3VtbWFyeSBUaGUgY29udGV4dCBvZiB0aGlzIHRhYiBvYmplY3QuXG4gICAgICAgICAqIEBkZXNjIFRoZSBjb250ZXh0IG1heSBlbmNvbXBhc3MgYW55IG51bWJlciBvZiB0YWIgcGFuZWxzIChgLnRhYnpgIGVsZW1lbnRzKS5cbiAgICAgICAgICogQHR5cGUge0hUTUxEb2N1bWVufEhUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yb290ID0gcm9vdDtcblxuICAgICAgICAvLyBlbmFibGUgZmlyc3QgdGFiIG9uIGVhY2ggdGFiIHBhbmVsIChgLnRhYnpgIGVsZW1lbnQpXG4gICAgICAgIGZvckVhY2hFbCgnLnRhYno+aGVhZGVyOmZpcnN0LW9mLXR5cGUsLnRhYno+c2VjdGlvbjpmaXJzdC1vZi10eXBlJywgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ3RhYnotZW5hYmxlJyk7XG4gICAgICAgIH0sIHJvb3QpO1xuXG4gICAgICAgIC8vIGVuYWJsZSBkZWZhdWx0IHRhYiBhbmQgYWxsIGl0cyBwYXJlbnRzIChtdXN0IGJlIGEgdGFiKVxuICAgICAgICB0aGlzLnRhYlRvKHJvb3QucXVlcnlTZWxlY3RvcignLnRhYnogPiBoZWFkZXInICsgZGVmYXVsdFRhYlNlbGVjdG9yKSk7XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZvckVhY2hFbCgnLnRhYnogPiBzZWN0aW9uJywgZnVuY3Rpb24oZWwpIHtcblxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgMTogQSBidWcgaW4gb2xkZXIgdmVyc2lvbnMgb2YgQ2hyb21lIChsaWtlIHY0MCkgdGhhdCBpbnNlcnRlZCBhIGJyZWFrIGF0IG1hcmstdXAgbG9jYXRpb24gb2YgYW4gYWJzb2x1dGUgcG9zaXRpb25lZCBibG9jay4gVGhlIHdvcmstYXJvdW5kIGlzIHRvIGhpZGUgdGhvc2UgYmxvY2tzIHVudGlsIGFmdGVyIGZpcnN0IHJlbmRlcjsgdGhlbiBzaG93IHRoZW0uIEkgZG9uJ3Qga25vdyB3aHkgdGhpcyB3b3JrcyBidXQgaXQgZG9lcy4gU2VlbXMgdG8gYmUgZHVyYWJsZS5cbiAgICAgICAgICAgICAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgMjogQWRqdXN0IGFic29sdXRlIHRvcCBvZiBlYWNoIHJlbmRlcmVkIGZvbGRlciB0byB0aGUgYm90dG9tIG9mIGl0cyB0YWJcbiAgICAgICAgICAgICAgICBlbC5zdHlsZS50b3AgPSBlbC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmJvdHRvbSAtIGVsLnBhcmVudEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgJ3B4JztcblxuICAgICAgICAgICAgfSwgcm9vdCk7XG4gICAgICAgIH0sIDApO1xuICAgIH1cblxuICAgIHZhciBtZXRob2QgPSB1bmhvb2sgPyAncmVtb3ZlRXZlbnRMaXN0ZW5lcicgOiAnYWRkRXZlbnRMaXN0ZW5lcic7XG4gICAgdmFyIGJvdW5kQ2xpY2tIYW5kbGVyID0gb25jbGljay5iaW5kKHRoaXMpO1xuICAgIGZvckVhY2hFbCgnLnRhYnonLCBmdW5jdGlvbih0YWJCYXIpIHtcbiAgICAgICAgdGFiQmFyLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICAgIHRhYkJhclttZXRob2RdKCdjbGljaycsIGJvdW5kQ2xpY2tIYW5kbGVyKTtcbiAgICB9LCByb290KTtcbn1cblxuZnVuY3Rpb24gb25jbGljayhldnQpIHtcbiAgICBjbGljay5jYWxsKHRoaXMsIGV2dC5jdXJyZW50VGFyZ2V0LCBldnQudGFyZ2V0KTtcbn1cblxuLyoqXG4gKiBAc3VtbWFyeSBTZWxlY3RzIHRoZSBnaXZlbiB0YWIuXG4gKiBAZGVzYyBJZiBpdCBpcyBhIG5lc3RlZCB0YWIsIGFsc28gcmV2ZWFscyBhbGwgaXRzIGFuY2VzdG9yIHRhYnMuXG4gKiBAcGFyYW0ge3N0cmluZ3xIVE1MRWxlbWVudH0gW2VsXSAtIE1heSBiZSBvbmUgb2Y6XG4gKiAqIGBIVE1MRWxlbWVudGBcbiAqICAgKiBgPGhlYWRlcj5gIC0gdGFiIGVsZW1lbnRcbiAqICAgKiBgPHNlY3Rpb24+YCAtIGZvbGRlciBlbGVtZW50XG4gKiAqIGBzdHJpbmdgIC0gQ1NTIHNlbGVjdG9yIHRvIG9uZSBvZiB0aGUgYWJvdmVcbiAqICogZmFsc3kgLSBmYWlscyBzaWxlbnRseVxuICogQG1lbWJlck9mIFRhYnoucHJvdG90eXBlXG4gKi9cblRhYnoucHJvdG90eXBlLnRhYlRvID0gZnVuY3Rpb24oZWwpIHtcbiAgICB3aGlsZSAoKGVsID0gdGhpcy50YWIoZWwpKSkge1xuICAgICAgICBjbGljay5jYWxsKHRoaXMsIGVsLnBhcmVudEVsZW1lbnQsIGVsKTtcbiAgICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7IC8vIGxvb3AgdG8gY2xpY2sgb24gZWFjaCBjb250YWluaW5nIHRhYi4uLlxuICAgIH1cbn07XG5cbi8qKlxuICogQ3VycmVudCBzZWxlY3RlZCB0YWIuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fG51bWJlcn0gZWwgLSBBbiBlbGVtZW50IHRoYXQgaXMgKG9yIGlzIHdpdGhpbikgdGhlIHRhYiBwYW5lbCAoYC50YWJ6YCBlbGVtZW50KSB0byBsb29rIGluLlxuICogQHJldHVybnMge3VuZGVmaW5lZHxIVE1MRWxlbWVudH0gUmV0dXJucyB0YWIgKGA8aGVhZGVyPmApIGVsZW1lbnQuICBSZXR1cm5zIGB1bmRlZmluZWRgIGlmIGBlbGAgaXMgbmVpdGhlciBvZiB0aGUgYWJvdmUgb3IgYW4gb3V0IG9mIHJhbmdlIGluZGV4LlxuICovXG5UYWJ6LnByb3RvdHlwZS5lbmFibGVkVGFiID0gZnVuY3Rpb24oZWwpIHtcbiAgICBlbCA9IHRoaXMucGFuZWwoZWwpO1xuICAgIHJldHVybiBlbCAmJiBlbC5xdWVyeVNlbGVjdG9yKCc6c2NvcGU+aGVhZGVyLnRhYnotZW5hYmxlJyk7XG59O1xuXG4vKipcbiAqIEBzdW1tYXJ5IEdldCB0YWIgZWxlbWVudC5cbiAqIEBkZXNjIEdldCB0YWIgZWxlbWVudCBpZiBnaXZlbiB0YWIgb3IgZm9sZGVyIGVsZW1lbnQ7IG9yIGFuIGVsZW1lbnQgd2l0aGluIHN1Y2g7IG9yIGZpbmQgdGFiLlxuICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gW2VsXSAtIE1heSBiZSBvbmUgb2Y6XG4gKiAqIGEgdGFiIChhIGA8aGVhZGVyPmAgZWxlbWVudClcbiAqICogYSBmb2xkZXIgKGEgYDxzZWN0aW9uPmAgZWxlbWVudClcbiAqICogYW4gZWxlbWVudCB3aXRoaW4gb25lIG9mIHRoZSBhYm92ZVxuICogKiBgc3RyaW5nYCAtIENTUyBzZWxlY3RvciB0byBvbmUgb2YgdGhlIGFib3ZlLCBzZWFyY2hpbmcgd2l0aGluIHRoZSByb290IG9yIGRvY3VtZW50XG4gKiBAcmV0dXJucyB7bnVsbHxFbGVtZW50fSB0YWIgKGA8aGVhZGVyPi4uLjwvaGVhZGVyPmApIGVsZW1lbnQgb3IgYG51bGxgIGlmIG5vdCBmb3VuZFxuICogQG1lbWJlck9mIFRhYnoucHJvdG90eXBlXG4gKi9cblRhYnoucHJvdG90eXBlLnRhYiA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwgPSBsb29rRm9yRWwuY2FsbCh0aGlzLCBlbCk7XG4gICAgcmV0dXJuICEoZWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgPyBudWxsIDogZWwudGFnTmFtZSA9PT0gJ0hFQURFUicgPyBlbCA6IGVsLnRhZ05hbWUgPT09ICdTRUNUSU9OJyA/IGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmcgOiBudWxsO1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBHZXQgZm9sZGVyIGVsZW1lbnQuXG4gKiBAZGVzYyBHZXQgZm9sZGVyIGVsZW1lbnQgaWYgZ2l2ZW4gdGFiIG9yIGZvbGRlciBlbGVtZW50OyBvciBhbiBlbGVtZW50IHdpdGhpbiBzdWNoOyBvciBmaW5kIGZvbGRlci5cbiAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR9IFtlbF0gLSBNYXkgYmUgb25lIG9mOlxuICogKiBhIHRhYiAoYSBgPGhlYWRlcj5gIGVsZW1lbnQpXG4gKiAqIGEgZm9sZGVyIChhIGA8c2VjdGlvbj5gIGVsZW1lbnQpXG4gKiAqIGFuIGVsZW1lbnQgd2l0aGluIG9uZSBvZiB0aGUgYWJvdmVcbiAqICogYHN0cmluZ2AgLSBDU1Mgc2VsZWN0b3IgdG8gb25lIG9mIHRoZSBhYm92ZSwgc2VhcmNoaW5nIHdpdGhpbiB0aGUgcm9vdCBvciBkb2N1bWVudFxuICogQHJldHVybnMge251bGx8RWxlbWVudH0gdGFiIChgPGhlYWRlcj4uLi48L2hlYWRlcj5gKSBlbGVtZW50IG9yIGBudWxsYCBpZiBub3QgZm91bmRcbiAqIEBtZW1iZXJPZiBUYWJ6LnByb3RvdHlwZVxuICovXG5UYWJ6LnByb3RvdHlwZS5mb2xkZXIgPSBmdW5jdGlvbihlbCkge1xuICAgIGVsID0gbG9va0ZvckVsLmNhbGwodGhpcywgZWwpO1xuICAgIHJldHVybiAhKGVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpID8gbnVsbCA6IGVsLnRhZ05hbWUgPT09ICdTRUNUSU9OJyA/IGVsIDogZWwudGFnTmFtZSA9PT0gJ0hFQURFUicgPyBlbC5uZXh0RWxlbWVudFNpYmxpbmcgOiBudWxsO1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBHZXQgdGFiIHBhbmVsIGVsZW1lbnQuXG4gKiBAZGVzYyBHZXQgcGFuZWwgZWxlbWVudCBpZiBnaXZlbiB0YWIgcGFuZWwgZWxlbWVudDsgb3IgYW4gZWxlbWVudCB3aXRoaW4gYSB0YWIgcGFuZWw7IG9yIGZpbmQgdGFiIHBhbmVsLlxuICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gW2VsXSAtIE1heSBiZSBvbmUgb2Y6XG4gKiAqIGEgdGFiIHBhbmVsIChhbiBgSFRNTEVsZW1lbnRgIHdpdGggY2xhc3MgYHRhYnpgKVxuICogKiBhbiBlbGVtZW50IHdpdGhpbiBhIHRhYiBwYW5lbFxuICogKiBgc3RyaW5nYCAtIENTUyBzZWxlY3RvciB0byBvbmUgYSB0YWIgcGFuZWwsIHNlYXJjaGluZyB3aXRoaW4gdGhlIHJvb3Qgb3IgZG9jdW1lbnRcbiAqIEByZXR1cm5zIHtudWxsfEVsZW1lbnR9IHRhYiBwYW5lbCBlbGVtZW50IG9yIGBudWxsYCBpZiBub3QgZm91bmRcbiAqIEBtZW1iZXJPZiBUYWJ6LnByb3RvdHlwZVxuICovXG5UYWJ6LnByb3RvdHlwZS5wYW5lbCA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgd2hpbGUgKGVsICYmICFlbC5jbGFzc0xpc3QuY29udGFpbnMoJ3RhYnonKSkge1xuICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiAhKGVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpID8gbnVsbCA6IGVsLmNsYXNzTGlzdC5jb250YWlucygndGFieicpID8gZWwgOiBudWxsO1xufTtcblxuZnVuY3Rpb24gbG9va0ZvckVsKGVsKSB7XG4gICAgaWYgKGVsIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICB3aGlsZSAoZWwgJiYgZWwudGFnTmFtZSAhPT0gJ0hFQURFUicgJiYgZWwudGFnTmFtZSAhPT0gJ1NFQ1RJT04nKSB7XG4gICAgICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBlbCA9IHRoaXMucm9vdC5xdWVyeVNlbGVjdG9yKGVsKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsO1xufVxuXG4vKiogRW5hYmxlcyB0aGUgdGFiL2ZvbGRlciBwYWlyIG9mIHRoZSBjbGlja2VkIHRhYi5cbiAqIERpc2FibGVzIGFsbCB0aGUgb3RoZXIgcGFpcnMgaW4gdGhpcyBzY29wZSB3aGljaCB3aWxsIGluY2x1ZGUgdGhlIHByZXZpb3VzbHkgZW5hYmxlZCBwYWlyLlxuICogQHByaXZhdGVcbiAqIEB0aGlzIFRhYnpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZGl2IC0gVGhlIHRhYiBwYW5lbCAoYC50YWJ6YCBlbGVtZW50KSB0aGF0J3MgaGFuZGxpbmcgdGhlIGNsaWNrIGV2ZW50LlxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgLSBUaGUgZWxlbWVudCB0aGF0IHJlY2VpdmVkIHRoZSBjbGljay5cbiAqIEByZXR1cm5zIHt1bmRlZmluZWR8RWxlbWVudH0gVGhlIGA8aGVhZGVyPmAgZWxlbWVudCAodGFiKSB0aGUgd2FzIGNsaWNrZWQ7IG9yIGB1bmRlZmluZWRgIHdoZW4gY2xpY2sgd2FzIG5vdCB3aXRoaW4gYSB0YWIuXG4gKi9cbmZ1bmN0aW9uIGNsaWNrKGRpdiwgdGFyZ2V0KSB7XG4gICAgdmFyIG5ld1RhYiwgb2xkVGFiO1xuXG4gICAgZm9yRWFjaEVsKCc6c2NvcGU+aGVhZGVyOm5vdCgudGFiei1lbmFibGUpJywgZnVuY3Rpb24odGFiKSB7IC8vIHRvZG86IHVzZSBhIC5maW5kKCkgcG9seWZpbGwgaGVyZVxuICAgICAgICBpZiAodGFiLmNvbnRhaW5zKHRhcmdldCkpIHtcbiAgICAgICAgICAgIG5ld1RhYiA9IHRhYjtcbiAgICAgICAgfVxuICAgIH0sIGRpdik7XG5cbiAgICBpZiAobmV3VGFiKSB7XG4gICAgICAgIG9sZFRhYiA9IHRoaXMuZW5hYmxlZFRhYihkaXYpO1xuICAgICAgICB0b2dnbGVUYWIuY2FsbCh0aGlzLCBvbGRUYWIsIGZhbHNlKTtcbiAgICAgICAgdG9nZ2xlVGFiLmNhbGwodGhpcywgbmV3VGFiLCB0cnVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3VGFiO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAdGhpcyBUYWJ6XG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhYiAtIFRoZSBgPGhlYWRlcj5gIGVsZW1lbnQgb2YgdGhlIHRhYiB0byBlbmFibGUgb3IgZGlzYWJsZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gZW5hYmxlIC0gRW5hYmxlICh2cy4gZGlzYWJsZSkgdGhlIHRhYi5cbiAqL1xuZnVuY3Rpb24gdG9nZ2xlVGFiKHRhYiwgZW5hYmxlKSB7XG4gICAgaWYgKHRhYikge1xuICAgICAgICB2YXIgZm9sZGVyID0gdGhpcy5mb2xkZXIodGFiKSxcbiAgICAgICAgICAgIG1ldGhvZCA9IGVuYWJsZSA/ICdvbkVuYWJsZScgOiAnb25EaXNhYmxlJztcblxuICAgICAgICB0aGlzW21ldGhvZF0uY2FsbCh0aGlzLCB0YWIsIGZvbGRlcik7XG5cbiAgICAgICAgdGFiLmNsYXNzTGlzdC50b2dnbGUoJ3RhYnotZW5hYmxlJywgZW5hYmxlKTtcbiAgICAgICAgZm9sZGVyLmNsYXNzTGlzdC50b2dnbGUoJ3RhYnotZW5hYmxlJywgZW5hYmxlKTtcblxuICAgICAgICBtZXRob2QgKz0gJ2QnO1xuICAgICAgICB0aGlzW21ldGhvZF0uY2FsbCh0aGlzLCB0YWIsIGZvbGRlcik7XG4gICAgfVxufVxuXG4vKipcbiAqIEB0eXBlZGVmIHRhYkV2ZW50XG4gKiBAdHlwZSB7ZnVuY3Rpb259XG4gKiBAcGFyYW0ge3RhYkV2ZW50T2JqZWN0fVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYgdGFiRXZlbnRPYmplY3RcbiAqIEBwcm9wZXJ0eSB7VGFien0gdGFieiAtIFRoZSB0YWIgb2JqZWN0IGlzc3VpbmcgdGhlIGNhbGxiYWNrLlxuICogQHByb3BlcnR5IHtFbGVtZW50fSB0YXJnZXQgLSBUaGUgdGFiIChgPGhlYWRlcj5gIGVsZW1lbnQpLlxuICovXG5cbi8qKlxuICogQ2FsbGVkIGJlZm9yZSBhIHByZXZpb3VzbHkgZGlzYWJsZWQgdGFiIGlzIGVuYWJsZWQuXG4gKiBAdHlwZSB7dGFiRXZlbnR9XG4gKiBAYWJzdHJhY3RcbiAqIEBtZW1iZXJPZiBUYWJ6LnByb3RvdHlwZVxuICovXG5UYWJ6LnByb3RvdHlwZS5vbkVuYWJsZSA9IG5vb3A7XG5cbi8qKlxuICogQ2FsbGVkIGJlZm9yZSBhIHByZXZpb3VzbHkgZW5hYmxlZCB0YWIgaXMgZGlzYWJsZWQgYnkgYW5vdGhlciB0YWIgYmVpbmcgZW5hYmxlZC5cbiAqIEB0eXBlIHt0YWJFdmVudH1cbiAqIEBhYnN0cmFjdFxuICogQG1lbWJlck9mIFRhYnoucHJvdG90eXBlXG4gKi9cblRhYnoucHJvdG90eXBlLm9uRGlzYWJsZSA9IG5vb3A7XG5cbi8qKlxuICogQ2FsbGVkIGFmdGVyIGEgcHJldmlvdXNseSBkaXNhYmxlZCB0YWIgaXMgZW5hYmxlZC5cbiAqIEB0eXBlIHt0YWJFdmVudH1cbiAqIEBhYnN0cmFjdFxuICogQG1lbWJlck9mIFRhYnoucHJvdG90eXBlXG4gKi9cblRhYnoucHJvdG90eXBlLm9uRW5hYmxlZCA9IG5vb3A7XG5cbi8qKlxuICogQ2FsbGVkIGFmdGVyIGEgcHJldmlvdXNseSBlbmFibGVkIHRhYiBpcyBkaXNhYmxlZCBieSBhbm90aGVyIHRhYiBiZWluZyBlbmFibGVkLlxuICogQHR5cGUge3RhYkV2ZW50fVxuICogQGFic3RyYWN0XG4gKiBAbWVtYmVyT2YgVGFiei5wcm90b3R5cGVcbiAqL1xuVGFiei5wcm90b3R5cGUub25EaXNhYmxlZCA9IG5vb3A7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fSAvLyBudWxsIHBhdHRlcm5cblxuZnVuY3Rpb24gZm9yRWFjaEVsKHNlbGVjdG9yLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKChjb250ZXh0IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSwgaXRlcmF0ZWUpO1xufVxuXG5cbnJldHVybiAgVGFiejtcblxufSkoKTtcbiJdfQ==
