import * as chai from 'chai';
import { AssertionError } from 'chai';
import {
    createConfig,
    createSpies,
    isExludeMessage,
    someSpyCalled,
    validateConfig,
} from '../dist/index';
import { Config } from '../dist/types/Config';
import { ConsoleType } from '../dist/types/ConsoleType';

describe('isExludeMessage()', () => {
    it('with config.excludeMessages matching spy error message should return true', () => {
        const spy: any = { args: [['foo']] };
        const config: any = { excludeMessages: ['foo'] };

        const expected = isExludeMessage(spy, config);

        chai.expect(expected).to.be.true;
    });

    it('without config.excludeMessages should return false', () => {
        const spy: any = { args: [['foo']] };
        const config: any = {};

        const expected = isExludeMessage(spy, config);

        chai.expect(expected).to.be.false;
    });

    it('without config.excludeMessages matching spy error message should return false', () => {
        const spy: any = { args: [['foo']] };
        const config: any = { excludeMessages: ['bar'] };

        const expected = isExludeMessage(spy, config);

        chai.expect(expected).to.be.false;
    });
});

describe('createConfig()', () => {
    it('when includeConsoleType is not set use default ConsoleType.ERROR', () => {
        const config: any = {};

        const given = createConfig(config);

        chai.expect(given.includeConsoleTypes.length).to.equal(1);
        chai.expect(given.includeConsoleTypes[0]).to.equal(ConsoleType.ERROR);
    });

    it('when includeConsoleType is set overwrite default ConsoleType.ERROR', () => {
        const config: Config = {
            includeConsoleTypes: [ConsoleType.WARN, ConsoleType.INFO],
        };

        const given = createConfig(config);

        chai.expect(given.includeConsoleTypes.length).to.equal(2);
        chai.expect(given.includeConsoleTypes[0]).to.equal(ConsoleType.WARN);
        chai.expect(given.includeConsoleTypes[1]).to.equal(ConsoleType.INFO);
    });
});

describe('validateConfig()', () => {
    it('excludeMessages contains empty string', () => {
        const config: Config = { excludeMessages: [''] };

        chai.expect(() => validateConfig(config)).to.throw(
            AssertionError,
            'excludeMessages contains empty string'
        );
    });

    it('includeConsoleTypes contains unknown ConsoleType', () => {
        const config: any = { includeConsoleTypes: ['unknownConsoleType'] };

        chai.expect(() => validateConfig(config)).to.throw(
            AssertionError,
            'includeConsoleTypes contains unknown ConsoleType'
        );
    });
});

describe('createSpies()', () => {
    it('createSpies map', () => {
        const config: Config = {
            includeConsoleTypes: [
                ConsoleType.INFO,
                ConsoleType.WARN,
                ConsoleType.ERROR,
            ],
        };
        const console: any = {
            info: () => true,
            warn: () => true,
            error: () => true,
        };

        const spies: any = createSpies(config, console);

        const spiesIterator = spies.keys();
        chai.expect(spies.size).to.equals(3);
        chai.expect(spiesIterator.next().value).to.equals(
            config.includeConsoleTypes[0]
        );
        chai.expect(spiesIterator.next().value).to.equals(
            config.includeConsoleTypes[1]
        );
        chai.expect(spiesIterator.next().value).to.equals(
            config.includeConsoleTypes[2]
        );
    });
});

describe('someSpyCalled()', () => {
    it('return true if spy was called', () => {
        const spies: Map<any, any> = new Map();
        spies.set(ConsoleType.ERROR, { called: true });
        spies.set(ConsoleType.WARN, { called: false });

        const called: any = someSpyCalled(spies);

        chai.expect(called).to.be.true;
    });

    it('return false if spy was not called', () => {
        const spies: Map<any, any> = new Map();
        spies.set(ConsoleType.ERROR, { called: false });
        spies.set(ConsoleType.WARN, { called: false });

        const called: any = someSpyCalled(spies);

        chai.expect(called).to.be.false;
    });
});
