import { useMemo, FC, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

const SolanaProvider: FC<Props> = ({ children }) => {
  const endpoint = useMemo(
    () => import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta"),
    []
  );
  // Phantom (and other wallets) register via Wallet Standard and are auto-detected.
  // Do NOT manually add PhantomWalletAdapter — it causes a duplicate that silently breaks connection.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaProvider;
