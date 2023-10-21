import failOnConsoleError, { Config, ConsoleMessage } from '../../dist/index';

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
    setConsoleMessages: (consoleMessages: ConsoleMessage[]) => {
        const config = getConfig();
        setConfig({ ...config, consoleMessages });
    },
    addConsoleMessages: (_consoleMessages: ConsoleMessage[]) => {
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
    deleteConsoleMessages: (_consoleMessages: ConsoleMessage[]) => {
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
                consoleMessages: ConsoleMessage[]
            ): Chainable<void>;
            addConsoleMessages(
                consoleMessages: ConsoleMessage[]
            ): Chainable<void>;
            deleteConsoleMessages(
                consoleMessages: ConsoleMessage[]
            ): Chainable<void>;
        }
    }
}
