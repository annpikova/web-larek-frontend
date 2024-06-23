export interface IAppState {
	catalog: IProduct[]; // вместо catalog products
	basket: IProduct[];
	preview: string | null;
	order: IOrder | null;
}

export interface IPage {
	counter: number;
	catalog: HTMLElement[]; // вместо catalog products
	locked: boolean;
}

export interface IProduct {
	id: string;
	description: string;
	image: string;
	title: string;
	category: string;
	price: number | null;
	getId(): string;
}

export interface ICard extends IProduct {
	button?: string;
}

export interface IBasketView {
	items: HTMLElement[];
	total: number;
	button: HTMLButtonElement;
}

export interface IBasketModel {
	items: IProduct[];
	getTotal(): number;
	add(id: IProduct): void;
	remove(id: IProduct): void;
	clearBasket(): void;
}

export interface IBasketProduct {
	deleteButton: string;
	index: number;
	title: string;
	price: number;
}

export interface IOrderContacts {
	email: string;
	phone: string;
}

export interface IOrderAddress {
	payment: string;
	address: string;
}

export interface IOrder {
	id: string;
	payment: string;
	email: string;
	phone: string;
	address: string;
	total: number;
	items: IProduct[];
}

export interface IOrderAPI {
	payment: string;
	email: string;
	phone: string;
	address: string;
	total: number;
	items: string[];
}

export interface IOrderResult {
	id: string[];
	total: number;
}

export interface ISuccess {
	total: number;
}

export interface IModalData {
	content: HTMLElement;
}

export interface IEventEmitter {
	emit: (event: string, data: unknown) => void;
}

export type IOrderForm = IOrderAddress & IOrderContacts;
export type IFormErrors = Partial<Record<keyof IOrder, string>>;

export enum Events {
	MODAL_OPEN = 'modal:open',
	MODAL_CLOSE = 'modal:close',
	CARD_SELECT = 'card:select',
	ITEMS_CHANGED = 'items:changed',
	PREVIEW_CHANGED = 'preview:changed',
	BASKET_OPEN = 'basket:open',
	BASKET_CHANGED = 'basket:changed',
	BASKET_ITEM_ADD = 'basket:item-add',
	BASKET_REMOVE = 'basket:remove',
	ORDER_SUBMIT = 'order:submit',
	ORDER_OPEN = 'order:open',
	ORDER_CHANGE = 'order:change',
	CONTACTS_CHANGE = 'contacts:change',
	FORM_ERRORS_CHANGE = 'formErrors:change',
	FORM_ERRORS_CONTSACTS_CHANGE = 'formErrorsContacts:change',
	SUCCESS_OPEN = 'success:open',
	SUCCESS_CLOSE = 'success:close',
}
