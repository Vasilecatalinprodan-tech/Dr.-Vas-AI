(function (root) {
  "use strict";

  const COINS = Object.freeze([
    { id: "bitcoin", symbol: "BTC", name: "Bitcoin", algorithm: "SHA-256", hardware: ["asic-sha256"] },
    { id: "bitcoin-cash", symbol: "BCH", name: "Bitcoin Cash", algorithm: "SHA-256", hardware: ["asic-sha256"] },
    { id: "litecoin", symbol: "LTC", name: "Litecoin", algorithm: "Scrypt", hardware: ["asic-scrypt"] },
    { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", algorithm: "Scrypt (merged mining)", hardware: ["asic-scrypt"], note: "De regulă minat combinat cu Litecoin" },
    { id: "ethereum-classic", symbol: "ETC", name: "Ethereum Classic", algorithm: "Etchash", hardware: ["gpu-ethash", "asic-etchash"] },
    { id: "monero", symbol: "XMR", name: "Monero", algorithm: "RandomX", hardware: ["cpu-randomx"] },
    { id: "zcash", symbol: "ZEC", name: "Zcash", algorithm: "Equihash", hardware: ["asic-equihash", "gpu-equihash"] },
    { id: "dash", symbol: "DASH", name: "Dash", algorithm: "X11", hardware: ["asic-x11"] },
    { id: "kaspa", symbol: "KAS", name: "Kaspa", algorithm: "kHeavyHash", hardware: ["asic-kheavyhash"] },
    { id: "ravencoin", symbol: "RVN", name: "Ravencoin", algorithm: "KawPoW", hardware: ["gpu-kawpow"] },
    { id: "digibyte", symbol: "DGB", name: "DigiByte", algorithm: "Multi-algorithm (SHA-256/Scrypt/Groestl/Skein/Qubit)", hardware: ["asic-sha256", "asic-scrypt", "gpu-groestl", "gpu-skein", "gpu-qubit"] },
    { id: "ecash", symbol: "XEC", name: "eCash", algorithm: "SHA-256", hardware: ["asic-sha256"] }
  ]);

  const HARDWARE = Object.freeze([
    { value: "all", label: "Toate echipamentele" },
    { value: "asic-sha256", label: "ASIC SHA-256" },
    { value: "asic-scrypt", label: "ASIC Scrypt" },
    { value: "gpu-ethash", label: "GPU Etchash / Ethash" },
    { value: "asic-etchash", label: "ASIC Etchash" },
    { value: "cpu-randomx", label: "CPU RandomX" },
    { value: "asic-equihash", label: "ASIC Equihash" },
    { value: "gpu-equihash", label: "GPU Equihash" },
    { value: "asic-x11", label: "ASIC X11" },
    { value: "asic-kheavyhash", label: "ASIC kHeavyHash" },
    { value: "gpu-kawpow", label: "GPU KawPoW" }
  ]);

  function eligibleCoins(markets, hardware = "all", minUsd = 1) {
    const byId = new Map(COINS.map(coin => [coin.id, coin]));
    return (Array.isArray(markets) ? markets : [])
      .map(market => {
        const coin = byId.get(String(market.id || "").toLowerCase());
        const priceUsd = Number(market.current_price);
        if (!coin || !Number.isFinite(priceUsd) || priceUsd <= minUsd) return null;
        if (hardware !== "all" && !coin.hardware.includes(hardware)) return null;
        return {
          ...coin,
          priceUsd,
          marketCapUsd: Number(market.market_cap) || null,
          change24h: Number(market.price_change_percentage_24h) || null,
          lastUpdated: market.last_updated || null
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.priceUsd - a.priceUsd);
  }

  function calculateNetDaily({ coinsPerDay, priceUsd, watts, electricityUsdPerKwh, poolFeePercent = 1, uptimePercent = 95, maintenanceUsdPerDay = 0 }) {
    const values = [coinsPerDay, priceUsd, watts, electricityUsdPerKwh, poolFeePercent, uptimePercent, maintenanceUsdPerDay].map(Number);
    if (values.some(value => !Number.isFinite(value) || value < 0) || poolFeePercent > 100 || uptimePercent > 100) {
      throw new RangeError("Parametri de rentabilitate invalizi.");
    }
    const [quantity, price, power, tariff, fee, uptime, maintenance] = values;
    const gross = quantity * price * (uptime / 100);
    const pool = gross * (fee / 100);
    const energy = (power / 1000) * 24 * tariff;
    return { grossUsd: gross, poolFeeUsd: pool, energyUsd: energy, maintenanceUsd: maintenance, netUsd: gross - pool - energy - maintenance };
  }

  function calculateHashrateScenario({
    minerHashrate,
    networkHashrate,
    blockReward,
    blocksPerDay,
    priceUsd,
    watts,
    electricityUsdPerKwh,
    poolFeePercent = 1,
    uptimePercent = 95,
    maintenanceUsdPerDay = 0
  }) {
    const values = [
      minerHashrate, networkHashrate, blockReward, blocksPerDay, priceUsd,
      watts, electricityUsdPerKwh, poolFeePercent, uptimePercent, maintenanceUsdPerDay
    ].map(Number);
    if (values.some(value => !Number.isFinite(value) || value < 0)) {
      throw new RangeError("Parametri de hashrate sau cost invalizi.");
    }
    const [miner, network, reward, blocks, price, power, tariff, fee, uptime, maintenance] = values;
    if (network <= 0 || blocks <= 0 || price <= 0 || miner > network || fee > 100 || uptime > 100) {
      throw new RangeError("Verifică hashrate-ul rețelei, recompensa, prețul, comisionul și timpul de funcționare.");
    }
    const hashrateShare = miner / network;
    const expectedCoinsPerDay = hashrateShare * blocks * reward * (uptime / 100);
    const grossUsdPerDay = expectedCoinsPerDay * price;
    const poolFeeUsdPerDay = grossUsdPerDay * (fee / 100);
    const energyUsdPerDay = (power / 1000) * 24 * tariff;
    const netUsdPerDay = grossUsdPerDay - poolFeeUsdPerDay - energyUsdPerDay - maintenance;
    return {
      hashrateShare,
      expectedCoinsPerDay,
      grossUsdPerDay,
      poolFeeUsdPerDay,
      energyUsdPerDay,
      maintenanceUsdPerDay: maintenance,
      netUsdPerDay,
      netUsdPer30Days: netUsdPerDay * 30,
      energyKwhPerDay: (power / 1000) * 24
    };
  }

  async function fetchMarkets(fetchImpl = root.fetch) {
    if (typeof fetchImpl !== "function") throw new Error("Browserul nu poate accesa sursa de cotații.");
    const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false";
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = controller && typeof root.setTimeout === "function"
      ? root.setTimeout(() => controller.abort(), 12000) : null;
    try {
      const response = await fetchImpl(url, {
        headers: { accept: "application/json" },
        cache: "no-store",
        ...(controller ? { signal: controller.signal } : {})
      });
      if (!response.ok) throw new Error("Sursa de cotații a răspuns cu HTTP " + response.status + ".");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Format invalid primit de la sursa de cotații.");
      return data;
    } finally {
      if (timeout !== null) root.clearTimeout(timeout);
    }
  }

  root.DrVasCryptoEngine = Object.freeze({
    coins: COINS,
    hardware: HARDWARE,
    eligibleCoins,
    calculateNetDaily,
    calculateHashrateScenario,
    fetchMarkets
  });
})(window);
