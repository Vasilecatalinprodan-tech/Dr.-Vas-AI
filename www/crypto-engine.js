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

  function eligibleCoins(markets, hardware = "all", minUsd = 0) {
    const minimumPriceUsd = Number(minUsd);
    if (!Number.isFinite(minimumPriceUsd) || minimumPriceUsd < 0) {
      throw new RangeError("Pragul minim de preț trebuie să fie un număr valid, zero sau pozitiv.");
    }
    const byId = new Map(COINS.map(coin => [coin.id, coin]));
    return (Array.isArray(markets) ? markets : [])
      .map(market => {
        const coin = byId.get(String(market.id || "").toLowerCase());
        const priceUsd = Number(market.current_price);
        if (!coin || !Number.isFinite(priceUsd) || priceUsd <= minimumPriceUsd) return null;
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


  function calculateBitcoinSensitivity({
    expectedBtcPerDay,
    btcPriceUsd,
    minerHashrateThs,
    efficiencyJPerTh,
    electricityUsdPerKwh,
    coolingOverheadPercent = 0,
    poolFeePercent = 1,
    uptimePercent = 95,
    maintenanceUsdPerDay = 0,
    hardwareCostUsd = 0,
    priceMultipliers = [0.8, 1, 1.2],
    electricityMultipliers = [0.8, 1, 1.2]
  }) {
    const validMultipliers = values => Array.isArray(values) && values.length > 0 &&
      values.length <= 5 && values.every(value => Number.isFinite(Number(value)) && Number(value) > 0);
    if (!validMultipliers(priceMultipliers) || !validMultipliers(electricityMultipliers)) {
      throw new RangeError("Multiplicatorii de sensibilitate trebuie să fie pozitivi și să conțină cel mult cinci valori.");
    }
    const base = {
      expectedBtcPerDay, btcPriceUsd, minerHashrateThs, efficiencyJPerTh,
      electricityUsdPerKwh, coolingOverheadPercent, poolFeePercent,
      uptimePercent, maintenanceUsdPerDay, hardwareCostUsd
    };
    return priceMultipliers.flatMap(priceMultiplier =>
      electricityMultipliers.map(electricityMultiplier => {
        const result = calculateBitcoinHardwareScenario({
          ...base,
          btcPriceUsd: Number(btcPriceUsd) * Number(priceMultiplier),
          electricityUsdPerKwh: Number(electricityUsdPerKwh) * Number(electricityMultiplier)
        });
        return {
          priceMultiplier: Number(priceMultiplier),
          electricityMultiplier: Number(electricityMultiplier),
          ...result
        };
      })
    );
  }

  async function fetchMarkets(fetchImpl = root.fetch) {
    if (typeof fetchImpl !== "function") throw new Error("Browserul nu poate accesa sursa de cotații.");
    const ids = encodeURIComponent(COINS.map(coin => coin.id).join(","));
    const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" + ids + "&order=market_cap_desc&per_page=250&page=1&sparkline=false";
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

  async function fetchBitcoinNetworkStats(fetchImpl = root.fetch) {
    if (typeof fetchImpl !== "function") throw new Error("Browserul nu poate accesa sursa de date Bitcoin.");
    const requestJson = async url => {
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timeout = controller && typeof root.setTimeout === "function"
        ? root.setTimeout(() => controller.abort(), 12000) : null;
      try {
        const response = await fetchImpl(url, {
          headers: { accept: "application/json" },
          cache: "no-store",
          ...(controller ? { signal: controller.signal } : {})
        });
        if (!response.ok) throw new Error("Sursa de date Bitcoin a răspuns cu HTTP " + response.status + ".");
        return await response.json();
      } finally {
        if (timeout !== null) root.clearTimeout(timeout);
      }
    };
    const [hashratePayload, rewardPayload] = await Promise.all([
      requestJson("https://mempool.space/api/v1/mining/hashrate/3d"),
      requestJson("https://mempool.space/api/v1/mining/reward-stats/144")
    ]);
    const series = Array.isArray(hashratePayload)
      ? hashratePayload
      : Array.isArray(hashratePayload?.hashrates) ? hashratePayload.hashrates : [];
    const latestPoint = [...series].reverse().find(point => Number(point?.avgHashrate) > 0);
    const networkHashrateHs = Number(hashratePayload?.currentHashrate) > 0
      ? Number(hashratePayload.currentHashrate)
      : Number(latestPoint?.avgHashrate);
    const difficultySeries = Array.isArray(hashratePayload?.difficulty) ? hashratePayload.difficulty : [];
    const latestDifficulty = [...difficultySeries].reverse().find(point => Number(point?.difficulty) > 0);
    const difficulty = Number(hashratePayload?.currentDifficulty) > 0
      ? Number(hashratePayload.currentDifficulty)
      : Number(latestDifficulty?.difficulty || latestPoint?.difficulty);
    const totalRewardSats = Number(rewardPayload?.totalReward);
    if (!Number.isFinite(networkHashrateHs) || networkHashrateHs <= 0) {
      throw new Error("Sursa Bitcoin nu a furnizat un hashrate de rețea valid.");
    }
    if (!Number.isFinite(totalRewardSats) || totalRewardSats <= 0) {
      throw new Error("Sursa Bitcoin nu a furnizat recompensa totală pentru ultimele 144 de blocuri.");
    }
    const validDifficulty = Number.isFinite(difficulty) && difficulty > 0 ? difficulty : null;
    const difficultyImpliedHashrateHs = validDifficulty
      ? validDifficulty * Math.pow(2, 32) * 144 / 86400
      : null;
    const rawSampleTimestamp = Number(latestPoint?.timestamp ?? latestPoint?.time);
    const sampleTimestampMs = Number.isFinite(rawSampleTimestamp) && rawSampleTimestamp > 0
      ? (rawSampleTimestamp < 1e12 ? rawSampleTimestamp * 1000 : rawSampleTimestamp)
      : null;
    const hashrateSampleAt = sampleTimestampMs !== null && Number.isFinite(new Date(sampleTimestampMs).getTime())
      ? new Date(sampleTimestampMs).toISOString()
      : null;
    const hashrateSampleAgeMs = hashrateSampleAt
      ? Math.max(0, Date.now() - new Date(hashrateSampleAt).getTime())
      : null;
    return {
      // Prefer the difficulty-derived network rate for expected BTC yield;
      // retain the observed 3-day average as a diagnostic cross-check.
      networkHashrateHs,
      difficultyImpliedHashrateHs,
      networkHashrateForProfitabilityHs: difficultyImpliedHashrateHs || networkHashrateHs,
      difficulty: validDifficulty,
      averageBlockRewardBtc: totalRewardSats / 144 / 100000000,
      blocksPerDay: 144,
      rewardSampleBlocks: 144,
      hashrateSampleAt,
      hashrateSampleAgeMs,
      hashrateSampleStale: hashrateSampleAgeMs !== null && hashrateSampleAgeMs > 2 * 60 * 60 * 1000,
      source: "mempool.space",
      fetchedAt: new Date().toISOString()
    };
  }


  function calculateBitcoinHardwareScenario({
    expectedBtcPerDay,
    btcPriceUsd,
    minerHashrateThs,
    efficiencyJPerTh,
    electricityUsdPerKwh,
    coolingOverheadPercent = 0,
    poolFeePercent = 1,
    uptimePercent = 95,
    maintenanceUsdPerDay = 0,
    hardwareCostUsd = 0
  }) {
    const values = [
      expectedBtcPerDay, btcPriceUsd, minerHashrateThs, efficiencyJPerTh,
      electricityUsdPerKwh, coolingOverheadPercent, poolFeePercent,
      uptimePercent, maintenanceUsdPerDay, hardwareCostUsd
    ].map(Number);
    if (values.some(value => !Number.isFinite(value) || value < 0)) {
      throw new RangeError("Parametri Bitcoin sau cost invalizi.");
    }
    const [btcPerDay, price, hashrate, efficiency, tariff, cooling, fee, uptime, maintenance, capex] = values;
    if (btcPerDay <= 0 || price <= 0 || hashrate <= 0 || efficiency <= 0 ||
        cooling > 500 || fee >= 100 || uptime <= 0 || uptime > 100) {
      throw new RangeError("Verifică producția BTC, prețul, hashrate-ul, eficiența și procentele.");
    }
    // TH/s × J/TH = J/s = watts. Cooling overhead is modelled as
    // additional facility load; this is an estimate, not measured wall power.
    const minerPowerWatts = hashrate * efficiency;
    const facilityPowerWatts = minerPowerWatts * (1 + cooling / 100);
    const energyKwhPerDay = facilityPowerWatts / 1000 * 24;
    const energyUsdPerDay = energyKwhPerDay * tariff;
    const realisedBtcPerDay = btcPerDay * uptime / 100;
    const grossUsdPerDay = realisedBtcPerDay * price;
    const poolFeeUsdPerDay = grossUsdPerDay * fee / 100;
    const netUsdPerDay = grossUsdPerDay - poolFeeUsdPerDay - energyUsdPerDay - maintenance;
    const breakEvenBtcPriceUsd = realisedBtcPerDay > 0 && fee < 100
      ? (energyUsdPerDay + maintenance) / (realisedBtcPerDay * (1 - fee / 100))
      : null;
    const paybackDays = netUsdPerDay > 0 && capex > 0 ? capex / netUsdPerDay : null;
    return {
      minerPowerWatts,
      facilityPowerWatts,
      energyKwhPerDay,
      energyUsdPerDay,
      maximumProfitableElectricityUsdPerKwh: energyKwhPerDay > 0
        ? Math.max(0, (grossUsdPerDay - poolFeeUsdPerDay - maintenance) / energyKwhPerDay)
        : null,
      realisedBtcPerDay,
      grossUsdPerDay,
      poolFeeUsdPerDay,
      maintenanceUsdPerDay: maintenance,
      netUsdPerDay,
      netUsdPer30Days: netUsdPerDay * 30,
      breakEvenBtcPriceUsd,
      hardwareCostUsd: capex,
      paybackDays,
      profitableAtAssumptions: netUsdPerDay > 0
    };
  }

  root.DrVasCryptoEngine = Object.freeze({
    coins: COINS,
    hardware: HARDWARE,
    eligibleCoins,
    calculateNetDaily,
    calculateHashrateScenario,
    calculateBitcoinHardwareScenario,
    calculateBitcoinSensitivity,
    fetchMarkets,
    fetchBitcoinNetworkStats
  });
})(window);
