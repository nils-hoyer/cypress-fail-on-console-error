# cypress-fail-on-console-error

[![npm](https://img.shields.io/npm/v/cypress-fail-on-console-error)](https://www.npmjs.com/package/cypress-fail-on-console-error)
[![CI](https://github.com/nils-hoyer/cypress-fail-on-console-error/actions/workflows/ci.yml/badge.svg)](https://github.com/nils-hoyer/cypress-fail-on-console-error/actions/workflows/ci.yml)

Fail Cypress tests when the application under test calls `console.error()`.

The plugin spies on the `console` of the application's [window object](https://developer.mozilla.org/en-US/docs/Web/API/Window). It watches `console.error` by default, and you can configure other console methods too. When a watched method is called with a message that you haven't excluded, the test fails with an `AssertionError`. It works for e2e and component tests.

To fail tests on network errors, see [cypress-fail-on-network-error](https://www.npmjs.com/package/cypress-fail-on-network-error).

## Installation

```sh
npm install cypress-fail-on-console-error --save-dev
```

## Usage

Call `failOnConsoleError()` in your support file: `cypress/support/e2e.js` for e2e tests, `cypress/support/component.js` for component tests, or the `.ts` versions of these files.

```js
import failOnConsoleError from 'cypress-fail-on-console-error';

failOnConsoleError();
```

## Config (optional)

| Parameter         | Default     | Description |
| ----------------- | ----------- | ----------- |
| `consoleMessages` | `[]`        | Console messages to ignore, as `string` or `RegExp`. Strings are converted with `new RegExp(string)`, so [escape special characters](https://javascript.info/regexp-escaping). A string that isn't a valid regular expression throws an error when the config is set. Messages are matched with [`RegExp.test()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test). |
| `consoleTypes`    | `['error']` | Console methods to watch: `error`, `warn`, `info`, `debug`, `trace` or `table`. |
| `debug`           | `false`     | Log how each console message was matched to the Cypress command log. See [Debugging](#debugging). |

```ts
import failOnConsoleError, { Config } from 'cypress-fail-on-console-error';

const config: Config = {
    consoleMessages: [
        'foo',
        /^bar-regex.*/,
        // ignore every message that does not contain 'include-console-messages'
        /^((?!include-console-messages).)*$/,
    ],
    consoleTypes: ['error', 'warn'],
};

failOnConsoleError(config);
```

### How messages are matched

- All arguments of a console call are joined with spaces into one message. Non-string arguments are converted with `JSON.stringify`. For example, `console.error('failed', 1, { foo: 'bar' })` becomes `failed 1 {"foo":"bar"}`. Circular references become `"[Circular]"` and BigInts become `"10n"`.
- If an argument is an `Error`, its name, message and stack trace are used, so your patterns can match the error name, the message or the file it came from.
- The plugin checks after each Cypress command. The test fails with `cypress-fail-on-console-error:` followed by the first message that none of the `consoleMessages` patterns matched.

## Set config from a Cypress test

`failOnConsoleError()` returns `getConfig()` and `setConfig()`, which let you change the config inside a test. After each test, the config goes back to the one passed to `failOnConsoleError()`.

```ts
import failOnConsoleError, {
    ConsoleMessage,
} from 'cypress-fail-on-console-error';

const { getConfig, setConfig } = failOnConsoleError(config);

Cypress.Commands.addAll({
    getConsoleMessages: () => cy.wrap(getConfig()?.consoleMessages),
    setConsoleMessages: (consoleMessages: ConsoleMessage[]) =>
        setConfig({ ...getConfig(), consoleMessages }),
});
```

```ts
describe('example test', () => {
    it('should set console messages', () => {
        cy.setConsoleMessages(['foo', 'bar']);
        cy.visit('...');
    });
});
```

This repository's own tests show a complete example, with TypeScript declarations and commands to add and remove messages: see the [commands](./cypress/support/commands.ts) and the [spec that uses them](./cypress/e2e/shouldFailOnConsoleErrorFromSetConfig.cy.ts).

> [!NOTE]
> Spies for `consoleTypes` are attached when a page loads in e2e tests and once per spec file in component tests. In e2e tests, call `setConfig()` with new `consoleTypes` before `cy.visit()`. In component tests, `setConfig()` can't change which console methods a running spec watches.

## Debugging

Set `debug: true` to log each match between a console message and your `consoleMessages` to the Cypress command log. Click an entry to print its details to the browser console. You can use this to check your patterns and to see the error message a test would fail with.

![Debug output in the Cypress command log](./docs/debugTrue.png)

## Contributing

1. Open an issue that describes the problem and the expected behaviour.
2. Install dependencies with `npm ci`. The e2e and component tests run Cypress in Chrome, so Chrome must be installed.
3. Make your change in `src/index.ts` and run `npm run build`. The tests run against `dist/`, which is committed.
4. Run `npm run verify` (build, type check, format check, unit, e2e and component tests). It must pass.
5. Open a PR with the implementation and tests.
