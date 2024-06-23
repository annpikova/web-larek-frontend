import { Form } from './common/Form';
import { IOrderContacts, IOrderAddress, IOrderForm } from '../types/index';
import { EventEmitter, IEvents } from './base/events';
import { ensureElement } from '../utils/utils';
import { Events } from '../types';

export class OrderAddress extends Form<IOrderAddress> {
	protected _onlineButton: HTMLButtonElement;
	protected _cashButton: HTMLButtonElement;
	protected _paymentContainer: HTMLDivElement;
	payment: string;

	constructor(container: HTMLFormElement, events: IEvents) {
		super(container, events);

		this._paymentContainer = ensureElement<HTMLDivElement>(
			'.order__buttons',
			this.container
		);
		this._onlineButton = this._paymentContainer.querySelector('[name="card"]');
		this._cashButton = this._paymentContainer.querySelector('[name="cash"]');

		if (this._cashButton) {
			this._cashButton.addEventListener('click', (el) => {
				el.preventDefault();
				this.toggleCash();
				this.toggleCard(false);
				this.setPayment('payment', 'При получении');
			});
		}
		if (this._onlineButton) {
			this._onlineButton.addEventListener('click', (el) => {
				el.preventDefault;
				this.toggleCard();
				this.toggleCash(false);
				this.setPayment('payment', 'Онлайн');
			});
		}
	}

	set address(value: string) {
		(this.container.elements.namedItem('address') as HTMLInputElement).value =
			'';
	}

	toggleCard(state: boolean = true) {
		this.toggleClass(this._onlineButton, 'button_alt-active', state);
	}

	toggleCash(state: boolean = true) {
		this.toggleClass(this._cashButton, 'button_alt-active', state);
	}

	setPayment(field: keyof IOrderForm, value: string) {
		this.events.emit('order.payment:change', { field, value });
	}
}

export class OrderContacts extends Form<IOrderContacts> {
	protected _button: HTMLElement;
	protected _inputEmail: HTMLElement;
	protected _inputPhone: HTMLElement;

	constructor(container: HTMLFormElement, events: EventEmitter) {
		super(container, events);

		this._button = container.querySelector('.button[type="submit"]');
		this._inputEmail = this.container.querySelector('input[name="email"]');
		this._inputPhone = this.container.querySelector('button[type="submit"]');

		this.container.addEventListener('submit', (event: Event) => {
			event.preventDefault();
			this.events.emit(Events.SUCCESS_OPEN);
		});
	}

	set phone(value: string) {
		(this.container.elements.namedItem('phone') as HTMLInputElement).value =
			value;
	}

	set email(value: string) {
		(this.container.elements.namedItem('email') as HTMLInputElement).value =
			value;
	}
}
