import { ethers, network } from "hardhat";

// Celo Mainnet stablecoin addresses
const MAINNET_TOKENS = {
  cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  USDC: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
  USDT: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
};

// Celo Alfajores testnet stablecoin addresses
const ALFAJORES_TOKENS = {
  cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  USDC: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
  USDT: "0xE4D517785D091D3c54818832dB6094bcc2744545",
};

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
  if (networkName === "celo") {
    tokens = [MAINNET_TOKENS.cUSD, MAINNET_TOKENS.USDC, MAINNET_TOKENS.USDT];
    console.log("Using Celo Mainnet token addresses");
  } else if (networkName === "alfajores") {
    tokens = [ALFAJORES_TOKENS.cUSD, ALFAJORES_TOKENS.USDC, ALFAJORES_TOKENS.USDT];
    console.log("Using Alfajores testnet token addresses");
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
  console.log("──────────────────────────────────────\n");

  // Verification hint
  console.log("To verify on CeloScan:");
  console.log(`  npx hardhat verify --network ${networkName} ${factoryAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
