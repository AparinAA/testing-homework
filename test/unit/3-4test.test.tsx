import React from "react";

import { render, screen, waitFor } from "@testing-library/react";
import {
    describe,
    it,
    expect,
    beforeEach,
    jest,
    beforeAll,
    afterAll,
    afterEach,
} from "@jest/globals";

import { Application } from "../../src/client/Application";
import { CartApi } from "../../src/client/api";
import { initStore } from "../../src/client/store";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { ProductShortInfo, Product, CartState } from "../../src/common/types";
import {
    InitCart,
    generateProducts,
    mockExampleApi,
    mockLocalStorage,
} from "./helpers";

const basename = "/hw/store";

const n = 5;

const products = generateProducts(n);

const api = mockExampleApi(basename, products);

const LOCAL_STORAGE_CART_KEY = "example-store-cart";

let localStorageMock = mockLocalStorage();

const cart = new CartApi();

let store = initStore(api, cart);

describe("Catalog", () => {
    let uniqueItems: HTMLElement[];

    beforeEach(async () => {
        const application = render(
            <MemoryRouter initialEntries={["/catalog"]}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            const loadingElem = screen.getByText("LOADING");
            return !loadingElem;
        });

        const items = await screen.findAllByTestId(/[0-9]+/);
        console.info(application.container.innerHTML);

        uniqueItems = items.filter((item) =>
            item.className.includes("ProductItem")
        );
    });

    it("Отображение в каталоге товаров, которые приходят с сервера", () => {
        expect(uniqueItems).toHaveLength(n);
    });

    it("Для каждого товара в каталоге отображается название, цена и ссылка на страницу с подробной информацией о товаре", async () => {
        uniqueItems.forEach((item) => {
            const name = item.querySelector("h5")?.innerHTML;
            const price = item.querySelector("p")?.innerHTML;
            const href = item.querySelector("a")?.href;
            const id = item.getAttribute("data-testid");

            const prodInd =
                products?.find((i) => +i.id === +(id ?? 0))?.id ?? 1;
            expect(name).toBe(products[prodInd - 1].name);
            expect(Number(price?.replace("$", ""))).toBe(
                products[prodInd - 1].price
            );
            expect(Number(href?.split("/")?.at(-1))).toBe(
                products[prodInd - 1].id
            );
        });
    });
});

describe("Product page", () => {
    const testId = 2;
    const original = window.location;
    const originalLocal = window.localStorage;

    const reloadFn = () => {
        window.location.reload();
    };

    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    let initCartState: CartState;

    beforeEach(() => {
        Object.defineProperty(window, "location", {
            configurable: true,
            value: { reload: jest.fn() },
        });

        initCartState = {
            1: {
                name: "name",
                price: 12,
                count: 1,
            },
        };

        localStorage.setItem(
            LOCAL_STORAGE_CART_KEY,
            JSON.stringify(initCartState)
        );

        store = initStore(api, cart);
    });

    afterEach(() => {
        Object.defineProperty(window, "location", {
            configurable: true,
            value: original,
        });

        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: originalLocal,
        });

        localStorage.clear();
    });

    it("на странице с подробной информацией отображаются: название товара, его описание, цена, цвет, материал и кнопка * * добавить в корзину", async () => {
        const application = render(
            <MemoryRouter initialEntries={["/catalog/2"]}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            const loadingElem = screen.getByText("LOADING");
            return !loadingElem;
        });

        const { getByTestId, findAllByTestId } = application;

        await screen.findAllByTestId(/[0-9]+/);

        const name = getByTestId(`name-${testId}`);
        const description = getByTestId(`description-${testId}`);
        const price = getByTestId(`price-${testId}`);
        const color = getByTestId(`color-${testId}`);
        const material = getByTestId(`material-${testId}`);
        const addcartButton = getByTestId("addcart");

        expect(name).not.toBeNull();
        expect(description).not.toBeNull();
        expect(price).not.toBeNull();
        expect(color).not.toBeNull();
        expect(material).not.toBeNull();
        expect(addcartButton).not.toBeNull();

        expect(name.innerHTML).toBe(products[1].name);
        expect(description.innerHTML).toBe(products[1].description);
        expect(Number(price.innerHTML.replace("$", ""))).toBe(
            products[1].price
        );
        expect(color.innerHTML).toBe(products[1].color);
        expect(material.innerHTML).toBe(products[1].material);
        expect(addcartButton.innerHTML).toBe("Add to Cart");
    });

    it("(Каталог) Если товар уже добавлен в корзину, в каталоге должно отображаться сообщение об этом", async () => {
        const application = render(
            <MemoryRouter initialEntries={["/catalog"]}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            const loadingElem = screen.getByText("LOADING");
            return !loadingElem;
        });

        const { getByTestId } = application;

        expect(getByTestId("itemincart-1")).not.toBeNull();
    });

    it("(Товар) Если товар уже добавлен в корзину, на странице товара должно отображаться сообщение об этом", async () => {
        const application = render(
            <MemoryRouter initialEntries={["/catalog/1"]}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            const loadingElem = screen.getByText("LOADING");
            return !loadingElem;
        });

        const { getByTestId } = application;

        expect(getByTestId("itemincart-1")).not.toBeNull();
    });

    it("После нажатия на кнопку Добавить товар, должно увеличиться количество", async () => {
        const application = render(
            <MemoryRouter initialEntries={["/catalog/1"]}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            const loadingElem = screen.getByText("LOADING");
            return !loadingElem;
        });

        const { getByTestId } = application;

        getByTestId("addcart").click();

        const oldCountProduct = initCartState["1"].count;
        const newCountProduct = cart.getState()["1"].count;

        expect(newCountProduct).toEqual(oldCountProduct + 1);
    });

    it("Cодержимое корзины должно сохраняться между перезагрузками страницы", async () => {
        const application = render(
            <MemoryRouter initialEntries={["/catalog/1"]}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </MemoryRouter>
        );

        expect(jest.isMockFunction(window.location.reload)).toBe(true);
        reloadFn();
        expect(window.location.reload).toHaveBeenCalled();

        expect(JSON.stringify(cart.getState())).toEqual(
            JSON.stringify(initCartState)
        );
    });
});

describe("Сart", () => {
    let initCartState: CartState;
    let num = 2;
    beforeAll(() => {
        initCartState = InitCart(num);

        localStorage.setItem(
            LOCAL_STORAGE_CART_KEY,
            JSON.stringify(initCartState)
        );

        store = initStore(api, cart);
    });

    afterAll(() => {
        localStorage.clear();
    });

    it("В шапке рядом со ссылкой на корзину должно отображаться количество не повторяющихся товаров в ней", async () => {
        const application = render(
            <BrowserRouter>
                <Provider store={store}>
                    <Application />
                </Provider>
            </BrowserRouter>
        );

        const { getByTestId } = application;

        const amountProduct = Object.keys(cart.getState()).length;

        const exptected =
            amountProduct > 0 ? `Cart (${amountProduct})` : "Cart";

        Array.from(getByTestId("navbar").querySelectorAll("a")).forEach(
            (item) => {
                if (item.href.split("/").at(-1) === "cart") {
                    expect(item.innerHTML).toEqual(exptected);
                }
            }
        );
    });

    it("В корзине должна отображаться таблица с добавленными в нее товарами", async () => {
        const application = render(
            <MemoryRouter initialEntries={["/cart"]}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </MemoryRouter>
        );

        const { findAllByTestId } = application;

        const items = await findAllByTestId(/^[1-3]$/);

        expect(items).toHaveLength(2);

        for (let item of items) {
            expect(item.tagName).toEqual("TR");
            expect(item.innerHTML).not.toEqual("");
        }
    });

    it("Для каждого товара должны отображаться название, цена, количество , стоимость, а также должна отображаться общая сумма заказа", async () => {
        const application = render(
            <MemoryRouter initialEntries={["/cart"]}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </MemoryRouter>
        );

        const { findAllByTestId, getByTestId } = application;

        const items = await findAllByTestId(/[1-3]/);

        const itemsInCart = cart.getState();
        let cumsum = 0;

        for (let key in itemsInCart) {
            const tempsum = itemsInCart[key].count * itemsInCart[key].price;
            cumsum += tempsum;

            expect(getByTestId(`name-${key}`).innerHTML).toEqual(
                itemsInCart[key].name
            );
            expect(
                Number(getByTestId(`price-${key}`).innerHTML.replace("$", ""))
            ).toEqual(itemsInCart[key].price);
            expect(Number(getByTestId(`count-${key}`).innerHTML)).toEqual(
                itemsInCart[key].count
            );
            expect(
                Number(getByTestId(`total-${key}`).innerHTML.replace("$", ""))
            ).toEqual(tempsum);
        }

        expect(
            Number(getByTestId("totalsum").innerHTML.replace("$", ""))
        ).toEqual(cumsum);
    });

    it('В корзине должна быть кнопка "очистить корзину", по нажатию на которую все товары должны удаляться', async () => {
        const application = render(
            <MemoryRouter initialEntries={["/cart"]}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </MemoryRouter>
        );

        const { getByTestId } = application;

        getByTestId("clearshoping").click();

        const itemsCheck = cart.getState();

        expect(Object.keys(itemsCheck).length).toEqual(0);
    });

    it("Если корзина пустая, должна отображаться ссылка на каталог товаров", async () => {
        localStorage.clear();
        store = initStore(api, cart);
        const application = render(
            <MemoryRouter initialEntries={["/cart"]}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </MemoryRouter>
        );

        const { getByTestId } = application;

        const shoppingCart = getByTestId("shoppingcart");

        expect(
            shoppingCart?.querySelector("a")?.href?.split("/")?.at(-1)
        ).toEqual("catalog");
    });
});
