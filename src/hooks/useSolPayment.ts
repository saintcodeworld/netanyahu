import { useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// Prize pool treasury wallet
const PRIZE_POOL_WALLET = new PublicKey(
  "GWaddFKFY8FXz2HabhKr916EWFWdHtVRspD4MhANtyX4"
);

const MESSAGE_COST_SOL = 0.01;

export function useSolPayment() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const payForMessage = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !connected) {
      return false;
    }

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: PRIZE_POOL_WALLET,
          lamports: Math.round(MESSAGE_COST_SOL * LAMPORTS_PER_SOL),
        })
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      return true;
    } catch (error) {
      console.error("SOL payment failed:", error);
      return false;
    }
  }, [publicKey, connected, connection, sendTransaction]);

  return {
    payForMessage,
    messageCost: MESSAGE_COST_SOL,
    canPay: connected && !!publicKey,
  };
}
