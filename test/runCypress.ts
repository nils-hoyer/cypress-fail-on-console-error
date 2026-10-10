import cypress from 'cypress';
import { beforeAll } from 'vitest';

// VS Code sets ELECTRON_RUN_AS_NODE in its terminals, which stops the Cypress binary from starting
delete process.env.ELECTRON_RUN_AS_NODE;

export interface TestResult {
    title: string;
    state: string;
    // the error message without the stack trace, undefined for tests that didn't fail
    error?: string;
}

const errorMessage = (displayError: string | null): string | undefined =>
    displayError?.split(/\n\s+at /)[0];

/**
 * Runs all specs of a testing type in one Cypress run and returns
 * the results of each spec, keyed by its file name without `.cy.ts`.
 */
export async function runCypress(
    testingType: 'e2e' | 'component'
): Promise<Map<string, TestResult[]>> {
    const result = await cypress.run({
        testingType,
        browser: 'chrome',
        configFile: './cypress/cypress.config.ts',
        quiet: true,
    });

    // a run that couldn't start, for example because the config file has an error
    if (!('runs' in result)) {
        throw new Error(
            `Cypress did not finish the run (${result.failures} failures):\n${result.message}`
        );
    }

    return new Map(
        result.runs.map((run) => [
            run.spec.fileName,
            run.tests.map((test) => ({
                title: test.title[test.title.length - 1],
                state: test.state,
                error: errorMessage(test.displayError),
            })),
        ])
    );
}

/**
 * Runs all specs of a testing type once, before the tests of the calling file.
 * `spec()` returns the results of one spec. `unchecked()` lists the specs
 * that no test asked for, so a new spec can't be left without checks.
 */
export function useCypressRun(testingType: 'e2e' | 'component') {
    let results = new Map<string, TestResult[]>();
    const checked = new Set<string>();

    beforeAll(async () => {
        results = await runCypress(testingType);
    }, 600_000);

    return {
        spec: (specName: string): TestResult[] | undefined => {
            checked.add(specName);
            return results.get(specName);
        },
        unchecked: (): string[] =>
            [...results.keys()].filter((specName) => !checked.has(specName)),
    };
}

export const passed = (title: string): TestResult => ({
    title,
    state: 'passed',
    error: undefined,
});

export const failed = (title: string, error: string): TestResult => ({
    title,
    state: 'failed',
    error,
});

// consoleMessages as in the failure message, for example 'console.error: foo'
export const failedOnConsole = (
    title: string,
    ...consoleMessages: string[]
): TestResult =>
    failed(
        title,
        `AssertionError: cypress-fail-on-console-error:\n${consoleMessages.join('\n')}`
    );
