import { createElement } from '../utils/dom';
import { TerminalCssClasses } from './TerminalTypes';
export interface ITerminalInputElement {
    input: HTMLTextAreaElement;
    focus(): void;
    bindInputEventListener(eventType: string, listener: EventListener): void;
}

export class TerminalInputElement implements ITerminalInputElement {
    public input: HTMLTextAreaElement;

    constructor() {
        this.input = createElement('textarea', TerminalCssClasses.Input);
        this.input.title = 'Terminal Input';
        this.input.id = 'terminal-input';
        this.input.wrap = 'off'; // Disables soft-wrapping
        this.input.spellcheck = true;
        this.input.autofocus = true;
        this.input.setAttribute('rows', '1');
        // Set additional properties and attributes
        // Optionally, bind the 'input' event listener here if it's standard for all input elements
        this.bindInputEventListener('input', this.autoExpand);
    }

    public focus(): void {
        this.input.focus();
    }

    public bindInputEventListener(eventType: string, listener: EventListener): void {
        this.input.addEventListener(eventType, listener);
    }

    private autoExpand(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        textarea.style.height = 'auto'; // Reset the height
        textarea.style.height = `${textarea.scrollHeight}px`; // Set to scrollHeight
    }
}

