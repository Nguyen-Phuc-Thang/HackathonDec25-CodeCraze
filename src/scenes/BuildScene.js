import Phaser from "phaser";
import HotbarUI from "../ui/HotbarUI.js";
import InventoryUI from "../ui/InventoryUI.js";
import ItemSystem from "../systems/ItemSystem.js";
import BlockBuildUI from "../ui/BlockBuildUI.js";

export default class BuildScene extends Phaser.Scene {
  constructor() {
    super("BuildScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0xaecbff);

    this.itemSystem = new ItemSystem(this);

    this.hotbarUI = new HotbarUI(this, this.itemSystem);
    this.inventoryUI = new InventoryUI(this, this.itemSystem, this.hotbarUI);
    this.inventoryUI.setItems([
      { type: "grass",       count: 10 },
      { type: "dirt",        count: 10 },
      { type: "stone",       count: 10 },
      { type: "oak_planks",  count: 10 },
      { type: "oak_wood",    count: 10 },
      { type: "obsidian",    count: 10 },
      { type: "bricks",      count: 10 },
      { type: "sand",        count: 10 },
      { type: "TNT",         count: 10 },
      { type: "grass",       count: 10 }
    ]);



    this.itemSystem.registerHotbarUI(this.hotbarUI);
    this.itemSystem.registerInventoryUI(this.inventoryUI);
    this.blockBuildUI = new BlockBuildUI(this, this.hotbarUI);

    this.currentTool = "build";

    this.hotbarUI.buildButton.on("pointerdown", () => {
      this.currentTool = "build";
    });

    this.hotbarUI.removeButton.on("pointerdown", () => {
      this.currentTool = "remove";
    });

    this.blockBuildUI.onCellClick = ({ x, y, type }) => {
      if (this.currentTool === "build") {
        if (!type) {
          this.blockBuildUI.placeBlock(x, y, "dirt");
        }
      } else if (this.currentTool === "remove") {
        this.blockBuildUI.removeBlock(x, y);
      }
    };
  }
}
