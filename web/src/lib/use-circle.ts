"use client";

import useSWR from "swr";

import { getReadOnlyClient } from "@/lib/circle-client";
import { contractCallError, describeError } from "@/lib/errors";

export interface MemberState {
  address: string;
  joined: boolean;
  depositedThisRound: boolean;
}

async function fetchCircle(circleId: bigint) {
  const client = getReadOnlyClient();
  const circleTx = await client.get_circle({ circle_id: circleId });
  const circleResult = circleTx.result;
  if (circleResult.isErr()) {
    throw contractCallError(circleTx);
  }
  const circle = circleResult.unwrap();

  const members = await Promise.all(
    circle.members.map(async (address): Promise<MemberState> => {
      const [joinedTx, depositedTx] = await Promise.all([
        client.has_joined({ circle_id: circleId, member: address }),
        client.has_deposited_current_round({ circle_id: circleId, member: address }),
      ]);
      const depositedResult = depositedTx.result;
      return {
        address,
        joined: joinedTx.result,
        depositedThisRound: depositedResult.isErr() ? false : depositedResult.unwrap(),
      };
    })
  );

  return { circle, members };
}

export const CIRCLE_REFRESH_INTERVAL_MS = 15_000;

export function useCircle(circleId: bigint) {
  const { data, error, isLoading, mutate } = useSWR(
    ["circle", circleId.toString()],
    () => fetchCircle(circleId),
    // Members act from their own browsers, so refresh regularly to show their joins and deposits.
    { refreshInterval: CIRCLE_REFRESH_INTERVAL_MS }
  );

  return {
    circle: data?.circle,
    members: data?.members,
    loading: isLoading,
    error: error ? describeError(error) : null,
    refetch: async () => {
      await mutate();
    },
  };
}
