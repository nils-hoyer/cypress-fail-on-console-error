import { isSpyExluded } from '../dist/index';
import { expect } from 'chai';

describe('isSpyExluded()', () => {
    it('without config.exclude should return false', () => {
        const spy: any = {
            args: [['foo']],
        };
        const config: any = {};

        const expected = isSpyExluded(spy, config);

        expect(expected).to.be.false;
    });

    it('without config.exlude matching spy error message should return false', () => {
        const spy: any = {
            args: [['foo']],
        };

        const config: any = {
            exclude: ['bar'],
        };

        const expected = isSpyExluded(spy, config);
        expect(expected).to.be.false;
    });

    it('with config.exlude matching spy error message should return true', () => {
        const spy: any = {
            args: [['foo']],
        };

        const config: any = {
            exclude: ['foo'],
        };

        const expected = isSpyExluded(spy, config);
        expect(expected).to.be.true;
    });
});
