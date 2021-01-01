import * as chai from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { Config } from './types/Config';
import { ConsoleType, containsConsoleType } from './types/ConsoleType';

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

        if (getIncludedSpy(spies, config)) {
            chai.expect(spies.get(ConsoleType.ERROR)).to.have.callCount(0);
        }
    });
}

export const validateConfig = (config: Config): void => {
    config.excludeMessages?.forEach((_excludeMessage) => {
        chai.expect(
            _excludeMessage.trim().length === 0,
            'excludeMessages contains empty string'
        ).not.to.be.true;
    });

    config.includeConsoleTypes?.forEach((_includeConsoleType) => {
        chai.expect(
            !containsConsoleType(_includeConsoleType),
            'includeConsoleTypes contains unknown ConsoleType'
        ).not.to.be.true;
    });
};

export const createConfig = (config: Config): Config => {
    const includeConsoleTypes: ConsoleType[] = config.includeConsoleTypes
        ?.length
        ? config.includeConsoleTypes
        : [ConsoleType.ERROR];
    return {
        ...config,
        includeConsoleTypes,
    };
};

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
): boolean => {
    return Array.from(spies).some(([key, value]) => value.called);
};

export const getIncludedSpy = (
    spies: Map<ConsoleType, sinon.SinonSpy>,
    config: Config
): sinon.SinonSpy | undefined =>
    Array.from(spies.values()).find((value) => !isExludeMessage(value, config));

export const isExludeMessage = (
    spy: sinon.SinonSpy,
    config: Config
): boolean => {
    if (!config.excludeMessages) {
        return false;
    }

    const errorMessage: string = spy.args[0][0];
    chai.expect(errorMessage).not.to.be.undefined;

    return config.excludeMessages.some((_excludeMessage) => {
        const hasMatch: number =
            errorMessage.match(_excludeMessage)?.length || 0;
        return hasMatch > 0;
    });
};
