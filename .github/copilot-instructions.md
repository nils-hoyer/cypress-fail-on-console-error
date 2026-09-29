# Copilot instructions

## Project

`cypress-fail-on-console-error` is a small Cypress plugin published to npm. Users call `failOnConsoleError(config)` from a Cypress support file. The plugin spies on `window.console` of the application under test and fails the running test with a chai `AssertionError` when a watched console method is called with a message that the config does not exclude. It supports e2e and component testing.

The whole plugin lives in `src/index.ts`. Keep it a single file, and keep runtime `dependencies` limited to `chai`, `sinon`, `sinon-chai` and `type-detect`, because every dependency ships to every user.

## How it works

- `failOnConsoleError(config)` validates the config (`validateConfig`), fills in defaults (`createConfig`), registers Cypress event handlers and returns `{ getConfig, setConfig }`.
- `createSpies` attaches a sinon spy for each entry in `consoleTypes`:
    - e2e: on every `window:before:load`
    - component: once per spec, in a root `before` hook via `cy.window()`
- On every `command:end`, `getConsoleMessageIncluded` checks the spies. `callToString` joins the arguments of each call with spaces. An argument with a `stack` (an `Error`) contributes its stack, and other non-strings go through `JSON.stringify`. The first message that no `consoleMessages` pattern matches is thrown as `AssertionError('cypress-fail-on-console-error:\n<message>')`. Spy history is reset after every check.
- On `test:after:run`, spies are reset and the config is restored to the one passed at setup, so `setConfig()` changes last for one test only.
- `consoleMessages` is an exclude list. Strings become `new RegExp(string)` without escaping, and matching uses `RegExp.test()`.
- With `debug: true`, `cypressLogger` writes each matching decision to the Cypress command log.
- A `consoleTypes` change made through `setConfig()` only takes effect when spies are next created. In e2e that happens on the next page load. In component mode it doesn't happen again within the current spec.

## Public API

The default export `failOnConsoleError`, the types `Config`, `ConsoleType` and `ConsoleMessage`, and the `{ getConfig, setConfig }` return shape are public API. A breaking change to any of them needs a major version bump. The helper functions (`validateConfig`, `createConfig`, `createSpies`, `resetSpies`, `getConsoleMessageIncluded`, `findConsoleMessageIncluded`, `isConsoleMessageExcluded`, `callToString`, `cypressLogger`) are exported so the unit tests can import them.

When you add or change a config option or public function, update `README.md` too.

## Repository layout

- `src/index.ts`: the plugin source
- `dist/`: compiled output, **committed to git** and published to npm. Rebuild with `npm run build` and commit `dist/` together with any change to `src/`.
- `test/unit.test.ts`: Vitest unit tests for the helper functions
- `test/e2e.test.ts`, `test/component.test.ts`: Vitest tests that run `cypress run` as a child process and assert on its stdout (pass/fail counts and error text)
- `cypress/e2e/*.cy.ts`, `cypress/component/*.cy.ts`: the Cypress specs run by those tests
- `cypress/fixtures/*.html`: pages that write to the console, visited by e2e specs
- `cypress/component/customComponents.ts`: web components that write to the console, mounted by component specs
- `cypress/support/commands.ts`: registers the plugin with the shared test config and adds the custom commands that specs use (`getConfig`, `setConfig`, `getConsoleMessages`, `setConsoleMessages`, `addConsoleMessages`, `deleteConsoleMessages`)

## Commands

- `npm ci`: install dependencies
- `npm run build`: delete `dist/` and compile with `tsc`
- `npm run lint`: type-check `src`, `test` and `cypress`
- `npm run test:ut`: unit tests (fast, no browser)
- `npm run test:e2e`, `npm run test:cmp`: Cypress e2e and component runs (slow, need Chrome)
- `npm run prettier`: format all files; `npm run ci:prettier` only checks formatting
- `npm run verify`: build, lint, format check and all tests. It must pass before a PR.

**All tests import from `dist/`, not `src/`.** Run `npm run build` before running tests, or they run stale code.

CI (`.github/workflows/ci.yml`) runs the build, the Prettier check and all three test suites on Node LTS. It does not run `npm run lint`, so run it locally.

## Adding or changing behaviour

1. Change `src/index.ts`.
2. Add or update unit tests in `test/unit.test.ts` for each helper you touch.
3. For behaviour that shows up in a real Cypress run, add:
    - an HTML fixture in `cypress/fixtures/` (e2e) or a web component in `cypress/component/customComponents.ts` (component)
    - a spec in `cypress/e2e/` or `cypress/component/`, named after the expected outcome (`shouldFailOn…`, `shouldPassOn…`, `shouldReset…`)
    - a case in `test/e2e.test.ts` or `test/component.test.ts` that runs the spec and asserts on stdout, for example `'1 of 1 failed'`, `/Failing:.*1/` or the expected error message

    If a feature applies to both testing types, cover both.

4. Specs run with the shared config from `cypress/support/commands.ts`. It excludes `/firstErrorExcluded.*/`, `'secondErrorExcluded'` and `'thirdErrorExcluded.*consoleError.*'`, and it watches `error` and `warn`. Name fixture messages so they match or miss those patterns on purpose.
5. Run `npm run build`, then `npm run verify`.

## Code style

- TypeScript in `strict` mode, ES modules (`"type": "module"`).
- Prettier: 4-space indent, single quotes, semicolons, `trailingComma: 'es5'`, LF line endings. Run `npm run prettier` instead of formatting by hand.
- Helpers are exported arrow functions (`export const name = (...) => ...`). The entry point is the default-exported `function failOnConsoleError`.
- Test names follow `WHEN <condition> THEN <expected result>`.
- Use chai assertions and sinon spies, like the existing code and tests.
