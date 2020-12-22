import Agent = Cypress.Agent;
import * as chai from 'chai';

export default function failOnConsoleError() {
    const config: Config = Cypress.env('failOnConsoleError');
    if (!config) {
        return;
    }

    let spy: Agent<sinon.SinonSpy> | undefined;

    Cypress.on('window:before:load', (win) => {
        spy = cy.spy(win.console, 'error');
    });

    Cypress.on('command:enqueued', () => {
        spy = undefined;
    });

    Cypress.on('command:end', () => {
        if (!spy) {
            return;
        }

        if (!isSpyExluded(spy, config)) {
            expect(spy).to.have.callCount(0);
        }
    });
}

export const isSpyExluded = (spy: Agent<sinon.SinonSpy>, config: Config) => {
    if (!config.excludeMessages) {
        return false;
    }

    const errorMessage: string = spy.args[0][0];
    chai.expect(errorMessage).not.to.be.undefined;

    return config.excludeMessages.some((_excludeMessage) => {
        const isEmpty: boolean = _excludeMessage.trim().length === 0;
        if (isEmpty) {
            return false;
        }

        const hasMatch: number =
            errorMessage.match(_excludeMessage)?.length || 0;
        return hasMatch > 0;
    });
};
