import getRPCHandler, { HandlerConstructorConfig, RPCHandler } from "../dist/";

/**
 * This script is meant to test the `yarn build` build output
 * while the jest tests work under the `yarn test` build output.
 *
 * Both have different esbuild configurations, this is to ensure that the
 * library works in both scenarios.
 */

(async () => {
  // a hook that loads the correct module based on the environment
  // not required but a good to have if main/module entry is causing issues
  const RPCHandler = await getRPCHandler();

  const config: HandlerConstructorConfig = {
    networkId: 1,
    rpcTimeout: 1500,
    autoStorage: false,
    cacheRefreshCycles: 10,
    networkName: null,
    networkRpcs: null,
    runtimeRpcs: null,
    proxySettings: {
      retryCount: 3,
      retryDelay: 500,
      logTier: "info",
      logger: null,
      strictLogs: false,
      moduleName: "[RPCHandler Provider Test] -> ",
    },
  };

  const handler: RPCHandler = new RPCHandler(config);

  await handler.getFastestRpcProvider();

  const latencies = handler.getLatencies();

  const provider = handler.getFastestRpcProvider();

  console.log(provider);
  console.log("=====================================");
  console.log(latencies);
  process.exit(0);
})().catch(console.error);
