# cypress-fail-on-console-error

[![npm](https://img.shields.io/npm/v/cypress-fail-on-console-error)](https://www.npmjs.com/package/cypress-fail-on-console-error)
[![CI](https://github.com/nils-hoyer/cypress-fail-on-console-error/actions/workflows/ci.yml/badge.svg)](https://github.com/nils-hoyer/cypress-fail-on-console-error/actions/workflows/ci.yml)
[![Sponsor](https://img.shields.io/github/sponsors/nils-hoyer?label=Sponsor&logo=GitHub)](https://github.com/sponsors/nils-hoyer)

Fail Cypress tests when the application under test calls `console.error()`. Set up once in your support file, it checks every test for errors that your app or third-party scripts catch and only log, which Cypress doesn't fail on. Works for e2e and component tests.

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

When the application calls `console.error()`, the test fails after the current command:

<img src="./docs/commandLog.png" width="448" alt="A console.error in the Cypress command log and the failed test's error">

## Configuration

| Option                  | Default     | Description |
| ----------------------- | ----------- | ----------- |
| `ignoreConsoleMessages` | `[]`        | Console messages that don't fail a test, see [Matching messages](#matching-messages). |
| `consoleTypes`          | `['error']` | Console methods that fail a test: `error`, `warn`, `info`, `debug`, `trace`, `table`, `log` or `assert`. |
| `debug`                 | `false`     | Also logs each message that `ignoreConsoleMessages` ignores, with the entry that matched it. See [Debugging](#debugging). |

```ts
import failOnConsoleError, { type Config } from 'cypress-fail-on-console-error';

const config: Config = {
    ignoreConsoleMessages: [
        'ResizeObserver loop',
        'unique "key" prop',
        { type: 'warn', message: 'is deprecated' }, // only for console.warn
    ],
    consoleTypes: ['error', 'warn'],
};

failOnConsoleError(config);
```

To fail only on messages that contain some text, ignore every message that doesn't contain it:

```ts
failOnConsoleError({
    // ignore every message that doesn't contain React
    ignoreConsoleMessages: [/^(?![\s\S]*React)/],
});
```

### Matching messages

An entry is a `string`, a `RegExp`, or `{ type, message }`, which only ignores calls of that console method. A message that matches any entry is ignored.

- A string or `RegExp` matches anywhere in the message. Strings are converted with `new RegExp(string)`, so [escape special characters](https://javascript.info/regexp-escaping).
- The message is all arguments of the console call, joined with spaces. Objects are converted to JSON: `console.error('Failed to load user', { id: 42 })` becomes `Failed to load user {"id":42}`.
- An `Error` becomes its name, message and stack trace, such as `TypeError: user is undefined` followed by lines like `at render (app.js:12:5)`, so you can also match the file an error came from.

## Ignoring messages in one test

To change the ignored messages in a test, register the commands in your support file:

```ts
import failOnConsoleError, {
    addIgnoredConsoleMessagesCommands,
} from 'cypress-fail-on-console-error';

const failOnConsole = failOnConsoleError(config);
addIgnoredConsoleMessagesCommands(failOnConsole);
```

Then use them in a test. Changes last until the end of the test.

```ts
it('should show the page without recommendations', () => {
    cy.addIgnoredConsoleMessages(['Failed to load recommendations']);
    cy.visit('/');
});
```

| Command                                                   | Description |
| --------------------------------------------------------- | ----------- |
| `cy.getIgnoredConsoleMessages()`                          | Yields `ignoreConsoleMessages`. |
| `cy.setIgnoredConsoleMessages(['ResizeObserver loop'])`   | Replaces `ignoreConsoleMessages`. |
| `cy.addIgnoredConsoleMessages(['is deprecated'])`         | Adds to `ignoreConsoleMessages`. |
| `cy.deleteIgnoredConsoleMessages(['ResizeObserver loop'])` | Removes from `ignoreConsoleMessages`. |

To change `consoleTypes` or `debug` in a test, use `getConfig()` and `setConfig()`, which `failOnConsoleError()` returns:

```ts
import { type ConsoleType } from 'cypress-fail-on-console-error';

const { getConfig, setConfig } = failOnConsole;

Cypress.Commands.add('setConsoleTypes', (consoleTypes: ConsoleType[]) =>
    setConfig({ ...getConfig(), consoleTypes })
);

declare global {
    namespace Cypress {
        interface Chainable {
            setConsoleTypes(consoleTypes: ConsoleType[]): Chainable<void>;
        }
    }
}
```

## Debugging

Click a `console.error` entry in the command log to print the original arguments and the message your `ignoreConsoleMessages` were matched against to the browser console.

Set `debug: true` to also log each ignored message, with the entry that matched it:

```ts
failOnConsoleError({
    ignoreConsoleMessages: ['ResizeObserver loop'],
    debug: true,
});
```

<img src="./docs/debugTrue.png" width="448" alt="An ignored console.error and a failing one in the Cypress command log">

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
