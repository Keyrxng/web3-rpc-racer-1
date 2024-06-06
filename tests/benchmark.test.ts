import { RPCHandler, HandlerConstructorConfig, PrettyLogs } from "../dist";

export const testConfig: HandlerConstructorConfig = {
  networkId: 1,
  autoStorage: false,
  cacheRefreshCycles: 3,
  networkName: null,
  networkRpcs: null,
  rpcTimeout: 1500,
  runtimeRpcs: null,
  proxySettings: {
    retryCount: 3,
    retryDelay: 10,
    logTier: "info",
    logger: new PrettyLogs(),
    strictLogs: true,
  },
};

describe("RPCHandler", () => {
  let rpcHandler: RPCHandler;

  afterAll(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.resetAllMocks();
    jest.resetModules();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.resetAllMocks();
    jest.resetModules();
  });

  it("executing without an rpc timeout", async () => {
    rpcHandler = new RPCHandler({
      ...testConfig,
      rpcTimeout: 99999999,
    });
    await rpcHandler.testRpcPerformance();
    const latencies = rpcHandler.getLatencies();

    const slowestRpc = latencies[Object.keys(latencies).sort((a, b) => latencies[b] - latencies[a])[0]];
    const fastestRpcUrl = latencies[Object.keys(latencies).sort((a, b) => latencies[a] - latencies[b])[0]];

    console.log("slowestRpc: without an rpc timeout > ", slowestRpc);
    console.log("fastestRpc: without an rpc timeout > ", fastestRpcUrl);
  }, 999999);

  it("executing with an rpc timeout", async () => {
    rpcHandler = new RPCHandler({
      ...testConfig,
      rpcTimeout: 1500,
    });
    await rpcHandler.testRpcPerformance();
    const latencies = rpcHandler.getLatencies();

    const slowestRpc = latencies[Object.keys(latencies).sort((a, b) => latencies[b] - latencies[a])[0]];
    const fastestRpcUrl = latencies[Object.keys(latencies).sort((a, b) => latencies[a] - latencies[b])[0]];

    console.log("slowestRpc: with an rpc timeout > ", slowestRpc);
    console.log("fastestRpc: with an rpc timeout > ", fastestRpcUrl);
  }, 999999);
});
