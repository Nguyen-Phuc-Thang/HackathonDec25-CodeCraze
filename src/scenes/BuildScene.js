import Phaser from "phaser";

export default class BuildScene extends Phaser.Scene {
  constructor() {
    super("BuildScene");
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setBackgroundColor(0xaecbff);


    // slotbar
    const barLeft = 10;
    const barBottom = 10;
    const barWidth = 5268;
    const barHeight = 636;
    const barScale = 0.16;
    const barX = barLeft + (barWidth * barScale) / 2;
    const barY = height - barBottom - (barHeight * barScale) / 2;

    this.slotBar = this.add.image(barX, barY, "slot_bar").setOrigin(0.5).setScale(barScale);

    const btnSize = 636;
    const btnScale = 0.16;
    const btnWidth = btnSize * btnScale;
    const gap = 35;

    const totalBtnWidth = btnWidth * 3 + gap * 2;
    const rightMargin = 20;
    const firstBtnX = width - rightMargin - totalBtnWidth + btnWidth / 2;
    const btnY = barY;


    this.buildButton = this.add
      .image(firstBtnX, btnY, "build_button")
      .setOrigin(0.5)
      .setScale(btnScale)
      .setInteractive({ useHandCursor: true });

    this.removeButton = this.add
      .image(firstBtnX + btnWidth + gap, btnY, "remove_button")
      .setOrigin(0.5)
      .setScale(btnScale)
      .setInteractive({ useHandCursor: true });


    this.inventoryButton = this.add
      .image(firstBtnX + (btnWidth + gap) * 2, btnY, "inventory_button")
      .setOrigin(0.5)
      .setScale(btnScale)
      .setInteractive({ useHandCursor: true });
  }
}
