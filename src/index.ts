import * as chai from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { Config } from './types/Config';
import { ConsoleType, someConsoleType } from './types/ConsoleType';

chai.should();
chai.use(sinonChai);

export default function failOnConsoleError(config: Config = {}): void {
    let spies: Map<number, sinon.SinonSpy> | undefined;

    validateConfig(config);
    config = createConfig(config);

    Cypress.on('window:before:load', (win) => {
        spies = createSpies(config, win.console);
    });

    Cypress.on('command:enqueued', () => {
        if (spies) {
            spies = resetSpies(spies);
        }
    });

    Cypress.on('command:end', () => {
        if (!spies || !someSpyCalled(spies)) {
            return;
        }

        const spy: sinon.SinonSpy | undefined = getIncludedSpy(spies, config);

        if (spy) {
            chai.expect(spy).to.have.callCount(0);
        }
    });
}

export const validateConfig = (config: Config): void => {
    if (config.excludeMessages) {
        chai.expect(config.excludeMessages).not.to.be.empty;
        config.excludeMessages.forEach((_excludeMessage) => {
            chai.expect(_excludeMessage).to.be.a('string');
            chai.expect(_excludeMessage).to.have.length.above(0);
        });
    }

    if (config.includeConsoleTypes) {
        chai.expect(config.includeConsoleTypes).not.to.be.empty;
        config.includeConsoleTypes.forEach(
            (_includeConsoleType) =>
                chai.expect(
                    someConsoleType(_includeConsoleType),
                    `includeConsoleTypes '${_includeConsoleType}' is an unknown ConsoleType`
                ).to.be.true
        );
    }
};

export const createConfig = (config: Config): Config => ({
    excludeMessages: config.excludeMessages,
    includeConsoleTypes: config.includeConsoleTypes?.length
        ? config.includeConsoleTypes
        : [ConsoleType.ERROR],
});

export const createSpies = (
    config: Config,
    console: Console
): Map<ConsoleType, sinon.SinonSpy> => {
    let spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
    config.includeConsoleTypes?.forEach((_consoleType) => {
        const functionName: any = ConsoleType[_consoleType].toLowerCase();
        spies.set(_consoleType, sinon.spy(console, functionName));
    });
    return spies;
};

export const resetSpies = (
    spies: Map<ConsoleType, sinon.SinonSpy>
): Map<ConsoleType, sinon.SinonSpy> => {
    spies.forEach((_spy) => _spy.resetHistory());
    return spies;
};

export const someSpyCalled = (
    spies: Map<ConsoleType, sinon.SinonSpy>
): boolean => Array.from(spies.values()).some((value) => value.called);

export const getIncludedSpy = (
    spies: Map<ConsoleType, sinon.SinonSpy>,
    config: Config
): sinon.SinonSpy | undefined =>
    Array.from(spies.values()).find(
        (spy) => spy.called && someIncludedCall(spy, config)
    );

export const someIncludedCall = (
    spy: sinon.SinonSpy,
    config: Config
): boolean => {
    if (!config.excludeMessages) {
        return true;
    }

    return spy.args.some(
        (call) =>
            !isExcludedMessage(
                config.excludeMessages as string[],
                callToString(call)
            )
    );
};

export const isExcludedMessage = (
    excludeMessages: string[],
    message: string
): boolean =>
    excludeMessages.some((_excludeMessage) => {
        const hasMatch: number = message.match(_excludeMessage)?.length || 0;
        return hasMatch > 0;
    });

export const callToString = (calls: any[]): string =>
    calls
        .reduce((previousValue, currentValue) => {
            const _currentValue =
                typeof currentValue === 'string'
                    ? currentValue
                    : currentValue?.message || JSON.stringify(currentValue);
            return `${previousValue} ${_currentValue}`;
        }, '')
        .trim();

export const consoleType = ConsoleType;
