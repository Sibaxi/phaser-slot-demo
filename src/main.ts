import SlotMachineScene from "./scenes/SlotMachineScene";
import { AUTO, Game, Scale } from "phaser";

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1920,
  height: 1080,
  parent: "game-container",
  backgroundColor: "#333333",
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  scene: [SlotMachineScene],
  physics: {
    default: "arcade",
  },
};

export default new Game(config);
