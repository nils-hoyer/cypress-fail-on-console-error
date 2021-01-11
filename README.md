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

Config | Default | Description
------ | ------- | -----------
`excludeMessages:string[]` | `undefined` | Exclude console messages by regex from throwing `assertionError`
`includeConsoleTypes:ConsoleType[]` | `[ConsoleType.ERROR]` | Overwrite console types

```js
const config:Config = {
    excludeMessages: ["foo", "^bar-regex.*$"],
    includeConsoleTypes: [Console.ERROR, ConsoleType.WARN, ConsoleType.INFO],
};

failOnConsoleError(config);
```
