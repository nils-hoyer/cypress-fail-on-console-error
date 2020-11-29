# cypress-fail-on-console-error

### Installation
`npm i cypress-fail-on-console-error`

### Usage
cypress.json
```
"env": {
    "failOnConsoleError": true
  }
```

cypress/support/index.ts
```
import failOnConsoleError from 'cypress-fail-on-console-error'

failOnConsoleError()
```

### Backlog
1. whitelist console types (log, info, debug, warn, error)
2. blacklist console messages
3. create console type log files 
4. fail test or just create log entry
