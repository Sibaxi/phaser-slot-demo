import Phaser from "phaser";
import { getRandomSymbol } from "../utils/utils";
import { symbolConfig } from "../config/assets";
import { ROW_COUNT, SYMBOL_SIZE } from "../config/constants";

export class Reel {
  private scene: Phaser.Scene;
  private symbols: Phaser.GameObjects.Sprite[] = [];
  private reelIndex: number;
  private isSpinning: boolean = false;
  private initialPositions: { x: number; y: number }[] = [];

  constructor(
    scene: Phaser.Scene,
    reelIndex: number,
    startX: number,
    startY: number,
    container: Phaser.GameObjects.Container
  ) {
    this.scene = scene;
    this.reelIndex = reelIndex;
    this.initializeReel(startX, startY, container);
  }

  private initializeReel(
    startX: number,
    startY: number,
    container: Phaser.GameObjects.Container
  ): void {
    const spacing = SYMBOL_SIZE + 20;
    const usedSymbols: string[] = [];

    for (let j = 0; j < ROW_COUNT; j++) {
      const symbolName = getRandomSymbol(
        Object.keys(symbolConfig),
        usedSymbols
      );
      usedSymbols.push(symbolName);

      const x = startX + this.reelIndex * spacing;
      const y = startY + j * spacing;

      const symbol = this.scene.add.sprite(x, y, symbolName);
      symbol.setDisplaySize(SYMBOL_SIZE, SYMBOL_SIZE);
      symbol.setAlpha(1);
      symbol.setDepth(1);

      const blurEffect = symbol.preFX?.addBlur(2, 2, 2, 0);
      symbol.setData("blurEffect", blurEffect);

      this.initialPositions.push({ x, y });
      container.add(symbol);
      this.symbols.push(symbol);
    }
  }

  public spin(onComplete: () => void, delay: number = 0): void {
    if (this.isSpinning) return;

    this.isSpinning = true;
    this.scene.time.delayedCall(delay, () => {
      this.spinSymbols(onComplete);
    });
  }

  private spinSymbols(onComplete: () => void): void {
    const symbolsToShow = 30;
    const spinDelay = 30;
    const finalSymbols: string[] = this.generateFinalSymbols();

    // Start spinning animation for each symbol in the reel
    this.symbols.forEach((symbol, index) => {
      this.startSymbolSpin(
        symbol,
        index,
        symbolsToShow,
        spinDelay,
        finalSymbols[index],
        () => {
          // Check if this is the last symbol in the last reel
          if (index === ROW_COUNT - 1) {
            this.isSpinning = false;
            onComplete();
          }
        }
      );
    });
  }

  private generateFinalSymbols(): string[] {
    const usedSymbols: string[] = [];
    const finalSymbols: string[] = [];

    for (let i = 0; i < ROW_COUNT; i++) {
      const finalSymbol = getRandomSymbol(
        Object.keys(symbolConfig),
        usedSymbols
      );
      finalSymbols.push(finalSymbol);
      usedSymbols.push(finalSymbol);
    }

    return finalSymbols;
  }

  private startSymbolSpin(
    symbol: Phaser.GameObjects.Sprite,
    symbolIndex: number,
    totalSpins: number,
    spinDelay: number,
    finalSymbol: string,
    onComplete: () => void
  ): void {
    const initialY = this.initialPositions[symbolIndex].y;

    // Initial bounce up animation
    this.scene.tweens.add({
      targets: symbol,
      y: initialY - 50,
      duration: 150,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.startSpinningLoop(
          symbol,
          symbolIndex,
          totalSpins,
          spinDelay,
          finalSymbol,
          initialY,
          onComplete
        );
      },
    });
  }

  private startSpinningLoop(
    symbol: Phaser.GameObjects.Sprite,
    symbolIndex: number,
    totalSpins: number,
    spinDelay: number,
    finalSymbol: string,
    initialY: number,
    onComplete: () => void
  ): void {
    let currentSpinCount = 0;

    // Add blur effect
    this.scene.tweens.add({
      targets: symbol.getData("blurEffect"),
      strength: 1,
      duration: 200,
      delay: 100,
      ease: "Linear",
    });

    const spinInterval = this.scene.time.addEvent({
      delay: spinDelay,
      repeat: totalSpins - 5,
      callback: () => {
        this.updateSymbolDuringSpinning(
          symbol,
          symbolIndex,
          currentSpinCount,
          totalSpins,
          spinDelay,
          finalSymbol,
          initialY,
          onComplete,
          spinInterval
        );
        currentSpinCount++;
      },
    });
  }

  private updateSymbolDuringSpinning(
    symbol: Phaser.GameObjects.Sprite,
    symbolIndex: number,
    currentSpinCount: number,
    totalSpins: number,
    spinDelay: number,
    finalSymbol: string,
    initialY: number,
    onComplete: () => void,
    spinInterval: Phaser.Time.TimerEvent
  ): void {
    symbol.setAlpha(0.8);

    // Move symbol down
    this.scene.tweens.add({
      targets: symbol,
      y: `+=${SYMBOL_SIZE / 2}`,
      duration: spinDelay,
      ease: "Linear",
      onComplete: () => {
        // Reset position if symbol goes too low
        if (symbol.y >= initialY + SYMBOL_SIZE) {
          symbol.y = initialY - SYMBOL_SIZE / 2;
        }

        // Change symbol texture during spinning
        if (currentSpinCount < totalSpins - 5) {
          const randomSymbol = getRandomSymbol(Object.keys(symbolConfig));
          symbol.setTexture(randomSymbol);
        }

        // Handle end of spinning
        if (currentSpinCount === totalSpins - 5) {
          this.finalizeSymbolSpin(
            symbol,
            finalSymbol,
            initialY,
            spinInterval,
            onComplete
          );
        }
      },
    });
  }

  private finalizeSymbolSpin(
    symbol: Phaser.GameObjects.Sprite,
    finalSymbol: string,
    initialY: number,
    spinInterval: Phaser.Time.TimerEvent,
    onComplete: () => void
  ): void {
    // Set final symbol
    symbol.setTexture(finalSymbol);
    spinInterval.remove();

    // Remove blur effect
    this.scene.tweens.add({
      targets: symbol.getData("blurEffect"),
      strength: 0,
      duration: 100,
      ease: "Linear",
    });

    // Final landing animation
    this.scene.tweens.add({
      targets: symbol,
      y: initialY,
      alpha: 1,
      duration: 400,
      ease: "Back.easeOut",
      onComplete: onComplete,
    });
  }

  public getSymbols(): Phaser.GameObjects.Sprite[] {
    return this.symbols;
  }

  public setSymbolGlow(symbolIndex: number, enabled: boolean): void {
    const symbol = this.symbols[symbolIndex];
    if (!symbol) return;

    if (enabled) {
      const glowEffect = symbol.preFX?.addGlow(0xffffff, 0, 0);
      symbol.setData("glowEffect", glowEffect);
      this.scene.tweens.add({
        targets: glowEffect,
        outerStrength: 10,
        duration: 500,
        ease: "Cubic.easeIn",
      });
    } else {
      const glowEffect = symbol.getData("glowEffect");
      if (glowEffect) {
        this.scene.tweens.add({
          targets: glowEffect,
          outerStrength: 0,
          duration: 200,
          ease: "Cubic.easeOut",
        });
      }
    }
  }

  public removeSymbolGlow(symbolIndex: number): void {
    const symbol = this.symbols[symbolIndex];
    if (!symbol) return;

    const glowEffect = symbol.getData("glowEffect");
    if (glowEffect) {
      glowEffect.destroy();
      symbol.setData("glowEffect", null);
    }
  }

  public getCurrentSymbols(): string[] {
    return this.symbols.map((symbol) => symbol.texture.key);
  }
}
