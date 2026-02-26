import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { Market, MockERC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Market", function () {
  // ──────────────────────── Fixtures ────────────────────────

  async function deployMarketFixture() {
    const [owner, alice, bob, carol, dave] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const cUSD = await MockERC20.deploy("Celo Dollar", "cUSD", 18);
    const USDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    const USDT = await MockERC20.deploy("Tether USD", "USDT", 6);
    const BAD = await MockERC20.deploy("Bad Token", "BAD", 18); // not allowed

    const now = await time.latest();
    const bettingClose = now + 3600;  // 1 hour from now
    const resolution = now + 4200;    // 1h10m from now (close + 10 min)

    const currencyPair = ethers.keccak256(ethers.toUtf8Bytes("USD/COP"));

    const MarketFactory = await ethers.getContractFactory("Market");
    const market = await MarketFactory.deploy(
      [await cUSD.getAddress(), await USDC.getAddress(), await USDT.getAddress()],
      currencyPair,
      300, // 3% rake
      bettingClose,
      resolution,
      owner.address
    );

    // Mint tokens to users
    const amt18 = ethers.parseUnits("1000", 18); // cUSD
    const amt6 = ethers.parseUnits("1000", 6);   // USDC/USDT
    for (const user of [alice, bob, carol, dave]) {
      await cUSD.mint(user.address, amt18);
      await USDC.mint(user.address, amt6);
      await USDT.mint(user.address, amt6);
    }

    // Approve market
    const marketAddr = await market.getAddress();
    for (const user of [alice, bob, carol, dave]) {
      await cUSD.connect(user).approve(marketAddr, ethers.MaxUint256);
      await USDC.connect(user).approve(marketAddr, ethers.MaxUint256);
      await USDT.connect(user).approve(marketAddr, ethers.MaxUint256);
    }

    return {
      market, cUSD, USDC, USDT, BAD,
      owner, alice, bob, carol, dave,
      bettingClose, resolution, currencyPair, marketAddr,
    };
  }

  // ──────────────────────── Constructor ─────────────────────

  describe("Constructor", function () {
    it("sets initial state correctly", async function () {
      const { market, currencyPair, bettingClose, resolution } = await loadFixture(deployMarketFixture);

      expect(await market.currencyPair()).to.equal(currencyPair);
      expect(await market.rakeBps()).to.equal(300);
      expect(await market.bettingCloseTime()).to.equal(bettingClose);
      expect(await market.resolutionTime()).to.equal(resolution);
      expect(await market.outcome()).to.equal(0); // UNRESOLVED
      expect(await market.resolved()).to.equal(false);
      expect(await market.totalUp()).to.equal(0);
      expect(await market.totalDown()).to.equal(0);
    });

    it("registers allowed tokens with correct decimals", async function () {
      const { market, cUSD, USDC, USDT } = await loadFixture(deployMarketFixture);

      expect(await market.isAllowedToken(await cUSD.getAddress())).to.be.true;
      expect(await market.isAllowedToken(await USDC.getAddress())).to.be.true;
      expect(await market.isAllowedToken(await USDT.getAddress())).to.be.true;

      expect(await market.tokenDecimals(await cUSD.getAddress())).to.equal(18);
      expect(await market.tokenDecimals(await USDC.getAddress())).to.equal(6);
      expect(await market.tokenDecimals(await USDT.getAddress())).to.equal(6);
    });

    it("rejects rake > 10%", async function () {
      const [owner] = await ethers.getSigners();
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const token = await MockERC20.deploy("T", "T", 18);
      const now = await time.latest();

      const MarketFactory = await ethers.getContractFactory("Market");
      await expect(
        MarketFactory.deploy(
          [await token.getAddress()],
          ethers.keccak256(ethers.toUtf8Bytes("USD/COP")),
          1001, // > 10%
          now + 3600,
          now + 4200,
          owner.address
        )
      ).to.be.revertedWith("Rake too high");
    });

    it("rejects empty allowed tokens", async function () {
      const [owner] = await ethers.getSigners();
      const now = await time.latest();
      const MarketFactory = await ethers.getContractFactory("Market");
      await expect(
        MarketFactory.deploy(
          [],
          ethers.keccak256(ethers.toUtf8Bytes("USD/COP")),
          300,
          now + 3600,
          now + 4200,
          owner.address
        )
      ).to.be.revertedWith("No tokens");
    });
  });

  // ──────────────────────── Deposits ────────────────────────

  describe("Deposits", function () {
    it("deposit UP with cUSD (18 dec) — normalization is identity", async function () {
      const { market, cUSD, alice } = await loadFixture(deployMarketFixture);
      const amount = ethers.parseUnits("100", 18);

      await market.connect(alice).depositUp(await cUSD.getAddress(), amount);

      expect(await market.totalUp()).to.equal(amount);
      expect(await market.userDepositsUp(alice.address)).to.equal(amount);
      expect(await market.userDepositToken(alice.address)).to.equal(await cUSD.getAddress());
    });

    it("deposit DOWN with USDC (6 dec) — amount * 1e12 stored", async function () {
      const { market, USDC, bob } = await loadFixture(deployMarketFixture);
      const amount = ethers.parseUnits("100", 6); // 100e6
      const normalized = ethers.parseUnits("100", 18); // 100e18

      await market.connect(bob).depositDown(await USDC.getAddress(), amount);

      expect(await market.totalDown()).to.equal(normalized);
      expect(await market.userDepositsDown(bob.address)).to.equal(normalized);
      expect(await market.userDepositToken(bob.address)).to.equal(await USDC.getAddress());
    });

    it("deposit with USDT (6 dec) normalizes correctly", async function () {
      const { market, USDT, carol } = await loadFixture(deployMarketFixture);
      const amount = ethers.parseUnits("50", 6);
      const normalized = ethers.parseUnits("50", 18);

      await market.connect(carol).depositUp(await USDT.getAddress(), amount);

      expect(await market.totalUp()).to.equal(normalized);
      expect(await market.userDepositsUp(carol.address)).to.equal(normalized);
    });

    it("allows multiple deposits from same user with same token", async function () {
      const { market, cUSD, alice } = await loadFixture(deployMarketFixture);
      const amount = ethers.parseUnits("50", 18);

      await market.connect(alice).depositUp(await cUSD.getAddress(), amount);
      await market.connect(alice).depositUp(await cUSD.getAddress(), amount);

      expect(await market.totalUp()).to.equal(ethers.parseUnits("100", 18));
      expect(await market.userDepositsUp(alice.address)).to.equal(ethers.parseUnits("100", 18));
    });

    it("reverts if user tries different token", async function () {
      const { market, cUSD, USDC, alice } = await loadFixture(deployMarketFixture);

      await market.connect(alice).depositUp(await cUSD.getAddress(), ethers.parseUnits("50", 18));
      await expect(
        market.connect(alice).depositDown(await USDC.getAddress(), ethers.parseUnits("50", 6))
      ).to.be.revertedWith("Must use same token");
    });

    it("reverts with non-allowed token", async function () {
      const { market, BAD, alice, marketAddr } = await loadFixture(deployMarketFixture);
      await BAD.mint(alice.address, ethers.parseUnits("100", 18));
      await BAD.connect(alice).approve(marketAddr, ethers.MaxUint256);

      await expect(
        market.connect(alice).depositUp(await BAD.getAddress(), ethers.parseUnits("100", 18))
      ).to.be.revertedWith("Token not allowed");
    });

    it("reverts with zero amount", async function () {
      const { market, cUSD, alice } = await loadFixture(deployMarketFixture);
      await expect(
        market.connect(alice).depositUp(await cUSD.getAddress(), 0)
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("reverts after betting closed (time)", async function () {
      const { market, cUSD, alice, bettingClose } = await loadFixture(deployMarketFixture);
      await time.increaseTo(bettingClose + 1);

      await expect(
        market.connect(alice).depositUp(await cUSD.getAddress(), ethers.parseUnits("100", 18))
      ).to.be.revertedWith("Betting closed");
    });

    it("reverts after betting closed (owner early close)", async function () {
      const { market, cUSD, alice, owner } = await loadFixture(deployMarketFixture);
      await market.connect(owner).closeBetting();

      await expect(
        market.connect(alice).depositUp(await cUSD.getAddress(), ethers.parseUnits("100", 18))
      ).to.be.revertedWith("Betting closed");
    });

    it("emits Deposited event with correct args", async function () {
      const { market, cUSD, alice } = await loadFixture(deployMarketFixture);
      const amount = ethers.parseUnits("100", 18);
      const cUSDAddr = await cUSD.getAddress();

      await expect(market.connect(alice).depositUp(cUSDAddr, amount))
        .to.emit(market, "Deposited")
        .withArgs(alice.address, 0 /* Side.UP */, cUSDAddr, amount);
    });

    it("transfers tokens from user to market", async function () {
      const { market, cUSD, alice, marketAddr } = await loadFixture(deployMarketFixture);
      const amount = ethers.parseUnits("100", 18);

      const balBefore = await cUSD.balanceOf(alice.address);
      await market.connect(alice).depositUp(await cUSD.getAddress(), amount);
      const balAfter = await cUSD.balanceOf(alice.address);

      expect(balBefore - balAfter).to.equal(amount);
      expect(await cUSD.balanceOf(marketAddr)).to.equal(amount);
    });
  });

  // ──────────────────────── Close Betting ───────────────────

  describe("closeBetting", function () {
    it("owner can close early", async function () {
      const { market, owner } = await loadFixture(deployMarketFixture);

      await expect(market.connect(owner).closeBetting())
        .to.emit(market, "BettingClosed");
      expect(await market.bettingClosed()).to.be.true;
    });

    it("anyone can close after bettingCloseTime", async function () {
      const { market, alice, bettingClose } = await loadFixture(deployMarketFixture);
      await time.increaseTo(bettingClose);

      await expect(market.connect(alice).closeBetting())
        .to.emit(market, "BettingClosed");
    });

    it("non-owner cannot close early", async function () {
      const { market, alice } = await loadFixture(deployMarketFixture);
      await expect(market.connect(alice).closeBetting())
        .to.be.revertedWith("Not authorized");
    });

    it("cannot close twice", async function () {
      const { market, owner } = await loadFixture(deployMarketFixture);
      await market.connect(owner).closeBetting();
      await expect(market.connect(owner).closeBetting())
        .to.be.revertedWith("Already closed");
    });
  });

  // ──────────────────────── Resolve ─────────────────────────

  describe("resolve", function () {
    it("resolves with UP outcome", async function () {
      const { market, owner, resolution } = await loadFixture(deployMarketFixture);
      await time.increaseTo(resolution);

      await expect(
        market.connect(owner).resolve(1, 4200_00, 4250_00, "TRM-2026-03-01")
      )
        .to.emit(market, "Resolved")
        .withArgs(1, 4200_00, 4250_00, "TRM-2026-03-01");

      expect(await market.outcome()).to.equal(1); // UP
      expect(await market.resolved()).to.be.true;
      expect(await market.openPrice()).to.equal(4200_00);
      expect(await market.closePrice()).to.equal(4250_00);
      expect(await market.sourceId()).to.equal("TRM-2026-03-01");
    });

    it("auto-closes betting on resolve", async function () {
      const { market, owner, resolution } = await loadFixture(deployMarketFixture);
      await time.increaseTo(resolution);

      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");
      expect(await market.bettingClosed()).to.be.true;
    });

    it("reverts if not owner", async function () {
      const { market, alice, resolution } = await loadFixture(deployMarketFixture);
      await time.increaseTo(resolution);

      await expect(
        market.connect(alice).resolve(1, 4200_00, 4250_00, "src")
      ).to.be.revertedWithCustomError(market, "OwnableUnauthorizedAccount");
    });

    it("reverts before resolution time", async function () {
      const { market, owner } = await loadFixture(deployMarketFixture);
      await expect(
        market.connect(owner).resolve(1, 4200_00, 4250_00, "src")
      ).to.be.revertedWith("Too early");
    });

    it("reverts with UNRESOLVED outcome", async function () {
      const { market, owner, resolution } = await loadFixture(deployMarketFixture);
      await time.increaseTo(resolution);

      await expect(
        market.connect(owner).resolve(0, 4200_00, 4250_00, "src")
      ).to.be.revertedWith("Invalid outcome");
    });

    it("reverts if already resolved", async function () {
      const { market, owner, resolution } = await loadFixture(deployMarketFixture);
      await time.increaseTo(resolution);
      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");

      await expect(
        market.connect(owner).resolve(2, 4200_00, 4100_00, "src2")
      ).to.be.revertedWith("Already resolved");
    });
  });

  // ──────────────────────── Claim + Payout Math ─────────────

  describe("Claim — single token (cUSD 18 dec)", function () {
    it("correct payout for simple 2-user market", async function () {
      const { market, cUSD, alice, bob, owner, bettingClose, resolution } =
        await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      // Alice bets 100 cUSD UP, Bob bets 100 cUSD DOWN
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositDown(cUSDAddr, ethers.parseUnits("100", 18));

      // Resolve UP
      await time.increaseTo(resolution);
      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");

      // Alice claims
      const balBefore = await cUSD.balanceOf(alice.address);
      await market.connect(alice).claim();
      const balAfter = await cUSD.balanceOf(alice.address);

      // Payout = 200e18 * 9700 / 10000 = 194e18
      const expectedPayout = ethers.parseUnits("194", 18);
      expect(balAfter - balBefore).to.equal(expectedPayout);
    });

    it("proportional payouts with unequal bets", async function () {
      const { market, cUSD, alice, bob, carol, owner, resolution } =
        await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      // Alice 100 UP, Bob 200 UP, Carol 300 DOWN
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositUp(cUSDAddr, ethers.parseUnits("200", 18));
      await market.connect(carol).depositDown(cUSDAddr, ethers.parseUnits("300", 18));

      await time.increaseTo(resolution);
      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");

      // totalPool = 600e18, rake = 18e18, payoutPool = 582e18
      // Alice share = 100/300 * 582 = 194e18
      // Bob share = 200/300 * 582 = 388e18
      const aliceBefore = await cUSD.balanceOf(alice.address);
      await market.connect(alice).claim();
      const aliceAfter = await cUSD.balanceOf(alice.address);
      expect(aliceAfter - aliceBefore).to.equal(ethers.parseUnits("194", 18));

      const bobBefore = await cUSD.balanceOf(bob.address);
      await market.connect(bob).claim();
      const bobAfter = await cUSD.balanceOf(bob.address);
      expect(bobAfter - bobBefore).to.equal(ethers.parseUnits("388", 18));
    });
  });

  describe("Claim — single token (USDC 6 dec)", function () {
    it("correct payout with 6-decimal token", async function () {
      const { market, USDC, alice, bob, owner, resolution } =
        await loadFixture(deployMarketFixture);

      const USDCAddr = await USDC.getAddress();
      // Alice 100 USDC UP, Bob 100 USDC DOWN
      await market.connect(alice).depositUp(USDCAddr, ethers.parseUnits("100", 6));
      await market.connect(bob).depositDown(USDCAddr, ethers.parseUnits("100", 6));

      await time.increaseTo(resolution);
      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");

      const balBefore = await USDC.balanceOf(alice.address);
      await market.connect(alice).claim();
      const balAfter = await USDC.balanceOf(alice.address);

      // Payout in normalized: 200e18 * 0.97 = 194e18
      // Denormalized to 6 dec: 194e18 / 1e12 = 194e6 = 194 USDC
      expect(balAfter - balBefore).to.equal(ethers.parseUnits("194", 6));
    });
  });

  describe("Claim — mixed pool (cUSD + USDC)", function () {
    it("correct payouts when users deposit different tokens", async function () {
      const { market, cUSD, USDC, alice, bob, carol, dave, owner, resolution } =
        await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      const USDCAddr = await USDC.getAddress();

      // Alice: 100 cUSD UP
      // Bob:   50 cUSD DOWN
      // Carol: 100 USDC UP
      // Dave:  50 USDC DOWN
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositDown(cUSDAddr, ethers.parseUnits("50", 18));
      await market.connect(carol).depositUp(USDCAddr, ethers.parseUnits("100", 6));
      await market.connect(dave).depositDown(USDCAddr, ethers.parseUnits("50", 6));

      // Normalized totals: UP = 200e18, DOWN = 100e18, pool = 300e18
      expect(await market.totalUp()).to.equal(ethers.parseUnits("200", 18));
      expect(await market.totalDown()).to.equal(ethers.parseUnits("100", 18));

      // Resolve UP
      await time.increaseTo(resolution);
      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");

      // payoutPool = 300e18 * 9700 / 10000 = 291e18
      // Alice: 100e18 / 200e18 * 291e18 = 145.5e18 cUSD
      // Carol: 100e18 / 200e18 * 291e18 = 145.5e18 normalized → 145.5e6 USDC

      const aliceBefore = await cUSD.balanceOf(alice.address);
      await market.connect(alice).claim();
      const aliceAfter = await cUSD.balanceOf(alice.address);
      expect(aliceAfter - aliceBefore).to.equal(ethers.parseUnits("145.5", 18));

      const carolBefore = await USDC.balanceOf(carol.address);
      await market.connect(carol).claim();
      const carolAfter = await USDC.balanceOf(carol.address);
      expect(carolAfter - carolBefore).to.equal(ethers.parseUnits("145.5", 6));
    });
  });

  describe("Rake", function () {
    it("rake deduction is correct (3%)", async function () {
      const { market, cUSD, alice, bob, owner, resolution, marketAddr } =
        await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositDown(cUSDAddr, ethers.parseUnits("100", 18));

      await time.increaseTo(resolution);
      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");

      // Winner claims 194 cUSD
      await market.connect(alice).claim();

      // Remaining in contract = 200 - 194 = 6 cUSD (the 3% rake)
      const remaining = await cUSD.balanceOf(marketAddr);
      expect(remaining).to.equal(ethers.parseUnits("6", 18));
    });

    it("owner can withdraw rake", async function () {
      const { market, cUSD, alice, bob, owner, resolution, marketAddr } =
        await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositDown(cUSDAddr, ethers.parseUnits("100", 18));

      await time.increaseTo(resolution);
      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");
      await market.connect(alice).claim();

      const ownerBefore = await cUSD.balanceOf(owner.address);
      await expect(market.connect(owner).withdrawRake(cUSDAddr))
        .to.emit(market, "RakeCollected")
        .withArgs(cUSDAddr, ethers.parseUnits("6", 18));
      const ownerAfter = await cUSD.balanceOf(owner.address);
      expect(ownerAfter - ownerBefore).to.equal(ethers.parseUnits("6", 18));
    });

    it("non-owner cannot withdraw rake", async function () {
      const { market, cUSD, alice, bob, owner, resolution } =
        await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositDown(cUSDAddr, ethers.parseUnits("100", 18));

      await time.increaseTo(resolution);
      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");
      await market.connect(alice).claim();

      await expect(
        market.connect(alice).withdrawRake(cUSDAddr)
      ).to.be.revertedWithCustomError(market, "OwnableUnauthorizedAccount");
    });
  });

  // ──────────────────────── Edge Cases ──────────────────────

  describe("Edge Cases", function () {
    it("no deposits on losing side — winners get back minus rake", async function () {
      const { market, cUSD, alice, bob, owner, resolution } =
        await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      // Both bet UP, no one on DOWN
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositUp(cUSDAddr, ethers.parseUnits("200", 18));

      await time.increaseTo(resolution);
      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");

      // totalPool = 300, payoutPool = 291
      // Alice: 100/300 * 291 = 97
      // Bob:   200/300 * 291 = 194
      const aliceBefore = await cUSD.balanceOf(alice.address);
      await market.connect(alice).claim();
      expect(await cUSD.balanceOf(alice.address) - aliceBefore)
        .to.equal(ethers.parseUnits("97", 18));

      const bobBefore = await cUSD.balanceOf(bob.address);
      await market.connect(bob).claim();
      expect(await cUSD.balanceOf(bob.address) - bobBefore)
        .to.equal(ethers.parseUnits("194", 18));
    });

    it("claim twice reverts", async function () {
      const { market, cUSD, alice, bob, owner, resolution } =
        await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositDown(cUSDAddr, ethers.parseUnits("100", 18));

      await time.increaseTo(resolution);
      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");

      await market.connect(alice).claim();
      await expect(market.connect(alice).claim()).to.be.revertedWith("Already claimed");
    });

    it("loser cannot claim", async function () {
      const { market, cUSD, alice, bob, owner, resolution } =
        await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositDown(cUSDAddr, ethers.parseUnits("100", 18));

      await time.increaseTo(resolution);
      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");

      // Bob bet DOWN but UP won
      await expect(market.connect(bob).claim()).to.be.revertedWith("No winning deposit");
    });

    it("non-depositor cannot claim", async function () {
      const { market, cUSD, alice, bob, carol, owner, resolution } =
        await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositDown(cUSDAddr, ethers.parseUnits("100", 18));

      await time.increaseTo(resolution);
      await market.connect(owner).resolve(1, 4200_00, 4250_00, "src");

      await expect(market.connect(carol).claim()).to.be.revertedWith("No winning deposit");
    });

    it("cannot claim before resolution", async function () {
      const { market, cUSD, alice, bob } = await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositDown(cUSDAddr, ethers.parseUnits("100", 18));

      await expect(market.connect(alice).claim()).to.be.revertedWith("Not resolved");
    });

    it("resolve DOWN and correct side wins", async function () {
      const { market, cUSD, alice, bob, owner, resolution } =
        await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositDown(cUSDAddr, ethers.parseUnits("100", 18));

      await time.increaseTo(resolution);
      await market.connect(owner).resolve(2, 4200_00, 4100_00, "src"); // DOWN wins

      // Bob should win
      await expect(market.connect(alice).claim()).to.be.revertedWith("No winning deposit");

      const bobBefore = await cUSD.balanceOf(bob.address);
      await market.connect(bob).claim();
      expect(await cUSD.balanceOf(bob.address) - bobBefore)
        .to.equal(ethers.parseUnits("194", 18));
    });
  });

  // ──────────────────────── View Functions ──────────────────

  describe("View Functions", function () {
    it("getMultiplier returns correct values", async function () {
      const { market, cUSD, alice, bob } = await loadFixture(deployMarketFixture);

      const cUSDAddr = await cUSD.getAddress();
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositDown(cUSDAddr, ethers.parseUnits("300", 18));

      // totalPool = 400, UP = 100, DOWN = 300
      // UP multiplier = 400 * 9700 / (100 * 10000) = 3.88x → 3.88e18
      // DOWN multiplier = 400 * 9700 / (300 * 10000) = ~1.293x → ~1.293e18
      const upMult = await market.getMultiplier(0); // Side.UP
      const downMult = await market.getMultiplier(1); // Side.DOWN

      expect(upMult).to.equal(ethers.parseUnits("3.88", 18));
      // 400 * 9700 * 1e18 / (300 * 10000) = 388_000_0e18 / 3_000_000 = 1293333333333333333
      expect(downMult).to.equal(1293333333333333333n);
    });

    it("getMultiplier returns 1x with empty pool", async function () {
      const { market } = await loadFixture(deployMarketFixture);
      expect(await market.getMultiplier(0)).to.equal(ethers.parseUnits("1", 18));
    });

    it("getMultiplier returns 0 for side with no deposits", async function () {
      const { market, cUSD, alice } = await loadFixture(deployMarketFixture);
      await market.connect(alice).depositUp(await cUSD.getAddress(), ethers.parseUnits("100", 18));
      expect(await market.getMultiplier(1)).to.equal(0); // DOWN side
    });

    it("getUserDeposit returns correct values", async function () {
      const { market, cUSD, alice } = await loadFixture(deployMarketFixture);
      const cUSDAddr = await cUSD.getAddress();
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));

      const [up, down, token] = await market.getUserDeposit(alice.address);
      expect(up).to.equal(ethers.parseUnits("100", 18));
      expect(down).to.equal(0);
      expect(token).to.equal(cUSDAddr);
    });

    it("getTotalPool returns correct sum", async function () {
      const { market, cUSD, alice, bob } = await loadFixture(deployMarketFixture);
      const cUSDAddr = await cUSD.getAddress();
      await market.connect(alice).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
      await market.connect(bob).depositDown(cUSDAddr, ethers.parseUnits("200", 18));

      expect(await market.getTotalPool()).to.equal(ethers.parseUnits("300", 18));
    });

    it("getAllowedTokens returns all tokens", async function () {
      const { market, cUSD, USDC, USDT } = await loadFixture(deployMarketFixture);
      const tokens = await market.getAllowedTokens();
      expect(tokens.length).to.equal(3);
      expect(tokens[0]).to.equal(await cUSD.getAddress());
      expect(tokens[1]).to.equal(await USDC.getAddress());
      expect(tokens[2]).to.equal(await USDT.getAddress());
    });
  });
});
