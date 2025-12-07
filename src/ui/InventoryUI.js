export default class InventoryUI {  

  
    constructor(scene, itemSystem, hotbarUI) {
    this.scene = scene;
    this.itemSystem = itemSystem;
    this.hotbarUI = hotbarUI;

    this.uiStyle = {
      baseColor: 0x2c3e50,
      accentColor: 0x34495e,
      hoverColor: 0x3498db,
      textColor: '#ecf0f1',
      successColor: 0x27ae60,
      font: '16px "Minecraft"',
      cornerRadius: 10
    };

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

    const buyX =
      this.invX + (this.invWidth * this.invScale) / 2 + 220;
    const buyY = this.hotbarUI.barY - this.hotbarUI.slotHeight - 50;

    const buyWidth = 150;
    const buyHeight = 100;
    const buyRadius = 20;

    this.buyButton = scene.add
      .container(buyX, buyY)
      .setDepth(4)
      .setVisible(false);

    const buyBg = scene.add.graphics();
    buyBg.lineStyle(2, 0xffffff, 1);
    buyBg.fillStyle(0x7f8c8d, 1);
    buyBg.fillRoundedRect(-buyWidth / 2, -buyHeight / 2, buyWidth, buyHeight, buyRadius);
    buyBg.strokeRoundedRect(-buyWidth / 2, -buyHeight / 2, buyWidth, buyHeight, buyRadius);

    this.buyButton.on("pointerover", () => {
      buyBg.clear();
      buyBg.lineStyle(2, 0xffffff, 1);
      buyBg.fillStyle(0x95a5a6, 1);
      buyBg.fillRoundedRect(-buyWidth / 2, -buyHeight / 2, buyWidth, buyHeight, buyRadius);
      buyBg.strokeRoundedRect(-buyWidth / 2, -buyHeight / 2, buyWidth, buyHeight, buyRadius);
    });

    this.buyButton.on("pointerout", () => {
      buyBg.clear();
      buyBg.lineStyle(2, 0xffffff, 1);
      buyBg.fillStyle(0x7f8c8d, 1);
      buyBg.fillRoundedRect(-buyWidth / 2, -buyHeight / 2, buyWidth, buyHeight, buyRadius);
      buyBg.strokeRoundedRect(-buyWidth / 2, -buyHeight / 2, buyWidth, buyHeight, buyRadius);
    });

    this.buyPriceText = scene.add
      .text(0, -8, "$ 0", {
        font: this.uiStyle.font,
        color: "#ffffff"
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.buyLabelText = scene.add
      .text(0, 14, "BUY", {
        font: this.uiStyle.font,
        color: "#ffffff"
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.buyButton.add([buyBg, this.buyPriceText, this.buyLabelText]);
    this.buyButton.setSize(buyWidth, buyHeight);
    this.buyButton.setInteractive({ useHandCursor: true });
   // this.buyButton.setText("BUY");

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

    this.inventoryItems = [];


    const self = this;

    this.createIcon = function (row, col, item) {
      const textureKey = item.type;
      const count = item.count;

      const x =
        self.invLeftScreen + self.invSlotWidth / 2 + col * self.invSlotWidth;
      const y =
        self.invTopScreen +
        self.invSlotHeight / 2 +
        row * self.invSlotHeight / 1.2;

      const source = scene.textures.get(textureKey).getSourceImage();
      const scale = Math.min(
        (self.invSlotWidth * 0.8) / source.width,
        (self.invSlotHeight * 0.8) / source.height
      );

      const icon = scene.add
        .image(x, y, textureKey)
        .setOrigin(0.5)
        .setScale(scale)
        .setDepth(4)
        .setVisible(false)
        .setInteractive({ useHandCursor: true });

      const countText = scene.add
        .text(
          x + self.invSlotWidth / 2 - 4,
          y + self.invSlotHeight / 2 - 4,
          String(count),
          {
            fontFamily: "Minecraft",
            fontSize: "14px",
            color: "#ffffff"
          }
        )
        .setOrigin(1, 1)
        .setDepth(5)
        .setVisible(false);

      countText.setStroke("#000000", 4);

      icon.invRow = row;
      icon.invCol = col;
      icon.location = "inventory";
      icon.hotbarIndex = null;
      icon.blockType = textureKey;

      icon.dataItem = item;
      icon.stackCount = item.count;
      icon.countText = countText;

      icon.on("pointerdown", function (pointer) {
        if (pointer.leftButtonDown()) {
          self.itemSystem.handleInventoryLeftClick(this);

          const selected =
            self.hotbarUI.getSelectedItem && self.hotbarUI.getSelectedItem();
          const price = selected?.price ?? 0;

          self.updateBuyButtonLabel(price);
        }
      });

      self.inventoryItems.push(icon);
    };

    hotbarUI.inventoryButton.on("pointerdown", () => {
      const show = !this.inventoryPanel.visible;
      this.setInventoryVisible(show);

      const selectedItem =
        this.hotbarUI.getSelectedItem && this.hotbarUI.getSelectedItem();
      const price = selectedItem?.price ?? 0;
      this.updateBuyButtonLabel(price);
    });

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
        if (icon.countText) icon.countText.setVisible(show);
      }
    }

    if (this.hotbarUI.setInventoryButtonActive) {
      this.hotbarUI.setInventoryButtonActive(show);
    }

    this.buyButton.setVisible(show);
  }


  setItems(items) {
    for (let i = 0; i < this.inventoryItems.length; i++) {
      const icon = this.inventoryItems[i];
      if (icon.countText) icon.countText.destroy();
      icon.destroy();
    }
    this.inventoryItems = [];

    const maxSlots = this.invRows * this.invCols;
    const count = Math.min(items.length, maxSlots);

    for (let i = 0; i < count; i++) {
      const item = items[i];
      const row = Math.floor(i / this.invCols);
      const col = i % this.invCols;
      this.createIcon(row, col, item);
    }
  }

  refreshCounts() {
    for (let i = 0; i < this.inventoryItems.length; i++) {
      const icon = this.inventoryItems[i];
      const dataItem = icon.dataItem;
      if (icon.countText && dataItem) {
        icon.countText.setText(String(dataItem.count));
      }
    }
  }

  isOpen() {
    return this.inventoryPanel.visible;
  }


  updateBuyButtonLabel(price) {
    if (!this.buyPriceText || !this.buyLabelText) return;

    if (!price || price <= 0) {
      this.buyPriceText.setText("$ 0");
      this.buyLabelText.setText("BUY");
    } else {
      this.buyPriceText.setText(`$ ${price}`);
      this.buyLabelText.setText("BUY");
    }
  }
}
