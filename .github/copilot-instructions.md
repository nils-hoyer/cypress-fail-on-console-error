# Copilot instructions

## Project

`cypress-fail-on-console-error` is a small Cypress plugin published to npm. Users call `failOnConsoleError(config)` from a Cypress support file. The plugin spies on `window.console` of the application under test and fails the running test with a chai `AssertionError` when a watched console method is called with a message that the config does not exclude. It supports e2e and component testing.

The whole plugin lives in `src/index.ts`. Keep it a single file, and keep runtime `dependencies` limited to `chai`, `sinon`, `sinon-chai` and `type-detect`, because every dependency ships to every user.

## How it works

- `failOnConsoleError(config)` validates the config (`validateConfig`), fills in defaults (`createConfig`), registers Cypress event handlers and returns `{ getConfig, setConfig }`.
- `createSpies` attaches a sinon spy for each entry in `consoleTypes`:
    - e2e: on every `window:before:load`
    - component: once per spec, in a root `before` hook via `cy.window()`
- On every `command:end`, `getConsoleCalls` collects the calls of all spies in call order, and `checkConsoleCalls` keeps those that no pattern ignores (`findIgnoringConsoleMessage`). `callToString` joins the arguments of each call with spaces. An argument with a string `stack` (an `Error`) contributes its stack, with `Name: message` put in front when the stack lacks it (Firefox, WebKit). Other non-strings go through `JSON.stringify`, with circular references as `"[Circular]"` and BigInts as `"10n"`. If any calls are left, `consoleCallsToString` lists them one per line as `console.<type>: <message>`, and they are thrown as `AssertionError('cypress-fail-on-console-error:\n<lines>')`. Before that, `logConsoleCall` adds each of them to the command log, with the original arguments in `consoleProps`. The reporter renders log messages as Markdown, so `escapeMarkdown` escapes them. Spy history is reset after every check.
- On `test:after:run`, spies are reset and the config is restored to the one passed at setup, so `setConfig()` changes last for one test only.
- `ignoreConsoleMessages` lists the messages to ignore. Entries are a `string`, a `RegExp` or a `{ type, message }` object that only matches calls of that console method. `consoleMessages` is its deprecated old name: `createConfig` uses it over `ignoreConsoleMessages` when set, and `getConfig()` has a non-enumerable `consoleMessages` getter for the same array, so `{ ...getConfig() }` doesn't copy it. Both are removed in 6.0. `setConfig` compiles the patterns once with `compileConsoleMessages` into `{ consoleMessage, type, regExp }`, keeping the configured entry for the debug log: strings become `new RegExp(string)` without escaping, and `validateConfig` rejects strings that are not valid regular expressions. Matching uses `RegExp.test()` with `lastIndex` reset to 0, so `/g` and `/y` patterns match consistently.
- With `debug: true`, `logIgnoredConsoleCall` adds an `ignored` entry for each ignored call, with the pattern as configured (`consoleMessageToString`).
- `setConfig()` applies a `consoleTypes` change at once with `updateSpies`, on the console the spies were last created on: spies for types that stay watched are kept with their calls, spies for removed types are restored, and new types get new spies.

## Public API

The default export `failOnConsoleError`, the opt-in `addIgnoredConsoleMessagesCommands` with the command declarations in `declare global`, the types `Config`, `ConsoleType`, `ConsoleMessage` and `TypedConsoleMessage`, and the `{ getConfig, setConfig }` return shape are public API. A breaking change to any of them needs a major version bump. The helper functions (`validateConfig`, `createConfig`, `createSpies`, `updateSpies`, `resetSpies`, `getConsoleCalls`, `compileConsoleMessages`, `findIgnoringConsoleMessage`, `checkConsoleCalls`, `isSameConsoleMessage`, `consoleCallsToString`, `isConsoleMessageExcluded`, `callToString`, `escapeMarkdown`, `consoleMessageToString`, `logConsoleCall`, `logIgnoredConsoleCall`) are exported so the unit tests can import them.

When you add or change a config option or public function, update `README.md` too.

## Repository layout

- `src/index.ts`: the plugin source
- `dist/`: compiled output, **committed to git** and published to npm. Rebuild with `npm run build` and commit `dist/` together with any change to `src/`.
- `test/unit.test.ts`: Vitest unit tests for the helper functions
- `test/runCypress.ts`: runs all specs of one testing type in a single `cypress.run()` (Cypress's Node API) and returns each spec's tests with their state and error message
- `test/e2e.test.ts`, `test/component.test.ts`: Vitest tests that check each spec's results. The last test fails if a spec has no check.
- `cypress/e2e/*.cy.ts`, `cypress/component/*.cy.ts`: the Cypress specs run by those tests
- `cypress/fixtures/*.html`: pages that write to the console, visited by e2e specs
- `cypress/component/customComponents.ts`: web components that write to the console, mounted by component specs
- `cypress/support/commands.ts`: registers the plugin with the shared test config, adds the plugin's `getIgnoredConsoleMessages`, `setIgnoredConsoleMessages`, `addIgnoredConsoleMessages` and `deleteIgnoredConsoleMessages` commands with `addIgnoredConsoleMessagesCommands`, and adds `getConfig` and `setConfig` commands for the specs

## Commands

- `npm ci`: install dependencies
- `npm run build`: delete `dist/` and compile with `tsc`. `npm pack` and `npm publish` run it first through the `prepack` script.
- `npm run lint`: type-check `src`, `test` and `cypress`
- `npm run test:ut`: unit tests (fast, no browser)
- `npm run test:e2e`, `npm run test:cmp`: Cypress e2e and component runs (slow, need Chrome)
- `npm run prettier`: format all files; `npm run ci:prettier` only checks formatting
- `npm run verify`: build, lint, format check and all tests. It must pass before a PR.

**All tests import from `dist/`, not `src/`.** Run `npm run build` before running tests, or they run stale code.

CI (`.github/workflows/ci.yml`) runs the build, checks that the committed `dist/` matches it, then runs the type check, the Prettier check and all three test suites on Node LTS. A second job, `oldest-cypress`, runs the e2e and component tests with Cypress 14.0.0, the oldest supported version. It installs TypeScript 5 and Vite 6 for that run, because Cypress 14 supports neither TypeScript 7 nor Vite 7 and later.

Dependabot (`.github/dependabot.yml`) opens dependency updates once a month. `.github/workflows/dependabot-automerge.yml` waits for the CI run of a minor or patch update and merges it if CI passed. Major updates need a review. There are no required status checks on `main`, because they would block the Release workflow's push.

## Releasing

Releases are made by the Release workflow (`.github/workflows/release.yml`), which the maintainer starts from the Actions tab on `main` with `patch`, `minor` or `major`. It:

1. runs CI
2. runs `npm version`, which commits `Release <version>` and tags `<version>` (no `v` prefix), then pushes both to `main`
3. publishes to npm with trusted publishing (OIDC) from the `npm` environment, which only `main` may deploy to, so no npm token is stored in the repository
4. creates the GitHub release with notes generated from the pull requests since the previous release, grouped by `.github/release.yml`

Never change `version` in `package.json` or create tags in a pull request. If the publish job fails, use "Re-run failed jobs": it publishes the tag that was already pushed instead of increasing the version again.

## Adding or changing behaviour

1. Change `src/index.ts`.
2. Add or update unit tests in `test/unit.test.ts` for each helper you touch.
3. For behaviour that shows up in a real Cypress run, add:
    - an HTML fixture in `cypress/fixtures/` (e2e) or a web component in `cypress/component/customComponents.ts` (component)
    - a spec in `cypress/e2e/` or `cypress/component/`, named after the expected outcome (`shouldFailOn…`, `shouldPassOn…`, `shouldReset…`)
    - a case in `test/e2e.test.ts` or `test/component.test.ts` that lists every test of the spec with `passed(title)`, `failedOnConsole(title, message)` or `failed(title, error)`

    If a feature applies to both testing types, cover both.

4. Specs run with the shared config from `cypress/support/commands.ts`. It excludes `/firstErrorExcluded.*/`, `'secondErrorExcluded'` and `'thirdErrorExcluded.*consoleError.*'`, and it watches `error` and `warn`. Name fixture messages so they match or miss those patterns on purpose.
5. Run `npm run build`, then `npm run verify`.

## Code style

- TypeScript in `strict` mode, ES modules (`"type": "module"`).
- Prettier: 4-space indent, single quotes, semicolons, `trailingComma: 'es5'`, LF line endings. Run `npm run prettier` instead of formatting by hand.
- Helpers are exported arrow functions (`export const name = (...) => ...`). The entry point is the default-exported `function failOnConsoleError`.
- Test names follow `WHEN <condition> THEN <expected result>`.
- Use chai assertions and sinon spies, like the existing code and tests.
