// The helpers behind the plugin. They aren't public API: the exports field in
// package.json only lists dist/index.js, and the unit tests import this file from dist/.

export const consoleTypes = [
    'error',
    'warn',
    'info',
    'debug',
    'trace',
    'table',
    'log',
    'assert',
] as const;
export type ConsoleType = (typeof consoleTypes)[number];
// a pattern that only matches messages of one console method
export interface TypedConsoleMessage {
    type: ConsoleType;
    message: string | RegExp;
}
export type ConsoleMessage = string | RegExp | TypedConsoleMessage;
export interface Config {
    ignoreConsoleMessages?: ConsoleMessage[];
    consoleTypes?: ConsoleType[];
    debug?: boolean;
}
// the config with every option set, as getConfig() returns it
export type ResolvedConfig = Required<Config>;
const options: readonly (keyof Config)[] = [
    'ignoreConsoleMessages',
    'consoleTypes',
    'debug',
];
// options that were renamed, with their new name
const renamedOptions: ReadonlyMap<string, keyof Config> = new Map([
    ['consoleMessages', 'ignoreConsoleMessages'],
]);
// a pattern compiled once, with the entry it was compiled from
export interface CompiledConsoleMessage {
    consoleMessage: ConsoleMessage;
    type?: ConsoleType;
    regExp: RegExp;
}

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

// a mistake in the config, not a failed check of the app, so a plain Error
const invalidConfig = (message: string): never => {
    throw new Error(`cypress-fail-on-console-error: ${message}`);
};

// plain JavaScript can pass a string, which would be spread into single characters
export const validateCommandArgument = (
    command: string,
    ignoreConsoleMessages: unknown
): void => {
    if (!Array.isArray(ignoreConsoleMessages)) {
        invalidConfig(
            `cy.${command}() expects an array, got ${typeName(ignoreConsoleMessages)}`
        );
    }
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
    // new RegExp('') and /(?:)/ match every message
    if (pattern instanceof RegExp && pattern.source === '(?:)') {
        invalidConfig(`${name} must not be an empty RegExp`);
    }
    try {
        toRegExp(pattern as string | RegExp);
    } catch (error) {
        invalidConfig(
            `${name} is not a valid regular expression. ${(error as Error).message}. Escape special characters to match them literally.`
        );
    }
};

const validateIgnoreConsoleMessages = (
    ignoreConsoleMessages: unknown
): void => {
    if (ignoreConsoleMessages == null) return;
    if (!Array.isArray(ignoreConsoleMessages)) {
        invalidConfig(
            `ignoreConsoleMessages must be an array, got ${typeName(ignoreConsoleMessages)}`
        );
    }
    (ignoreConsoleMessages as unknown[]).forEach((consoleMessage, index) => {
        const name = `ignoreConsoleMessages[${index}]`;
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

// a typo in an option name would otherwise be ignored without notice
const validateOptionNames = (config: object): void => {
    Object.keys(config).forEach((key) => {
        const renamedTo = renamedOptions.get(key);
        if (renamedTo) {
            invalidConfig(`${key} was renamed to ${renamedTo}`);
        }
        if (!(options as readonly string[]).includes(key)) {
            invalidConfig(
                `unknown option ${JSON.stringify(key)}, must be one of ${options.join(', ')}`
            );
        }
    });
};

export const validateConfig = (config: Config): void => {
    if (
        typeof config !== 'object' ||
        config === null ||
        Array.isArray(config)
    ) {
        invalidConfig(`config must be an object, got ${typeName(config)}`);
    }
    validateOptionNames(config);
    validateIgnoreConsoleMessages(config.ignoreConsoleMessages);

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

// copies the arrays and objects, so the config doesn't share them with the caller
export const createConfig = (config: Config): ResolvedConfig => ({
    ignoreConsoleMessages: (config.ignoreConsoleMessages ?? []).map(
        copyConsoleMessage
    ),
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

// the watched console methods, with the calls made since the last reset
export interface ConsoleSpies {
    // puts back the original method of each watched console type
    restores: Map<ConsoleType, () => void>;
    // the calls of all watched methods, in the order the app made them
    calls: { type: ConsoleType; args: any[] }[];
}

// a plain function, not a sinon spy: sinon refuses to wrap a method twice, so
// users couldn't cy.spy() or cy.stub() the console. A cy.spy() on top calls
// through to this function, a cy.stub() replaces it.
const spyOn = (
    spies: ConsoleSpies,
    console: Console,
    consoleType: ConsoleType
): (() => void) => {
    const original = console[consoleType] as (...args: any[]) => void;
    let watching = true;
    const spy = function (this: unknown, ...args: any[]) {
        if (watching) spies.calls.push({ type: consoleType, args });
        return original?.apply(this, args);
    };
    (console as any)[consoleType] = spy;
    return () => {
        watching = false;
        // a spy that was put on top still calls this one, so leave it in place
        if (console[consoleType] === spy) {
            (console as any)[consoleType] = original;
        }
    };
};

export const createSpies = (
    config: ResolvedConfig,
    console: Console
): ConsoleSpies => {
    const spies: ConsoleSpies = { restores: new Map(), calls: [] };
    config.consoleTypes.forEach((consoleType) => {
        spies.restores.set(consoleType, spyOn(spies, console, consoleType));
    });
    return spies;
};

// keeps the spies, and their calls, of the console types that are still watched
export const updateSpies = (
    spies: ConsoleSpies,
    config: ResolvedConfig,
    console: Console
): ConsoleSpies => {
    spies.restores.forEach((restore, consoleType) => {
        if (!config.consoleTypes.includes(consoleType)) {
            restore();
            spies.restores.delete(consoleType);
        }
    });
    config.consoleTypes.forEach((consoleType) => {
        if (!spies.restores.has(consoleType)) {
            spies.restores.set(consoleType, spyOn(spies, console, consoleType));
        }
    });
    return spies;
};

export const resetSpies = (spies: ConsoleSpies): ConsoleSpies => {
    spies.calls = [];
    return spies;
};

export interface ConsoleCall {
    type: ConsoleType;
    args: any[];
    // the arguments as one string, which ignoreConsoleMessages are matched against
    message: string;
}

// every call since the spies were last reset, in the order the app made them
export const getConsoleCalls = (spies: ConsoleSpies): ConsoleCall[] =>
    spies.calls
        .map(({ type, args }) => toConsoleCall(type, args))
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
): CompiledConsoleMessage | undefined =>
    compiledConsoleMessages.find(
        ({ type, regExp }) =>
            (type === undefined || type === consoleCall.type) &&
            isConsoleMessageExcluded(consoleCall.message, regExp)
    );

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
            logConsoleCall(consoleCall, compiledConsoleMessages);
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

// instanceof doesn't work for values from the application's window, which is another realm
const isMap = (value: unknown): value is Map<unknown, unknown> =>
    Object.prototype.toString.call(value) === '[object Map]';
const isSet = (value: unknown): value is Set<unknown> =>
    Object.prototype.toString.call(value) === '[object Set]';
const isNode = (value: any): value is Node =>
    typeof value?.nodeType === 'number' && typeof value?.nodeName === 'string';

// an element as its opening tag, as the browser console shows it collapsed: <div id="app">
const nodeToString = (node: Node): string => {
    if (node.nodeType !== 1) return node.nodeName;
    const attributes = Array.from(
        (node as Element).attributes,
        ({ name, value }) => ` ${name}="${value}"`
    ).join('');
    return `<${node.nodeName.toLowerCase()}${attributes}>`;
};

// JSON.stringify turns Maps, Sets and DOM nodes into {}
const toJsonValue = (value: object): unknown => {
    if (isNode(value)) return nodeToString(value);
    if (isMap(value)) {
        return Object.fromEntries(
            Array.from(value, ([key, entry]) => [
                typeof key === 'string' ? key : stringify(key),
                entry,
            ])
        );
    }
    if (isSet(value)) return Array.from(value);
    return value;
};

// JSON.stringify throws on circular references and BigInts, which apps can pass to console methods
const stringify = (value: unknown): string => {
    // the objects on the path to the current value, as JSON.stringify sees them and as they were passed
    const ancestors: unknown[] = [];
    const originals: unknown[] = [];
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
                        originals.pop();
                    }
                    if (originals.indexOf(_value) !== -1) return '[Circular]';
                    const jsonValue = toJsonValue(_value);
                    ancestors.push(jsonValue);
                    originals.push(_value);
                    return jsonValue;
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
    if (isNode(argument)) return nodeToString(argument);
    if (isMap(argument)) return `Map(${argument.size}) ${stringify(argument)}`;
    if (isSet(argument)) return `Set(${argument.size}) ${stringify(argument)}`;
    return stringify(argument?.stack ?? argument);
};

const formatSpecifierToString = (specifier: string, argument: any): string => {
    switch (specifier) {
        case '%d':
        case '%i':
            return typeof argument === 'symbol'
                ? 'NaN'
                : String(parseInt(argument, 10));
        case '%f':
            return typeof argument === 'symbol'
                ? 'NaN'
                : String(parseFloat(argument));
        // CSS for the browser console, not part of the message
        case '%c':
            return '';
        default:
            return argumentToString(argument);
    }
};

// fills in format specifiers as the browser does, so console.error('Warning: %s is deprecated', 'componentWillMount')
// becomes "Warning: componentWillMount is deprecated". Arguments left over are appended. Like DevTools,
// %% becomes % even without arguments.
const formatArguments = (args: any[]): any[] => {
    const [format, ...rest] = args;
    if (typeof format !== 'string') return args;
    const formatted = format.replace(/%[%sdifoOc]/g, (specifier) => {
        if (specifier === '%%') return '%';
        return rest.length === 0
            ? specifier
            : formatSpecifierToString(specifier, rest.shift());
    });
    return [formatted, ...rest];
};

export const callToString = (calls: any[]): string =>
    formatArguments(calls).map(argumentToString).join(' ').trim();

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

// a pattern as it is matched: strings become RegExps
const compiledConsoleMessageToPattern = ({
    type,
    regExp,
}: CompiledConsoleMessage): RegExp | TypedConsoleMessage =>
    type === undefined ? regExp : { type, message: regExp };

// clicking the entry prints the original arguments, the matched text and the patterns
// that didn't match to the browser console, where they can be inspected
export const logConsoleCall = (
    consoleCall: ConsoleCall,
    compiledConsoleMessages: CompiledConsoleMessage[]
): void => {
    const name = `console.${consoleCall.type}`;
    Cypress.log({
        name,
        displayName: name,
        message: escapeMarkdown(consoleCall.message),
        consoleProps: () => ({
            'Console method': name,
            Arguments: consoleCall.args,
            'Matched against': consoleCall.message,
            'Patterns tried': compiledConsoleMessages.map(
                compiledConsoleMessageToPattern
            ),
        }),
    });
};

// with debug: true, shows which pattern ignored a console call
export const logIgnoredConsoleCall = (
    consoleCall: ConsoleCall,
    ignoredBy: CompiledConsoleMessage
): void => {
    const name = `console.${consoleCall.type}`;
    Cypress.log({
        name: 'ignored',
        displayName: 'ignored',
        message: `**${escapeMarkdown(consoleMessageToString(ignoredBy.consoleMessage))}** matched ${name}: ${escapeMarkdown(consoleCall.message)}`,
        consoleProps: () => ({
            'Console method': name,
            Arguments: consoleCall.args,
            'Ignored by': ignoredBy.consoleMessage,
            'As RegExp': ignoredBy.regExp,
            'Matched against': consoleCall.message,
        }),
    });
};
