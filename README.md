# tabz
Easy hierarchial HTML folder tabs.

### Demo

A demo can be found [here](http://joneit.github.io/tabz/demo.html).

### Usage

###### Flat

A 2-tab tab panel with the first tab enabled:

```html
<div class="tabz">

    <header>Tab A</header>
    <section>Content A</section>

    <header id="click-me">Tab B</header>
    <section>Content B</section>

</div>
```

###### Hierarchical

A 2-tab tab panel nested within the 2nd tab of another 2-tab tab panel.

```html
<div class="tabz">

    <header>Tab A</header>
    <section>Content A</section>

    <header>Tab B</header>
    <section>
        Content B
        <div class="tabz">

            <header>Tab B.1</header>
            <section>Content B.1</section>

            <header>Tab B.2</header>
            <section>Content B.2</section>

        </div>
    </section>
</div>
```

The following, called after page load, will instantiate an single object to service all the `.tabz` panels above.

```javascript
var Tabz = require('tabz');
var tabz = new Tabz();
```

Alternatively, you could instantiate separate objects for specific panels or sets of panels.

In any case, the first tab of each `.tabz` panel will be enabled by default. See option `defaultTabSelector` (below) to override this.

###### Switch to a tab programmatically

To trigger a tab, you can call the `.tabTo()` method with the tab's `<header>` element or a selector that resolves to it:

```javascript
tabz.tabTo('#click-me');
```

###### Query currently selected tab

To find out which tab in a panel is the currently selected tab, call the following with the panel element (or any element within it):

```javascript
var enabledTab = tabz.enabled(element); // returns the tab (`<header>`) element
```

###### Callbacks

There are callbacks for each of the following events:

```javascript
`tabz.onDisable = function(tab, folder) { ... }` // called before a previously enabled tab is disabled
`tabz.onEnable = function(tab, folder) { ... }` // called before a previously disabled tab is enabled
`tabz.onDisabled = function(tab, folder) { ... }` // called after a previously enabled tab is disabled
`tabz.onEnabled = function(tab, folder) { ... }` // called after a previously disabled tab is enabled

The calling context for each of these (the `.this` value) is `tabz`.

### CSS included

[The stylesheet](https://github.com/joneit/tabz/blob/master/src/tabz.css) is baked into the code and is programmatically injected into the DOM with the id _tabz-css-base_. You have control of where to place it with the `referenceElement` parameter.

The default color for a tab is white. The stylesheet includes six pastel colors in selectors .tabz-bg1 through .tabz-bg6. If you want to use these, reference them from both the tab _and_ the folder (`<header>` and `<section>`) elements.

### Hints

Set `visibility:hidden` in the `style` attribute of your root tab bar div so it won't be visible before the stylesheet loads.

You will probably need to adjust the dimensions of your sections. Adjust the `width` and `height` properties using the `.tabz > header + section` selector. Nested tabs will need their own dimensions.

For example, you can find the following on the [demo page](https://github.com/joneit/tabz/blob/master/build/demo.html).

```css
.tabz {
    visibility:hidden;
}
.tabz > header + section {
    width: 300px;
    height: 350px;
}
.tabz > header + section >
.tabz > header + section {
    width: 280px;
    height: 295px;
}
```

### Initialization options

```javascript
var tabz = new Tabz( options )
```

`options.root` - Where to look for `.tabz` panels. Defaults to `document`.

`options.unhook` - Skip normal initialization and just remove event listener from `.tabz` elements. Defaults to `false`.

`options.referenceElement` - Explicitly position `<style>` element before this element. Default position is in `<head>`, before the first `<link rel="stylesheet">` or `<style>` element, if any; otherwise at the end of `<head>`.

`defaultTabSelector` - A .classname or #id of the tab(s) to select by default. This string is appended to `.tabz > header` to ensure only one of our tabs is selected. Defaults to `'.default-tab'`.

### Events

Not events really, but callbacks:

* `tabz.tabEnabled(tabEvent)` - Called when a previously disabled tab is enabled. 

* `tabz.tabDisabled(tabEvent)` - Called when a previously enabled tab is disabled by another tab being enabled.

Both of the above are called with a `tabEvent` which is:

```javascript
{
    target: tab, // the <header> HTMLElement of the tab in question
    id: id // the string id of the tab (form the id attribute of the above HTMLElement)
}
```

### Acceptance Testing

* Chromium 40.0.2214.91
* Chrome 48.0.2564.109
* Safari 9.0.3
* Firefox 44.0.2

### CDN versions

To use in a browser, you have two options:

1. Incorporate the node module into your own browserified project.
2. Use the browserified versions [`tabz.js`](http://joneit.github.io/tabz/tabz.js) or [`tabz.min.js`](http://joneit.github.io/tabz/tabz.min.js) available on the Github pages CDN.
