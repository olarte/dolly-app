import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("MarketFactory", function () {
  async function deployFactoryFixture() {
    const [owner, alice] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const cUSD = await MockERC20.deploy("Celo Dollar", "cUSD", 18);
    const USDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    const USDT = await MockERC20.deploy("Tether USD", "USDT", 6);

    const Factory = await ethers.getContractFactory("MarketFactory");
    const factory = await Factory.deploy();

    const pairCOP = ethers.keccak256(ethers.toUtf8Bytes("USD/COP"));
    const pairNGN = ethers.keccak256(ethers.toUtf8Bytes("USD/NGN"));
    const tokens = [await cUSD.getAddress(), await USDC.getAddress(), await USDT.getAddress()];

    const now = Math.floor(Date.now() / 1000);
    const startDate = now + 100;
    const endDate = now + 86400; // +1 day

    return { factory, cUSD, USDC, USDT, owner, alice, pairCOP, pairNGN, tokens, startDate, endDate };
  }

  describe("createMarket", function () {
    it("creates a market and registers it", async function () {
      const { factory, pairCOP, tokens, startDate, endDate } =
        await loadFixture(deployFactoryFixture);

      const tx = await factory.createMarket(pairCOP, 0, startDate, endDate, 300, tokens);
      const receipt = await tx.wait();

      // Check registry
      const markets = await factory.getMarketsByCurrency(pairCOP);
      expect(markets.length).to.equal(1);

      const all = await factory.allMarkets();
      expect(all.length).to.equal(1);
      expect(all[0]).to.equal(markets[0]);

      expect(await factory.marketCount()).to.equal(1);
    });

    it("emits MarketCreated event", async function () {
      const { factory, pairCOP, tokens, startDate, endDate } =
        await loadFixture(deployFactoryFixture);

      await expect(factory.createMarket(pairCOP, 0, startDate, endDate, 300, tokens))
        .to.emit(factory, "MarketCreated");
    });

    it("getMarket returns correct address by key", async function () {
      const { factory, pairCOP, tokens, startDate, endDate } =
        await loadFixture(deployFactoryFixture);

      const tx = await factory.createMarket(pairCOP, 0, startDate, endDate, 300, tokens);
      const receipt = await tx.wait();

      const addr = await factory.getMarket(pairCOP, 0, startDate);
      expect(addr).to.not.equal(ethers.ZeroAddress);

      const markets = await factory.getMarketsByCurrency(pairCOP);
      expect(addr).to.equal(markets[0]);
    });

    it("deterministic — duplicate creation reverts", async function () {
      const { factory, pairCOP, tokens, startDate, endDate } =
        await loadFixture(deployFactoryFixture);

      await factory.createMarket(pairCOP, 0, startDate, endDate, 300, tokens);

      await expect(
        factory.createMarket(pairCOP, 0, startDate, endDate, 300, tokens)
      ).to.be.revertedWith("Market already exists");
    });

    it("different marketType creates separate market", async function () {
      const { factory, pairCOP, tokens, startDate, endDate } =
        await loadFixture(deployFactoryFixture);

      await factory.createMarket(pairCOP, 0, startDate, endDate, 300, tokens); // daily
      await factory.createMarket(pairCOP, 1, startDate, endDate, 300, tokens); // weekly

      const markets = await factory.getMarketsByCurrency(pairCOP);
      expect(markets.length).to.equal(2);
      expect(markets[0]).to.not.equal(markets[1]);
    });

    it("different dates create separate markets", async function () {
      const { factory, pairCOP, tokens, startDate, endDate } =
        await loadFixture(deployFactoryFixture);

      const start2 = startDate + 86400;
      const end2 = endDate + 86400;

      await factory.createMarket(pairCOP, 0, startDate, endDate, 300, tokens);
      await factory.createMarket(pairCOP, 0, start2, end2, 300, tokens);

      expect(await factory.marketCount()).to.equal(2);
    });

    it("only owner can create markets", async function () {
      const { factory, alice, pairCOP, tokens, startDate, endDate } =
        await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(alice).createMarket(pairCOP, 0, startDate, endDate, 300, tokens)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });

    it("rejects invalid dates", async function () {
      const { factory, pairCOP, tokens, startDate } =
        await loadFixture(deployFactoryFixture);

      await expect(
        factory.createMarket(pairCOP, 0, startDate, startDate, 300, tokens) // endDate = startDate
      ).to.be.revertedWith("Invalid dates");
    });
  });

  describe("Multi-currency", function () {
    it("creates markets for different currency pairs", async function () {
      const { factory, pairCOP, pairNGN, tokens, startDate, endDate } =
        await loadFixture(deployFactoryFixture);

      await factory.createMarket(pairCOP, 0, startDate, endDate, 300, tokens);
      await factory.createMarket(pairNGN, 0, startDate, endDate, 300, tokens);

      const copMarkets = await factory.getMarketsByCurrency(pairCOP);
      const ngnMarkets = await factory.getMarketsByCurrency(pairNGN);
      expect(copMarkets.length).to.equal(1);
      expect(ngnMarkets.length).to.equal(1);
      expect(copMarkets[0]).to.not.equal(ngnMarkets[0]);

      expect(await factory.marketCount()).to.equal(2);
    });

    it("getMarketsByCurrency returns empty for unknown pair", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      const unknown = ethers.keccak256(ethers.toUtf8Bytes("USD/XYZ"));
      const markets = await factory.getMarketsByCurrency(unknown);
      expect(markets.length).to.equal(0);
    });
  });

  describe("Created market properties", function () {
    it("market has correct owner (factory owner)", async function () {
      const { factory, owner, pairCOP, tokens, startDate, endDate } =
        await loadFixture(deployFactoryFixture);

      await factory.createMarket(pairCOP, 0, startDate, endDate, 300, tokens);
      const addr = await factory.getMarket(pairCOP, 0, startDate);

      const Market = await ethers.getContractFactory("Market");
      const market = Market.attach(addr);

      expect(await market.owner()).to.equal(owner.address);
    });

    it("market has correct currency pair and rake", async function () {
      const { factory, pairCOP, tokens, startDate, endDate } =
        await loadFixture(deployFactoryFixture);

      await factory.createMarket(pairCOP, 0, startDate, endDate, 300, tokens);
      const addr = await factory.getMarket(pairCOP, 0, startDate);

      const Market = await ethers.getContractFactory("Market");
      const market = Market.attach(addr);

      expect(await market.currencyPair()).to.equal(pairCOP);
      expect(await market.rakeBps()).to.equal(300);
    });

    it("market betting closes 10 min before resolution", async function () {
      const { factory, pairCOP, tokens, startDate, endDate } =
        await loadFixture(deployFactoryFixture);

      await factory.createMarket(pairCOP, 0, startDate, endDate, 300, tokens);
      const addr = await factory.getMarket(pairCOP, 0, startDate);

      const Market = await ethers.getContractFactory("Market");
      const market = Market.attach(addr);

      expect(await market.bettingCloseTime()).to.equal(endDate - 600);
      expect(await market.resolutionTime()).to.equal(endDate);
    });
  });
});
