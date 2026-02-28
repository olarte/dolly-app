import { ethers, network } from "hardhat";

// Celo Mainnet stablecoin addresses
const MAINNET_TOKENS = {
  cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  USDC: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
  USDT: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
};

async function deployMockTokens(deployerAddress: string) {
  console.log("Deploying mock stablecoins for testnet...\n");

  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const cUSD = await MockERC20.deploy("Mock cUSD", "cUSD", 18);
  await cUSD.waitForDeployment();
  const cUSDAddr = await cUSD.getAddress();
  console.log(`  Mock cUSD (18 dec): ${cUSDAddr}`);

  const USDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
  await USDC.waitForDeployment();
  const USDCAddr = await USDC.getAddress();
  console.log(`  Mock USDC (6 dec):  ${USDCAddr}`);

  const USDT = await MockERC20.deploy("Mock USDT", "USDT", 6);
  await USDT.waitForDeployment();
  const USDTAddr = await USDT.getAddress();
  console.log(`  Mock USDT (6 dec):  ${USDTAddr}`);

  // Mint 10,000 of each to deployer for testing
  const mintAmount18 = ethers.parseUnits("10000", 18);
  const mintAmount6 = ethers.parseUnits("10000", 6);

  await (await cUSD.mint(deployerAddress, mintAmount18)).wait();
  await (await USDC.mint(deployerAddress, mintAmount6)).wait();
  await (await USDT.mint(deployerAddress, mintAmount6)).wait();
  console.log(`  Minted 10,000 of each to ${deployerAddress}\n`);

  return {
    tokens: [cUSDAddr, USDCAddr, USDTAddr],
    addresses: { cUSD: cUSDAddr, USDC: USDCAddr, USDT: USDTAddr },
  };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log(`\nDeploying to ${networkName} with account: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} CELO\n`);

  // Deploy MarketFactory
  const Factory = await ethers.getContractFactory("MarketFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log(`MarketFactory deployed: ${factoryAddr}`);

  // Select token addresses based on network
  let tokens: string[];
  let mockAddresses: { cUSD: string; USDC: string; USDT: string } | null = null;

  if (networkName === "celo") {
    tokens = [MAINNET_TOKENS.cUSD, MAINNET_TOKENS.USDC, MAINNET_TOKENS.USDT];
    console.log("Using Celo Mainnet token addresses");
  } else if (networkName === "celo-sepolia") {
    // Deploy mock tokens on testnet
    const result = await deployMockTokens(deployer.address);
    tokens = result.tokens;
    mockAddresses = result.addresses;
    console.log("Using mock testnet token addresses");
  } else {
    console.log("Local network — skipping market creation (no real tokens)");
    console.log("\n──────────────────────────────────────");
    console.log("Deployment Summary:");
    console.log(`  MarketFactory: ${factoryAddr}`);
    console.log("──────────────────────────────────────\n");
    return;
  }

  // Create an initial daily market for USD/COP
  const currencyPairCOP = ethers.keccak256(ethers.toUtf8Bytes("USD/COP"));
  const now = Math.floor(Date.now() / 1000);

  // Daily market: starts now, resolves at 5 PM Colombia time (22:00 UTC) today
  const todayUTC = new Date();
  todayUTC.setUTCHours(22, 0, 0, 0); // 5 PM COT = 22:00 UTC
  let endDate = Math.floor(todayUTC.getTime() / 1000);
  if (endDate <= now) {
    endDate += 86400; // push to tomorrow if already past
  }

  const tx = await factory.createMarket(
    currencyPairCOP,
    0, // daily
    now,
    endDate,
    300, // 3% rake
    tokens
  );
  await tx.wait();
  const marketAddr = await factory.getMarket(currencyPairCOP, 0, now);

  console.log(`Daily USD/COP Market created: ${marketAddr}`);
  console.log(`  Start: ${new Date(now * 1000).toISOString()}`);
  console.log(`  End:   ${new Date(endDate * 1000).toISOString()}`);

  console.log("\n──────────────────────────────────────");
  console.log("Deployment Summary:");
  console.log(`  MarketFactory: ${factoryAddr}`);
  console.log(`  USD/COP Daily: ${marketAddr}`);
  if (mockAddresses) {
    console.log(`  Mock cUSD:     ${mockAddresses.cUSD}`);
    console.log(`  Mock USDC:     ${mockAddresses.USDC}`);
    console.log(`  Mock USDT:     ${mockAddresses.USDT}`);
  }
  console.log("──────────────────────────────────────\n");

  // Verification hint
  if (networkName === "celo") {
    console.log("To verify on CeloScan:");
    console.log(`  npx hardhat verify --network ${networkName} ${factoryAddr}`);
  } else {
    console.log("Testnet explorer: https://sepolia.celoscan.io/");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
