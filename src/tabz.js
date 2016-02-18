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
    root = root || document;
    register = register === undefined || register;

    if (register) {
        var css;
        /* inject:css */
        /* endinject */
        cssInjector(css, 'tabz-css-base', referenceElement || document.querySelector('head style'));

        this.root = root;

        var defaultTab = (
            root.querySelector('.tabz > header#default-tab') ||
            root.querySelector('.tabz > header')
        );

        if (defaultTab) {
            this.tabTo(defaultTab);
        }
    }

    var method = register ? 'addEventListener' : 'removeEventListener';
    var collection = root.querySelectorAll('.tabz');
    for (var i = 0; i < collection.length; ++i) {
        var el = collection[i];
        el.style.visibility = 'visible';
        el[method]('click', onclick);
    }
}

Tabz.prototype.tabTo = function (tabElt) {
    if (!(tabElt instanceof Element)) {
        tabElt = this.root.querySelector(tabElt);
    }
    while (tabElt && tabElt.tagName === 'HEADER') {
        click(tabElt.parentElement, tabElt);

        // loop to click on containing tabs...
        tabElt = tabElt.parentElement.parentElement;
        if (tabElt.tagName === 'SECTION') {
            tabElt = tabElt.previousElementSibling;
        }
    }
};

function click(div, tab) {
    var result, i, el, clickInTab, enable,
        collection = div.querySelectorAll(':scope>header,:scope>header+section');

    for (i = 0; i < collection.length; ++i) {
        el = collection[i];
        clickInTab = el.contains(tab);
        enable = clickInTab || el.previousElementSibling && el.previousElementSibling.contains(tab);
        el.classList.toggle('tabz-enable', enable);
        result = result || clickInTab;
    }

    return result;
}

function onclick(evt) {
    if (click(this, evt.target)) {
        evt.stopPropagation();
    }
}

module.exports = Tabz;
