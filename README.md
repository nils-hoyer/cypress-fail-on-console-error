# cypress-fail-on-console-error

Fail cypress test on console.error()

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

| Parameter             | Default               | Description                                                                                                               |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `excludeMessages`     | `undefined`           | Exclude console messages from throwing `assertionError` <br /> String parameter will be interpreted as regular expression |
| `includeConsoleTypes` | `[consoleType.ERROR]` | Include console types for observation                                                                                     |

<br/>

<!-- prettier-ignore -->
```js
import failOnConsoleError, { consoleType } from 'cypress-fail-on-console-error';

const config = {
    excludeMessages: ['foo', '^some bar-regex.*'],
    includeConsoleTypes: [
        consoleType.ERROR,
        consoleType.WARN,
        consoleType.INFO,
    ],
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
