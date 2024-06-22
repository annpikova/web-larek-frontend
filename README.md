# Проектная работа "Веб-ларек"

Стек: HTML, SCSS, TS, Webpack

Структура проекта:
- src/ — исходные файлы проекта
- src/components/ — папка с JS компонентами
- src/components/base/ — папка с базовым кодом

Важные файлы:
- src/pages/index.html — HTML-файл главной страницы
- src/types/index.ts — файл с типами
- src/index.ts — точка входа приложения
- src/styles/styles.scss — корневой файл стилей
- src/utils/constants.ts — файл с константами
- src/utils/utils.ts — файл с утилитами

## Установка и запуск
Для установки и запуска проекта необходимо выполнить команды

```
npm install
npm run start
```

или

```
yarn
yarn start
```
## Сборка

```
npm run build
```

или

```
yarn build
```

## Данные и типы данных, используемые в приложении

### Интерфейс для описания главной страницы 

Глобальное состояние приложения:
```
interface IAppState {
	catalog: IProduct[];
	basket: IProduct[];
	preview: string | null;
	order: IOrder | null;
}
```
Главная страница приложения:
```
interface IPage {
    counter: number;
    catalog: HTMLElement[];
    locked: boolean;
}
```

### Интерфейс для описания карточки товара 
Товар:
```
interface IProduct {
    id: string;
    description: string;
    image: string;
    title: string;
    category: string;
    price: number | null;
    getId(): string;
}
```
Карточка товара:
```
interface ICard extends IProduct {
    button?: string;
}
```

### Интерфейс для описания корзины с товарами
Отображение корзины:
```
interface IBasketView {
    items: HTMLElement[];
    total: number;
    button: HTMLButtonElement;
}
```
Интерфейс данных корзины с товарами:
```
interface IBasketModel {
    items: IProduct[];
    getTotal(): number;
    add(id: IProduct): void;
    remove(id: IProduct): void;
    clearBasket(): void;
}
```
Интерфейс для отображения отдельного продукта в корзине:
```
export interface IBasketProduct {
    deleteButton: string;
    index: number;
    title: string;
    price: number;
}
```
### Интерфейс для описания данных покупателя 
Форма контактных данных:
```
interface IOrderContacts {
    email: string;
    phone: string;
}
```
Форма оплаты и адреса доставки:
```
interface IOrderAddress {
    payment: string;
    address: string;
}
```
Общий тип данных для всех форм:
```
type IOrderForm = IOrderAddress & IOrderContacts;
```
Тип данных для отображения ошибок форм:
```
type FormErrors = Partial<Record<keyof IOrder, string>>;
```

### Интерфейс для описания покупки
Отправка данныз списка заказов на сервер:
```
interface IOrder {
	id: string;
	payment: string;
	email: string;
	phone: string;
	address: string;
	total: number;
	items: IProduct[];
}
```
API заказа:
```
interface IOrderAPI {
	payment: string;
	email: string;
	phone: string;
	address: string;
	total: number;
	items: string[];
}
```
Результат заказа:
```
interface IOrderResult {
    id: string[];
    total: number;
}
```
Отображение сообщения об успешном заказе:
```
interface ISuccess {
    total: number;
}
```

Отображение модального окна:
```
interface IModalData {
    content: HTMLElement;
}
``` 
Брокер событий:
```
interface IEventEmitter {
    emit: (event: string, data: unknown) => void;
}
```

## Архитектура приложения
Код приложения разделен на слои согласно парадигме MVP: 
- слой представления, отвечает за отображение данных на странице, 
- слой данных, отвечает за хранение и изменение данных
- презентер, отвечает за связь представления и данных.

### Базовый код

#### Класс Api
Содержит в себе базовую логику отправки HTTP-запросов (GET и POST). В конструктор передается базовый URL-адрес и опциональный объект с заголовками запросов. 

**Конструктор класса:**
- `constructor(baseUrl: string, options: RequestInit = {})` — принимает базовый URL и глобальные опции для всех запросов (опционально).

**Поля класса:**
- `baseUrl: string` — базовый URL-адрес.
- `options: RequestInit` — опциональный объект с заголовками запросов.

**Методы класса:** 
- `handleResponse(responce: Responce)` — обрабатывает ответы сервера, при отсутствии ответа возвращает ошибку.
- `get(uri: string)` — выполняет GET запрос на переданный в параметрах ендпоинт и возвращает промис с объектом, которым ответил сервер.
- `post (uri: string, data: object, method: ApiPostMethods = 'POST')` — принимает объект с данными, которые будут переданы в JSON в теле запроса, и отправляет эти данные на ендпоинт переданный как параметр при вызове метода. По умолчанию выполняется `POST` запрос, но метод запроса может быть переопределен заданием третьего параметра при вызове.


#### Класс EventEmitter
Брокер событий позволяет отправлять события и подписываться на события, происходящие в системе. Класс используется в презентере для обработки событий и в слоях приложения для генерации событий. 

**Конструктор класса:**
- `constructor() { this._events = new Map<EventName, Set<Subscriber>>() }` — задает свойство `_events`, которое использует `Map` для хранения обработчиков событий (ключ — имя события, значение — функции-обработчики).

**Методы класса:**
- `on <T extends object>(eventName: EventName, callback: (event: T) => void)` — устанавливает обработчик на событие.
- `off (eventName: EventName, callback: Subscriber)` — снимает обработчик с события.
- `emit <T extends object>(eventName: string, data?: T)` — инициирует событие с данными.   
- `onAll (callback: (event: EmitterEvent) => void)` — установливает/сбросывает обработчики для всех событий.
- `trigger <T extends object>(eventName: string, context?: Partial<T>)` — возвращает функцию, при вызове которой инициализируется событие, требуемое в параметрах. 

#### Класс Model
Абстрактный класс — модель, на основе которой создаются другие модели в приложении, работает с дженериками.

**Конструктор класса:**
- `constructor(data: Partial<T>, protected events: IEvents)` — принимает объект с данными и экземпляр `IEvents` для работы с событиями.

**Методы класса:**
- `emitChanges (event: string, payload?: object)` — сообщает об изменении модели и принимает два параметра: `event` (имя события) и `payload` (объект с дополнительными данными о событии).

#### Класс Component<T>
Базовый класс, являющийся дженериком и создающий компоненты пользовательского интерфейса. В конструктор принимает элемент разметки, являющийся основным родительским контейнером компонента. Содержит метод `render`, отвечающий за сохранение полученных в параметре данных в полях компонентов через их сеттеры, возвращает обновленный контейнер компонента. 

**Конструктор класса:**
- `constructor(protected readonly container: HTMLElement) {}` — принимает только один параметр — `container`.

**Методы класса**: 
- `toggleClass (element: HTMLElement, className: string, force?: boolean)` — переключает класс компонента, один из параметров — необязательный параметр типа boolean, позволяет использовать тогл только в одном направлении.
- `setText(element: HTMLElement, value: unknown)` — устанавливает текстовое содержимое компонента.
- `setImage(element: HTMLImageElement, src: string, alt?: string)` — устанавливает для компонента изображение с альтернативным текстом, если он был передан.
- `setDisabled(element: HTMLElement, state: boolean)` — меняет статус блокировки компонента, один из параметров — флаг boolean, в зависимости от которого снимается или устанавливается атрибут `disabled`.
- `render(data?: Partial<T>)` — возвращает корневой DOM-элемент с заполненными данными.
- `setHidden(element: HTMLElement)` — скрывает компонент.
- `protected setVisible(element: HTMLElement)` — показывает компонент.


### Слой данных

#### Класс AppState
Класс отвечает за хранение данных приложения, за счет чего появляется возможность отслеживать его состояние. Наследуется от класса `Model`. 

**Конструктор класса:**
- `constructor(data: Partial<IAppState>, events: IEvents)`

**Поля класса:**
- `catalog: IProduct[]` — список товаров в каталоге.
- `basket: string[]` — список товаров в корзине.
- `order: IOrder` — информация о заказе.
- `preview: string | null` — товар, выбранный для просмотра в модальном окне.
- `formErrors: FormErrors` — валидация форм при оформлении заказа.

**Методы класса:**
- `getOrderAPI()` — получает данные заказа с сервера.
- `addBasket()` — добавляет товар в корзину.
- `removeBasket()` — удаляет товар из корзины.
- `clearBasket()` — очищает всю корзину.
- `getTotal()` — определяет итоговую стоимость корзины.
- `updateCounter()` — обновляет счётчик корзины.
- `setCatalog(items: ILot[])` — устанавливает каталог карточек.
- `setPreview(item: LotItem)` — отображает товар в модальном окне.
- `setOrderField(field: keyof IOrderForm, value: string)` — устанавливает валидацию форм.
- `validateOrderAddress()` — валидация формы с адресом доставки и способом оплаты.
- `validateOrderContacts()` — валидация формы с контактами.

#### Класс Product
Отвечает за хранение данных отдельного товара. Расширяет базовый класс `Model` и вызывает его конструктор, чтобы унаследовать функционал.

**Поля класса:**
- `id: string` — id товара.
- `description: string` — описание товара.
- `image: string` — изображение товара.
- `title: string` — название товара.
- `category: string` — категория товара.
- `price: number` — стоимость товара.
- `isOrdered: boolean` — продукт заказан или не заказан.
- `index: number` — индекс продукта в корзине.

**Методы класса:**
- `getId(): string` — получает идентификатор конкретного товара.


### Классы представления
Все классы представления отвечают за отображение внутри контейнера (DOM-элемент) передаваемых в них данных.

#### Класс Page
Класс определяет методы, описанные в интерфейсе `IPage`, использует их для передачи данных в класс `Component` — отвечает за формирование главной страницы приложения.

**Конструктор класса:**
- `constructor(container: HTMLElement, protected events: IEvents)` — принимает DOM-элемент и объект для управления событиями; отвечает за инициализацию элементов страницы и установку обработчика события для открытия корзины с товарами по клику.

**Поля класса:**
- `_counter: HTMLElement` — счётчик товаров в корзине.
- `_catalog: HTMLElement` — список карточек товаров.
- `_basket: HTMLElement` — кнопка перехода к корзине.
- `_wrapper: HTMLElement` — контейнер-обертка страницы.

**Методы класса:**
- `set counter(value: number | null)` — отражает количество добавленных товаров в корзину, меняя ее счетчик.
- `set catalog(items: HTMLElement[])` — добавляет карточки товаров на страницу.
- `set locked(value: boolean)` — управляет блокировкой прокрутки страницы при открытом модальном окне.

#### Класс Modal
Класс определяет структуру данных, переданных в класс `Component`, используя интерфейс `IModalData`; отображает модальное окно.

**Конструктор класса:**
- `constructor(container: HTMLElement, protected events: IEvents)` — принимает DOM-элемент для размещения модального окна и объект для обработки событий.

**Поля класса:**
- `_closeButton: HTMLButtonElement` — кнопка закрытия модального окна.
- `_content: HTMLElement` — контент, выводящийся в модальном окне.

**Методы класса:**
- `set content(value: HTMLElement)` — устанавливает содержимое модального окна.
- `open()` — открывает модальное окно.
- `close()` — закрывает модальное окно.
- `render(data: IModalData)` — реализует модальное окно и открывает его.

#### Класс Card
Класс отображает на странице данные карточки товара.

**Конструктор класса:**
`constructor(protected blockName: string, container: HTMLElement, actions?: ICardActions)` — принимает первым аргументом имя блока, вторым — DOM-элемент и третьим (необязательным) — объект с обработчиком клика по карточке товара.

**Поля класса:**
- `_title: HTMLElement` — название товара.
- `_image?: HTMLImageElement` — изображение товара.
- `_description?: HTMLElement` — описание товара.
- `_button?: HTMLButtonElement` — кнопка действия.
- `price: number | null` — стоимость товара.
- `category: string` — категория товара.

**Методы класса:**
- `set id(value: string)` — устанавливает значение идентификатора товара.
- `get id()` — получает значение идентификатора товара.
- `set title(value: string)` — устанавливает название товара.
- `get title()` — получает название товара.
- `set image(value: string)` — устанавливает изображение товара.
- `set description(value: string | string[])` — устанавливает описание товара.
- `set price` — устанавливает стоимость товара.
- `set category()` — устанавливает категорию товара.

#### Класс Basket
Класс отображает корзину с добавленными товарами, а также предоставляет методы для управления ими.

**Конструктор класса:**
- `constructor(container: HTMLElement, protected events: EventEmitter)` — принимает элемент контейнера для инициализации элементов корзины и объект для управления событиями у кнопки оформления заказа.

**Поля класса:**
- `_list: HTMLElement` — элемент списка добавленных товаров в корзину.
- `_total: HTMLElement` — элемент итоговой стоимости корзины с товарами.
- `_button: HTMLElement` — элемент кнопки оформления заказа.

**Методы класса:**
- `set items(items: HTMLElement[])` — устанавливает список товаров в корзине.
- `set total(total: number)` — устанавливает итоговую стоимость товаров в корзине.

#### Класс BasketProduct
Реализует отображение товаров, добавленных в корзину, а также, предоставляет методы для управления ими.

Конструктор класса:
`constructor(container: HTMLElement, actions?: IBasketActions)` — принимает элемент контейнера и действие, доступное для управление товаром в корзине.

Свойства класса:
- `protected _deleteButton: HTMLButtonElement;` — кнопка удаления товара из корзины.
- `protected _index: HTMLElement;` — индекс товара.
- `protected _title: HTMLElement;` — название товара.
- `protected _price: HTMLElement;` — стоимость товара.

Методы:
- `set title(value: string[])` — устанавливает название товара.
- `set index(value: number)` — устанавливает индекс товара.
- `set price(value: number)` — устанавливает стоимость товара в корзине.

#### Класс Form
Класс отображает форму и обеспечивает взаимодействие с ней.

**Конструктор класса:**
- `constructor(protected container: HTMLFormElement, protected events: IEvents)` — вызывает конструктор родительского класса `Component`, принимает элемент формы и объект для управления событиями.

**Поля класса:**
- `_submit: HTMLButtonElement` — элемент кнопки подтверждения формы.
- `_errors: HTMLElement` — элемент отображения ошибки при отправке формы.

**Методы класса:**
- `onInputChange(field: keyof T, value: string)` — отслеживает изменения в полях ввода.
- `set valid(value: boolean)` — устанавливает состояние кнопки подтверждения формы при наличии ошибок в заполнении формы.
- `set errors(value: string)` — выводит текст ошибок валидации.
- `render(state: Partial<T> & IFormState)` — устанавливает итоговое состояние формы: значение полей ввода и ошибок валидации.

#### Класс Success
Класс отображает в модальном окне сообщение об успешном оформление заказа.

**Конструктор класса:**
- `constructor(container: HTMLElement, actions: ISuccessActions)` — вызывает конструктор родительского класса `Component`, принимает элемент контейнера и действия, доступные при успешном оформлении заказа.

**Поля класса:**
- `_close: HTMLElement` — DOM-элемент для закрытия окна.
- `total: number` — элемент итоговой стоимости заказа.

**Методы класса:**
- `set total(total: number)` — устанавливает итоговую стоимость заказа.

#### Класс OrderAddress
Класс отображает форму доставки и позволяет управлять ею, отвечает за хранение и изменение данных пользователя при оформлении заказа.

**Конструктор класса:**
- `constructor(container: HTMLFormElement, events: IEvents)` — вызывает конструктор родительского класса `Form`, принимает элемент формы и объект для управления событиями.

**Поля класса:**
- `protected _onlineButton: HTMLButtonElement` — кнопка Онлайн-заказа.
- `protected _cashButton: HTMLButtonElement` — кнопка оплаты наличными.
- `protected _paymentContainer: HTMLDivElement` — контейнер с кнопками выбора оплаты.
- `payment: string` — способ оплаты заказа.

**Методы класса:**
- `set address(value: string)` — устанавливает адрес доставки.
- `setPayment(field: keyof IOrderForm, value: string)` — устанавливает способ оплаты.

#### Класс OrderContacts
Класс отображает форму контактных данных и позволяет управлять ею, отвечает за хранение и изменение данных пользователя при оформлении заказа.

**Конструктор класса:**
- `constructor(container: HTMLFormElement, events: IEvents)` — вызывает конструктор родительского класса `Form`, принимает элемент формы и объект для управления событиями.

**Поля класса:**
- `protected _button: HTMLElement` — кнопка сабмита.
- `protected _phone: string` — email пользователя.
- `protected _email: string` — номер телефона пользователя.

**Методы класса:**
- `set phone(value: string)` — устанавливает номер телефона в форме контактных данных.
- `set email(value: string)` — устанавливает адрес электронной поты в форме контактных данных.

### Слой коммуникации

#### Взаимодействие компонентов
Код, описывающий взаимодействие представления и данных между собой, находится в файле `index.ts`, выполняющем роль презентера. Взаимодействие осуществляется за счет событий, генерируемых с помощью брокера событий и обработчиков этих событий, описанных в `index.ts`. В `index.ts` сначала создаются экземпляры всех необходимых классов, а затем настраивается обработка событий.

#### Список всех событий, которые могут генерироваться в системе
- `modal:open` — открытие модального окна.
- `modal:close` — закрытие модального окна.
- `card:select` — выбор товара для отображения в модальном окне.
- `items:changed` — изменение каталога карточек.
- `preview:changed` — изменение открытой карточки.
- `basket:open` — открытие модального окна корзины.
- `basket:changed` — изменение корзины.
- `basket:item-add` — добавление товара в корзину.
- `basket:remove` — удаление товара из корзины.
- `order:submit` — отправка формы адреса и способа оплаты.
- `order:open` — открытие формы адреса и способа оплаты.
- `order:change` — изменение одного из полей формы адреса и способа оплаты.
- `contacts:change` — изменение одного из полей формы контактов.
- `formErrors:change` — изменение состояния валидации формы адреса и способа оплаты.
- `formErrorsContacts:change` — изменение состояния валидации формы контактов.
- `success:open` — открытие окна успешного заказа.
- `success:close` — закрытие окна успешного заказа.

