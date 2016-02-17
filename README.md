# tabz
Easy hierarchial HTML folder tabs.

### Usage

##### Flat

A 2-tab tab bar with the first tab enabled:

```html
<div class="tabz">

    <header class="tabz-enable">Tab A</header>
    <section class="tabz-enable">Content A</section>

    <header id="click-me">Tab B</header>
    <section>Content B</section>

</div>
```
Make this call once after page loaded:

```javascript
tabz();
```

##### Switch to a tab programmatically

To trigger a tab, you can call `tabz()` with the tab's `<header>` elemment:

```javascript
tabz(document.getElementById('click-me'));
```

##### Hierarchical

A 2-tab tab bar nested within the 2nd tab of another 2-tab tab bar.

```html
<div class="tabz">

    <header>Tab A</header>
    <section>Content A</section>

    <header class="tabz-enable">Tab B</header>
    <section class="tabz-enable">
        Content B
        <div class="tabz">

            <header>Tab B.1</header>
            <section>Content B.1</section>

            <header class="tabz-enable">Tab B.2</header>
            <section>Content B.2</section>

        </div>
    </section>
</div>
```

### Options

```javascript
tabz( container, register )
```

`container` - optional - defaults to `document` - Where to look for `div.tabz` elements. Alternatively, this can be a `<header>` element to simulate a click on.

`register` - optional - defaults to `true` - Whether to register or deregister.

### Demo

A demo can be found [here](http://joneit.github.io/tabz/demo.html).

### CDN versions

To use in a browser, you have two options:

1. Incorporate the node module into your own browserified project.
2. Use the browserified versions [`tabz.js`](http://joneit.github.io/tabz/tabz.js) or [`tabz.min.js`](http://joneit.github.io/tabz/tabz.min.js) available on the Github pages CDN.
