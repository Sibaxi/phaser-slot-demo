import Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  REEL_COUNT,
  ROW_COUNT,
  SYMBOL_SIZE,
} from "../config/constants";
import { symbolConfig, backgroundImage, confetti } from "../config/assets";
import { SpinButton } from "../components/SpinButton";
import { Reel } from "../components/Reel";
import { WinDisplay } from "../components/WinDisplay";
import { FrameData } from "../types/types";
import WebFont from "webfontloader";

export default class SlotMachineScene extends Phaser.Scene {
  private reels: Reel[] = [];
  private spinButton!: SpinButton;
  private winDisplay!: WinDisplay;
  private isSpinning: boolean = false;
  private fontLoaded: boolean = false;

  constructor() {
    super({ key: "SlotMachineScene" });
  }

  preload(): void {
    Object.entries(symbolConfig).forEach(([symbolName, path]) => {
      this.load.image(symbolName, path);
    });
    this.load.image("background", backgroundImage);
    this.loadFont();

    this.load.spritesheet("confetti", confetti, {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  private loadFont(): void {
    WebFont.load({
      google: { families: ["Space Grotesk:700"] },
      active: () => {
        this.fontLoaded = true;
      },
    });
  }

  create(): void {
    if (!this.fontLoaded) {
      this.time.addEvent({
        delay: 100,
        callback: () => this.create(),
        callbackScope: this,
      });
      return;
    }

    this.createBackground();
    const frameData = this.createReelFrame();
    this.createReels(frameData);
    this.createSpinButton();
    this.createTitle();
    this.winDisplay = new WinDisplay(this);
  }

  private createBackground(): void {
    const background = this.add.sprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      "background"
    );
    background.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x000000, 0x110024, 0x1a0008, 0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private createReelFrame(): FrameData {
    const frameX =
      GAME_WIDTH / 2 -
      (REEL_COUNT * SYMBOL_SIZE + (REEL_COUNT - 1) * 20) / 2 -
      10;
    const frameY =
      GAME_HEIGHT / 2 -
      (ROW_COUNT * SYMBOL_SIZE + (ROW_COUNT - 1) * 20) / 2 -
      50;
    const frameWidth = REEL_COUNT * SYMBOL_SIZE + (REEL_COUNT - 1) * 20 + 40;
    const frameHeight = ROW_COUNT * SYMBOL_SIZE + (ROW_COUNT - 1) * 20 + 40;

    const container = this.add.container(0, 0);
    container.setDepth(2);
    this.createFrameBackground(frameX, frameY, frameWidth, frameHeight);
    this.createGridLines(frameX, frameY, frameWidth, frameHeight);
    this.createMask(frameX, frameY, frameWidth, frameHeight, container);

    return { frameX, frameY, frameWidth, frameHeight, container };
  }

  private createFrameBackground(
    frameX: number,
    frameY: number,
    frameWidth: number,
    frameHeight: number
  ): void {
    const frame = this.add.graphics();
    frame.lineStyle(2, 0xffffff, 1);
    frame.fillStyle(0x000000, 0.5);
    frame.strokeRoundedRect(frameX, frameY, frameWidth, frameHeight, 16);
    frame.fillRoundedRect(frameX, frameY, frameWidth, frameHeight, 16);
  }

  private createGridLines(
    frameX: number,
    frameY: number,
    frameWidth: number,
    frameHeight: number
  ): void {
    const grid = this.add.graphics();
    grid.lineStyle(1, 0xffffff, 0.15);

    for (let i = 1; i < REEL_COUNT; i++) {
      const x = frameX + (frameWidth / REEL_COUNT) * i;
      grid.lineBetween(x, frameY + 10, x, frameY + frameHeight - 10);
    }

    for (let i = 1; i < ROW_COUNT; i++) {
      const y = frameY + (frameHeight / ROW_COUNT) * i;
      grid.lineBetween(frameX + 10, y, frameX + frameWidth - 10, y);
    }
  }

  private createMask(
    frameX: number,
    frameY: number,
    frameWidth: number,
    frameHeight: number,
    container: Phaser.GameObjects.Container
  ): void {
    const maskGraphics = this.add.graphics();
    maskGraphics.fillStyle(0x000000);
    maskGraphics.fillRoundedRect(frameX, frameY, frameWidth, frameHeight, 16);
    container.setMask(
      new Phaser.Display.Masks.GeometryMask(this, maskGraphics)
    );
  }

  private createReels(frameData: FrameData): void {
    const symbolSpacing =
      (frameData.frameWidth - 60 - REEL_COUNT * SYMBOL_SIZE) / (REEL_COUNT - 1);
    const offsetX = 115;
    const offsetY = 130;
    for (let i = 0; i < REEL_COUNT; i++) {
      const startX = frameData.frameX + offsetX + i * symbolSpacing;
      const startY = frameData.frameY + offsetY;
      this.reels[i] = new Reel(this, i, startX, startY, frameData.container);
    }
  }

  private createSpinButton(): void {
    const buttonX = GAME_WIDTH / 2;
    const buttonY = GAME_HEIGHT - 140;
    this.spinButton = new SpinButton(this, buttonX, buttonY, () => this.spin());
  }

  private createTitle(): void {
    const titleConfig: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: "48px",
      color: "#ffffff",
      fontFamily: "Space Grotesk",
      fontStyle: "bold",
      align: "center",
    };

    this.add
      .text(GAME_WIDTH / 2, 100, "Slot Machine", titleConfig)
      .setOrigin(0.45, 0.5)
      .setDepth(3);
  }

  private spin(): void {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.spinButton.disable();

    for (let i = 0; i < REEL_COUNT; i++) {
      this.removeHighlightWinningSymbols(i);
      this.time.delayedCall(i * 300, () => {
        this.spinReel(i, i === REEL_COUNT - 1);
      });
    }
  }

  private spinReel(reelIndex: number, isLastReel: boolean): void {
    this.reels[reelIndex].spin(() => {
      if (isLastReel) {
        this.onSpinComplete();
      }
    });
  }

  private onSpinComplete(): void {
    this.isSpinning = false;

    if (this.checkForWin()) {
      this.triggerWin();
    } else this.spinButton.enable();
  }

  private checkForWin(): boolean {
    for (let row = 0; row < ROW_COUNT; row++) {
      if (this.checkRowForWin(row)) {
        return true;
      }
    }
    return false;
  }

  private checkRowForWin(row: number): boolean {
    const firstSymbolTexture = this.reels[0].getSymbols()[row].texture.key;

    for (let i = 1; i < REEL_COUNT; i++) {
      const currentSymbolTexture = this.reels[i].getSymbols()[row].texture.key;
      if (currentSymbolTexture !== firstSymbolTexture) {
        return false;
      }
    }

    this.highlightWinningSymbols(row);
    return true;
  }

  private removeHighlightWinningSymbols(row: number): void {
    for (let i = 0; i < REEL_COUNT; i++) {
      this.reels[i].setSymbolGlow(row, false);
    }
  }

  private highlightWinningSymbols(row: number): void {
    for (let i = 0; i < REEL_COUNT; i++) {
      this.reels[i].setSymbolGlow(row, true);
    }
  }

  private triggerWin(): void {
    this.winDisplay.show(() => {
      this.spinButton.enable();
    });
  }
}
