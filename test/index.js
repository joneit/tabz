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

var tabz = require('../src/tabz.js');

function nullfunc() {}

describe('require() returns an object that', function() {
    describe('has a method `init` that', function() {
        it('is a function', function() {
            tabz.init.should.be.a.Function();
        });
    });
    describe('has a method `tabTo` that', function() {
        it('is a function', function() {
            tabz.tabTo.should.be.a.Function();
        });
    });
});
