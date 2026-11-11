const { test, expect } = require("@playwright/test");
const path = require("node:path");

async function loadEngine(page) {
  await page.goto("about:blank");
  await page.addScriptTag({ path: path.resolve(__dirname, "../../www/crypto-engine.js") });
}

test("Bitcoin hardware profitability includes facility cooling load and maximum break-even tariff", async ({ page }) => {
  await loadEngine(page);
  const result = await page.evaluate(() => window.DrVasCryptoEngine.calculateBitcoinHardwareScenario({
    expectedBtcPerDay: 0.01,
    btcPriceUsd: 100000,
    minerHashrateThs: 100,
    efficiencyJPerTh: 20,
    electricityUsdPerKwh: 0.1,
    coolingOverheadPercent: 25,
    poolFeePercent: 1,
    uptimePercent: 95,
    maintenanceUsdPerDay: 2,
    hardwareCostUsd: 3000
  }));
  expect(result.minerPowerWatts).toBe(2000);
  expect(result.facilityPowerWatts).toBe(2500);
  expect(result.energyKwhPerDay).toBe(60);
  expect(result.energyUsdPerDay).toBe(6);
  expect(result.netUsdPerDay).toBeCloseTo(932.5, 8);
  expect(result.maximumProfitableElectricityUsdPerKwh).toBeCloseTo(15.6416666667, 8);
  expect(result.paybackDays).toBeCloseTo(3000 / 932.5, 8);
});

test("Bitcoin sensitivity matrix covers nine price and electricity combinations", async ({ page }) => {
  await loadEngine(page);
  const result = await page.evaluate(() => window.DrVasCryptoEngine.calculateBitcoinSensitivity({
    expectedBtcPerDay: 0.01,
    btcPriceUsd: 100000,
    minerHashrateThs: 100,
    efficiencyJPerTh: 20,
    electricityUsdPerKwh: 0.1,
    coolingOverheadPercent: 25,
    poolFeePercent: 1,
    uptimePercent: 95,
    maintenanceUsdPerDay: 2,
    hardwareCostUsd: 3000
  }));
  expect(result).toHaveLength(9);
  expect(result.map(row => [row.priceMultiplier, row.electricityMultiplier])).toEqual([
    [0.8, 0.8], [0.8, 1], [0.8, 1.2],
    [1, 0.8], [1, 1], [1, 1.2],
    [1.2, 0.8], [1.2, 1], [1.2, 1.2]
  ]);
  expect(result[0].netUsdPerDay).toBeCloseTo(745.6, 8);
  expect(result[4].netUsdPerDay).toBeCloseTo(932.5, 8);
  expect(result[8].netUsdPerDay).toBeCloseTo(1119.4, 8);
  expect(result[8].paybackDays).toBeLessThan(result[0].paybackDays);
});

test("Bitcoin sensitivity rejects invalid, zero and oversized multiplier sets", async ({ page }) => {
  await loadEngine(page);
  const result = await page.evaluate(() => {
    const calculate = window.DrVasCryptoEngine.calculateBitcoinSensitivity;
    const base = {
      expectedBtcPerDay: 0.01, btcPriceUsd: 100000, minerHashrateThs: 100,
      efficiencyJPerTh: 20, electricityUsdPerKwh: 0.1
    };
    return {
      zero: (() => { try { calculate({ ...base, priceMultipliers: [0] }); return false; } catch { return true; } })(),
      negative: (() => { try { calculate({ ...base, electricityMultipliers: [-1] }); return false; } catch { return true; } })(),
      tooMany: (() => { try { calculate({ ...base, priceMultipliers: [1, 2, 3, 4, 5, 6] }); return false; } catch { return true; } })()
    };
  });
  expect(result).toEqual({ zero: true, negative: true, tooMany: true });
});
