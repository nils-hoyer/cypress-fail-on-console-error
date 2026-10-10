import failOnConsoleError, {
    addIgnoredConsoleMessagesCommands,
    Config as FailOnConsoleErrorConfig,
} from '../../dist/index';

const failOnConsole = failOnConsoleError({
    ignoreConsoleMessages: [
        /firstErrorExcluded.*/,
        'secondErrorExcluded',
        'thirdErrorExcluded.*consoleError.*',
    ],
    consoleTypes: ['error', 'warn'],
    debug: true,
});

addIgnoredConsoleMessagesCommands(failOnConsole);

Cypress.Commands.addAll({
    getConfig: () => {
        return cy.wrap(failOnConsole.getConfig());
    },
    setConfig: (config: FailOnConsoleErrorConfig) => {
        failOnConsole.setConfig(config);
    },
});

declare global {
    namespace Cypress {
        interface Chainable {
            getConfig(): Chainable<Required<FailOnConsoleErrorConfig>>;
            setConfig(config: FailOnConsoleErrorConfig): Chainable<void>;
        }
    }
}
