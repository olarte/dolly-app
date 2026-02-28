import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("E2E — Full Market Lifecycle", function () {
  async function deployFullFixture() {
    const [owner, userA, userB] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const cUSD = await MockERC20.deploy("Celo Dollar", "cUSD", 18);
    const USDC = await MockERC20.deploy("USD Coin", "USDC", 6);

    const cUSDAddr = await cUSD.getAddress();
    const USDCAddr = await USDC.getAddress();
    const tokens = [cUSDAddr, USDCAddr];

    // Deploy factory
    const Factory = await ethers.getContractFactory("MarketFactory");
    const factory = await Factory.deploy();

    // Mint tokens
    await cUSD.mint(userA.address, ethers.parseUnits("1000", 18));
    await cUSD.mint(userB.address, ethers.parseUnits("1000", 18));
    await USDC.mint(userA.address, ethers.parseUnits("1000", 6));
    await USDC.mint(userB.address, ethers.parseUnits("1000", 6));

    const currencyPair = ethers.keccak256(ethers.toUtf8Bytes("USD/COP"));

    return { factory, cUSD, USDC, cUSDAddr, USDCAddr, tokens, owner, userA, userB, currencyPair };
  }

  it("full lifecycle: deploy, deposit, close, resolve, claim, rake", async function () {
    const { factory, cUSD, cUSDAddr, tokens, owner, userA, userB, currencyPair } =
      await loadFixture(deployFullFixture);

    // 1. Create daily USD/COP market via factory
    const now = await time.latest();
    const startDate = now + 60;
    const endDate = now + 86400;

    const tx = await factory.createMarket(currencyPair, 0, startDate, endDate, 300, tokens);
    await tx.wait();

    const marketAddr = await factory.getMarket(currencyPair, 0, startDate);
    expect(marketAddr).to.not.equal(ethers.ZeroAddress);

    const Market = await ethers.getContractFactory("Market");
    const market = Market.attach(marketAddr);

    // Verify market properties
    expect(await market.currencyPair()).to.equal(currencyPair);
    expect(await market.rakeBps()).to.equal(300);
    expect(await market.owner()).to.equal(owner.address);

    // 2. Approve tokens
    await cUSD.connect(userA).approve(marketAddr, ethers.MaxUint256);
    await cUSD.connect(userB).approve(marketAddr, ethers.MaxUint256);

    // 3. User A deposits 100 cUSD on UP side
    const depositA = ethers.parseUnits("100", 18);
    await expect(market.connect(userA).depositUp(cUSDAddr, depositA))
      .to.emit(market, "Deposited")
      .withArgs(userA.address, 0, cUSDAddr, depositA);

    // 4. User B deposits 50 cUSD on DOWN side
    const depositB = ethers.parseUnits("50", 18);
    await expect(market.connect(userB).depositDown(cUSDAddr, depositB))
      .to.emit(market, "Deposited")
      .withArgs(userB.address, 1, cUSDAddr, depositB);

    // Verify pool state
    expect(await market.totalUp()).to.equal(ethers.parseUnits("100", 18));
    expect(await market.totalDown()).to.equal(ethers.parseUnits("50", 18));
    expect(await market.getTotalPool()).to.equal(ethers.parseUnits("150", 18));

    // 5. Advance time past betting close
    const bettingClose = endDate - 600;
    await time.increaseTo(bettingClose + 1);

    // 6. Close betting (anyone can close after bettingCloseTime)
    await market.connect(userA).closeBetting();
    expect(await market.bettingClosed()).to.be.true;

    // 7. Advance time past resolution
    await time.increaseTo(endDate);

    // 8. Resolve as UP (close > open)
    await expect(market.connect(owner).resolve(1, 4200_00, 4250_00, "TRM-2026-03-01"))
      .to.emit(market, "Resolved")
      .withArgs(1, 4200_00, 4250_00, "TRM-2026-03-01");

    expect(await market.resolved()).to.be.true;
    expect(await market.outcome()).to.equal(1); // UP

    // 9. User A claims — winner
    // totalPool = 150e18, rake = 4.5e18, payoutPool = 145.5e18
    // User A: 100/100 * 145.5 = 145.5 cUSD
    const balABefore = await cUSD.balanceOf(userA.address);
    await expect(market.connect(userA).claim())
      .to.emit(market, "Claimed")
      .withArgs(userA.address, cUSDAddr, ethers.parseUnits("145.5", 18));
    const balAAfter = await cUSD.balanceOf(userA.address);
    expect(balAAfter - balABefore).to.equal(ethers.parseUnits("145.5", 18));

    // 10. User B tries to claim — reverts (loser)
    await expect(market.connect(userB).claim())
      .to.be.revertedWith("No winning deposit");

    // 11. Owner withdraws rake (4.5 cUSD remaining)
    const rakeBalance = await cUSD.balanceOf(marketAddr);
    expect(rakeBalance).to.equal(ethers.parseUnits("4.5", 18));

    const ownerBefore = await cUSD.balanceOf(owner.address);
    await expect(market.connect(owner).withdrawRake(cUSDAddr))
      .to.emit(market, "RakeCollected")
      .withArgs(cUSDAddr, ethers.parseUnits("4.5", 18));
    const ownerAfter = await cUSD.balanceOf(owner.address);
    expect(ownerAfter - ownerBefore).to.equal(ethers.parseUnits("4.5", 18));

    // Contract is now empty
    expect(await cUSD.balanceOf(marketAddr)).to.equal(0);
  });

  it("full lifecycle: same token pool (clean payout)", async function () {
    const { factory, cUSD, cUSDAddr, tokens, owner, userA, userB, currencyPair } =
      await loadFixture(deployFullFixture);

    const now = await time.latest();
    const startDate = now + 60;
    const endDate = now + 86400;

    await factory.createMarket(currencyPair, 0, startDate, endDate, 300, tokens);
    const marketAddr = await factory.getMarket(currencyPair, 0, startDate);

    const Market = await ethers.getContractFactory("Market");
    const market = Market.attach(marketAddr);

    await cUSD.connect(userA).approve(marketAddr, ethers.MaxUint256);
    await cUSD.connect(userB).approve(marketAddr, ethers.MaxUint256);

    // User A: 100 cUSD UP, User B: 50 cUSD DOWN
    await market.connect(userA).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
    await market.connect(userB).depositDown(cUSDAddr, ethers.parseUnits("50", 18));

    // Resolve UP
    await time.increaseTo(endDate);
    await market.connect(owner).resolve(1, 4200_00, 4250_00, "TRM");

    // User A claims
    // totalPool = 150e18, rake = 4.5e18, payoutPool = 145.5e18
    // userA share = 100/100 * 145.5 = 145.5 cUSD
    const balBefore = await cUSD.balanceOf(userA.address);
    await market.connect(userA).claim();
    const balAfter = await cUSD.balanceOf(userA.address);
    expect(balAfter - balBefore).to.equal(ethers.parseUnits("145.5", 18));

    // User B cannot claim
    await expect(market.connect(userB).claim()).to.be.revertedWith("No winning deposit");

    // Owner withdraws rake (4.5 cUSD)
    const ownerBefore = await cUSD.balanceOf(owner.address);
    await market.connect(owner).withdrawRake(cUSDAddr);
    const ownerAfter = await cUSD.balanceOf(owner.address);
    expect(ownerAfter - ownerBefore).to.equal(ethers.parseUnits("4.5", 18));

    // Contract is now empty
    expect(await cUSD.balanceOf(marketAddr)).to.equal(0);
  });

  it("emergency refund lifecycle: unresolved market after 7 days", async function () {
    const { factory, cUSD, cUSDAddr, tokens, owner, userA, userB, currencyPair } =
      await loadFixture(deployFullFixture);

    const now = await time.latest();
    const startDate = now + 60;
    const endDate = now + 86400;

    await factory.createMarket(currencyPair, 0, startDate, endDate, 300, tokens);
    const marketAddr = await factory.getMarket(currencyPair, 0, startDate);

    const Market = await ethers.getContractFactory("Market");
    const market = Market.attach(marketAddr);

    await cUSD.connect(userA).approve(marketAddr, ethers.MaxUint256);
    await cUSD.connect(userB).approve(marketAddr, ethers.MaxUint256);

    await market.connect(userA).depositUp(cUSDAddr, ethers.parseUnits("100", 18));
    await market.connect(userB).depositDown(cUSDAddr, ethers.parseUnits("50", 18));

    // Owner never resolves... 7 days pass
    await time.increaseTo(endDate + 7 * 24 * 3600);

    // Both users get emergency refund
    const balABefore = await cUSD.balanceOf(userA.address);
    await market.connect(userA).emergencyRefund();
    expect(await cUSD.balanceOf(userA.address) - balABefore).to.equal(ethers.parseUnits("100", 18));

    const balBBefore = await cUSD.balanceOf(userB.address);
    await market.connect(userB).emergencyRefund();
    expect(await cUSD.balanceOf(userB.address) - balBBefore).to.equal(ethers.parseUnits("50", 18));

    // Contract is now empty
    expect(await cUSD.balanceOf(marketAddr)).to.equal(0);
  });

  it("verifies XP-relevant events are emitted", async function () {
    const { factory, cUSD, cUSDAddr, tokens, owner, userA, userB, currencyPair } =
      await loadFixture(deployFullFixture);

    const now = await time.latest();
    const startDate = now + 60;
    const endDate = now + 86400;

    await factory.createMarket(currencyPair, 0, startDate, endDate, 300, tokens);
    const marketAddr = await factory.getMarket(currencyPair, 0, startDate);

    const Market = await ethers.getContractFactory("Market");
    const market = Market.attach(marketAddr);

    await cUSD.connect(userA).approve(marketAddr, ethers.MaxUint256);
    await cUSD.connect(userB).approve(marketAddr, ethers.MaxUint256);

    // Verify Deposited events (used for XP: 1 XP per $1 wagered)
    await expect(market.connect(userA).depositUp(cUSDAddr, ethers.parseUnits("100", 18)))
      .to.emit(market, "Deposited")
      .withArgs(userA.address, 0, cUSDAddr, ethers.parseUnits("100", 18));

    await expect(market.connect(userB).depositDown(cUSDAddr, ethers.parseUnits("50", 18)))
      .to.emit(market, "Deposited")
      .withArgs(userB.address, 1, cUSDAddr, ethers.parseUnits("50", 18));

    // Resolve and verify Claimed event (used for XP: +50% win bonus)
    await time.increaseTo(endDate);
    await market.connect(owner).resolve(1, 4200_00, 4250_00, "TRM");

    const expectedPayout = ethers.parseUnits("145.5", 18);
    await expect(market.connect(userA).claim())
      .to.emit(market, "Claimed")
      .withArgs(userA.address, cUSDAddr, expectedPayout);
  });
});
