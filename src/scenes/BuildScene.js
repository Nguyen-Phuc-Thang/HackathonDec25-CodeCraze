import { db } from "../firebase/firebaseConfig.js";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

import Phaser from "phaser";
import HotbarUI from "../ui/HotbarUI.js";
import InventoryUI from "../ui/InventoryUI.js";
import ItemSystem from "../systems/ItemSystem.js";
import BlockBuildUI from "../ui/BlockBuildUI.js";

export default class BuildScene extends Phaser.Scene {
  constructor() {
    super("BuildScene");
    this.inventoryData = [];
    this.money = 0;
  }

  async loadInventoryFromDB() {
    const userRef = doc(db, "users", this.userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const defaultMap = this.blockBuildUI.getMapData();

      const newData = {
        inventory: [],
        money: 0,
        map: defaultMap
      };

      try {
        await setDoc(userRef, newData);
      } catch (err) {
        console.error("Failed to create user doc:", err);
      }

      this.inventoryData = newData.inventory;
      this.money = newData.money;
      this.inventoryUI.setItems(this.inventoryData);
      this.updateMoneyUI();
      return;
    }

    const data = snap.data();

    this.inventoryData = data.inventory || [];
    this.money = data.money ?? 0;
    this.inventoryUI.setItems(this.inventoryData);
    this.updateMoneyUI();

    if (data.map) {
      this.blockBuildUI.loadMapData(data.map);
    } else {
      const defaultMap = this.blockBuildUI.getMapData();
      try {
        await updateDoc(userRef, { map: defaultMap });
      } catch (err) {
        console.error("Failed to save default map:", err);
      }
    }
  }

  setupInventoryRealtime() {
    const userRef = doc(db, "users", this.userId);

    onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      this.inventoryData = data.inventory || [];
      this.inventoryUI.setItems(this.inventoryData);
    });
  }

  init(data) {
    this.userId = data.userId;
  }

  create() {
    this.cameras.main.setBackgroundColor(0xaecbff);
    this.createMoneyUI();

    if (this.input.mouse) {
      this.input.mouse.disableContextMenu();
    }

    this.itemSystem = new ItemSystem(this);
    this.hotbarUI = new HotbarUI(this, this.itemSystem);
    this.inventoryUI = new InventoryUI(this, this.itemSystem, this.hotbarUI);
    this.blockBuildUI = new BlockBuildUI(this, this.hotbarUI);

    this.loadInventoryFromDB();

    this.itemSystem.registerHotbarUI(this.hotbarUI);
    this.itemSystem.registerInventoryUI(this.inventoryUI);

    this.blockBuildUI.onCellClick = async ({ x, y, type }) => {
      const tool = this.hotbarUI.currentTool || "build";

      if (tool === "build") {
        const selectedItem = this.hotbarUI.getSelectedItem();
        if (!selectedItem || selectedItem.count <= 0) return;

        if (!type) {
          this.blockBuildUI.placeBlock(x, y, selectedItem.type);
          selectedItem.count -= 1;

          this.inventoryUI.refreshCounts();
          this.hotbarUI.refreshCounts();

          const userRef = doc(db, "users", this.userId);
          try {
            await updateDoc(userRef, {
              inventory: this.inventoryData,
              map: this.blockBuildUI.getMapData()
            });
          } catch (err) {
            console.error("Failed to update inventory/map:", err);
          }
        }
      } else if (tool === "remove") {
        const removed = this.blockBuildUI.removeBlock(x, y);
        if (removed) {
          const userRef = doc(db, "users", this.userId);
          try {
            await updateDoc(userRef, {
              map: this.blockBuildUI.getMapData()
            });
          } catch (err) {
            console.error("Failed to update map:", err);
          }
        }
      }
    };

    this.inventoryUI.buyButton.on("pointerdown", async () => {
      const selectedItem = this.hotbarUI.getSelectedItem();
      if (!selectedItem) return;

      const price = selectedItem.price ?? 0;
      if (this.money < price || price <= 0) return;

      this.money -= price;
      selectedItem.count += 1;

      this.updateMoneyUI();
      this.inventoryUI.refreshCounts();
      this.hotbarUI.refreshCounts();

      const userRef = doc(db, "users", this.userId);
      try {
        await updateDoc(userRef, {
          money: this.money,
          inventory: this.inventoryData
        });
      } catch (err) {
        console.error("Failed to update money/inventory:", err);
      }
    });
  }

  createMoneyUI() {
    const padding = 16;

    this.moneyText = this.add
      .text(this.scale.width - padding, padding, `$${this.money}`, {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#FFD700",
        stroke: "#000",
        strokeThickness: 4
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000);
  }

  updateMoneyUI() {
    if (this.moneyText) {
      this.moneyText.setText(`$${this.money}`);
    }
  }
}
