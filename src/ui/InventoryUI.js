export default class InventoryUI {
  constructor(scene, itemSystem, hotbarUI) {
    this.scene = scene;
    this.itemSystem = itemSystem;
    this.hotbarUI = hotbarUI;

    const width = scene.scale.width;
    const height = scene.scale.height;

    const barLeft = 10;
    const barBottom = 10;
    const barWidth = 5268;
    const barHeight = 636;
    const barScale = 0.16;
    const barX = barLeft + (barWidth * barScale) / 2;
    const barY = height - barBottom - (barHeight * barScale) / 2;

    const invWidth = barWidth;
    const invHeight = 1356;
    const invScale = barScale;
    const invGap = 10;

    const invX = barX;
    const invY =
      barY -
      (barHeight * barScale) / 2 -
      (invHeight * invScale) / 2 -
      invGap;

    this.invX = invX;
    this.invY = invY;
    this.invWidth = invWidth;
    this.invHeight = invHeight;
    this.invScale = invScale;

    this.inventoryPanel = scene.add
      .image(invX, invY, "inventory_panel")
      .setOrigin(0.5)
      .setScale(invScale)
      .setVisible(false)
      .setDepth(3);

    const invRows = 3;
    const invCols = 14;

    this.invRows = invRows;
    this.invCols = invCols;

    const invSlotWidth = (invWidth / invCols) * invScale - 3.3;
    const invSlotHeight = (invHeight / invRows) * invScale - 3.3;

    this.invSlotWidth = invSlotWidth;
    this.invSlotHeight = invSlotHeight;

    const invLeftScreen = invX - (invWidth * invScale) / 2 + 22;
    const invTopScreen = invY - (invHeight * invScale) / 2 + 17;

    this.invLeftScreen = invLeftScreen;
    this.invTopScreen = invTopScreen;

    const grassSource = scene.textures.get("grass").getSourceImage();
    const grassScale = Math.min(
      (invSlotWidth * 0.8) / grassSource.width,
      (invSlotHeight * 0.8) / grassSource.height
    );

    this.inventoryItems = [];

    this.inventorySelection = scene.add
      .rectangle(
        invLeftScreen + invSlotWidth / 2,
        invTopScreen + invSlotHeight / 2,
        invSlotWidth - 6,
        invSlotHeight - 18
      )
      .setOrigin(0.5)
      .setStrokeStyle(4, 0xffffff)
      .setFillStyle(0x000000, 0)
      .setDepth(5)
      .setVisible(false);

    this.selectedInventoryRow = 0;
    this.selectedInventoryCol = 0;

    const self = this;

    for (let row = 0; row < invRows; row++) {
      for (let col = 0; col < invCols; col++) {
        const x = invLeftScreen + invSlotWidth / 2 + col * invSlotWidth;
        const y = invTopScreen + invSlotHeight / 2 + row * invSlotHeight / 1.2;

        const icon = scene.add
          .image(x, y, "grass")
          .setOrigin(0.5)
          .setScale(grassScale)
          .setDepth(4)
          .setVisible(false)
          .setInteractive({ useHandCursor: true });

        icon.invRow = row;
        icon.invCol = col;
        icon.location = "inventory";
        icon.hotbarIndex = null;

        icon.on("pointerdown", function () {
          self.selectInventorySlot(this.invRow, this.invCol);
          self.itemSystem.handleInventoryClick(this);
        });

        this.inventoryItems.push(icon);
      }
    }

    hotbarUI.inventoryButton.on("pointerdown", () => {
      const show = !this.inventoryPanel.visible;
      this.setInventoryVisible(show);
    });
  }

  selectInventorySlot(row, col) {
    const r = ((row % this.invRows) + this.invRows) % this.invRows;
    const c = ((col % this.invCols) + this.invCols) % this.invCols;

    this.selectedInventoryRow = r;
    this.selectedInventoryCol = c;

    const x =
      this.invLeftScreen + this.invSlotWidth / 2 + c * this.invSlotWidth;
    const y =
      this.invTopScreen +
      this.invSlotHeight / 2 +
      r * this.invSlotHeight / 1.2;

    this.inventorySelection.setPosition(x, y);
  }

  getCellPosition(row, col) {
    const x =
      this.invLeftScreen + this.invSlotWidth / 2 + col * this.invSlotWidth;
    const y =
      this.invTopScreen +
      this.invSlotHeight / 2 +
      row * this.invSlotHeight / 1.2;
    return { x, y };
  }

  setInventoryVisible(show) {
    this.inventoryPanel.setVisible(show);

    for (let i = 0; i < this.inventoryItems.length; i++) {
      const icon = this.inventoryItems[i];
      if (icon.location === "inventory") {
        icon.setVisible(show);
      }
    }

    this.inventorySelection.setVisible(show);

    if (show) {
      this.selectInventorySlot(
        this.selectedInventoryRow,
        this.selectedInventoryCol
      );
    }
  }

  isOpen() {
    return this.inventoryPanel.visible;
  }
}
