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
    let consoleMessagePatterns = [];
    let spies;
    const getConfig = () => config;
    const setConfig = (_config) => {
        validateConfig(_config);
        config = createConfig(_config);
        consoleMessagePatterns = config.consoleMessages.map(toRegExp);
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
        // match against the patterns compiled in setConfig
        const consoleMessage = getConsoleMessageIncluded(spies, Object.assign(Object.assign({}, config), { consoleMessages: consoleMessagePatterns }));
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
        config.consoleMessages.forEach((consoleMessage, index) => {
            chai.expect(typeDetect(consoleMessage)).to.be.oneOf([
                'string',
                'RegExp',
            ]);
            chai.expect(consoleMessage.toString()).to.have.length.above(0);
            try {
                toRegExp(consoleMessage);
            }
            catch (error) {
                throw new AssertionError(`cypress-fail-on-console-error: consoleMessages[${index}] is not a valid regular expression. ${error.message}. Escape special characters to match them literally.`);
            }
        });
    }
    if (config.consoleTypes) {
        chai.expect(config.consoleTypes).not.to.be.empty;
        config.consoleTypes.forEach((consoleType) => {
            chai.expect([
                'error',
                'warn',
                'info',
                'debug',
                'trace',
                'table',
            ]).contains(consoleType);
        });
    }
};
export const createConfig = (config) => { var _a; var _b, _c; return ({
    consoleMessages: (_b = config.consoleMessages) !== null && _b !== void 0 ? _b : [],
    consoleTypes: ((_a = config.consoleTypes) === null || _a === void 0 ? void 0 : _a.length) ? config.consoleTypes : ['error'],
    debug: (_c = config.debug) !== null && _c !== void 0 ? _c : false,
}); };
export const createSpies = (config, console) => {
    var _a;
    let spies = new Map();
    (_a = config.consoleTypes) === null || _a === void 0 ? void 0 : _a.forEach((consoleType) => {
        //TODO: function table does not exists on node.Console
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
const toRegExp = (consoleMessage) => consoleMessage instanceof RegExp
    ? consoleMessage
    : new RegExp(consoleMessage);
export const isConsoleMessageExcluded = (consoleMessage, configConsoleMessage, debug) => {
    const configConsoleMessageRegExp = toRegExp(configConsoleMessage);
    // test() starts at lastIndex for /g and /y patterns and moves it on a match
    configConsoleMessageRegExp.lastIndex = 0;
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
// JSON.stringify throws on circular references and BigInts, which apps can pass to console methods
const stringify = (value) => {
    const ancestors = [];
    try {
        return String(JSON.stringify(value, function (_key, _value) {
            if (typeof _value === 'bigint')
                return `${_value}n`;
            if (typeof _value !== 'object' || _value === null) {
                return _value;
            }
            // `this` is the object holding _value: drop ancestors that aren't on its path
            while (ancestors.length > 0 &&
                ancestors[ancestors.length - 1] !== this) {
                ancestors.pop();
            }
            if (ancestors.indexOf(_value) !== -1)
                return '[Circular]';
            ancestors.push(_value);
            return _value;
        }));
    }
    catch (_a) {
        return Object.prototype.toString.call(value);
    }
};
// Firefox and WebKit stacks only list the frames, without the "Name: message" line V8 puts first
const errorToString = (error) => {
    const header = error.message
        ? `${error.name}: ${error.message}`
        : error.name;
    return !error.name || error.stack.startsWith(header)
        ? error.stack
        : `${header}\n${error.stack}`;
};
const argumentToString = (argument) => {
    var _a;
    if (typeof argument === 'string')
        return argument;
    if (typeof (argument === null || argument === void 0 ? void 0 : argument.stack) === 'string')
        return errorToString(argument);
    return stringify((_a = argument === null || argument === void 0 ? void 0 : argument.stack) !== null && _a !== void 0 ? _a : argument);
};
export const callToString = (calls) => calls.map(argumentToString).join(' ').trim();
export const cypressLogger = (name, message) => {
    Cypress.log({
        name: name,
        displayName: name,
        // JSON.stringify turns a RegExp into {}
        message: JSON.stringify(message, (_key, value) => value instanceof RegExp ? String(value) : value),
        consoleProps: () => message,
    });
};
