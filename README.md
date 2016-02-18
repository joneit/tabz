# tabz
Easy hierarchial HTML folder tabs.

### Demo

A demo can be found [here](http://joneit.github.io/tabz/demo.html).

### Usage

###### Flat

A 2-tab tab bar with the first tab enabled:

```html
<div class="tabz">

    <header>Tab A</header>
    <section>Content A</section>

    <header id="click-me">Tab B</header>
    <section>Content B</section>

</div>
```
Make this call once after page loaded:

```javascript
var Tabz = require('tabz');
var tabz = new Tabz();
```

###### Switch to a tab programmatically

To trigger a tab, you can call the `.tabTo()` method with the tab's `<header>` element or a selector that resolves to it:

```javascript
tabz.tabTo('#click-me');
```

###### Hierarchical

A 2-tab tab bar nested within the 2nd tab of another 2-tab tab bar.

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
var tabz = new Tabz( container, register, referenceElement )
```

`container` - optional
Where to look for `.tabz` elements. Defaults to `document`.

`register` - optional
Whether to register or deregister. Defaults to `true`.

`referenceElement` - optional
Explicitly position `<style>` element before this element. Default position is in `<head>`, before the first `<link rel="stylesheet">` or `<style>` element, if any; otherwise at the end of `<head>`.

### CDN versions

To use in a browser, you have two options:

1. Incorporate the node module into your own browserified project.
2. Use the browserified versions [`tabz.js`](http://joneit.github.io/tabz/tabz.js) or [`tabz.min.js`](http://joneit.github.io/tabz/tabz.min.js) available on the Github pages CDN.
