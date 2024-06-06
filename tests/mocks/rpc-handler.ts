import { JsonRpcProvider } from "@ethersproject/providers";
import { LOCAL_HOST, networkRpcs, networkIds } from "../../types/constants";
import { HandlerInterface, HandlerConstructorConfig } from "./handler";

import { RPCService } from "./rpc-service";
import { StorageService } from "./storage-service";
import { NetworkId, NetworkName } from "../../types/handler";
import { Metadata, PrettyLogs, PrettyLogsWithOk } from "./logs";

export class RPCHandler implements HandlerInterface {
  private static _instance: RPCHandler | null = null;
  private _provider: JsonRpcProvider | null = null;
  private _networkId: NetworkId;
  private _networkName: NetworkName;
  private _env: string = "node";

  private _rpcTimeout: number = Number.MAX_SAFE_INTEGER; // ms
  private _cacheRefreshCycles: number = 10;
  private _refreshLatencies: number = 0;
  private _autoStorage: boolean = false;

  private _runtimeRpcs: string[] = [];
  private _latencies: Record<string, number> = {};
  private _networkRpcs: string[] = [];

  private _proxySettings: HandlerConstructorConfig["proxySettings"] = {
    retryCount: 3,
    retryDelay: 500,
    logTier: "error",
    logger: new PrettyLogs(),
    strictLogs: false,
  };

  constructor(config: HandlerConstructorConfig) {
    this._networkId = config.networkId;
    this._networkRpcs = networkRpcs[this._networkId];
    this._networkName = networkIds[this._networkId];

    this.log.bind(this);
    this.metadataMaker.bind(this);
    this.createProviderProxy.bind(this);
    this.getProvider.bind(this);
    this.getFastestRpcProvider.bind(this);
    this.getLatencies.bind(this);
    this.getRefreshLatencies.bind(this);
    this.getCacheRefreshCycles.bind(this);
    this.getRuntimeRpcs.bind(this);
    this.getNetworkId.bind(this);
    this.getNetworkName.bind(this);
    this.getNetworkRpcs.bind(this);
    this.testRpcPerformance.bind(this);
    this._initialize(config);
  }

  public async getFastestRpcProvider(): Promise<JsonRpcProvider> {
    let fastest;
    if (this._networkId === "31337" || this._networkId === "1337") {
      fastest = new JsonRpcProvider(LOCAL_HOST, this._networkId);
    } else if (!fastest) {
      fastest = await this.testRpcPerformance();
    }

    if (fastest && fastest?.connection.url.includes("localhost") && this._networkId !== "31337" || this._networkId === "1337") {
      /**
       * The JsonRpcProvider defaults erroneously to localhost:8545
       * this is a fix for that
       *  static defaultUrl(): string {
       *    return "http:/\/localhost:8545";
       *  }
       */
      fastest = await this.testRpcPerformance();
    }

    this._provider = this.createProviderProxy(fastest, this);

    this.log("ok", "Provider initialized", {});
    this.log("info", `Provider: ${this._provider?.connection.url}`);
    this.log("verbose", `Latencies: ${JSON.stringify(this._latencies, null, 2)}`);

    return this._provider;
  }

  createProviderProxy(provider: JsonRpcProvider, handler: RPCHandler): JsonRpcProvider {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this; // retaining context of "this" in the proxy
    return new Proxy(provider, {
      get: function (target: JsonRpcProvider, prop: keyof JsonRpcProvider) {
        if (typeof target[prop] === "function") {
          const fn = target[prop] as (...args: unknown[]) => Promise<unknown> | unknown;

          const isAsync = fn.prototype instanceof Promise || fn.toString().includes("async");

          if (isAsync) {
            return self.asyncRequest(self, target, prop, handler);
          } else {
            return self.syncRequest(self, target, prop, handler);
          }
        }
        return target[prop];
      },
    });
  }

  asyncRequest(self: RPCHandler, target: JsonRpcProvider, prop: keyof JsonRpcProvider, handler: RPCHandler): (...args: unknown[]) => unknown {
    self.log("verbose", `Calling provider method ${prop}`);
    return async function (...args: unknown[]) {
      try {
        return await (target[prop] as (...args: unknown[]) => Promise<unknown>)(...args);
      } catch (e) {
        self.log("info", `Failed to call provider method ${prop}, retrying...`, self.metadataMaker(e, prop as string, args));
      }

      const latencies: Record<string, number> = handler.getLatencies();
      const sortedLatencies = Object.entries(latencies).sort((a, b) => a[1] - b[1]);

      let loops = self._proxySettings.retryCount;

      let lastError: Error | unknown | null = null;

      while (loops > 0) {
        for (const [rpc] of sortedLatencies) {
          self.log("info", `Connected to: ${rpc}`);
          try {
            const newProvider = new JsonRpcProvider(rpc.split("__")[1]);
            return await (newProvider[prop] as (...args: unknown[]) => Promise<unknown>)(...args);
          } catch (e) {
            self.log("error", `Failed to call provider method ${prop}`, self.metadataMaker(e, prop as string, args));
            lastError = e;

            await new Promise((resolve) => setTimeout(resolve, self._proxySettings.retryDelay));
          }
        }
        loops--;
      }

      self.log("fatal", "Failed to call provider method", self.metadataMaker(lastError, prop as string, args));
    };
  }

  syncRequest(self: RPCHandler, target: JsonRpcProvider, prop: keyof JsonRpcProvider, handler: RPCHandler) {
    self.log("verbose", `Calling provider method ${prop}`);
    return function (...args: unknown[]): unknown {
      try {
        return (target[prop] as (...args: unknown[]) => unknown)(...args);
      } catch (e) {
        self.log("info", `Failed to call provider method`, self.metadataMaker(e, prop as string, args, { targetUrl: target.connection.url }));
      }

      const latencies: Record<string, number> = handler.getLatencies();
      const sortedLatencies = Object.entries(latencies).sort((a, b) => a[1] - b[1]);

      let loops = self._proxySettings.retryCount;

      let lastError: Error | unknown | null = null;

      while (loops > 0) {
        for (const [rpc] of sortedLatencies) {
          self.log("info", `Retrying with: ${rpc}`);
          const newProvider = new JsonRpcProvider(rpc.split("__")[1]);
          try {
            return (newProvider[prop] as (...args: unknown[]) => unknown)(...args);
          } catch (e) {
            self.log(
              "error",
              `Failed to call provider method ${prop}`,
              self.metadataMaker(e, prop as string, args, { providerUrl: newProvider.connection.url })
            );
            lastError = e;

            setTimeout(() => { }, self._proxySettings.retryDelay);
          }
        }
        loops--;
      }

      self.log("fatal", "Failed to call provider method", self.metadataMaker(lastError, prop as string, args, { sortedLatencies }));
    };
  }

  metadataMaker(error: Error | unknown, method: string, args: unknown[], obj?: unknown[] | unknown): Metadata {
    const err = error instanceof Error ? error : undefined;
    if (err) {
      return {
        error: err,
        method,
        args,
        obj,
      };
    } else {
      return {
        method,
        args,
        obj,
      };
    }
  }

  public async testRpcPerformance(): Promise<JsonRpcProvider> {
    const shouldRefreshRpcs =
      Object.keys(this._latencies).filter((rpc) => rpc.startsWith(`${this._networkId}__`)).length <= 1 || this._refreshLatencies >= this._cacheRefreshCycles;

    if (shouldRefreshRpcs) {
      this._runtimeRpcs = networkRpcs[this._networkId];
      this._refreshLatencies = 0;
    } else {
      this._runtimeRpcs = Object.keys(this._latencies).map((rpc) => {
        return rpc.split("__")[1];
      });
    }

    await this._testRpcPerformance();

    const fastestRpcUrl = await RPCService.findFastestRpc(this._latencies, this._networkId);

    if (!fastestRpcUrl) {
      throw this.log(
        "fatal",
        "Failed to find fastest RPC",
        this.metadataMaker(new Error("No RPCs available"), "testRpcPerformance", [], { latencies: this._latencies, networkId: this._networkId })
      );
    }

    this._provider = this.createProviderProxy(new JsonRpcProvider(fastestRpcUrl, Number(this._networkId)), this);

    if (this._autoStorage) {
      StorageService.setLatencies(this._env, this._latencies);
      StorageService.setRefreshLatencies(this._env, this._refreshLatencies);
    }

    if (!this._provider) {
      throw this.log(
        "fatal",
        "Failed to create provider",
        this.metadataMaker(new Error("No provider available"), "testRpcPerformance", [], {
          latencies: this._latencies,
          fastestRpcUrl: fastestRpcUrl,
        })
      );
    }

    return this._provider;
  }

  public getProvider(): JsonRpcProvider {
    if (!this._provider) {
      throw this.log(
        "fatal",
        "Provider is not initialized",
        this.metadataMaker(new Error("Provider is not initialized"), "getProvider", [], {
          networkRpcs: this._networkRpcs,
          runtimeRpcs: this._runtimeRpcs,
          latencies: this._latencies,
        })
      );
    }
    return this._provider;
  }

  public static getInstance(config: HandlerConstructorConfig): RPCHandler {
    if (!RPCHandler._instance) {
      if (!config) {
        throw new Error("Config is required to initialize RPCHandler");
      }

      RPCHandler._instance = new RPCHandler(config);
    }
    return RPCHandler._instance;
  }

  public clearInstance(): void {
    RPCHandler._instance = null;
  }

  public getRuntimeRpcs(): string[] {
    return this._runtimeRpcs;
  }
  public getNetworkId(): NetworkId {
    return this._networkId;
  }

  public getNetworkName(): string {
    return this._networkName;
  }

  public getNetworkRpcs(): string[] {
    return this._networkRpcs;
  }

  public getLatencies(): Record<string, number> {
    return this._latencies;
  }

  public getRefreshLatencies(): number {
    return this._refreshLatencies;
  }

  public getCacheRefreshCycles(): number {
    return this._cacheRefreshCycles;
  }

  private async _testRpcPerformance(): Promise<void> {
    const { latencies, runtimeRpcs } = await RPCService.testRpcPerformance(
      this._networkId,
      this._latencies,
      this._runtimeRpcs,
      { "Content-Type": "application/json" },
      JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBlockByNumber",
        params: ["latest", false],
        id: 1,
      }),
      this._rpcTimeout
    );

    this._runtimeRpcs = runtimeRpcs;
    this._latencies = latencies;
    this._refreshLatencies++;

    StorageService.setLatencies(this._env, this._latencies);
    StorageService.setRefreshLatencies(this._env, this._refreshLatencies);
  }

  log(tier: PrettyLogsWithOk, message: string, obj?: Metadata): void {
    if (!this._proxySettings.logger) {
      this._proxySettings.logger = new PrettyLogs();
    }

    if (!this._proxySettings.logTier) {
      this._proxySettings.logTier = "error";
    }

    // only capture the logs from the specified tier
    if (this._proxySettings.strictLogs) {
      this._proxySettings.logger[tier](message, obj);
    } else {
      // capture logs from the specified tier and below
      this._proxySettings.logger.log(tier, message, obj);
    }
  }

  private _updateConfig(config: HandlerConstructorConfig): void {
    if (config.proxySettings) {
      this._proxySettings = {
        ...this._proxySettings,
        ...config.proxySettings,
        // ensuring the logger is not null
        logger: config.proxySettings.logger || this._proxySettings.logger,
      };
    }

    if (config.networkName) {
      this._networkName = config.networkName;
    }

    if (config.networkRpcs) {
      if (this._networkId === "31337") {
        this._networkRpcs = [LOCAL_HOST];
      }
      this._networkRpcs = [...this._networkRpcs, ...config.networkRpcs];
    }

    if (config.runtimeRpcs) {
      this._runtimeRpcs = config.runtimeRpcs;
    }

    if (config.cacheRefreshCycles) {
      this._cacheRefreshCycles = config.cacheRefreshCycles;
    }

    if (config.rpcTimeout) {
      this._rpcTimeout = config.rpcTimeout;
    }

    if (config.autoStorage) {
      this._autoStorage = true;
      this._latencies = StorageService.getLatencies(this._env, this._networkId);
      this._refreshLatencies = StorageService.getRefreshLatencies(this._env);
    }
  }

  private _initialize(config: HandlerConstructorConfig): void {
    this._env = typeof window === "undefined" ? "node" : "browser";
    this._updateConfig(config);
  }
}
