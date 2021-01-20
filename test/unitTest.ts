import * as chai from 'chai';
import { AssertionError } from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {
    createConfig,
    createSpies,
    getIncludedSpy,
    isExludeMessage,
    resetSpies,
    someSpyCalled,
    validateConfig,
} from '../dist/index';
import { Config } from '../dist/types/Config';
import { ConsoleType } from '../dist/types/ConsoleType';

chai.should();
chai.use(sinonChai);

describe('createConfig()', () => {
    it('when includeConsoleType is not set use default ConsoleType.ERROR', () => {
        const config: Config = {};

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
        const config: Config = {
            includeConsoleTypes: ['unknownConsoleType'] as any,
        };

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

        const spies: Map<ConsoleType, sinon.SinonSpy> = createSpies(
            config,
            console
        );

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

describe('resetSpies()', () => {
    it('when resetHistory on spies called should be false', () => {
        const objectToSpy: any = { error: () => true, warn: () => true };
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, sinon.spy(objectToSpy, 'error'));
        spies.set(ConsoleType.WARN, sinon.spy(objectToSpy, 'warn'));
        objectToSpy.error();
        chai.expect(spies.get(ConsoleType.ERROR)).be.called;
        chai.expect(spies.get(ConsoleType.WARN)).not.be.called;

        const expectedSpies: Map<ConsoleType, sinon.SinonSpy> = resetSpies(
            spies
        );

        chai.expect(expectedSpies.get(ConsoleType.ERROR)).not.be.called;
        chai.expect(expectedSpies.get(ConsoleType.WARN)).not.be.called;
    });
});

describe('someSpyCalled()', () => {
    it('return true if spy was called', () => {
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, { called: true } as sinon.SinonSpy);
        spies.set(ConsoleType.WARN, { called: false } as sinon.SinonSpy);

        const called: any = someSpyCalled(spies);

        chai.expect(called).to.be.true;
    });

    it('return false if spy was not called', () => {
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, { called: false } as sinon.SinonSpy);
        spies.set(ConsoleType.WARN, { called: false } as sinon.SinonSpy);

        const exptecedSpyCalled: boolean = someSpyCalled(spies);

        chai.expect(exptecedSpyCalled).to.be.false;
    });
});

describe('getIncludedSpy()', () => {
    it('when spies contains some spy not matching exludeMessage should return spy', () => {
        const config: Config = { excludeMessages: ['foo', 'bar'] };
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, {
            called: true,
            args: [['foo']],
        } as sinon.SinonSpy);
        spies.set(ConsoleType.WARN, {
            called: true,
            args: [['expectedSpy']],
        } as sinon.SinonSpy);

        const expectedSpy: sinon.SinonSpy = getIncludedSpy(spies, config);

        chai.expect(expectedSpy.args[0][0]).to.equals('expectedSpy');
    });

    it('when spies contains not called or spy matching exludeMessage should return undefined', () => {
        const config: Config = { excludeMessages: ['foo'] };
        const spies: Map<ConsoleType, sinon.SinonSpy> = new Map();
        spies.set(ConsoleType.ERROR, { called: false } as sinon.SinonSpy);
        spies.set(ConsoleType.WARN, {
            called: false,
            args: [['bar']],
        } as sinon.SinonSpy);
        spies.set(ConsoleType.INFO, {
            called: true,
            args: [['foo']],
        } as sinon.SinonSpy);

        const expectedSpy: sinon.SinonSpy = getIncludedSpy(spies, config);

        chai.expect(expectedSpy).to.be.undefined;
    });
});

describe('isExludeMessage()', () => {
    it('with config.excludeMessages matching spy error message should return true', () => {
        const spy: sinon.SinonSpy = { args: [['foo']] } as sinon.SinonSpy;
        const config: Config = { excludeMessages: ['foo'] };

        const expected = isExludeMessage(spy, config);

        chai.expect(expected).to.be.true;
    });

    it('without config.excludeMessages should return false', () => {
        const spy: sinon.SinonSpy = { args: [['foo']] } as sinon.SinonSpy;
        const config: Config = {};

        const expected = isExludeMessage(spy, config);

        chai.expect(expected).to.be.false;
    });

    it('without config.excludeMessages matching spy error message should return false', () => {
        const spy: sinon.SinonSpy = { args: [['foo']] } as sinon.SinonSpy;
        const config: Config = { excludeMessages: ['bar'] };

        const expected = isExludeMessage(spy, config);

        chai.expect(expected).to.be.false;
    });
});
