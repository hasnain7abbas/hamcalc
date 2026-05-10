// Drive the live web app via Playwright and capture every screenshot referenced
// by README.md. Run with `npm run screenshots` after the app is reachable at
// $URL (defaults to http://localhost:4173/, what `vite preview` exposes).

import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = "docs/images";
const URL = process.env.URL || "http://localhost:4173/";

async function fillCell(page, row, col, value) {
  const input = page.getByLabel(`row ${row}, column ${col}`);
  await input.click();
  await input.fill(value);
  // Defocus so the cell-active ring doesn't bleed into the screenshot.
  await page.keyboard.press("Tab");
}

async function setupRabi(page) {
  // 2x2 Rabi-style Hamiltonian.
  await fillCell(page, 1, 1, "hbar*omega/2");
  await fillCell(page, 1, 2, "g");
  await fillCell(page, 2, 1, "g");
  await fillCell(page, 2, 2, "-hbar*omega/2");

  // Free symbols are sorted alphabetically: g, hbar, omega.
  const numInputs = page.locator('input[type="number"][placeholder="—"]');
  await numInputs.nth(0).fill("0.3");
  await numInputs.nth(1).fill("1");
  await numInputs.nth(2).fill("1");
}

async function clickPresetAndGo(page) {
  await page.getByRole("button", { name: /Two-level \(Rabi, qubit\)/i }).click();
  await page.getByRole("button", { name: /^Go$/ }).click();
  await page.waitForSelector('input[aria-label="row 1, column 1"]');
}

async function solve(page) {
  await page.getByRole("button", { name: /^Solve/i }).click();
  // Allow the deferred solver + KaTeX to render.
  await page.waitForTimeout(900);
}

async function captureDesktop(browser) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1) Size modal — first thing on first-load.
  await page.goto(URL);
  await page.waitForSelector("text=Choose the matrix shape");
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, "size-modal.png") });

  // Pick 2×2 and dismiss
  await clickPresetAndGo(page);
  await setupRabi(page);
  await solve(page);

  // 2) Hero — full window with results visible. Spectrum tab is default.
  await page.screenshot({ path: path.join(OUT, "hero.png") });

  // 3) Each output tab.
  const outputPanel = page.locator(".panel").filter({ has: page.getByRole("button", { name: /^Spectrum$/ }) });

  const tabs = [
    ["Spectrum", "output-spectrum.png"],
    ["Eigenvectors", "output-eigenvectors.png"],
    ["Properties", "output-properties.png"],
    ["Char Poly", "output-charpoly.png"],
    ["U(t)", "output-evolution.png"],
    ["Steps", "output-steps.png"],
  ];
  for (const [label, file] of tabs) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(350);
    await outputPanel.screenshot({ path: path.join(OUT, file) });
  }

  // 4) Keyboard panel only.
  const kbPanel = page
    .locator(".panel")
    .filter({ has: page.getByRole("button", { name: /^Greek$/ }) });
  await page.getByLabel("row 1, column 1").click();
  await page.waitForTimeout(150);
  await kbPanel.screenshot({ path: path.join(OUT, "keyboard.png") });

  await context.close();
}

async function captureMobile(browser) {
  const context = await browser.newContext({
    ...devices["iPhone 14 Pro"],
  });
  const page = await context.newPage();
  await page.goto(URL);

  await page.waitForSelector("text=Choose the matrix shape");
  await clickPresetAndGo(page);
  await setupRabi(page);
  await solve(page);

  // Scroll back to the matrix so the mobile shot shows the input grid.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, "mobile.png") });

  await context.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    console.log(`[screenshots] desktop pass against ${URL}`);
    await captureDesktop(browser);
    console.log(`[screenshots] mobile pass against ${URL}`);
    await captureMobile(browser);
  } finally {
    await browser.close();
  }
  console.log(`[screenshots] done — see ${OUT}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
