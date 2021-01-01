# cypress-fail-on-console-error

### Installation

`npm install cypress-fail-on-console-error --save-dev`

### Usage

cypress/support/index.ts

```
import failOnConsoleError from 'cypress-fail-on-console-error'

failOnConsoleError();
```

use `excludeMessages:string[]` to exclude console.error messages by regex from throwning assertionError. Default value is `undefined`.
use `includeConsoleTypes:ConsoleType[]` to include console types. Default value is `[ConsoleType.ERROR]`.

```
const config = {
    excludeMessages: ["foo", "^bar-regex.*$"],
    includeConsoleTypes: [Console.ERROR, ConsoleType.WARN, ConsoleType.INFO],
};

failOnConsoleError(config);
```
