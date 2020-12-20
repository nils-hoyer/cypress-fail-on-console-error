import * as chai from 'chai';
import Agent = Cypress.Agent;

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

            cy.window().then((win) => {
                expect(win.console.error).to.have.callCount(0);
            });
        }
    });
}

export const isSpyExluded = (spy: Agent<sinon.SinonSpy>, config: Config) => {
    if (!config.exclude) {
        return false;
    }

    const errorMessage: string = spy.args[0][0];
    chai.expect(errorMessage).not.to.be.undefined;

    return config.exclude.includes(errorMessage);
};
