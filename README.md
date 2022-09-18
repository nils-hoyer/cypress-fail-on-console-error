# cypress-fail-on-console-error

This Plugin observes `console.error()` function from [window object](https://developer.mozilla.org/de/docs/Web/API/Window). Cypress test will fail when the error function gets executed.

### Installation

```
npm install cypress-fail-on-console-error --save-dev
```

### Usage

`cypress/support/e2e.js`

```js
import failOnConsoleError from 'cypress-fail-on-console-error';

failOnConsoleError();
```

### Config (optional)

| Parameter             | Default               | <div style="width:300px">Description</div>    |
|---                    |---                    |---                                            |
| `consoleMessages`     | `[]` | Exclude console messages from throwing `AssertionError`. Types RegExp and string are accepted. Strings will be converted to regular expression. [RegExp.test()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test?retiredLocale=de) will be used for console message matching. Make sure to [escape string / regular expression](https://javascript.info/regexp-escaping) for special characters. When console message property `stacktrace` exists, then the whole stacktrace can be matched. |
| `consoleTypes` | `[ConsoleType.ERROR]` | Define console types for observation. ERROR, WARN and INFO are accepted values.
| `cypressLog`          | `false`               | Enable debug logs for consoleMessage_configConsoleMessage_match and consoleMessage_excluded to cypress runner                                     

<br/>

```js
import failOnConsoleError, { ConsoleType, Config } from 'cypress-fail-on-console-error';

const config: Config = {
    consoleMessages: ['foo', /^some bar-regex.*/],
    consoleTypes: [
        ConsoleType.ERROR,
        ConsoleType.WARN,
        ConsoleType.INFO,
    ],
    debug: false,
};

failOnConsoleError(config);
```

Using Javascript, consoleType Enum can be parsed as number values

```js
failOnConsoleError({
    consoleTypes: [0, 1, 2],
});

// 0 = INFO
// 1 = WARN
// 2 = ERROR
```

### Set config from cypress test 
Use `failOnConsoleError` functions `getConfig()` and `setConfig()` with your own requirements. Detailed example implementation [cypress comands](https://github.com/nils-hoyer/cypress-fail-on-console-error/blob/56753cf3ff9222bb2c452304589ae0cfd5f85b46/cypress/support/e2e.ts#L14-L64) & [cypress test](https://github.com/nils-hoyer/cypress-fail-on-console-error/blob/123e251510045f2eb30c9ec2f6f247b77427d464/cypress/e2e/shouldFailOnConsoleErrorFromSetConfig.cy.ts#L1-L25). Note that the config will be resetted to initial config between tests.

```js
// Simple example implementation
const { getConfig, setConfig } = failOnConsoleError(config);

Cypress.Commands.addAll({
    getConsoleMessages: () => cy.wrap(getConfig().consoleMessages),
    setConsoleMessages: (consoleMessages: (string | RegExp)[]) => 
        setConfig({ ...getConfig(), consoleMessages });
```

```js
describe('example test', () => {
    it('should set console messages', () => {
        cy.setConsoleMessages(['foo', 'bar']);
        cy.visit('...');
    });
});
```


### Debugging 
When Cypress log is activated, debug information about the console messages / config console messages matching and excluding process are available from the cypress runner. As a plus, the generated error message string can be verified.
![image info](./docs/cypressLogTrue.png)

### Contributing
1. Create an project issue with proper description and expected behaviour
2. NPM command `npm run verify` have to pass locally
3. Provide a PR with implementation and tests 
