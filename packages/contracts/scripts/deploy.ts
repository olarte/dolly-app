import { ethers } from 'hardhat'

async function main() {
  console.log('Deploying Dolly contracts to Celo...')

  // TODO: Session 6 — deploy MarketFactory + initial Market

  console.log('Deployment complete.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
