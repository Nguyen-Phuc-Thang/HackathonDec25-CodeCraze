export default class HotbarUI {

  preload() {}

  constructor(scene, itemSystem) {
    this.scene = scene;
    this.itemSystem = itemSystem;

    const width = scene.scale.width;
    const height = scene.scale.height;

    const barLeft = 10;
    const barBottom = 10;
    const barWidth = 5268;
    const barHeight = 636;
    const barScale = 0.16;
    const barX = barLeft + (barWidth * barScale) / 2;
    const barY = height - barBottom - (barHeight * barScale) / 2;

    this.barY = barY;
    this.barWidth = barWidth;
    this.barHeight = barHeight;
    this.barScale = barScale;

    this.slotBar = scene.add
      .image(barX, barY, "slot_bar")
      .setOrigin(0.5)
      .setScale(barScale)
      .setDepth(1);

    const numSlots = 14;
    this.numSlots = numSlots;

    this.hotbarItemSprites = new Array(numSlots).fill(null);
    this.storedItems = new Array(numSlots).fill(null);
    this.hotbarCountTexts = new Array(numSlots).fill(null);

    const slotWidth = (barWidth / numSlots) * barScale - 3.1;
    const slotHeight = barHeight * barScale;
    this.slotWidth = slotWidth;
    this.slotHeight = slotHeight;

    const barLeftScreen = barX - (barWidth * barScale) / 2;
    const firstSlotX = barLeftScreen + slotWidth / 2 + 20;

    this.hotbarSlots = [];
    this.selectedSlotIndex = 0;

    this.slotSelection = scene.add
      .rectangle(
        firstSlotX,
        barY,
        slotWidth - 7,
        slotHeight - 50
      )
      .setOrigin(0.5)
      .setStrokeStyle(4, 0xffffff)
      .setFillStyle(0x000000, 0)
      .setDepth(5);

    for (let i = 0; i < numSlots; i++) {
      const x = firstSlotX + i * slotWidth;
      const zone = scene.add
        .zone(x, barY, slotWidth, slotHeight)
        .setOrigin(0.5)
        .setInteractive();

      zone.slotIndex = i;
      zone.on("pointerdown", () => {
        this.selectSlot(zone.slotIndex);
        this.itemSystem.handleHotbarClick(zone.slotIndex);

        const selectedItem = this.getSelectedItem();
        const price = selectedItem?.price ?? 0;

        this.scene.inventoryUI.updateBuyButtonLabel(price);
      });

      this.hotbarSlots.push(zone);
    }

    scene.input.on("wheel", (_pointer, _go, _dx, dy) => {
      if (dy > 0) {
        this.selectSlot(this.selectedSlotIndex + 1);
      } else if (dy < 0) {
        this.selectSlot(this.selectedSlotIndex - 1);
      }
    });

    const btnSize = 636;
    const btnScale = 0.16;
    const btnWidth = btnSize * btnScale;
    const gap = 10;

    const totalBtnWidth = btnWidth * 3 + gap * 2;
    const rightMargin = 20;
    const firstBtnX = width - rightMargin - totalBtnWidth + btnWidth / 2 - 20;
    const btnY = barY;

    this.modeBtnWidth = 120;
    this.modeBtnHeight = 40;
    this.modeBtnRadius = 0;

    this.inventoryBtnWidth = 160;
    this.inventoryBtnHeight = 40;
    this.inventoryBtnRadius = 0;

    this.isBuildMode = true;
    this.currentTool = "build";

    this.buildModeButton = scene.add
      .container(firstBtnX, btnY)
      .setDepth(2);

    const buildBg = scene.add.graphics();
    this.buildModeBg = buildBg;

    this.buildModeLabel = scene.add
      .text(0, 0, "BUILD", {
        font: '16px "Minecraft"',
        color: "#303030"
      })
      .setOrigin(0.5);

    this.buildModeButton.add([buildBg, this.buildModeLabel]);
    this.buildModeButton.setSize(this.modeBtnWidth, this.modeBtnHeight);
    this.buildModeButton.setInteractive({ useHandCursor: true });

    this._redrawBuildModeButton("normal");

    this.buildModeButton.on("pointerdown", () => {
      this.isBuildMode = !this.isBuildMode;
      this.currentTool = this.isBuildMode ? "build" : "remove";
      this._redrawBuildModeButton("pressed");
    });

    this.buildModeButton.on("pointerup", () => {
      this._redrawBuildModeButton("hover");
    });

    this.buildModeButton.on("pointerover", () => {
      this._redrawBuildModeButton("hover");
    });

    this.buildModeButton.on("pointerout", () => {
      this._redrawBuildModeButton("normal");
    });

    const inventoryBtnX = firstBtnX + this.inventoryBtnWidth + gap + 40;

    this.inventoryButton = scene.add
      .container(inventoryBtnX, btnY)
      .setDepth(2);

    const invBg = scene.add.graphics();
    this.inventoryBg = invBg;

    this.inventoryLabel = scene.add
      .text(0, 0, "INVENTORY", {
        font: '16px "Minecraft"',
        color: "#303030"
      })
      .setOrigin(0.5);

    this.inventoryButton.add([invBg, this.inventoryLabel]);
    this.inventoryButton.setSize(this.inventoryBtnWidth, this.inventoryBtnHeight);
    this.inventoryButton.setInteractive({ useHandCursor: true });

    this._redrawInventoryButton("normal", "INVENTORY");

    this.inventoryButton.on("pointerdown", () => {
      this._redrawInventoryButton("pressed", "INVENTORY");
    });

    this.inventoryButton.on("pointerup", () => {
      this._redrawInventoryButton("hover", "INVENTORY");
    });

    this.inventoryButton.on("pointerover", () => {
      this._redrawInventoryButton("hover", "INVENTORY");
    });

    this.inventoryButton.on("pointerout", () => {
      this._redrawInventoryButton("normal", "INVENTORY");
    });

    this.selectSlot(0);
  }

  _redrawBuildModeButton(state = "normal") {
    if (!this.buildModeBg) return;

    const g = this.buildModeBg;
    const w = this.modeBtnWidth;
    const h = this.modeBtnHeight;

    const baseGrey = 0xc6c6c6;
    const hoverGrey = 0xd8d8d8;
    const pressGrey = 0xa8a8a8;
    const outerBorder = 0x000000;
    const innerBorder = 0x373737;

    let fillColor = baseGrey;
    if (state === "hover") fillColor = hoverGrey;
    if (state === "pressed") fillColor = pressGrey;

    g.clear();
    g.fillStyle(outerBorder, 1);
    g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle(innerBorder, 1);
    g.fillRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);
    g.fillStyle(fillColor, 1);
    g.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, 2);
    g.fillStyle(0x000000, 0.35);
    g.fillRect(-w / 2 + 2, h / 2 - 4, w - 4, 2);

    this.buildModeLabel.setText(this.isBuildMode ? "BUILD" : "REMOVE");
    this.buildModeLabel.setColor("#303030");
  }

  _redrawInventoryButton(state = "normal", inventoryText = "INVENTORY") {
    if (!this.inventoryBg) return;

    const g = this.inventoryBg;
    const w = this.inventoryBtnWidth;
    const h = this.inventoryBtnHeight;

    const baseGrey = 0xc6c6c6;
    const hoverGrey = 0xd8d8d8;
    const pressGrey = 0xa8a8a8;
    const outerBorder = 0x000000;
    const innerBorder = 0x373737;

    let fillColor = baseGrey;
    if (state === "hover") fillColor = hoverGrey;
    if (state === "pressed") fillColor = pressGrey;

    g.clear();
    g.fillStyle(outerBorder, 1);
    g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle(innerBorder, 1);
    g.fillRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);
    g.fillStyle(fillColor, 1);
    g.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, 2);
    g.fillStyle(0x000000, 0.35);
    g.fillRect(-w / 2 + 2, h / 2 - 4, w - 4, 2);

    this.inventoryLabel.setText(inventoryText);
    this.inventoryLabel.setColor("#303030");
  }

  setInventoryButtonActive(active) {
    this._redrawInventoryButton(active ? "pressed" : "normal", "INVENTORY");
  }

  selectSlot(index) {
    const n = this.numSlots;
    this.selectedSlotIndex = ((index % n) + n) % n;
    const slot = this.hotbarSlots[this.selectedSlotIndex];
    this.slotSelection.x = slot.x;
  }

  getSlotIconPosition(index) {
    const slot = this.hotbarSlots[index];
    return {
      x: slot.x,
      y: this.barY
    };
  }

  setSlotItem(index, item) {
    if (index < 0 || index >= this.numSlots) return;
    this.storedItems[index] = item;
  }

  getSlotItem(index) {
    if (index < 0 || index >= this.numSlots) return null;
    return this.storedItems[index];
  }

  getSelectedItem() {
    return this.getSlotItem(this.selectedSlotIndex);
  }

  getSelectedItemType() {
    const item = this.getSelectedItem();
    return item ? item.type : null;
  }

  getSelectedItemCount() {
    const item = this.getSelectedItem();
    return item ? item.count : 0;
  }

  refreshCounts() {
    for (let i = 0; i < this.numSlots; i++) {
      const item = this.storedItems[i];
      const slot = this.hotbarSlots[i];
      let textObj = this.hotbarCountTexts[i];

      if (item && item.count > 0) {
        const textX = slot.x + this.slotWidth / 2 - 4;
        const textY = this.barY + this.slotHeight / 2 - 12;

        if (!textObj) {
          textObj = this.scene.add
            .text(textX, textY, String(item.count), {
              fontFamily: "Minecraft",
              fontSize: "14px",
              color: "#ffffff"
            })
            .setOrigin(1, 1)
            .setDepth(5);

          textObj.setStroke("#000000", 4);
          this.hotbarCountTexts[i] = textObj;
        } else {
          textObj.setText(String(item.count));
          textObj.setPosition(textX, textY);
          textObj.setVisible(true);
        }
      } else {
        if (textObj) {
          textObj.destroy();
          this.hotbarCountTexts[i] = null;
        }
      }
    }
  }

  create() {}
}
