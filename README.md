# cypress-fail-on-console-error

This Plugin observes `console.error()` function from [window object](https://developer.mozilla.org/de/docs/Web/API/Window). Cypress test will fail when the error function gets executed.

### Installation

```
npm install cypress-fail-on-console-error --save-dev
```

### Usage

`cypress/support/index.js`

```js
import failOnConsoleError from 'cypress-fail-on-console-error';

failOnConsoleError();
```

### Config (optional)

| Parameter             | Default               | Description                                                                                                                                                                                                                                   |
| --------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `excludeMessages`     | `undefined`           | Exclude console messages from throwing `AssertionError` <br /> When `console.error()` contains an error object from `new Error()`, then the whole stacktrace can be matched <br /> Regular expression parameters are acceptable. String parameters will be interpreted as regular expression. Be sure to [escape the string regular expression](https://javascript.info/regexp-escaping) for special characters. |
| `includeConsoleTypes` | `[consoleType.ERROR]` | Include console types for observation                                                                                                                                                                                                         |
| `cypressLog`          | `false`               | Include debug logs for `errorMessage_excludeMessage_match` and `errorMessage_excluded` to cypress runner                                                                                                                                      |

<br/>

<!-- prettier-ignore -->
```js
import failOnConsoleError, { consoleType } from 'cypress-fail-on-console-error';

const config = {
    excludeMessages: ['foo', /^some bar-regex.*/],
    includeConsoleTypes: [
        consoleType.ERROR,
        consoleType.WARN,
        consoleType.INFO,
    ],
    cypressLog: true,
};

failOnConsoleError(config);

// excludeMessages[0] matches example console message 'this is a foo message'
// excludeMessages[1] matches example console message 'some bar-regex message'
// includeConsoleTypes observe console types ERROR, WARN and INFO
```

Using Javascript, consoleType Enum can be parsed as number values

```js
failOnConsoleError({
    includeConsoleTypes: [0, 1, 2],
});

// 0 = INFO
// 1 = WARN
// 2 = ERROR
```
