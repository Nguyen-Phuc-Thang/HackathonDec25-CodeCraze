import { db } from "../firebase/firebaseConfig.js";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  setDoc
} from "firebase/firestore";

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
    this.mapsCache = {};
    this.mapNames = [];
  }

  async loadInventoryFromDB() {
    const userRef = doc(db, "users", this.userId);
    console.log("Loading inventory for user:", this.userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const defaultMap = this.blockBuildUI.getMapData();
      const maps = { [this.currentMapName]: defaultMap };

      const newData = {
        inventory: [],
        money: 0,
        maps,
        currentMap: this.currentMapName
      };

      try {
        await setDoc(userRef, newData);
      } catch (err) {
        console.error(err);
      }

      this.inventoryData = [];
      this.money = 0;
      this.mapsCache = maps;
      this.mapNames = Object.keys(this.mapsCache);
      this.inventoryUI.setItems([]);
      this.updateMoneyUI();
      this.refreshMapDropdownLabel();
      this.refreshMapOptions();
      return;
    }

    const data = snap.data();

    this.inventoryData = data.inventory || [];
    this.money = data.money ?? 0;
    this.inventoryUI.setItems(this.inventoryData);
    this.updateMoneyUI();

    let maps = data.maps || null;

    if (!maps && data.map) {
      maps = { [this.currentMapName]: data.map };
      try {
        await updateDoc(userRef, {
          maps,
          currentMap: this.currentMapName
        });
      } catch (err) {
        console.error(err);
      }
    }

    if (!maps) {
      const defaultMap = this.blockBuildUI.getMapData();
      maps = { [this.currentMapName]: defaultMap };
      try {
        await updateDoc(userRef, {
          maps,
          currentMap: this.currentMapName
        });
      } catch (err) { 
        console.error(err);
      }
    }

    this.mapsCache = maps;
    this.mapNames = Object.keys(this.mapsCache);

    let nameToUse = data.currentMap;
    if (!nameToUse || !this.mapsCache[nameToUse]) {
      nameToUse = this.mapNames[0];
      try {
        await updateDoc(userRef, { currentMap: nameToUse });
      } catch (err) {
        console.error(err);
      }
    }

    this.currentMapName = nameToUse;
    this.blockBuildUI.loadMapData(this.mapsCache[this.currentMapName]);
    this.refreshMapDropdownLabel();
    this.refreshMapOptions();
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

    this.uiStyle = {
      baseColor: 0x707070,       
      accentColor: 0x4f4f4f,       
      hoverColor: 0x8b8b8b,       
      selectedColor: 0x006400,      
      textColor: "#f5f5f5",       
      mutedTextColor: "#d0d0d0",  
      successColor: 0x00aa00,       
      font: "16px Minecraft",
      cornerRadius: 4
    };

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
          this.mapsCache[this.currentMapName] = mapData;

          try {
            await updateDoc(userRef, {
              inventory: this.inventoryData,
              ["maps." + this.currentMapName]: mapData
            });
          } catch (err) {
            console.error(err);
          }
        }
      } else if (tool === "remove") {
        const removed = this.blockBuildUI.removeBlock(x, y);
        if (removed) {
          const userRef = doc(db, "users", this.userId);
          const mapData = this.blockBuildUI.getMapData();
          this.mapsCache[this.currentMapName] = mapData;

          try {
            await updateDoc(userRef, {
              ["maps." + this.currentMapName]: mapData
            });
          } catch (err) {
            console.error(err);
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
        console.error(err);
      }
    });

    const switchButton = this.add.sprite(this.scale.width / 2, 35, "buildMode").setOrigin(0.5).setScale(3).setInteractive();
    switchButton.on('pointerdown', () => {
        this.scene.start("PomodoroScene", { userId: this.userId });
    });
  }

  createMoneyUI() {
    const padding = 16;

    this.moneyText = this.add
      .text(padding + 80, padding, `$${this.money}`, {
        fontFamily: "Minecraft",
        fontSize: "29px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3
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
    const width = 200;
    const height = 40;

    this.mapHeaderContainer = this.add.container(padding + 870, padding).setDepth(1001);

    this.mapDropdownBg = this.add.graphics();
    this.drawDropdownHeader(false);
    this.mapHeaderContainer.add(this.mapDropdownBg);

    this.mapDropdownLabel = this.add
      .text(15, height / 2, this.currentMapName, {
        font: this.uiStyle.font,
        color: this.uiStyle.textColor,
        fontStyle: "bold"
      })
      .setOrigin(0, 0.5);
    this.mapHeaderContainer.add(this.mapDropdownLabel);

    this.arrowIcon = this.add
      .text(width - 25, height / 2, "▼", {
        font: "14px Minecraft",
        color: this.uiStyle.textColor
      })
      .setOrigin(0.5);
    this.mapHeaderContainer.add(this.arrowIcon);

    const hitZone = this.add
      .zone(width / 2, height / 2, width, height)
      .setInteractive({ useHandCursor: true });
    this.mapHeaderContainer.add(hitZone);

    this.mapOptionsContainer = this.add
      .container(padding + 870, padding + height + 5)
      .setDepth(1000)
      .setVisible(false)
      .setAlpha(0);

    hitZone.on("pointerdown", () => {
      this.toggleDropdown();
    });
  }

  drawDropdownHeader(isOpen) {
    this.mapDropdownBg.clear();
    this.mapDropdownBg.fillStyle(this.uiStyle.baseColor, 1);
    this.mapDropdownBg.lineStyle(2, this.uiStyle.accentColor, 1);
    this.mapDropdownBg.fillRoundedRect(0, 0, 200, 40, this.uiStyle.cornerRadius);
    this.mapDropdownBg.strokeRoundedRect(0, 0, 200, 40, this.uiStyle.cornerRadius);
  }

  toggleDropdown() {
    const isVisible = this.mapOptionsContainer.visible;

    if (!isVisible) {
      this.mapOptionsContainer.setVisible(true);
      this.mapOptionsContainer.y = 16 + 40 + 5 - 10;

      this.tweens.add({
        targets: this.mapOptionsContainer,
        y: 16 + 40 + 5,
        alpha: 1,
        duration: 200,
        ease: "Power2"
      });

      this.tweens.add({
        targets: this.arrowIcon,
        angle: 180,
        duration: 200
      });
    } else {
      this.tweens.add({
        targets: this.mapOptionsContainer,
        alpha: 0,
        y: 16 + 40 + 5 - 10,
        duration: 150,
        onComplete: () => {
          this.mapOptionsContainer.setVisible(false);
        }
      });

      this.tweens.add({
        targets: this.arrowIcon,
        angle: 0,
        duration: 200
      });
    }
  }

  refreshMapDropdownLabel() {
    if (!this.mapDropdownLabel) return;
    let displayName = this.currentMapName;
    if (displayName.length > 15) displayName = displayName.substring(0, 14) + "...";
    this.mapDropdownLabel.setText(displayName);
  }

  refreshMapOptions() {
    if (!this.mapOptionsContainer) return;

    this.mapOptionsContainer.removeAll(true);

    const width = 200;
    const itemHeight = 35;
    const padding = 5;

    const totalItems = this.mapNames.length + 1;
    const totalHeight = totalItems * itemHeight + padding * 2;

    const bg = this.add.graphics();
    bg.fillStyle(this.uiStyle.baseColor, 1);
    bg.lineStyle(1, this.uiStyle.accentColor, 1);
    bg.fillRoundedRect(0, 0, width, totalHeight, this.uiStyle.cornerRadius);
    bg.strokeRoundedRect(0, 0, width, totalHeight, this.uiStyle.cornerRadius);
    this.mapOptionsContainer.add(bg);

    let currentY = padding;

    this.mapNames.forEach((name) => {
      const isSelected = name === this.currentMapName;

      const row = this.add.container(0, currentY);

      const rowBg = this.add.graphics();
      if (isSelected) {
        rowBg.fillStyle(this.uiStyle.selectedColor, 1);
        rowBg.fillRect(2, 0, width - 4, itemHeight);
      }
      row.add(rowBg);

      const text = this.add
        .text(15, itemHeight / 2, name, {
          font: this.uiStyle.font,
          color: isSelected ? "#ffffff" : this.uiStyle.mutedTextColor
        })
        .setOrigin(0, 0.5);
      row.add(text);

      const zone = this.add
        .zone(width / 2, itemHeight / 2, width, itemHeight)
        .setInteractive({ useHandCursor: true });

      zone.on("pointerover", () => {
        if (!isSelected) {
          rowBg.clear();
          rowBg.fillStyle(this.uiStyle.hoverColor, 1);
          rowBg.fillRect(2, 0, width - 4, itemHeight);
          text.setColor("#ffffff");
        }
      });

      zone.on("pointerout", () => {
        if (!isSelected) {
          rowBg.clear();
          text.setColor(this.uiStyle.mutedTextColor);
        }
      });

      zone.on("pointerdown", () => {
        this.handleMapSelect(name);
      });

      row.add(zone);
      this.mapOptionsContainer.add(row);
      currentY += itemHeight;
    });

    const divider = this.add.graphics();
    divider.lineStyle(1, "#ffffff", 0.25);
    divider.lineBetween(10, currentY, width - 10, currentY);
    this.mapOptionsContainer.add(divider);

    const newMapRow = this.add.container(0, currentY);
    const newMapBg = this.add.graphics();
    newMapRow.add(newMapBg);

    const plusIcon = this.add
      .text(15, itemHeight / 2, "+", {
        font: "bold 20px Minecraft",
        color: "#00aa00"
      })
      .setOrigin(0, 0.5);

    const newMapText = this.add
      .text(35, itemHeight / 2, "Create New Map", {
        font: this.uiStyle.font,
        color: "#00aa00"
      })
      .setOrigin(0, 0.5);

    newMapRow.add([plusIcon, newMapText]);

    const newZone = this.add
      .zone(width / 2, itemHeight / 2, width, itemHeight)
      .setInteractive({ useHandCursor: true });

    newZone.on("pointerover", () => {
      newMapBg.clear();
      newMapBg.fillStyle(this.uiStyle.successColor, 0.25);
      newMapBg.fillRect(2, 0, width - 4, itemHeight);
    });

    newZone.on("pointerout", () => {
      newMapBg.clear();
    });

    newZone.on("pointerdown", () => {
      this.handleNewMap();
    });

    newMapRow.add(newZone);
    this.mapOptionsContainer.add(newMapRow);
  }

  handleMapSelect(name) {
    if (!this.mapsCache[name]) return;

    this.currentMapName = name;
    this.blockBuildUI.loadMapData(this.mapsCache[name]);
    this.refreshMapDropdownLabel();
    this.toggleDropdown();
    this.refreshMapOptions();

    const userRef = doc(db, "users", this.userId);
    updateDoc(userRef, { currentMap: name });
  }

  async handleNewMap() {
    this.toggleDropdown();

    this.time.delayedCall(100, async () => {
      const name = window.prompt("New map name:");
      if (!name || this.mapsCache[name]) return;

      this.currentMapName = name;
      this.blockBuildUI.resetToDefault();
      const mapData = this.blockBuildUI.getMapData();

      this.mapsCache[name] = mapData;
      this.mapNames = Object.keys(this.mapsCache);

      this.refreshMapDropdownLabel();
      this.refreshMapOptions();

      const userRef = doc(db, "users", this.userId);
      await updateDoc(userRef, {
        ["maps." + name]: mapData,
        currentMap: name
      });
    });
  }
}
