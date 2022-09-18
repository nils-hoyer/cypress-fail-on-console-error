import failOnConsoleError, { Config, consoleType } from '../../dist/index';
import './commands';

const config = {
    excludeMessages: [
        /firstErrorExcluded.*/,
        'secondErrorExcluded',
        'thirdErrorExcluded.*consoleError.*',
    ],
    includeConsoleTypes: [consoleType.ERROR, consoleType.WARN],
    cypressLog: true,
};

const { getConfig, setConfig } = failOnConsoleError(config);

Cypress.Commands.addAll({
    getExcludeMessages: () => {
        const config = getConfig();
        return cy.wrap(config);
    },
    setExcludeMessages: (excludeMessages: (string | RegExp)[]) => {
        const config = getConfig();
        setConfig({ ...config, excludeMessages });
    },
    addExcludeMessages: (_excludeMessages: (string | RegExp)[]) => {
        const config = getConfig() as Required<Config>;
        const excludeMessages = [
            ...config.excludeMessages,
            ..._excludeMessages,
        ];
        setConfig({
            ...config,
            excludeMessages,
        });
    },
    deleteExcludeMessages: (_excludeMessages: (string | RegExp)[]) => {
        const config = getConfig() as Required<Config>;
        debugger;
        const excludeMessages = config.excludeMessages.filter(
            (excludeMessage: string | RegExp) =>
                _excludeMessages.includes(excludeMessage.toString())
        );
        debugger;
        setConfig({
            ...config,
            excludeMessages,
        });
    },
});

declare global {
    namespace Cypress {
        interface Chainable {
            getExcludeMessages(): Chainable<any>;
            setExcludeMessages(
                excludeMessages: (string | RegExp)[]
            ): Chainable<void>;
            addExcludeMessages(
                excludeMessages: (string | RegExp)[]
            ): Chainable<void>;
            deleteExcludeMessages(
                excludeMessages: (string | RegExp)[]
            ): Chainable<void>;
        }
    }
}
