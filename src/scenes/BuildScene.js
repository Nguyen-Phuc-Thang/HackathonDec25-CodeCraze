import { db } from "../firebase/firebaseConfig.js";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

import Phaser from "phaser";
import HotbarUI from "../ui/HotbarUI.js";
import InventoryUI from "../ui/InventoryUI.js";
import ItemSystem from "../systems/ItemSystem.js";
import BlockBuildUI from "../ui/BlockBuildUI.js";

export default class BuildScene extends Phaser.Scene {
  constructor() {
    super("BuildScene");
  }

  async loadInventoryFromDB() {
    const userRef = doc(db, "users", this.userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      console.warn("User not found:", this.userId);
      this.inventoryUI.setItems([]);
      return;
    }

    const data = snap.data();
    const inventory = data.inventory || [];

    this.inventoryUI.setItems(inventory);
  }

  setupInventoryRealtime() {
    const userRef = doc(db, "users", this.userId);

    onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      const inventory = data.inventory || [];

      this.inventoryUI.setItems(inventory);
    });
  }
  init(data) {
    this.userId = data.userId;
    console.log("Loaded userId:", this.userId);
  }

  create() {
    this.cameras.main.setBackgroundColor(0xaecbff);

    this.itemSystem = new ItemSystem(this);

    this.hotbarUI = new HotbarUI(this, this.itemSystem);
    this.inventoryUI = new InventoryUI(this, this.itemSystem, this.hotbarUI);
    console.log("Fetching inventory for userId:", this.userId);
    this.loadInventoryFromDB();
    this.setupInventoryRealtime();


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
