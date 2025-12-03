import Phaser from "phaser";
import HotbarUI from "../ui/HotbarUI.js";
import InventoryUI from "../ui/InventoryUI.js";
import ItemSystem from "../systems/ItemSystem.js";

export default class BuildScene extends Phaser.Scene {
  constructor() {
    super("BuildScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0xaecbff);

    this.itemSystem = new ItemSystem(this);

    this.hotbarUI = new HotbarUI(this, this.itemSystem);
    this.inventoryUI = new InventoryUI(this, this.itemSystem, this.hotbarUI);

    this.itemSystem.registerHotbarUI(this.hotbarUI);
    this.itemSystem.registerInventoryUI(this.inventoryUI);
  }
}
