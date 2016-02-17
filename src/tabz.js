// tabz node module
// https://github.com/joneit/tabz

/* eslint-env node, browser */

'use strict';

var cssInjector = require('css-injector');

var root;

var css;
/* inject:css */
/* endinject */

cssInjector(css, 'tabz-css-base');

/**
 * Register/deregister click handler on all tab collections.
 * @param {Element} [elt=document] - Containing element of tabs and folders (`<header>` and `<section>` elements, respectively).
 * @param {boolean} [register=true] - When `elt` is not a `<header>` element, add or remove event listener to or from `div.tagz` elements.
 */
function init(elt, register) {
    if (!(elt instanceof Element)) {
        register = elt;
        elt = document;
    }

    register = register === undefined || register;

    var i, collection,
        method = register ? 'addEventListener' : 'removeEventListener';

    root = elt;

    collection = elt.querySelectorAll('div.tabz');
    for (i = 0; i < collection.length; ++i) {
        collection[i][method]('click', onclick);
    }

    collection = elt.querySelectorAll('div.tabz > header#default-tab');
    for (i = 0; i < collection.length; ++i) {
        tabTo(collection[i]);
    }
}

function tabTo(tabElt) {
    if (!(tabElt instanceof Element)) {
        tabElt = root.querySelector(tabElt);
    }
    while (tabElt && tabElt.tagName === 'HEADER') {
        click(tabElt);

        // loop to click on containing tabs...
        tabElt = tabElt.parentElement.parentElement;
        if (tabElt.tagName === 'SECTION') {
            tabElt = tabElt.previousElementSibling;
        }
    }
}

function click(tab) {
    var i, el, enable,
        collection = tab.parentElement.querySelectorAll(':scope>header,:scope>header+section');

    for (i = 0; i < collection.length; ++i) {
        el = collection[i];
        enable = el.contains(tab) ||
            el.previousElementSibling && el.previousElementSibling.contains(tab);
        el.classList.toggle('tabz-enable', enable);
    }
}

function onclick(evt) {
    click(evt.target);
    evt.stopPropagation();
}


module.exports = {
    init: init,
    tabTo: tabTo
};
