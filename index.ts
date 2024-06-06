export default async function getRPCHandler() {
  let modulePath;
  if (typeof window !== "undefined") {
    modulePath = "./esm/index.js";
  } else {
    modulePath = "./cjs/index.js";
  }

  const { RPCHandler } = await import(modulePath);

  return RPCHandler;
}

import {
  ChainId,
  ChainNames,
  HandlerConstructorConfig,
  HandlerInterface,
  NativeToken,
  NetworkCurrencies,
  NetworkExplorers,
  NetworkIds,
  NetworkNames,
  NetworkRPCs,
  Token,
  Tokens,
  ValidBlockData,
} from "./types/handler";

import {
  LOCAL_HOST,
  chainIDList,
  extraRpcs,
  getNetworkName,
  networkCurrencies,
  networkExplorers,
  networkIds,
  networkNames,
  networkRpcs,
  nftAddress,
  permit2Address,
  tokens,
} from "./types/constants";

import { RPCHandler } from "./types/rpc-handler";
import { PrettyLogs } from "./types/logs";
import { StorageService } from "./types/storage-service";
import { RPCService } from "./types/rpc-service";

export {
  LOCAL_HOST,
  chainIDList,
  extraRpcs,
  getNetworkName,
  networkCurrencies,
  networkExplorers,
  networkIds,
  networkNames,
  networkRpcs,
  nftAddress,
  permit2Address,
  tokens,
};

export type {
  ChainId,
  ChainNames,
  HandlerConstructorConfig,
  HandlerInterface,
  NativeToken,
  NetworkCurrencies,
  NetworkExplorers,
  NetworkIds,
  NetworkNames,
  NetworkRPCs,
  Token,
  Tokens,
  ValidBlockData,
};
export { RPCHandler, PrettyLogs, StorageService, RPCService };
