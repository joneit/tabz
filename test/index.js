'use strict';

/* global describe, it, beforeEach */

require('should'); // extends Object with `should`

var Element = global.Element = function() { this.children = []; };
Element.prototype = {
    classList: {
        add: nullfunc
    },
    previousElementSibling: new Element(),
    getElementsByTagName: function() {
        return [];
    },
    querySelector: function() {
        return null;
    },
    querySelectorAll: function() {
        return [];
    },
    appendChild: function(elt) {
        this.children.push(elt);
    },
    insertBefore: function(elt) {
        this.children.push(elt);
    }
};
var document = global.document = new Element();
document.head = new Element();
document.createElement = document.createTextNode = function() { return new Element(); };

var Tabz = require('../src/tabz.js');

function nullfunc() {}

describe('require() returns an object that', function() {
    it('is a function', function() {
        Tabz.should.be.a.Function();
    });
});
