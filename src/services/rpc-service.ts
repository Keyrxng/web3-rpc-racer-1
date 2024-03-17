import { ValidBlockData } from "../../types/handler";
import axios from "axios";
type PromiseResult = { success: boolean; rpcUrl: string; duration: number };

export class RPCService {
  static async testRpcPerformance(
    networkId: number,
    latencies: Record<string, number>,
    runtimeRpcs: string[],
    rpcHeader: object,
    rpcBody: string
  ): Promise<{ latencies: Record<string, number>; runtimeRpcs: string[] }> {
    const successfulPromises = runtimeRpcs.map<Promise<PromiseResult>>(
      (rpcUrl) =>
        new Promise<PromiseResult>((resolve) => {
          const startTime = performance.now();
          axios
            .post(rpcUrl, rpcBody, {
              headers: rpcHeader,
              cancelToken: new axios.CancelToken((c) => setTimeout(() => c("Request Timeout"), 500)),
            })
            .then(() => {
              const endTime = performance.now();
              resolve({
                rpcUrl,
                duration: endTime - startTime,
                success: true,
              });
            })
            .catch(() => {
              resolve({ rpcUrl, success: false, duration: 0 });
            });
        })
    );

    const fastest = await Promise.race(successfulPromises);

    if (fastest.success) {
      latencies[`${fastest.rpcUrl}_${networkId}_`] = fastest.duration;
    }

    const allResults = await Promise.allSettled(successfulPromises);

    allResults.forEach((result) => {
      if (result.status === "fulfilled" && (result.value as PromiseResult).success) {
        latencies[`${(result.value as PromiseResult).rpcUrl}_${networkId}_`] = (result.value as PromiseResult).duration;
      } else if (result.status === "fulfilled") {
        const fulfilledResult = result.value as PromiseResult;
        const index = runtimeRpcs.indexOf(fulfilledResult.rpcUrl);
        if (index > -1) {
          runtimeRpcs.splice(index, 1);
        }
      }
    });

    return { latencies, runtimeRpcs };
  }

  static async findFastestRpc(latencies: Record<string, number>, networkId: number): Promise<string> {
    if (Object.keys(latencies).length === 0) {
      console.error("[RPCService] Latencies object is empty");
    }

    try {
      const validLatencies: Record<string, number> = Object.entries(latencies)
        .filter(([key]) => key.endsWith(`_${networkId}_`))
        .reduce(
          (acc, [key, value]) => {
            acc[key] = value;
            return acc;
          },
          {} as Record<string, number>
        ); // Add index signature for validLatencies object

      return Object.keys(validLatencies)
        .reduce((a, b) => (validLatencies[a] < validLatencies[b] ? a : b))
        .split("_")[0];
    } catch (error) {
      console.error("[RPCService] Failed to find fastest RPC");
      return "";
    }
  }

  static _verifyBlock(data: ValidBlockData): boolean {
    try {
      const { jsonrpc, id, result } = data;
      const { number, timestamp, hash } = result;
      return (
        jsonrpc === "2.0" && id === 1 && parseInt(number, 16) > 0 && parseInt(timestamp, 16) > 0 && hash.match(/[0-9|a-f|A-F|x]/gm)?.join("").length === 66
      );
    } catch (error) {
      return false;
    }
  }
}
