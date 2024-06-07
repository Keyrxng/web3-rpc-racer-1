import { JsonRpcProvider } from "@ethersproject/providers";
import { ChainId, networkCurrencies, networkExplorers, networkIds, networkNames, networkRpcs, tokens } from "./constants";
import { LogInterface, PrettyLogs, PrettyLogsWithOk } from "./logs";

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
  symbol: string;
  decimals: number;
};

export type HandlerInterface = {
  getProvider(): JsonRpcProvider | null;
  clearInstance(): void;
  getFastestRpcProvider(): Promise<JsonRpcProvider | null>;
  testRpcPerformance(): Promise<JsonRpcProvider | null>;
};

// This is log message prefix which can be used to identify the logs from this module
type ModuleName = "[RPCHandler Provider Proxy] - ";

type ProxySettings = {
  retryCount: number; // how many times we'll loop the list of RPCs retrying the request before failing
  retryDelay: number; // how long we'll wait before moving to the next RPC
  // eslint-disable-next-line @typescript-eslint/ban-types
  logTier: (PrettyLogsWithOk & {}) | null; // set to "none" for no logs, null will default to "error", "verbose" will log all
  logger: PrettyLogs | LogInterface | null; // null will default to PrettyLogs, otherwise pass in your own logger
  strictLogs: boolean; // true is default, only the specified logTier will be logged. false will log all logs.
  moduleName?: ModuleName | string; // this is the prefix for the logs
  disabled?: boolean;
};

export type HandlerConstructorConfig = {
  networkId: number;
  networkName: string | null; // will default using the networkRpcs
  networkRpcs: string[] | null; // e.g "https://mainnet.infura.io/..."
  autoStorage: boolean | null; // browser only, will store in localStorage
  cacheRefreshCycles: number | null; // bad RPCs are excluded if they fail, this is how many cycles before they're re-tested
  runtimeRpcs: string[] | null; // e.g "<networkId>__https://mainnet.infura.io/..." > "1__https://mainnet.infura.io/..."
  rpcTimeout: number | null; // when the RPCs are tested they are raced, this is the max time to allow for a response
  proxySettings: ProxySettings; // settings for the proxy
};

export type NetworkRPCs = typeof networkRpcs;
export type NetworkNames = typeof networkNames;
export type NetworkCurrencies = typeof networkCurrencies;
export type Tokens = typeof tokens;
export type NetworkExplorers = typeof networkExplorers;
export type NetworkIds = typeof networkIds;
export type { ChainId };

export type ChainNames<TChainID extends PropertyKey = ChainId> = {
  [key in TChainID]: string;
};
