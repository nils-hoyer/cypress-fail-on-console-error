# cypress-fail-on-console-error

### Installation

`npm install cypress-fail-on-console-error --save-dev`

### Usage

cypress.json

```
{
    ...
    "env": {
        "failOnConsoleError": true
    }
}
```

use `excludeMessages?:[string]` to exclude console.error messages by regex from throwning assertionError.

```
{
    ...
    "env": {
        "failOnConsoleError": {
            "excludeMessages": ["foo", "^bar-regex.*$"]
        }
    }
}
```

cypress/support/index.ts

```
import failOnConsoleError from 'cypress-fail-on-console-error'

failOnConsoleError();
```

### Backlog

1. whitelist console levels (log, info, debug, warn, error)
