import * as chai from 'chai';
import { AssertionError } from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';

const consoleTypes = [
    'error',
    'warn',
    'info',
    'debug',
    'trace',
    'table',
    'log',
    'assert',
] as const;
type ConsoleType = (typeof consoleTypes)[number];
// a pattern that only matches messages of one console method
interface TypedConsoleMessage {
    type: ConsoleType;
    message: string | RegExp;
}
type ConsoleMessage = string | RegExp | TypedConsoleMessage;
interface Config {
    ignoreConsoleMessages?: ConsoleMessage[];
    /**
     * @deprecated Renamed to `ignoreConsoleMessages`, removed in 6.0. If both are set, `consoleMessages` is used.
     */
    consoleMessages?: ConsoleMessage[];
    consoleTypes?: ConsoleType[];
    debug?: boolean;
}
// the config with every option set, as getConfig() returns it
type ResolvedConfig = Required<Omit<Config, 'consoleMessages'>> & {
    /**
     * @deprecated Use `ignoreConsoleMessages`. The same array, kept for code written before the rename.
     */
    readonly consoleMessages: ConsoleMessage[];
};
// a pattern compiled once, with the entry it was compiled from
interface CompiledConsoleMessage {
    consoleMessage: ConsoleMessage;
    type?: ConsoleType;
    regExp: RegExp;
}

export { Config };
export { ConsoleType };
export { ConsoleMessage };
export { TypedConsoleMessage };

declare global {
    namespace Cypress {
        // registered by addIgnoredConsoleMessagesCommands()
        interface Chainable {
            getIgnoredConsoleMessages(): Chainable<ConsoleMessage[]>;
            setIgnoredConsoleMessages(
                ignoreConsoleMessages: ConsoleMessage[]
            ): Chainable<void>;
            addIgnoredConsoleMessages(
                ignoreConsoleMessages: ConsoleMessage[]
            ): Chainable<void>;
            deleteIgnoredConsoleMessages(
                ignoreConsoleMessages: ConsoleMessage[]
            ): Chainable<void>;
        }
    }
}

chai.should();
chai.use(sinonChai);

export default function failOnConsoleError(_config: Config = {}) {
    let originConfig: ResolvedConfig | undefined;
    let config: ResolvedConfig;
    let compiledConsoleMessages: CompiledConsoleMessage[];
    let spies: Map<ConsoleType, sinon.SinonSpy> | undefined;
    // the console that the spies were last created on
    let autConsole: Console | undefined;

    const getConfig = () => config;
    const setConfig = (_config: Config): void => {
        validateConfig(_config);
        config = createConfig(_config);
        compiledConsoleMessages = compileConsoleMessages(
            config.ignoreConsoleMessages
        );
        // a separate copy, so changes to getConfig() don't outlive the test
        originConfig = originConfig ?? createConfig(config);
        if (spies && autConsole) {
            spies = updateSpies(spies, config, autConsole);
        }
    };

    setConfig(_config);

    const setSpies = (window: Cypress.AUTWindow) => {
        autConsole = window.console;
        spies = createSpies(config, window.console);
    };

    if (Cypress.testingType === 'component') {
        before(() => cy.window().then(setSpies));
    } else {
        Cypress.on('window:before:load', setSpies);
    }

    Cypress.on('command:end', () => {
        if (!spies) return;

        const consoleCalls = checkConsoleCalls(
            getConsoleCalls(spies),
            compiledConsoleMessages,
            config.debug
        );

        spies = resetSpies(spies);

        if (consoleCalls.length === 0) return;

        throw new AssertionError(
            `cypress-fail-on-console-error:\n${consoleCallsToString(consoleCalls)}`
        );
    });

    Cypress.on('test:after:run', () => {
        if (spies) {
            spies = resetSpies(spies);
        }

        setConfig(originConfig as ResolvedConfig);
    });

    return {
        getConfig,
        setConfig,
    };
}

/**
 * Registers the commands getIgnoredConsoleMessages, setIgnoredConsoleMessages, addIgnoredConsoleMessages
 * and deleteIgnoredConsoleMessages, which read and change ignoreConsoleMessages for the current test.
 */
export const addIgnoredConsoleMessagesCommands = ({
    getConfig,
    setConfig,
}: ReturnType<typeof failOnConsoleError>): void => {
    const setIgnoredConsoleMessages = (
        ignoreConsoleMessages: ConsoleMessage[]
    ) => setConfig({ ...getConfig(), ignoreConsoleMessages });

    Cypress.Commands.addAll({
        getIgnoredConsoleMessages: () =>
            cy.wrap(getConfig().ignoreConsoleMessages, { log: false }),
        setIgnoredConsoleMessages,
        addIgnoredConsoleMessages: (ignoreConsoleMessages: ConsoleMessage[]) =>
            setIgnoredConsoleMessages([
                ...getConfig().ignoreConsoleMessages,
                ...ignoreConsoleMessages,
            ]),
        deleteIgnoredConsoleMessages: (
            ignoreConsoleMessages: ConsoleMessage[]
        ) =>
            setIgnoredConsoleMessages(
                getConfig().ignoreConsoleMessages.filter(
                    (consoleMessage) =>
                        !ignoreConsoleMessages.some((deleted) =>
                            isSameConsoleMessage(consoleMessage, deleted)
                        )
                )
            ),
    });
};

// a string and a RegExp with the same text are different patterns
const consoleMessageKey = (consoleMessage: ConsoleMessage): string => {
    if (isTypedConsoleMessage(consoleMessage)) {
        return `${consoleMessage.type}:${consoleMessageKey(consoleMessage.message)}`;
    }
    return consoleMessage instanceof RegExp
        ? `RegExp:${consoleMessage}`
        : `string:${consoleMessage}`;
};

export const isSameConsoleMessage = (
    a: ConsoleMessage,
    b: ConsoleMessage
): boolean => consoleMessageKey(a) === consoleMessageKey(b);

const typeName = (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof RegExp) return 'RegExp';
    return typeof value;
};

const invalidConfig = (message: string): never => {
    throw new AssertionError(`cypress-fail-on-console-error: ${message}`);
};

const isPattern = (value: unknown): value is string | RegExp =>
    typeof value === 'string' || value instanceof RegExp;

const isTypedConsoleMessage = (
    consoleMessage: unknown
): consoleMessage is TypedConsoleMessage =>
    typeof consoleMessage === 'object' &&
    consoleMessage !== null &&
    !Array.isArray(consoleMessage) &&
    !(consoleMessage instanceof RegExp);

const validateConsoleType = (name: string, consoleType: unknown): void => {
    if (!(consoleTypes as readonly unknown[]).includes(consoleType)) {
        invalidConfig(
            `${name} must be one of ${consoleTypes.join(', ')}, got ${JSON.stringify(consoleType)}`
        );
    }
};

const validatePattern = (name: string, pattern: unknown): void => {
    if (!isPattern(pattern)) {
        invalidConfig(
            `${name} must be a string or RegExp, got ${typeName(pattern)}`
        );
    }
    if (pattern === '') {
        invalidConfig(`${name} must not be an empty string`);
    }
    try {
        toRegExp(pattern as string | RegExp);
    } catch (error) {
        invalidConfig(
            `${name} is not a valid regular expression. ${(error as Error).message}. Escape special characters to match them literally.`
        );
    }
};

const validateConsoleMessages = (
    option: string,
    consoleMessages: unknown
): void => {
    if (consoleMessages == null) return;
    if (!Array.isArray(consoleMessages)) {
        invalidConfig(
            `${option} must be an array, got ${typeName(consoleMessages)}`
        );
    }
    (consoleMessages as unknown[]).forEach((consoleMessage, index) => {
        const name = `${option}[${index}]`;
        if (isTypedConsoleMessage(consoleMessage)) {
            validateConsoleType(`${name}.type`, consoleMessage.type);
            validatePattern(`${name}.message`, consoleMessage.message);
        } else if (isPattern(consoleMessage)) {
            validatePattern(name, consoleMessage);
        } else {
            invalidConfig(
                `${name} must be a string, RegExp or { type, message } object, got ${typeName(consoleMessage)}`
            );
        }
    });
};

export const validateConfig = (config: Config): void => {
    validateConsoleMessages(
        'ignoreConsoleMessages',
        config.ignoreConsoleMessages
    );
    validateConsoleMessages('consoleMessages', config.consoleMessages);

    if (config.consoleTypes != null) {
        if (!Array.isArray(config.consoleTypes)) {
            invalidConfig(
                `consoleTypes must be an array, got ${typeName(config.consoleTypes)}`
            );
        }
        if (config.consoleTypes.length === 0) {
            invalidConfig('consoleTypes must not be empty');
        }
        config.consoleTypes.forEach((consoleType, index) =>
            validateConsoleType(`consoleTypes[${index}]`, consoleType)
        );
    }
};

const copyConsoleMessage = (consoleMessage: ConsoleMessage): ConsoleMessage =>
    isTypedConsoleMessage(consoleMessage)
        ? { ...consoleMessage }
        : consoleMessage;

// getConfig().consoleMessages keeps working for code written before the rename.
// It isn't enumerable, so { ...getConfig(), ignoreConsoleMessages } doesn't copy it.
const withConsoleMessagesAlias = (
    config: Omit<ResolvedConfig, 'consoleMessages'>
): ResolvedConfig =>
    Object.defineProperty(config, 'consoleMessages', {
        get(this: ResolvedConfig) {
            return this.ignoreConsoleMessages;
        },
        enumerable: false,
    }) as ResolvedConfig;

// copies the arrays and objects, so the config doesn't share them with the caller
export const createConfig = (config: Config): ResolvedConfig =>
    withConsoleMessagesAlias({
        // consoleMessages wins, so setConfig({ ...getConfig(), consoleMessages }) still replaces the list
        ignoreConsoleMessages: (
            config.consoleMessages ??
            config.ignoreConsoleMessages ??
            []
        ).map(copyConsoleMessage),
        consoleTypes: config.consoleTypes?.length
            ? [...new Set(config.consoleTypes)]
            : ['error'],
        debug: config.debug ?? false,
    });

// compiles string patterns once, instead of on every check
export const compileConsoleMessages = (
    consoleMessages: ConsoleMessage[]
): CompiledConsoleMessage[] =>
    consoleMessages.map((consoleMessage) =>
        isTypedConsoleMessage(consoleMessage)
            ? {
                  consoleMessage,
                  type: consoleMessage.type,
                  regExp: toRegExp(consoleMessage.message),
              }
            : { consoleMessage, regExp: toRegExp(consoleMessage) }
    );

export const createSpies = (
    config: ResolvedConfig,
    console: Console
): Map<ConsoleType, sinon.SinonSpy> => {
    let spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
    config.consoleTypes?.forEach((consoleType) => {
        //TODO: function table does not exists on node.Console
        spies.set(consoleType, sinon.spy(console, consoleType as any));
    });
    return spies;
};

// keeps the spies, and their calls, of the console types that are still watched
export const updateSpies = (
    spies: Map<ConsoleType, sinon.SinonSpy>,
    config: ResolvedConfig,
    console: Console
): Map<ConsoleType, sinon.SinonSpy> => {
    spies.forEach((spy, consoleType) => {
        if (!config.consoleTypes.includes(consoleType)) spy.restore();
    });
    return new Map(
        config.consoleTypes.map((consoleType) => [
            consoleType,
            spies.get(consoleType) ?? sinon.spy(console, consoleType),
        ])
    );
};

export const resetSpies = (
    spies: Map<ConsoleType, sinon.SinonSpy>
): Map<ConsoleType, sinon.SinonSpy> => {
    spies.forEach((spy) => spy.resetHistory());
    return spies;
};

export interface ConsoleCall {
    type: ConsoleType;
    args: any[];
    // the arguments as one string, which ignoreConsoleMessages are matched against
    message: string;
}

// every call since the spies were last reset, in the order the app made them
export const getConsoleCalls = (
    spies: Map<ConsoleType, sinon.SinonSpy>
): ConsoleCall[] =>
    Array.from(spies.entries())
        .flatMap(([type, spy]) =>
            spy.getCalls().map((spyCall) => ({ type, spyCall }))
        )
        .sort((a, b) => (a.spyCall.calledBefore(b.spyCall) ? -1 : 1))
        .map(({ type, spyCall }) => toConsoleCall(type, spyCall.args))
        .filter((consoleCall) => consoleCall !== undefined);

// console.assert only logs when its first argument is falsy, and logs the remaining arguments
const toConsoleCall = (
    type: ConsoleType,
    args: any[]
): ConsoleCall | undefined => {
    if (type !== 'assert') return { type, args, message: callToString(args) };
    if (args[0]) return undefined;
    const message = callToString(args.slice(1));
    return {
        type,
        args,
        message: message ? `Assertion failed: ${message}` : 'Assertion failed',
    };
};

// the first pattern that matches the call; a { type, message } pattern only matches calls of its console method
export const findIgnoringConsoleMessage = (
    consoleCall: ConsoleCall,
    compiledConsoleMessages: CompiledConsoleMessage[]
): ConsoleMessage | undefined =>
    compiledConsoleMessages.find(
        ({ type, regExp }) =>
            (type === undefined || type === consoleCall.type) &&
            isConsoleMessageExcluded(consoleCall.message, regExp)
    )?.consoleMessage;

// logs each call to the command log and returns the calls that aren't ignored
export const checkConsoleCalls = (
    consoleCalls: ConsoleCall[],
    compiledConsoleMessages: CompiledConsoleMessage[],
    debug: boolean
): ConsoleCall[] =>
    consoleCalls.filter((consoleCall) => {
        const ignoredBy = findIgnoringConsoleMessage(
            consoleCall,
            compiledConsoleMessages
        );
        if (ignoredBy === undefined) {
            logConsoleCall(consoleCall);
            return true;
        }
        if (debug) logIgnoredConsoleCall(consoleCall, ignoredBy);
        return false;
    });

export const consoleCallsToString = (consoleCalls: ConsoleCall[]): string =>
    consoleCalls
        .map(
            (consoleCall) =>
                `console.${consoleCall.type}: ${consoleCall.message}`
        )
        .join('\n');

const toRegExp = (consoleMessage: string | RegExp): RegExp =>
    consoleMessage instanceof RegExp
        ? consoleMessage
        : new RegExp(consoleMessage);

export const isConsoleMessageExcluded = (
    consoleMessage: string,
    configConsoleMessage: string | RegExp
): boolean => {
    const configConsoleMessageRegExp = toRegExp(configConsoleMessage);
    // test() starts at lastIndex for /g and /y patterns and moves it on a match
    configConsoleMessageRegExp.lastIndex = 0;
    return configConsoleMessageRegExp.test(consoleMessage);
};

// JSON.stringify throws on circular references and BigInts, which apps can pass to console methods
const stringify = (value: unknown): string => {
    const ancestors: unknown[] = [];
    try {
        return String(
            JSON.stringify(
                value,
                function (this: unknown, _key: string, _value: unknown) {
                    if (typeof _value === 'bigint') return `${_value}n`;
                    if (typeof _value !== 'object' || _value === null) {
                        return _value;
                    }
                    // `this` is the object holding _value: drop ancestors that aren't on its path
                    while (
                        ancestors.length > 0 &&
                        ancestors[ancestors.length - 1] !== this
                    ) {
                        ancestors.pop();
                    }
                    if (ancestors.indexOf(_value) !== -1) return '[Circular]';
                    ancestors.push(_value);
                    return _value;
                }
            )
        );
    } catch {
        return Object.prototype.toString.call(value);
    }
};

// Firefox and WebKit stacks only list the frames, without the "Name: message" line V8 puts first
const errorToString = (error: Error & { stack: string }): string => {
    const header = error.message
        ? `${error.name}: ${error.message}`
        : error.name;
    return !error.name || error.stack.startsWith(header)
        ? error.stack
        : `${header}\n${error.stack}`;
};

const argumentToString = (argument: any): string => {
    if (typeof argument === 'string') return argument;
    if (typeof argument?.stack === 'string') return errorToString(argument);
    return stringify(argument?.stack ?? argument);
};

export const callToString = (calls: any[]): string =>
    calls.map(argumentToString).join(' ').trim();

// the reporter renders Cypress.log messages as Markdown, which would format characters like * and _
export const escapeMarkdown = (text: string): string =>
    text.replace(/[\\`*_~[\]()<>&]/g, '\\$&');

// a pattern as it is written in the config
export const consoleMessageToString = (
    consoleMessage: ConsoleMessage
): string => {
    if (isTypedConsoleMessage(consoleMessage)) {
        return `{ type: '${consoleMessage.type}', message: ${consoleMessageToString(consoleMessage.message)} }`;
    }
    return consoleMessage instanceof RegExp
        ? String(consoleMessage)
        : `'${consoleMessage.replace(/[\\']/g, '\\$&')}'`;
};

// clicking the entry prints the original arguments to the browser console, where they can be inspected
export const logConsoleCall = (consoleCall: ConsoleCall): void => {
    const name = `console.${consoleCall.type}`;
    Cypress.log({
        name,
        displayName: name,
        message: escapeMarkdown(consoleCall.message),
        consoleProps: () => ({
            'Console method': name,
            Arguments: consoleCall.args,
        }),
    });
};

// with debug: true, shows which pattern ignored a console call
export const logIgnoredConsoleCall = (
    consoleCall: ConsoleCall,
    ignoredBy: ConsoleMessage
): void => {
    const name = `console.${consoleCall.type}`;
    Cypress.log({
        name: 'ignored',
        displayName: 'ignored',
        message: `**${escapeMarkdown(consoleMessageToString(ignoredBy))}** matched ${name}: ${escapeMarkdown(consoleCall.message)}`,
        consoleProps: () => ({
            'Console method': name,
            Arguments: consoleCall.args,
            'Ignored by': ignoredBy,
        }),
    });
};
