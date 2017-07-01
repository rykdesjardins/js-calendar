# CONTRIBUTING

## Reporting an issue / requesting a feature
Simply use the Github built-in issue reporting system.

## Contributing code
Please use pull requests. It's a lot easier to maintain afterwards.

## Setting up a test environment
First clone the repo using `git clone https://github.com/rykdesjardins/js-calendar`. Make sure you have git installed.

You will find directly in the root directory an `html` file labelled `example.html`. 
Opening this should display a nicely preconfigured JSCalendar instance.

The main JS file is located under `./dev/js-calendar.js`. 
It is using ES6, so you might need to use babel before being able to test in a browser. I used babel with the `es2015` preset to build into `./dist/js-calendar.js`.

You can find all the documentation including hooks, static and instance methods in the README.md file.

## Let's keep this dependency free
The idea behind this project is also to have a pure vanilla JS library. For your convenience, you can use the `_a` function.
It acts as a small wrapper around `document.createElement`. 

```javascript
/*
  elementType : string, represents the tag name (div, span, ...)
  cssClasses : string, a space-separated list of css classes
  parentElem : HTMLElement, if specified, the newly created element will be appended user the parent.
  
  The function returns the newly created element.
*/
var _a = function(elementType, cssClasses, parentElem) {
    let elem = document.createElement(elementType);
    elem.className = cssClasses || "";
    parentElem && parentElem.appendChild(elem);
    return elem;
}
```
