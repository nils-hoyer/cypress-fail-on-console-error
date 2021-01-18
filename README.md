# cypress-fail-on-console-error

Cypress Plugin to observe for console errors which causes the cypress test to fail.

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

```js
const config: Config = {
    excludeMessages: ['foo', '^bar-regex.*$'],
    // prettier-ignore
    includeConsoleTypes: [
        Console.ERROR, 
        ConsoleType.WARN, 
        ConsoleType.INFO
    ],
};

failOnConsoleError(config);
```
