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
    this.currentMapName = "default";
  }

  async loadInventoryFromDB() {
    const userRef = doc(db, "users", this.userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const defaultMap = this.blockBuildUI.getMapData();
      const newData = {
        inventory: [],
        money: 0,
        maps: {
          [this.currentMapName]: defaultMap
        },
        currentMap: this.currentMapName
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

    const maps = data.maps || null;
    const currentMap = data.currentMap || null;

    if (maps && currentMap && maps[currentMap]) {
      this.currentMapName = currentMap;
      this.blockBuildUI.loadMapData(maps[currentMap]);
    } else if (maps) {
      const keys = Object.keys(maps);
      if (keys.length > 0) {
        this.currentMapName = keys[0];
        this.blockBuildUI.loadMapData(maps[keys[0]]);
        try {
          await updateDoc(userRef, { currentMap: this.currentMapName });
        } catch (err) {
          console.error("Failed to set currentMap:", err);
        }
      }
    } else if (data.map) {
      this.currentMapName = "default";
      this.blockBuildUI.loadMapData(data.map);
      try {
        await updateDoc(userRef, {
          maps: { [this.currentMapName]: data.map },
          currentMap: this.currentMapName
        });
      } catch (err) {
        console.error("Failed to migrate map:", err);
      }
    } else {
      const defaultMap = this.blockBuildUI.getMapData();
      this.currentMapName = "default";
      try {
        await updateDoc(userRef, {
          maps: { [this.currentMapName]: defaultMap },
          currentMap: this.currentMapName
        });
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
    this.createMapUI();

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
          const mapData = this.blockBuildUI.getMapData();
          try {
            await updateDoc(userRef, {
              inventory: this.inventoryData,
              ["maps." + this.currentMapName]: mapData
            });
          } catch (err) {
            console.error("Failed to update inventory/map:", err);
          }
        }
      } else if (tool === "remove") {
        const removed = this.blockBuildUI.removeBlock(x, y);
        if (removed) {
          const userRef = doc(db, "users", this.userId);
          const mapData = this.blockBuildUI.getMapData();
          try {
            await updateDoc(userRef, {
              ["maps." + this.currentMapName]: mapData
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

  createMapUI() {
    const padding = 16;

    this.newMapButton = this.add
      .text(padding, padding, "New Map", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#2ecc71"
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(1000);

    this.loadMapButton = this.add
      .text(padding, padding + 30, "Load Map", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#3498db"
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(1000);

    this.newMapButton.on("pointerdown", async () => {
      const name = window.prompt("New map name:");
      if (!name) return;

      this.currentMapName = name;
      this.blockBuildUI.resetToDefault();

      const userRef = doc(db, "users", this.userId);
      const mapData = this.blockBuildUI.getMapData();

      try {
        await updateDoc(userRef, {
          ["maps." + name]: mapData,
          currentMap: name
        });
      } catch (err) {
        console.error("Failed to create new map:", err);
      }
    });

    this.loadMapButton.on("pointerdown", async () => {
      const name = window.prompt("Map name to load:");
      if (!name) return;

      const userRef = doc(db, "users", this.userId);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return;

      const data = snap.data();
      if (!data.maps || !data.maps[name]) return;

      this.currentMapName = name;
      this.blockBuildUI.loadMapData(data.maps[name]);

      try {
        await updateDoc(userRef, {
          currentMap: name
        });
      } catch (err) {
        console.error("Failed to set currentMap:", err);
      }
    });
  }
}
