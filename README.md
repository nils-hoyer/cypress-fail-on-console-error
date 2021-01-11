# cypress-fail-on-console-error

### Installation

```
npm install cypress-fail-on-console-error --save-dev
```

### Usage

`cypress/support/index.ts`

```js
import failOnConsoleError from 'cypress-fail-on-console-error'

failOnConsoleError();
```

### Config (optional)

Parameter | Default | Description
------ | ------- | -----------
`excludeMessages:string[]` | `undefined` | Exclude console messages from throwing `assertionError`
`includeConsoleTypes:ConsoleType[]` | `[ConsoleType.ERROR]` | Include console types

```js
const config:Config = {
    excludeMessages: ["foo", "^bar-regex.*$"],
    includeConsoleTypes: [Console.ERROR, ConsoleType.WARN, ConsoleType.INFO],
};

failOnConsoleError(config);
```
