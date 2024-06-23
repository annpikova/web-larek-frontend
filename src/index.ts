import './scss/styles.scss';

import { EventEmitter } from './components/base/events';
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
	Events,
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
events.on(Events.CARD_SELECT, (item: Product) => {
	appData.setPreview(item);
});

// Изменение кнопки добавления товара в корзину 
events.on(Events.PREVIEW_CHANGED, (item: Product) => {
	const showCard = (item: Product, buttonOptions: IButtonOptions) => {
		const card = new Card(
			'card',
			cloneTemplate(cardPreviewTemplate),
			buttonOptions,
			{
				onClick: () => events.emit(Events.BASKET_ITEM_ADD, item),
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
events.on(Events.BASKET_ITEM_ADD, (item: Product) => {
	appData.addBasket(item);
	page.setCounter(appData.order.items.length);
	modal.close();
});

// Блокировка прокрутки страницы при открытом модальном окне 
events.on(Events.MODAL_OPEN, () => {
	page.locked = true;
});

// Разблокировка прокрутки страницы 
events.on(Events.MODAL_CLOSE, () => {
	page.locked = false;
});

// Получение лотов с сервера
api
	.getProductList()
	.then(appData.setCatalog.bind(appData))
	.catch(console.error);

// Вывод карточек
events.on(Events.ITEMS_CHANGED, () => {
	page.catalog = appData.getProducts().map((item) => {
		const card = new Card('card', cloneTemplate(cardCatalogTemplate), null, {
			onClick: () => events.emit(Events.PREVIEW_CHANGED, item),
		});
		return card.render(item);
	});
});

// Открытие формы оплаты и адреса
events.on(Events.ORDER_OPEN, () => {
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
events.on(Events.FORM_ERRORS_CHANGE, (errors: Partial<IOrderForm>) => {
	const { address, payment } = errors;
	orderAddress.valid = !address && !payment;
	orderAddress.errors = Object.values({ address, payment })
		.filter((i) => !!i)
		.join(' и ');
});

// Открытие формы контактных данных 
events.on(Events.ORDER_SUBMIT, () => {
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
events.on(Events.FORM_ERRORS_CONTSACTS_CHANGE, (errors: Partial<IOrderForm>) => {
	const { email, phone } = errors;
	contacts.valid = !email && !phone;
	contacts.errors = Object.values({ phone, email })
		.filter((i) => !!i)
		.join(' и ');
});

// Отправка формы заказа
events.on(Events.SUCCESS_OPEN, () => {
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

events.on(Events.SUCCESS_CLOSE, () => {
	modal.close();
});

// Открытие корзины
events.on(Events.BASKET_OPEN, () => {
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
events.on(Events.BASKET_CHANGED, () => {
	const basketProducts = appData.order.items.map((item, index) => {
		const basketItem = new BasketProduct(cloneTemplate(cardBasketTemplate), {
			onClick: () => events.emit(Events.BASKET_REMOVE, item),
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
events.on(Events.BASKET_REMOVE, (item: Product) => {
	appData.removeBasket(item);
	page.setCounter(appData.order.items.length);
});

