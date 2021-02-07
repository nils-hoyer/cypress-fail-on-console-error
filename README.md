# cypress-fail-on-console-error

Fail cypress test on console error.

### Installation

```
npm install cypress-fail-on-console-error --save-dev
```

### Usage

`cypress/support/index.ts`

```js
import failOnConsoleError from 'cypress-fail-on-console-error';

failOnConsoleError();
```

### Config (optional)

| Parameter             | Default               | Description                                             |
| --------------------- | --------------------- | ------------------------------------------------------- |
| `excludeMessages`     | `undefined`           | Exclude console messages from throwing `assertionError` |
| `includeConsoleTypes` | `[ConsoleType.ERROR]` | Include console types for observation                   |

<br/>

<!-- prettier-ignore -->
```js
import failOnConsoleError, { consoleType } from 'cypress-fail-on-console-error';

    includeConsoleTypes: [
        consoleType.ERROR,
        consoleType.WARN,
        consoleType.INFO,
    ],
};

failOnConsoleError(config);

```

Javascript user can pass enum values instead

```js
failOnConsoleError({
    includeConsoleTypes: [1, 2],
});

// 0 = INFO
// 1 = WARN
// 2 = ERROR
```
