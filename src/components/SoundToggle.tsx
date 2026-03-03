import { Volume2, VolumeX } from "lucide-react";
import { useSoundSettings } from "../context/SoundContext";

export default function SoundToggle() {
  const { soundEnabled, toggleSound } = useSoundSettings();

  return (
    <button
      onClick={toggleSound}
      className="p-1.5 rounded-lg border border-blue-900/30 bg-black/40 hover:bg-blue-900/20 transition-all cursor-pointer"
      title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
    >
      {soundEnabled ? (
        <Volume2 className="w-3.5 h-3.5 text-blue-400" />
      ) : (
        <VolumeX className="w-3.5 h-3.5 text-red-400" />
      )}
    </button>
  );
}
