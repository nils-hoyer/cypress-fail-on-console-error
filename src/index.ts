import {
    AssertionError,
    checkConsoleCalls,
    compileConsoleMessages,
    consoleCallsToString,
    createConfig,
    createSpies,
    getConsoleCalls,
    isSameConsoleMessage,
    resetSpies,
    updateSpies,
    validateConfig,
    type CompiledConsoleMessage,
    type Config,
    type ConsoleMessage,
    type ConsoleType,
    type ResolvedConfig,
} from './internal.js';

export type {
    Config,
    ConsoleMessage,
    ConsoleType,
    TypedConsoleMessage,
} from './internal.js';

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

export default function failOnConsoleError(_config: Config = {}) {
    let originConfig: ResolvedConfig | undefined;
    let config: ResolvedConfig;
    let compiledConsoleMessages: CompiledConsoleMessage[];
    let spies: Map<ConsoleType, sinon.SinonSpy> | undefined;
    // the console that the spies were last created on
    let autConsole: Console | undefined;

    const getConfig = () => config;
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
        autConsole = window.console;
        spies = createSpies(config, window.console);
    };

    if (Cypress.testingType === 'component') {
        before(() => cy.window().then(setSpies));
    } else {
        Cypress.on('window:before:load', setSpies);
    }

    Cypress.on('command:end', () => {
        if (!spies) return;

        const consoleCalls = checkConsoleCalls(
            getConsoleCalls(spies),
            compiledConsoleMessages,
            config.debug
        );

        spies = resetSpies(spies);

        if (consoleCalls.length === 0) return;

        throw new AssertionError(
            `cypress-fail-on-console-error:\n${consoleCallsToString(consoleCalls)}`
        );
    });

    Cypress.on('test:after:run', () => {
        if (spies) {
            spies = resetSpies(spies);
        }

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
        setIgnoredConsoleMessages,
        addIgnoredConsoleMessages: (ignoreConsoleMessages: ConsoleMessage[]) =>
            setIgnoredConsoleMessages([
                ...getConfig().ignoreConsoleMessages,
                ...ignoreConsoleMessages,
            ]),
        deleteIgnoredConsoleMessages: (
            ignoreConsoleMessages: ConsoleMessage[]
        ) =>
            setIgnoredConsoleMessages(
                getConfig().ignoreConsoleMessages.filter(
                    (consoleMessage) =>
                        !ignoreConsoleMessages.some((deleted) =>
                            isSameConsoleMessage(consoleMessage, deleted)
                        )
                )
            ),
    });
};
