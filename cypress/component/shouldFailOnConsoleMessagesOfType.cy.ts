import { WithSameMessage } from './customComponents';

describe('shouldFailOnConsoleMessagesOfType', () => {
    it('should throw AssertionError on console.error when only console.warn is excluded', () => {
        cy.setConfig({
            consoleTypes: ['error', 'warn'],
            consoleMessages: [{ type: 'warn', message: 'sameMessage' }],
        });
        cy.mount(WithSameMessage, 'with-same-message');
    });

    it('should pass when the message is excluded for both console methods', () => {
        cy.setConfig({
            consoleTypes: ['error', 'warn'],
            consoleMessages: [
                { type: 'error', message: /same/ },
                { type: 'warn', message: /same/ },
            ],
        });
        cy.mount(WithSameMessage, 'with-same-message');
    });
});
