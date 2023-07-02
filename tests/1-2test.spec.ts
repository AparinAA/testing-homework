import { test, expect, chromium, Locator } from "@playwright/test";

test.describe("Адаптивность шапки", () => {
    let NAMESTORE = "Example store";
    let page: any;
    let header: Locator;

    interface UrlRouter {
        [index: string]: string | RegExp;
    }
    const urlRouter: UrlRouter = {
        "/hw/store/": NAMESTORE,
        "/hw/store/catalog": "Catalog",
        "/hw/store/delivery": "Delivery",
        "/hw/store/contacts": "Contacts",
        "/hw/store/cart": /Cart\s?[0-9]*/,
    };

    test.beforeAll(async () => {
        const browser = await chromium.launch();
        page = await browser.newPage();
        await page.goto("http://localhost:3000/hw/store");
        header = await page.getByTestId("navbar");
    });

    // к каждой странице
    test("В магазине должны быть страницы: главная, каталог, условия доставки, контакты", async () => {
        const allLinksHeader = await header.getByRole("link").all();

        for (let link of allLinksHeader) {
            const hrefName = await link.getAttribute("href");

            if (hrefName) {
                await expect(link).toHaveText(urlRouter[hrefName]);
            } else {
                await expect(link).toHaveText(NAMESTORE);
            }
        }
    });

    test("Название магазина в шапке должно быть ссылкой на главную страницу", async () => {
        await header.getByText(NAMESTORE).click();

        await expect(page).toHaveURL(/^.*hw\/store\/?$/);
    });

    test.afterAll(async ({ browser }) => {
        await browser.close();
    });
});
