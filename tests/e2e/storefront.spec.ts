import { test, expect } from "@playwright/test";
const publicPages = [
  "",
  "shop",
  "shop/household",
  "wholesale",
  "about",
  "contact",
  "faq",
  "blog",
  "shipping-returns",
  "privacy",
  "terms",
  "cookies",
  "cart",
  "checkout",
  "track-order",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
];
test("public routes in both languages and protected routes", async ({ page }) => {
  for (const locale of ["sq", "en"])
    for (const path of publicPages) {
      const response = await page.goto(`/${locale}/${path}`);
      expect(response?.status(), `${locale}/${path}`).toBe(200);
      await expect(page.locator("main h1")).toHaveCount(1);
    }
  await page.goto("/en/account/orders");
  await expect(page).toHaveURL(/\/en\/login/);
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/sq\/login/);
});
test("browse, filter, add to bag, update and checkout", async ({ page }) => {
  await page.goto("/en/shop");
  await page.getByRole("button", { name: "Necessary only" }).click();
  await page.getByRole("button", { name: "Add to bag Everyday foil · 10 m", exact: true }).click();
  await page.getByRole("button", { name: "Your bag", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByRole("spinbutton", { name: "Quantity" })).toHaveValue("2");
  await page.getByRole("link", { name: "Checkout", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await page.reload();
  await expect(page.getByText("2 × Everyday foil · 10 m")).toBeVisible();
  await page.goto("/en/shop?q=catering&stock=1");
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page
    .getByRole("link", { name: /Catering foil · 100 m/ })
    .first()
    .click();
  await expect(page.locator("h1")).toHaveText("Catering foil · 100 m");
});
test("mobile menu, search, language and unknown route", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/en");
  await page.getByRole("button", { name: "Necessary only" }).click();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/contact/);
  await page.getByRole("button", { name: "Search products and guides" }).click();
  await page.getByRole("combobox").fill("baking");
  await expect(page.locator("[cmdk-item]")).toHaveCount(2);
  await page.keyboard.press("Escape");
  const response = await page.goto("/en/missing-page");
  expect(response?.status()).toBe(404);
});
test("preview APIs fail explicitly without pretending success", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  if ((await health.json()).status === "preview") {
    const response = await request.post("/api/contact", {
      data: {
        name: "Example",
        email: "test@example.com",
        message: "This is a test contact message",
        locale: "en",
      },
    });
    expect(response.status()).toBe(503);
    expect((await response.json()).error).toBe("SERVICE_UNAVAILABLE");
  }
});
