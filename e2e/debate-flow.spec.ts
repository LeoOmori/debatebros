import { expect, test } from "@playwright/test";

const argumentsByStage = [
  "Acredito em liberdade prática porque conseguimos revisar nossos impulsos antes de agir.",
  "A influência das circunstâncias não elimina a capacidade de responder a razões e mudar de direção.",
  "Concluo que liberdade não exige ausência de causas, mas reflexão responsável entre alternativas reais.",
];

test("completes the structured debate and records report feedback", async ({ page }) => {
  await page.goto("/debate/new");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Entrar no ar" }).click();
  await expect(page).toHaveURL(/\/debate\/session$/);

  for (const argument of argumentsByStage) {
    const input = page.getByRole("textbox", { name: "Seu argumento" });
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill(argument);
    await page.getByRole("button", { name: /Transmitir argumento|Enviar para o juiz/ }).click();
  }

  await expect(page).toHaveURL(/\/debate\/result$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/venceu|empate/i);
  const notas = page.getByLabel("Notas da avaliação");
  await expect(notas.getByRole("progressbar")).toHaveCount(5);
  // A evidência não fica mais na página: ela abre no leitor.
  await notas.getByRole("button", { name: "Por quê?" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Sim" }).click();
  await expect(page.getByText("Resposta registrada neste protótipo.")).toBeVisible();
});

test("runs a debate on a thesis written by the person", async ({ page }) => {
  await page.goto("/debate/new");
  const thesis = "O anonimato online melhora o debate público?";
  const start = page.getByRole("button", { name: "Entrar no ar" });

  await page.getByRole("radio", { name: "Escrever minha própria tese" }).check();
  await expect(start).toBeDisabled();

  await page.getByRole("textbox", { name: "Sua tese" }).fill(thesis);
  await expect(start).toBeEnabled();
  await start.click();

  await expect(page).toHaveURL(/\/debate\/session$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(thesis);

  const input = page.getByRole("textbox", { name: "Seu argumento" });
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.fill("O anonimato protege quem tem menos poder e amplia quem não falaria de outro modo.");
  await page.getByRole("button", { name: "Transmitir argumento" }).click();
  await expect(input).toBeVisible({ timeout: 10_000 });
});

test("opens the full text of a turn in the reading modal", async ({ page }) => {
  await page.goto("/debate/new");
  await page.getByRole("button", { name: "Entrar no ar" }).click();
  await expect(page.getByRole("textbox", { name: "Seu argumento" })).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Ler em tela cheia" }).click();
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("heading")).toHaveText("Friedrich Nietzsche");
  await expect(page.getByRole("button", { name: "Fechar" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();

  await page.getByRole("button", { name: "Ler tese completa" }).click();
  await expect(page.getByRole("dialog")).toContainText("A favor: Existe livre-arbítrio?");
});

test("keeps the stage recoverable when the AI request fails", async ({ page }) => {
  await page.route("**/api/debate", async (route) => {
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({ error: "Falha simulada e segura." }),
    });
  });

  await page.goto("/debate/new");
  await page.getByRole("button", { name: "Entrar no ar" }).click();

  await expect(page.locator(".zine-error")).toContainText("Falha simulada e segura.");
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeFocused();
  await page.reload();
  await expect(page.locator(".zine-error")).toContainText("Falha simulada e segura.");
});

test("shows an empty result safely without a completed session", async ({ page }) => {
  const response = await page.goto("/debate/result");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  await expect(page.getByRole("heading", { name: "O juiz ainda não deliberou." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Começar um debate" })).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeFocused();
});
