import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "./ui/button";
import { Wallet, LogOut } from "lucide-react";

export default function WalletConnect() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-blue-400/70">{shortAddress}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="gap-1 text-[10px] h-7 px-2 border-blue-800/50 text-blue-400 hover:text-red-400 hover:border-red-800/50"
        >
          <LogOut className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => setVisible(true)}
      className="gap-1.5 text-[11px] bg-blue-600/80 hover:bg-blue-600 border-blue-700/50"
    >
      <Wallet className="w-3.5 h-3.5" />
      Connect
    </Button>
  );
}
