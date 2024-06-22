import './scss/styles.scss';

import { EventEmitter } from './components/base/Events';
import { Modal } from './components/common/Modal';
import { AppState, CatalogChangeEvent, Product } from './components/AppData';
import { Basket, BasketProduct } from './components/Basket';
import { Card, IButtonOptions } from './components/Card';
import { OrderAddress, OrderContacts } from './components/Order';
import { Page } from './components/Page';
import { Success } from './components/Success';
import { WebLarekAPI } from './components/WebLarekApi';
import { API_URL, CDN_URL } from './utils/constants';
import { cloneTemplate, createElement, ensureElement } from './utils/utils';
import {
	IProduct,
	IOrderResult,
	IOrderAddress,
	IOrderContacts,
	IOrderForm,
	ICard,
} from './types';

const events = new EventEmitter();
const api = new WebLarekAPI(CDN_URL, API_URL);

// Чтобы мониторить все события, для отладки
events.onAll(({ eventName, data }) => {
	console.log(eventName, data);
});

// Все шаблоны
const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card-catalog');
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#card-preview');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const orderTemplate = ensureElement<HTMLTemplateElement>('#order');
const contactsTemplate = ensureElement<HTMLTemplateElement>('#contacts');
const successTemplate = ensureElement<HTMLTemplateElement>('#success');

// Все контейнеры 
const appData = new AppState({}, events);
const page = new Page(document.body, events);
const modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);
const basket = new Basket(cloneTemplate(basketTemplate), events);
const orderAddress = new OrderAddress(cloneTemplate(orderTemplate), events);
const contacts = new OrderContacts(cloneTemplate(contactsTemplate), events);

// Открытие карточки товара
events.on('card:select', (item: Product) => {
	appData.setPreview(item);
});

// Изменение кнопки добавления товара в корзину 
events.on('preview:changed', (item: Product) => {
	const showCard = (item: Product, buttonOptions: IButtonOptions) => {
		const card = new Card(
			'card',
			cloneTemplate(cardPreviewTemplate),
			buttonOptions,
			{
				onClick: () => events.emit('basket:item-add', item),
			}
		);

		modal.render({
			content: card.render(item),
		});
	};

	if (item) {
		api
			.getProductItem(item.id)
			.then((result) => {
				item.description = result.description;
				showCard(item, {
					disabledButton: appData.findOrderItem(item) != null,
					buttonText: 'Уже в корзине',
				});
			})
			.catch(console.error);
	} else {
		modal.close();
	}
});

// Добавление карточки в корзину
events.on('basket:item-add', (item: Product) => {
	appData.addBasket(item);
	page.setCounter(appData.order.items.length);
	modal.close();
});

// Блокировка прокрутки страницы при открытом модальном окне 
events.on('modal:open', () => {
	page.locked = true;
});

// Разблокировка прокрутки страницы 
events.on('modal:close', () => {
	page.locked = false;
});

// Получение лотов с сервера
api
	.getProductList()
	.then(appData.setCatalog.bind(appData))
	.catch(console.error);

// Вывод карточек
events.on('items:changed', () => {
	page.catalog = appData.getProducts().map((item) => {
		const card = new Card('card', cloneTemplate(cardCatalogTemplate), null, {
			onClick: () => events.emit('preview:changed', item),
		});
		return card.render(item);
	});
});

// Открытие формы оплаты и адреса
events.on('order:open', () => {
	modal.render({
		content: orderAddress.render({
			address: orderAddress.address,
			payment: orderAddress.payment,
			valid: false,
			errors: [],
		}),
	});
});

// Изменение состояния валидации формы 
events.on('formErrors:change', (errors: Partial<IOrderForm>) => {
	const { address, payment } = errors;
	orderAddress.valid = !address && !payment;
	orderAddress.errors = Object.values({ address, payment })
		.filter((i) => !!i)
		.join(' и ');
});

// Открытие формы контактных данных 
events.on('order:submit', () => {
	modal.render({
		content: contacts.render({
			phone: '',
			email: '',
			valid: false,
			errors: [],
		}),
	});
});

// Изменение одного из полей в формах
events.on(
	/^(order|contacts)\..*:change/,
	(data: { field: keyof IOrderForm; value: string }) => {
		appData.setOrderField(data.field, data.value);
	}
);

// Изменение состояния валидации формы
events.on('formErrorsContacts:change', (errors: Partial<IOrderForm>) => {
	const { email, phone } = errors;
	contacts.valid = !email && !phone;
	contacts.errors = Object.values({ phone, email })
		.filter((i) => !!i)
		.join(' и ');
});

// Отправка формы заказа
events.on('success:open', () => {
	api
		.orderProducts(appData.getOrderAPI())
		.then(() => {
			const success = new Success(cloneTemplate(successTemplate), events);
			success.total = appData.getTotal();
			modal.close();
			appData.clearBasket();
			page.counter = appData.basket.length;
			modal.render({
				content: success.render({}),
			});
		})
		.catch(console.error);
});

events.on('success:close', () => {
	modal.close();
});

// Открытие корзины
events.on('basket:open', () => {
	page.setCounter(appData.order.items.length);
	modal.render({
		content: createElement<HTMLElement>('div', {}, [
			basket.render({
				total: appData.getTotal(),
			}),
		]),
	});
});

// Отображение элементов в корзине
events.on('basket:changed', () => {
	const basketProducts = appData.order.items.map((item, index) => {
		const basketItem = new BasketProduct(cloneTemplate(cardBasketTemplate), {
			onClick: () => events.emit('basket:remove', item),
		});
		return basketItem.render({
			title: item.title,
			price: item.price,
			index: index + 1,
		});
	});
	basket.render({
		items: basketProducts,
		total: appData.getTotal(),
	});
});

// Удаление товаров из корзины и обновление количества товаров
events.on('basket:remove', (item: Product) => {
	appData.removeBasket(item);
	page.setCounter(appData.order.items.length);
});

