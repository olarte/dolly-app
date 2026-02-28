import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  stringToHex,
  type Address,
} from 'viem'
import { celo, celoSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const isTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true'
const activeChain = isTestnet ? celoSepolia : celo

const rpcUrl = isTestnet
  ? (process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC || 'https://forno.celo-sepolia.celo-testnet.org')
  : (process.env.NEXT_PUBLIC_CELO_RPC || 'https://forno.celo.org')

export const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(rpcUrl),
})

// Wallet client for cron jobs (market creation, resolution)
// Only available when DEPLOYER_PRIVATE_KEY is set
export function getWalletClient() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY
  if (!pk) {
    throw new Error('DEPLOYER_PRIVATE_KEY not set')
  }
  const account = privateKeyToAccount(pk as `0x${string}`)
  return createWalletClient({
    account,
    chain: activeChain,
    transport: http(rpcUrl),
  })
}

export function getDeployerAddress(): Address {
  const pk = process.env.DEPLOYER_PRIVATE_KEY
  if (!pk) throw new Error('DEPLOYER_PRIVATE_KEY not set')
  return privateKeyToAccount(pk as `0x${string}`).address
}

// Shared helper: matches Solidity keccak256(toUtf8Bytes(pair))
export function currencyPairToBytes32(pair: string): `0x${string}` {
  return keccak256(stringToHex(pair))
}
