import Phaser from "phaser";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.image("slot_bar", "assets/ui/hotbar/slot_bar.png");
    this.load.image("build_button1", "assets/ui/hotbar/build_button1.png");
    this.load.image("build_button2", "assets/ui/hotbar/build_button2.png");
    this.load.image("build_button3", "assets/ui/hotbar/build_button3.png");
    this.load.image("build_button4", "assets/ui/hotbar/build_button4.png");
    this.load.image("inventory_button", "assets/ui/hotbar/inventory_button.png");
    this.load.image("inventory_button1", "assets/ui/hotbar/inventory_button1.png");
    this.load.image("inventory_panel", "assets/ui/inventory_panel.png");
    this.load.image("buy_button", "assets/ui/buy_button.png");

    this.load.image("grass", "assets/blocks/grass.png");
    this.load.image("dirt", "assets/blocks/dirt.png");
    this.load.image("bedrock", "assets/blocks/bedrock.png");
    this.load.image("stone", "assets/blocks/stone.png");
    this.load.image("oak_planks", "assets/blocks/oak_planks.png");
    this.load.image("oak_wood", "assets/blocks/oak_wood.png");
    this.load.image("obsidian", "assets/blocks/obsidian.png");
    this.load.image("bricks", "assets/blocks/bricks.png");
    this.load.image("sand", "assets/blocks/sand.png");
    this.load.image("TNT", "assets/blocks/TNT.png");
    this.load.font('Minecraft', 'assets/fonts/Minecraft.ttf');
  }

  create() {

    async function loadInventoryFromDB() {
      const userRef = doc(db, "users", this.userId);

      const snap = await getDoc(userRef);
      const inv = snap.data().inventory || [];

      this.inventoryUI.setItems(inv);
    }
    const userId = "demoUser";
    this.scene.start("BuildScene", { userId });
  }
}
