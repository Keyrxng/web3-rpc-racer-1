import { JsonRpcProvider } from "@ethersproject/providers";
import { networkCurrencies, networkExplorers, networkRpcs } from "../../types/constants";
import { CHAINS_IDS, EXTRA_RPCS } from "../../types/dynamic";
import { PrettyLogs, PrettyLogsWithOk } from "./logs";

export type BlockExplorer = {
  name: string;
  url: string;
  standard?: string;
  icon?: string;
};

export type ValidBlockData = {
  jsonrpc: string;
  id: number;
  result: {
    number: string;
    timestamp: string;
    hash: string;
  };
};

export type Token = {
  decimals: number;
  address: string;
  symbol: string;
};

export type NativeToken = {
  name: string;
  symbol: string;
  decimals: number;
};

export type HandlerInterface = {
  getProvider(): JsonRpcProvider | null;
  clearInstance(): void;
  getFastestRpcProvider(): Promise<JsonRpcProvider | null>;
  testRpcPerformance(): Promise<JsonRpcProvider | null>;
};

type ModuleName = "[RPCHandler Provider Proxy] -> ";

type ProxySettings = {
  retryCount: number;
  retryDelay: number;
  logTier: PrettyLogsWithOk | null;
  logger: PrettyLogs | null;
  strictLogs: boolean;
  moduleName?: ModuleName | string;
};

export type HandlerConstructorConfig = {
  networkId: NetworkId;
  networkName: NetworkName | null;
  networkRpcs: string[] | null;
  autoStorage: boolean | null;
  cacheRefreshCycles: number | null;
  runtimeRpcs: string[] | null;
  rpcTimeout: number | null;
  proxySettings: ProxySettings;
};

export type NetworkRPCs = typeof networkRpcs;
export type NetworkCurrencies = typeof networkCurrencies;
export type NetworkExplorers = typeof networkExplorers;

// filtered NetworkId union
export type NetworkId = keyof typeof EXTRA_RPCS | "31337" | "1337";

// unfiltered Record<NetworkId, NetworkName>
type ChainsUnfiltered = {
  -readonly [K in keyof typeof CHAINS_IDS]: (typeof CHAINS_IDS)[K];
};

// filtered ChainName union
export type NetworkName = ChainsUnfiltered[NetworkId] | "anvil" | "hardhat";
