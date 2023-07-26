export class WithError extends HTMLElement {
    connectedCallback() {
        console.error('firstErrorExcluded');

        console.error(
            'secondErrorNotExcluded',
            1,
            { foo: 'bar' },
            ['a', 1],
            undefined,
            null
        );
    }
}

export class WithExcludedError extends HTMLElement {
    connectedCallback() {
        console.error('secondErrorExcluded');
    }
}

export class WithErrorFromError extends HTMLElement {
    connectedCallback() {
        try {
            throw new Error('thirdErrorExcluded');
        } catch (error) {
            console.log(error);
        }

        try {
            const _undefined = undefined;
            // @ts-ignore
            _undefined.map(() => true);
        } catch (error) {
            console.error(error);
        }
    }
}

export class WithErrorNotExcluded extends HTMLElement {
    connectedCallback() {
        console.error('errorNotExcluded');
    }
}

export class WithErrorInTimeout extends HTMLElement {
    connectedCallback() {
        setTimeout(() => {
            console.error('errorNotExcluded');
        }, 1000);
    }
}

export class WithInfo extends HTMLElement {
    connectedCallback() {
        console.info('consoleInfoMessage');
    }
}

export class WithWarn extends HTMLElement {
    connectedCallback() {
        console.info('consoleWarnMessage');
    }
}

export class WithNoConsole extends HTMLElement {}
