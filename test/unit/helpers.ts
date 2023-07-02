import { AxiosResponse } from "axios";
import { ExampleApi } from "../../src/client/api";
import { CartState, Product, ProductShortInfo } from "../../src/common/types";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Provider } from "react";
type ProductUP = Product & ProductShortInfo;

export const generateProducts = (n: number) =>
    new Array(n).fill(0).map((e, i) => ({
        id: i + 1,
        name: `prod ${i + 1}`,
        price: 10 + i + 1,
        material: "material",
        color: "color",
        description: "description",
    }));

export function mockExampleApi(basename: string, products: ProductUP[]) {
    const api = new ExampleApi(basename);
    api.getProducts = async () => {
        const res = await Promise.resolve({
            data: products as ProductShortInfo[],
        });
        return res as AxiosResponse<ProductShortInfo[], any>;
    };

    api.getProductById = async (id: number) => {
        const res = await Promise.resolve({ data: products[id - 1] });
        return res as AxiosResponse<Product, any>;
    };

    return api;
}

interface storage {
    [index: string]: string;
}

export function mockLocalStorage() {
    let store: storage = {};
    return {
        getItem: function (key: string) {
            return store[key];
        },
        setItem: function (key: string, value: string) {
            store[key] = value.toString();
        },
        clear: function () {
            store = {};
        },
        removeItem: function (key: string) {
            if (Object.keys(store).length && store[key]) {
                delete store[key];
            }
        },
    };
}

export function InitCart(num: number) {
    const initCartState: CartState = {};

    for (let i = 0; i < num; i++) {
        initCartState[i + 1] = {
            name: `prod ${i + 1}`,
            price: 11 + i,
            count: 1,
        };
    }

    return initCartState;
}
