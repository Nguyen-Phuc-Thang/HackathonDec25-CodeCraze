export default class ItemSystem {
  constructor(scene) {
    this.scene = scene;
    this.hotbarUI = null;
    this.inventoryUI = null;
    this.hotbarItemSprites = [];
  }

  registerHotbarUI(hotbarUI) {
    this.hotbarUI = hotbarUI;
    this.hotbarItemSprites = new Array(hotbarUI.numSlots).fill(null);
  }

  registerInventoryUI(inventoryUI) {
    this.inventoryUI = inventoryUI;
  }

  handleInventoryClick(icon) {
    if (!this.hotbarUI) return;
    const hotIndex = this.hotbarUI.selectedSlotIndex;

    const existing = this.hotbarItemSprites[hotIndex];
    if (existing && existing !== icon) {
      const posBack = this.inventoryUI.getCellPosition(
        existing.invRow,
        existing.invCol
      );
      existing.setPosition(posBack.x, posBack.y);
      existing.location = "inventory";
      existing.hotbarIndex = null;
      existing.setVisible(this.inventoryUI.isOpen());
    }

    const slotPos = this.hotbarUI.getSlotIconPosition(hotIndex);
    icon.location = "hotbar";
    icon.hotbarIndex = hotIndex;
    icon.setPosition(slotPos.x, slotPos.y);
    icon.setVisible(true);
    this.hotbarItemSprites[hotIndex] = icon;
  }

  handleHotbarClick(slotIndex) {
    if (!this.inventoryUI || !this.inventoryUI.isOpen()) return;
    const icon = this.hotbarItemSprites[slotIndex];
    if (!icon) return;

    const posBack = this.inventoryUI.getCellPosition(
      icon.invRow,
      icon.invCol
    );
    icon.setPosition(posBack.x, posBack.y);
    icon.location = "inventory";
    icon.hotbarIndex = null;
    icon.setVisible(true);
    this.hotbarItemSprites[slotIndex] = null;
  }
}
