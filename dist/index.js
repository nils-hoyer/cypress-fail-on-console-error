"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function failOnConsoleError() {
    if (!Cypress.env('failOnConsoleError')) {
        return;
    }
    var spy;
    Cypress.on('window:before:load', function (win) {
        spy = cy.spy(win.console, 'error');
    });
    beforeEach(function () {
        spy = undefined;
    });
    afterEach(function () {
        if (spy) {
            cy.window().then(function (win) {
                expect(win.console.error).to.have.callCount(0);
            });
        }
    });
}
exports.default = failOnConsoleError;
