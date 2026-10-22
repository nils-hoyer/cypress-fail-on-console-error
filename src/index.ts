import {
    checkConsoleCalls,
    compileConsoleMessages,
    consoleCallsToString,
    createConfig,
    createSpies,
    findIgnoringConsoleMessage,
    getConsoleCalls,
    isSameConsoleMessage,
    logConsoleCall,
    resetSpies,
    updateSpies,
    validateCommandArgument,
    validateConfig,
    type CompiledConsoleMessage,
    type ConsoleCall,
    type ConsoleSpies,
    type Config,
    type ConsoleMessage,
    type ResolvedConfig,
} from './internal.js';

export type {
    Config,
    ConsoleMessage,
    ConsoleType,
    TypedConsoleMessage,
} from './internal.js';

// a console message failed the test, like a failed assertion. Named like chai's
// AssertionError, so Cypress shows failures as before 6.0.
class AssertionError extends Error {
    name = 'AssertionError';
}

declare global {
    namespace Cypress {
        // registered by addIgnoredConsoleMessagesCommands()
        interface Chainable {
            getIgnoredConsoleMessages(): Chainable<ConsoleMessage[]>;
            setIgnoredConsoleMessages(
                ignoreConsoleMessages: ConsoleMessage[]
            ): Chainable<void>;
            addIgnoredConsoleMessages(
                ignoreConsoleMessages: ConsoleMessage[]
            ): Chainable<void>;
            deleteIgnoredConsoleMessages(
                ignoreConsoleMessages: ConsoleMessage[]
            ): Chainable<void>;
        }
    }
}

// set on Cypress, which is created anew for every spec, so it also catches two copies of the package
const registered = Symbol.for('cypress-fail-on-console-error');

// calls made after a test's last check that its patterns don't ignore, with the title of that test
interface LateConsoleCalls {
    title: string;
    consoleCalls: ConsoleCall[];
    compiledConsoleMessages: CompiledConsoleMessage[];
}

export default function failOnConsoleError(_config: Config = {}) {
    // a second call would watch the console again and report every message twice
    if ((Cypress as any)[registered]) {
        throw new Error(
            'cypress-fail-on-console-error: failOnConsoleError() was called more than once. Call it once, in your support file.'
        );
    }
    (Cypress as any)[registered] = true;

    let originConfig: ResolvedConfig | undefined;
    let config: ResolvedConfig;
    let compiledConsoleMessages: CompiledConsoleMessage[];
    let spies: ConsoleSpies | undefined;
    // the console that the spies were last created on
    let autConsole: Console | undefined;
    // calls from pages that unloaded before the check after the command
    let unloadedConsoleCalls: ConsoleCall[] = [];
    // reported together at the end of the spec, see the after hook below
    let lateConsoleCalls: LateConsoleCalls[] = [];
    // the test that ended last, until the next test starts, with the patterns it ignored
    let endedTest:
        | {
              title: string;
              passed: boolean;
              compiledConsoleMessages: CompiledConsoleMessage[];
          }
        | undefined;

    // a copy, so changes to it don't look like they were applied
    const getConfig = () => createConfig(config);
    const setConfig = (_config: Config): void => {
        validateConfig(_config);
        config = createConfig(_config);
        compiledConsoleMessages = compileConsoleMessages(
            config.ignoreConsoleMessages
        );
        // a separate copy, so changes to getConfig() don't outlive the test
        originConfig = originConfig ?? createConfig(config);
        if (spies && autConsole) {
            spies = updateSpies(spies, config, autConsole);
        }
    };

    setConfig(_config);

    const setSpies = (window: Cypress.AUTWindow) => {
        // a page that navigates during a command, for example after a click, logs before the next page loads
        if (spies) unloadedConsoleCalls.push(...getConsoleCalls(spies));
        autConsole = window.console;
        spies = createSpies(config, window.console);
    };

    // the calls since the last check
    const takeConsoleCalls = (): ConsoleCall[] => {
        const consoleCalls = [
            ...unloadedConsoleCalls,
            ...(spies ? getConsoleCalls(spies) : []),
        ];
        unloadedConsoleCalls = [];
        if (spies) spies = resetSpies(spies);
        return consoleCalls;
    };

    // calls after a test's last command belong to that test, and are filtered with its
    // patterns. A failed test already shows its own error, so its calls are dropped.
    const takeConsoleCallsOfEndedTest = (): void => {
        if (!endedTest) return;
        const { title, passed, compiledConsoleMessages } = endedTest;
        const consoleCalls = takeConsoleCalls().filter(
            (consoleCall) =>
                !findIgnoringConsoleMessage(
                    consoleCall,
                    compiledConsoleMessages
                )
        );
        if (passed && consoleCalls.length > 0) {
            lateConsoleCalls.push({
                title,
                consoleCalls,
                compiledConsoleMessages,
            });
        }
    };

    const checkConsole = (): void => {
        if (!spies) return;

        // in a hook after the test: failing it would skip the rest of the suite
        if (endedTest) {
            takeConsoleCallsOfEndedTest();
            return;
        }

        const consoleCalls = checkConsoleCalls(
            takeConsoleCalls(),
            compiledConsoleMessages,
            config.debug
        );
        if (consoleCalls.length === 0) return;

        throw new AssertionError(
            `cypress-fail-on-console-error:\n${consoleCallsToString(consoleCalls)}`
        );
    };

    const reportLateConsoleCalls = (): void => {
        takeConsoleCallsOfEndedTest();
        const reported = lateConsoleCalls;
        lateConsoleCalls = [];
        if (reported.length === 0) return;

        reported.forEach(({ consoleCalls, compiledConsoleMessages }) =>
            consoleCalls.forEach((consoleCall) =>
                logConsoleCall(consoleCall, compiledConsoleMessages)
            )
        );
        throw new AssertionError(
            [
                'cypress-fail-on-console-error:',
                ...reported.map(
                    ({ title, consoleCalls }) =>
                        `logged after the test "${title}" ended:\n${consoleCallsToString(consoleCalls)}`
                ),
                'End these tests with an assertion that waits for the page, so that a message fails the test that logged it.',
            ].join('\n')
        );
    };

    if (Cypress.testingType === 'component') {
        before(() => cy.window().then(setSpies));
    } else {
        Cypress.on('window:before:load', setSpies);
    }

    Cypress.on('command:end', checkConsole);

    // a root hook, so it runs after the afterEach hooks of the spec's suites. Root
    // afterEach hooks registered later run after it, and only collect calls.
    afterEach(function () {
        endedTest = {
            title: this.currentTest?.fullTitle() ?? '',
            passed: this.currentTest?.state === 'passed',
            compiledConsoleMessages,
        };
    });

    Cypress.on('test:before:run', () => {
        takeConsoleCallsOfEndedTest();
        endedTest = undefined;
    });

    // the calls of all tests after their last command, reported once at the end of the
    // spec: Cypress doesn't retry an after hook, and no tests are left to skip
    after(() => {
        cy.then(reportLateConsoleCalls);
    });

    Cypress.on('test:after:run', () => {
        setConfig(originConfig as ResolvedConfig);
    });

    return {
        getConfig,
        setConfig,
    };
}

/**
 * Registers the commands getIgnoredConsoleMessages, setIgnoredConsoleMessages, addIgnoredConsoleMessages
 * and deleteIgnoredConsoleMessages, which read and change ignoreConsoleMessages for the current test.
 */
export const addIgnoredConsoleMessagesCommands = ({
    getConfig,
    setConfig,
}: ReturnType<typeof failOnConsoleError>): void => {
    const setIgnoredConsoleMessages = (
        ignoreConsoleMessages: ConsoleMessage[]
    ) => setConfig({ ...getConfig(), ignoreConsoleMessages });

    Cypress.Commands.addAll({
        getIgnoredConsoleMessages: () =>
            cy.wrap(getConfig().ignoreConsoleMessages, { log: false }),
        setIgnoredConsoleMessages: (
            ignoreConsoleMessages: ConsoleMessage[]
        ) => {
            validateCommandArgument(
                'setIgnoredConsoleMessages',
                ignoreConsoleMessages
            );
            setIgnoredConsoleMessages(ignoreConsoleMessages);
        },
        addIgnoredConsoleMessages: (
            ignoreConsoleMessages: ConsoleMessage[]
        ) => {
            validateCommandArgument(
                'addIgnoredConsoleMessages',
                ignoreConsoleMessages
            );
            setIgnoredConsoleMessages([
                ...getConfig().ignoreConsoleMessages,
                ...ignoreConsoleMessages,
            ]);
        },
        deleteIgnoredConsoleMessages: (
            ignoreConsoleMessages: ConsoleMessage[]
        ) => {
            validateCommandArgument(
                'deleteIgnoredConsoleMessages',
                ignoreConsoleMessages
            );
            setIgnoredConsoleMessages(
                getConfig().ignoreConsoleMessages.filter(
                    (consoleMessage) =>
                        !ignoreConsoleMessages.some((deleted) =>
                            isSameConsoleMessage(consoleMessage, deleted)
                        )
                )
            );
        },
    });
};
