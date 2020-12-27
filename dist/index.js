"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSpyExluded = void 0;
var chai = __importStar(require("chai"));
function failOnConsoleError() {
    var config = Cypress.env('failOnConsoleError');
    if (!config) {
        return;
    }
    var spy;
    Cypress.on('window:before:load', function (win) {
        spy = cy.spy(win.console, 'error');
    });
    Cypress.on('command:enqueued', function () {
        spy = undefined;
    });
    Cypress.on('command:end', function () {
        if (!spy || !spy.called) {
            return;
        }
        if (!exports.isSpyExluded(spy, config)) {
            expect(spy).to.have.callCount(0);
        }
    });
}
exports.default = failOnConsoleError;
var isSpyExluded = function (spy, config) {
    if (!config.excludeMessages) {
        return false;
    }
    var errorMessage = spy.args[0][0];
    chai.expect(errorMessage).not.to.be.undefined;
    return config.excludeMessages.some(function (_excludeMessage) {
        var _a;
        var isEmpty = _excludeMessage.trim().length === 0;
        if (isEmpty) {
            return false;
        }
        var hasMatch = ((_a = errorMessage.match(_excludeMessage)) === null || _a === void 0 ? void 0 : _a.length) || 0;
        return hasMatch > 0;
    });
};
exports.isSpyExluded = isSpyExluded;
//# sourceMappingURL=index.js.map