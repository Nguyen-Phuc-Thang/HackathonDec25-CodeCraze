export default class ItemSystem {
  constructor(scene) {
    this.scene = scene;

    this.hotbarUI = null;
    this.inventoryUI = null;

    this.hotbarItemSprites = [];

    this.hotbarItems = [];
  }

  registerHotbarUI(hotbarUI) {
    this.hotbarUI = hotbarUI;
    this.hotbarItemSprites = new Array(hotbarUI.numSlots).fill(null);
    this.hotbarItems = new Array(hotbarUI.numSlots).fill(null);
  }

  registerInventoryUI(inventoryUI) {
    this.inventoryUI = inventoryUI;
  }

 


equipFromInventory(icon) {
  if (!this.hotbarUI) return;

  const type = icon.blockType;

  const existingIndex = this.hotbarItems.findIndex(
    (item) => item && item.type === type
  );
  if (existingIndex !== -1) {
    this.hotbarUI.selectSlot(existingIndex);
    return;
  }

  const emptyIndex = this.hotbarItems.findIndex((item) => item === null);
  if (emptyIndex === -1) {
    return;
  }

  const pos = this.hotbarUI.getSlotIconPosition(emptyIndex);
  const textureKey = type;

  const source = this.scene.textures.get(textureKey).getSourceImage();
  const scale = Math.min(
    (this.hotbarUI.slotWidth * 0.8) / source.width,
    (this.hotbarUI.slotHeight * 0.8) / source.height
  );

  const sprite = this.scene.add
    .image(pos.x, pos.y, textureKey)
    .setOrigin(0.5)
    .setScale(scale)
    .setDepth(4);

  sprite.blockType = textureKey;

  this.hotbarItemSprites[emptyIndex] = sprite;

  const logicalItem = icon.dataItem || {
    type,
    count: icon.stackCount
  };

  this.hotbarItems[emptyIndex] = logicalItem;


  if (typeof this.hotbarUI.setSlotItem === "function") {
    this.hotbarUI.setSlotItem(emptyIndex, logicalItem);
  }

  this.hotbarUI.selectSlot(emptyIndex);
  this.hotbarUI.refreshCounts();
}


handleInventoryClick(icon) {

  this.equipFromInventory(icon);
}

handleInventoryLeftClick(icon) {
  this.equipFromInventory(icon);
}

handleHotbarClick(_slotIndex) {
}

getSelectedItem() {
  if (!this.hotbarUI) return null;
  const index = this.hotbarUI.selectedSlotIndex;
  return this.hotbarItems[index] || null;
}

getSelectedItemType() {
  const item = this.getSelectedItem();
  return item ? item.type : null;
}

getSelectedItemCount() {
  const item = this.getSelectedItem();
  return item ? item.count : 0;
}
}
