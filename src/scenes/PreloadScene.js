import Phaser from "phaser";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.image("slot_bar", "assets/ui/hotbar/slot_bar.png");
    this.load.image("build_button", "assets/ui/hotbar/build_button.png");
    this.load.image("remove_button", "assets/ui/hotbar/remove_button.png");
    this.load.image("inventory_button", "assets/ui/hotbar/inventory_button.png");
  }

  create() {
    this.scene.start("BuildScene");
  }
}
