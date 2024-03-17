import { HandlerConstructorConfig, RPCHandler } from "../dist/";
import getRPCHandler from "../dist/index";

(async () => {
  const RPCHandler = await getRPCHandler();

  const config: HandlerConstructorConfig = {
    networkId: 1,
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
