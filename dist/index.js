import * as chai from 'chai';
import { AssertionError } from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import typeDetect from 'type-detect';
chai.should();
chai.use(sinonChai);
export default function failOnConsoleError(_config = {}) {
    let originConfig;
    let config;
    let spies;
    const getConfig = () => config;
    const setConfig = (_config) => {
        validateConfig(_config);
        config = createConfig(_config);
        originConfig = originConfig !== null && originConfig !== void 0 ? originConfig : Object.assign({}, config);
    };
    setConfig(_config);
    const setSpies = (window) => (spies = createSpies(config, window.console));
    if (Cypress.testingType === 'component') {
        before(() => cy.window().then(setSpies));
    }
    else {
        Cypress.on('window:before:load', setSpies);
    }
    Cypress.on('command:end', () => {
        if (!spies)
            return;
        const consoleMessage = getConsoleMessageIncluded(spies, config);
        spies = resetSpies(spies);
        if (!consoleMessage)
            return;
        throw new AssertionError(`cypress-fail-on-console-error:\n${consoleMessage}`);
    });
    Cypress.on('test:after:run', () => {
        if (spies) {
            spies = resetSpies(spies);
        }
        setConfig(originConfig);
    });
    return {
        getConfig,
        setConfig,
    };
}
export const validateConfig = (config) => {
    if (config.consoleMessages) {
        config.consoleMessages.forEach((consoleMessage) => {
            chai.expect(typeDetect(consoleMessage)).to.be.oneOf([
                'string',
                'RegExp',
            ]);
            chai.expect(consoleMessage.toString()).to.have.length.above(0);
        });
    }
    if (config.consoleTypes) {
        chai.expect(config.consoleTypes).not.to.be.empty;
        config.consoleTypes.forEach((consoleType) => {
            chai.expect(['error', 'warn', 'info']).contains(consoleType);
        });
    }
};
export const createConfig = (config) => {
    var _a, _b, _c;
    return ({
        consoleMessages: (_a = config.consoleMessages) !== null && _a !== void 0 ? _a : [],
        consoleTypes: ((_b = config.consoleTypes) === null || _b === void 0 ? void 0 : _b.length) ? config.consoleTypes : ['error'],
        debug: (_c = config.debug) !== null && _c !== void 0 ? _c : false,
    });
};
export const createSpies = (config, console) => {
    var _a;
    let spies = new Map();
    (_a = config.consoleTypes) === null || _a === void 0 ? void 0 : _a.forEach((consoleType) => {
        spies.set(consoleType, sinon.spy(console, consoleType));
    });
    return spies;
};
export const resetSpies = (spies) => {
    spies.forEach((spy) => spy.resetHistory());
    return spies;
};
export const getConsoleMessageIncluded = (spies, config) => {
    let includedConsoleMessage;
    Array.from(spies.values()).find((spy) => {
        if (!spy.called)
            return false;
        includedConsoleMessage = findConsoleMessageIncluded(spy, config);
        return includedConsoleMessage !== undefined;
    });
    return includedConsoleMessage;
};
export const findConsoleMessageIncluded = (spy, config) => {
    const consoleMessages = spy.args.map((call) => callToString(call));
    if (config.consoleMessages.length === 0) {
        return consoleMessages[0];
    }
    return consoleMessages.find((consoleMessage) => {
        const someConsoleMessagesExcluded = config.consoleMessages.some((configConsoleMessage) => isConsoleMessageExcluded(consoleMessage, configConsoleMessage, config.debug));
        if (config.debug) {
            cypressLogger('consoleMessage_excluded', {
                consoleMessage,
                someConsoleMessagesExcluded,
            });
        }
        return !someConsoleMessagesExcluded;
    });
};
export const isConsoleMessageExcluded = (consoleMessage, configConsoleMessage, debug) => {
    const configConsoleMessageRegExp = configConsoleMessage instanceof RegExp
        ? configConsoleMessage
        : new RegExp(configConsoleMessage);
    const consoleMessageExcluded = configConsoleMessageRegExp.test(consoleMessage);
    if (debug) {
        cypressLogger('consoleMessage_configConsoleMessage_match', {
            consoleMessage,
            configConsoleMessage,
            consoleMessageExcluded,
        });
    }
    return consoleMessageExcluded;
};
export const callToString = (calls) => calls
    .reduce((previousValue, currentValue) => {
    var _a;
    const _value = (_a = currentValue === null || currentValue === void 0 ? void 0 : currentValue.stack) !== null && _a !== void 0 ? _a : currentValue;
    const _currentValue = typeof _value !== 'string' ? JSON.stringify(_value) : _value;
    return `${previousValue} ${_currentValue}`;
}, '')
    .trim();
export const cypressLogger = (name, message) => {
    Cypress.log({
        name: name,
        displayName: name,
        message: JSON.stringify(message),
        consoleProps: () => message,
    });
};
