import { Model } from './base/Model';
import {
	Events,
	IFormErrors,
	IAppState,
	IOrderAPI,
	IProduct,
	IOrder,
	IOrderForm,
	IOrderAddress,
	IOrderContacts,
} from '../types/index';

export type CatalogChangeEvent = {
	catalog: Product[];
};

export class Product extends Model<IProduct> {
	id: string;
	description: string;
	image: string;
	title: string;
	category: string;
	price: number | null;
	isOrdered: boolean;
	index: number;
	getId(): string {
		return this.id;
	}
}

export class AppState extends Model<IAppState> {
	basket: string[] = [];
	_catalog: Product[];
	loading: boolean;
	orderAddress: IOrderAddress = {
		payment: '',
		address: '',
	};

	contacts: IOrderContacts = {
		email: '',
		phone: '',
	};

	protected _order: IOrder = {
		id: '',
		payment: '',
		email: '',
		phone: '',
		address: '',
		total: 0,
		items: [],
	};

	preview: string | null;
	formErrors: IFormErrors = {};

	get order() {
		return this._order;
	}

	getOrderAPI() {
		const orderApi: IOrderAPI = {
			payment: this._order.payment,
			email: this._order.email,
			phone: this._order.phone,
			address: this._order.address,
			total: 0,
			items: [],
		};
		orderApi.items = this._order.items.map((item) => item.id);
		orderApi.total = this.getTotal();
		return orderApi;
	}

	addBasket(item: Product) {
		if (this.findOrderItem(item) === null) {
			this._order.items.push(item);
			this.emitChanges(Events.BASKET_CHANGED);
		}
	}

	removeBasket(item: Product) {
		this._order.items = this._order.items.filter((el) => el.id != item.id);
		this.emitChanges(Events.BASKET_CHANGED);
	}

	clearBasket() {
		this._order.items = [];
		this.emitChanges(Events.BASKET_CHANGED);
	}

	getTotal() {
		this._order.total = this._order.items.reduce((prev, current) => prev + current.price, 0);
		return this._order.total;
	}

	getProducts(): Product[] {
		return this._catalog;
	}

	findOrderItem(item: Product) {
		const orderItemIndex = this._order.items.findIndex(
			(id) => id.getId() === item.id
		);

		if (orderItemIndex !== -1) {
			return orderItemIndex;
		} else {
			return null;
		}
	}

	updateCounter(): number {
		return this.basket.length;
	}

	setCatalog(items: IProduct[]) {
		this._catalog = items.map((item) => new Product(item, this.events));
		this.emitChanges(Events.ITEMS_CHANGED, { catalog: this._catalog });
	}

	setPreview(item: Product) {
		this.preview = item.id;
		this.emitChanges(Events.PREVIEW_CHANGED, item);
	}

	setOrderField(field: keyof IOrderForm, value: string) {
		this.order[field] = value;

		if (this.validateOrderAddress()) {
			this.events.emit('order:ready', this.order);
		}

		if (this.validateOrderContact()) {
			this.events.emit('order:ready', this.order);
		}
	}

	validateOrderAddress() {
		const errors: typeof this.formErrors = {};

		if (!this.order.address) {
			errors.address = 'Необходимо указать адрес доставки';
		}
		if (!this.order.payment) {
			errors.payment = 'Необходимо выбрать способ оплаты';
		}

		this.formErrors = errors;
		this.events.emit(Events.FORM_ERRORS_CHANGE, this.formErrors);

		return Object.keys(errors).length === 0;
	}

	validateOrderContact() {
		const errors: typeof this.formErrors = {};

		if (!this.order.email) {
			errors.email = 'Необходимо указать адрес эл. почты';
		}

		if (!this.order.phone) {
			errors.phone = 'Необходимо указать номер телефона';
		}

		this.formErrors = errors;
		this.events.emit(Events.FORM_ERRORS_CONTSACTS_CHANGE, this.formErrors);

		return Object.keys(errors).length === 0;
	}
}
