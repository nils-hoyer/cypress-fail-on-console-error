# cypress-fail-on-console-error

### Installation

`npm install cypress-fail-on-console-error --save-dev`

### Usage

cypress/support/index.ts

```
import failOnConsoleError from 'cypress-fail-on-console-error'

failOnConsoleError();
```

use `excludeMessages?:string[]` to exclude console.error messages by regex from throwning assertionError.

```
const config = {
    excludeMessages: ["foo", "^bar-regex.*$"]
};

failOnConsoleError(config);
```
