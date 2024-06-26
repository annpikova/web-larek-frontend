import { Component } from '../base/Component';
import { ensureElement } from '../../utils/utils';
import { IEvents } from '../base/events';
import { Events } from '../../types';

interface IModalData {
	content: HTMLElement;
}

export class Modal extends Component<IModalData> {
	protected _closeButton: HTMLButtonElement;
	protected _content: HTMLElement;

	constructor(container: HTMLElement, protected events: IEvents) {
		super(container);
		this._closeButton = ensureElement<HTMLButtonElement>(
			'.modal__close',
			container
		);
		this._content = ensureElement<HTMLElement>('.modal__content', container);
		this._closeButton.addEventListener('click', this.close.bind(this));
		this.container.addEventListener('click', this.close.bind(this));
		this._content.addEventListener('click', (event) => event.stopPropagation());
	}

	set content(value: HTMLElement) {
		this._content.replaceChildren(value);
	}

	open() {
		this._toggleModal();
		document.addEventListener('keydown', this._handleEscape);
		this.events.emit(Events.MODAL_OPEN);
	}

	close() {
		this._toggleModal(false);
		this.content = null;
		document.removeEventListener('keydown', this._handleEscape);
		this.events.emit(Events.MODAL_CLOSE);
	}

	render(data: IModalData): HTMLElement {
		super.render(data);
		this.open();
		return this.container;
	}

	// рекомендации из пачки:

	// переключение модального окна,
	// во избежание передачи каждый раз селектора и контейнера
	_toggleModal(state: boolean = true) {
		this.toggleClass(this.container, 'modal_active', state);
	}

	// обработчик в виде стрелочного метода,
	// во избежание потери контекста `this`
	_handleEscape = (evt: KeyboardEvent) => {
		if (evt.key === 'Escape') {
			this.close();
		}
	};
}
