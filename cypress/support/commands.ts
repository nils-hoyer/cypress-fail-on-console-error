import failOnConsoleError, { Config, ConsoleMessages } from '../../dist/index';

const { getConfig, setConfig } = failOnConsoleError({
    consoleMessages: [
        /firstErrorExcluded.*/,
        'secondErrorExcluded',
        'thirdErrorExcluded.*consoleError.*',
    ],
    consoleTypes: ['error', 'warn'],
    debug: true,
});

Cypress.Commands.addAll({
    getConsoleMessages: () => {
        const config = getConfig();
        return cy.wrap(config?.consoleMessages);
    },
    setConsoleMessages: (consoleMessages: ConsoleMessages[]) => {
        const config = getConfig();
        setConfig({ ...config, consoleMessages });
    },
    addConsoleMessages: (_consoleMessages: ConsoleMessages[]) => {
        const config = getConfig() as Required<Config>;
        const consoleMessages = [
            ...config.consoleMessages,
            ..._consoleMessages,
        ];
        setConfig({
            ...config,
            consoleMessages,
        });
    },
    deleteConsoleMessages: (_consoleMessages: ConsoleMessages[]) => {
        const config = getConfig() as Required<Config>;
        const consoleMessages = config.consoleMessages.filter(
            (consoleMessage: string | RegExp) =>
                !_consoleMessages.includes(consoleMessage.toString())
        );
        setConfig({
            ...config,
            consoleMessages,
        });
    },
});

declare global {
    namespace Cypress {
        interface Chainable {
            getConsoleMessages(): Chainable<any>;
            setConsoleMessages(
                consoleMessages: ConsoleMessages[]
            ): Chainable<void>;
            addConsoleMessages(
                consoleMessages: ConsoleMessages[]
            ): Chainable<void>;
            deleteConsoleMessages(
                consoleMessages: ConsoleMessages[]
            ): Chainable<void>;
        }
    }
}
