export default class BlockBuildUI {
  constructor(scene, hotbarUI) {
    this.scene = scene;

    const width = scene.scale.width - 5;
    const barHeight = hotbarUI.barHeight;
    const barScale = hotbarUI.barScale;
    const barY = hotbarUI.barY;

    this.cols = 25;
    this.minY = -3;
    this.maxY = 8;
    this.rows = this.maxY - this.minY + 1;

    const cellWidth = width / this.cols;
    const cellHeight = cellWidth;

    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;

    const baseY = barY - (barHeight * barScale) / 2 - cellHeight / 2;
    this.baseY = baseY;

    this.grid = [];

    this.hoverHighlight = scene.add
      .rectangle(0, 0, cellWidth - 4, cellHeight - 4)
      .setOrigin(0.5)
      .setStrokeStyle(3, 0xffffff)
      .setFillStyle(0x000000, 0)
      .setDepth(3)
      .setVisible(false);

    for (let y = this.minY; y <= this.maxY; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        const screen = this.worldToScreen(x, y);

        let zone = null;
        if (y >= 0) {
          zone = scene.add
            .zone(screen.x, screen.y, cellWidth, cellHeight)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

          zone.gridX = x;
          zone.gridY = y;

          zone.on("pointerover", () => {
            const cell = this.getCell(zone.gridX, zone.gridY);
            if (!cell || cell.type === "bedrock") return;
            this.hoverHighlight.setPosition(zone.x, zone.y);
            this.hoverHighlight.setVisible(true);
          });

          zone.on("pointerout", () => {
            this.hoverHighlight.setVisible(false);
          });

          zone.on("pointerdown", () => {
            const cell = this.getCell(zone.gridX, zone.gridY);
            if (!cell || cell.type === "bedrock") return;
            if (this.onCellClick) {
              this.onCellClick({
                x: zone.gridX,
                y: zone.gridY,
                type: cell.type,
                sprite: cell.sprite,
                zone
              });
            }
          });
        }

        row.push({
          x,
          y,
          type: null,
          sprite: null,
          zone
        });
      }
      this.grid.push(row);
    }

    this.resetToDefault();
  }

  worldToScreen(x, y) {
    const sx = this.cellWidth / 2 + x * this.cellWidth;
    const sy = this.baseY - y * this.cellHeight;
    return { x: sx, y: sy };
  }

  getCell(x, y) {
    if (x < 0 || x >= this.cols) return null;
    if (y < this.minY || y > this.maxY) return null;
    const rowIndex = y - this.minY;
    return this.grid[rowIndex][x];
  }

  placeBlock(x, y, type) {
    const cell = this.getCell(x, y);
    if (!cell) return;

    if (cell.sprite) {
      cell.sprite.destroy();
      cell.sprite = null;
    }

    cell.type = type;
    if (!type) return;

    const screen = this.worldToScreen(x, y);
    const source = this.scene.textures.get(type).getSourceImage();
    const scale = Math.min(
      this.cellWidth / source.width,
      this.cellHeight / source.height
    );
    const depth = type === "bedrock" ? 0 : 2;

    cell.sprite = this.scene.add
      .image(screen.x, screen.y, type)
      .setOrigin(0.5)
      .setScale(scale)
      .setDepth(depth);
  }

  getBlock(x, y) {
    const cell = this.getCell(x, y);
    if (!cell) return null;
    return cell.type;
  }

  setVisible(visible) {
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        const cell = this.grid[r][c];
        if (cell.sprite) cell.sprite.setVisible(visible);
        if (cell.zone) {
          if (visible) cell.zone.setInteractive();
          else cell.zone.disableInteractive();
        }
      }
    }
    if (!visible) this.hoverHighlight.setVisible(false);
  }

  removeBlock(x, y) {
    const cell = this.getCell(x, y);
    if (!cell) return false;
    if (!cell.type || cell.type === "bedrock") return false;

    if (cell.sprite) {
      cell.sprite.destroy();
      cell.sprite = null;
    }

    cell.type = null;
    return true;
  }

  resetToDefault() {
    for (let y = this.minY; y <= this.maxY; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.getCell(x, y);
        if (cell && cell.sprite) {
          cell.sprite.destroy();
          cell.sprite = null;
        }
        if (cell) cell.type = null;
      }
    }

    for (let x = 0; x < this.cols; x++) {
      for (let y = this.minY; y <= -1; y++) {
        this.placeBlock(x, y, "bedrock");
      }
      this.placeBlock(x, 0, "dirt");
      this.placeBlock(x, 1, "grass");
    }
  }

  getMapData() {
    const data = {};
    for (let y = this.minY; y <= this.maxY; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        const cell = this.getCell(x, y);
        row.push(cell && cell.type ? cell.type : null);
      }
      data[y] = row;
    }
    return data;
  }

  loadMapData(mapData) {
    if (!mapData || typeof mapData !== "object") return;

    for (let y = this.minY; y <= this.maxY; y++) {
      const row = mapData[y];
      if (!Array.isArray(row)) continue;

      for (let x = 0; x < this.cols; x++) {
        const type = row[x] || null;
        this.placeBlock(x, y, type);
      }
    }
  }
}
