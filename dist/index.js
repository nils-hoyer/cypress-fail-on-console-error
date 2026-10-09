import * as chai from 'chai';
import { AssertionError } from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
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
        // a separate copy, so changes to getConfig() don't outlive the test
        originConfig = originConfig !== null && originConfig !== void 0 ? originConfig : createConfig(config);
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
        const consoleCalls = getConsoleCallsIncluded(spies, Object.assign(Object.assign({}, config), { consoleMessages: consoleMessagePatterns }));
        spies = resetSpies(spies);
        if (consoleCalls.length === 0)
            return;
        throw new AssertionError(`cypress-fail-on-console-error:\n${consoleCallsToString(consoleCalls)}`);
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
const consoleTypes = [
    'error',
    'warn',
    'info',
    'debug',
    'trace',
    'table',
];
const typeName = (value) => {
    if (value === null)
        return 'null';
    if (Array.isArray(value))
        return 'array';
    if (value instanceof RegExp)
        return 'RegExp';
    return typeof value;
};
const invalidConfig = (message) => {
    throw new AssertionError(`cypress-fail-on-console-error: ${message}`);
};
export const validateConfig = (config) => {
    if (config.consoleMessages != null) {
        if (!Array.isArray(config.consoleMessages)) {
            invalidConfig(`consoleMessages must be an array, got ${typeName(config.consoleMessages)}`);
        }
        config.consoleMessages.forEach((consoleMessage, index) => {
            if (typeof consoleMessage !== 'string' &&
                !(consoleMessage instanceof RegExp)) {
                invalidConfig(`consoleMessages[${index}] must be a string or RegExp, got ${typeName(consoleMessage)}`);
            }
            if (consoleMessage === '') {
                invalidConfig(`consoleMessages[${index}] must not be an empty string`);
            }
            try {
                toRegExp(consoleMessage);
            }
            catch (error) {
                invalidConfig(`consoleMessages[${index}] is not a valid regular expression. ${error.message}. Escape special characters to match them literally.`);
            }
        });
    }
    if (config.consoleTypes != null) {
        if (!Array.isArray(config.consoleTypes)) {
            invalidConfig(`consoleTypes must be an array, got ${typeName(config.consoleTypes)}`);
        }
        if (config.consoleTypes.length === 0) {
            invalidConfig('consoleTypes must not be empty');
        }
        config.consoleTypes.forEach((consoleType, index) => {
            if (!consoleTypes.includes(consoleType)) {
                invalidConfig(`consoleTypes[${index}] must be one of ${consoleTypes.join(', ')}, got ${JSON.stringify(consoleType)}`);
            }
        });
    }
};
// copies the arrays, so the config doesn't share them with the caller
export const createConfig = (config) => { var _a; var _b, _c; return ({
    consoleMessages: [...((_b = config.consoleMessages) !== null && _b !== void 0 ? _b : [])],
    consoleTypes: ((_a = config.consoleTypes) === null || _a === void 0 ? void 0 : _a.length)
        ? [...new Set(config.consoleTypes)]
        : ['error'],
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
// every call since the spies were last reset, in the order the app made them
export const getConsoleCalls = (spies) => Array.from(spies.entries())
    .flatMap(([type, spy]) => spy.getCalls().map((spyCall) => ({ type, spyCall })))
    .sort((a, b) => (a.spyCall.calledBefore(b.spyCall) ? -1 : 1))
    .map(({ type, spyCall }) => ({
    type,
    args: spyCall.args,
    message: callToString(spyCall.args),
}));
export const getConsoleCallsIncluded = (spies, config) => getConsoleCalls(spies).filter((consoleCall) => isConsoleCallIncluded(consoleCall, config));
export const isConsoleCallIncluded = (consoleCall, config) => {
    if (config.consoleMessages.length === 0)
        return true;
    const consoleMessage = consoleCall.message;
    const someConsoleMessagesExcluded = config.consoleMessages.some((configConsoleMessage) => isConsoleMessageExcluded(consoleMessage, configConsoleMessage, config.debug));
    if (config.debug) {
        cypressLogger('consoleMessage_excluded', {
            consoleMessage,
            someConsoleMessagesExcluded,
        });
    }
    return !someConsoleMessagesExcluded;
};
export const consoleCallsToString = (consoleCalls) => consoleCalls
    .map((consoleCall) => `console.${consoleCall.type}: ${consoleCall.message}`)
    .join('\n');
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
