
export function createElement<T extends HTMLElement>(tagName: keyof HTMLElementTagNameMap, className?: string): T {
    const element = document.createElement(tagName) as T;
    if (className) {
        element.id = className;
        element.classList.add(className);
    }
    return element;
}

export function createHTMLElementFromHTML(htmlString: string): HTMLElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body.firstChild as HTMLElement;
}