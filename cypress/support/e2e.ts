import failOnConsoleError, { Config, ConsoleType } from '../../dist/index';
import './commands';

const config = {
    consoleMessages: [
        /firstErrorExcluded.*/,
        'secondErrorExcluded',
        'thirdErrorExcluded.*consoleError.*',
    ],
    consoleTypes: [ConsoleType.ERROR, ConsoleType.WARN],
    debug: true,
};

const { getConfig, setConfig } = failOnConsoleError(config);

Cypress.Commands.addAll({
    getConsoleMessages: () => {
        const config = getConfig();
        return cy.wrap(config?.consoleMessages);
    },
    setConsoleMessages: (consoleMessages: (string | RegExp)[]) => {
        const config = getConfig();
        setConfig({ ...config, consoleMessages });
    },
    addConsoleMessages: (_consoleMessages: (string | RegExp)[]) => {
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
    deleteConsoleMessages: (_consoleMessages: (string | RegExp)[]) => {
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
                consoleMessages: (string | RegExp)[]
            ): Chainable<void>;
            addConsoleMessages(
                consoleMessages: (string | RegExp)[]
            ): Chainable<void>;
            deleteConsoleMessages(
                consoleMessages: (string | RegExp)[]
            ): Chainable<void>;
        }
    }
}
