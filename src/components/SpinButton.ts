export class SpinButton {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, onSpin: () => void) {
    this.scene = scene;
    this.container = this.createButton(x, y, onSpin);
  }

  private createButton(
    x: number,
    y: number,
    onSpin: () => void
  ): Phaser.GameObjects.Container {
    const buttonWidth = 400;
    const buttonHeight = 80;

    const container = this.scene.add.container(x, y);
    const buttonBg = this.scene.add.graphics();

    buttonBg.fillStyle(0xf9fafb, 0.9);
    buttonBg.fillRoundedRect(
      -buttonWidth / 2,
      -buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      12
    );
    buttonBg.lineStyle(1, 0xffffff, 1);
    buttonBg.strokeRoundedRect(
      -buttonWidth / 2,
      -buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      12
    );

    const buttonText = this.scene.add
      .text(0, 0, "Spin!", {
        fontSize: "40px",
        fontFamily: "Space Grotesk, sans-serif",
        fontStyle: "bold",
        color: "#000",
      })
      .setOrigin(0.5);

    container.add([buttonBg, buttonText]);
    this.setupInteractivity(container, onSpin);

    return container;
  }

  private setupInteractivity(
    container: Phaser.GameObjects.Container,
    onSpin: () => void
  ): void {
    container
      .setSize(400, 80)
      .setInteractive()
      .on("pointerdown", () => {
        onSpin();
        this.scene.tweens.add({
          targets: container,
          scale: 0.93,
          duration: 150,
          ease: "Power2",
        });
      })
      .on("pointerup", () => {
        this.scene.tweens.add({
          targets: container,
          scale: 1,
          duration: 150,
          ease: "Power2",
        });
      })
      .on("pointerover", () => {
        this.scene.tweens.add({
          targets: container,
          scale: 0.98,
          duration: 200,
          ease: "Power2",
        });
      })
      .on("pointerout", () => {
        this.scene.tweens.add({
          targets: container,
          scale: 1,
          duration: 200,
          ease: "Power2",
        });
      });
  }

  public disable(): void {
    this.container.disableInteractive();
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0.5,
      duration: 200,
      ease: "Linear",
    });
  }

  public enable(): void {
    this.container.setInteractive();
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 200,
      ease: "Linear",
    });
  }
}
