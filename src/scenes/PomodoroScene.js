import { db } from "../firebase/firebaseConfig.js";
import {
    doc,
    getDoc,
    updateDoc
} from "firebase/firestore";

import Phaser from "phaser";

export default class PomodoroScene extends Phaser.Scene {
    constructor() {
        super("PomodoroScene");
        this.rewardCheckpoint = 0;
    }

    init(data) {
        this.userId = data.userId;  
        console.log("userId in PomodoroScene:", this.userId);
    }

    preload() {
        this.load.image("num_0", "assets/fonts/wooden/0.png");
        this.load.image("num_1", "assets/fonts/wooden/1.png");
        this.load.image("num_2", "assets/fonts/wooden/2.png");
        this.load.image("num_3", "assets/fonts/wooden/3.png");
        this.load.image("num_4", "assets/fonts/wooden/4.png");
        this.load.image("num_5", "assets/fonts/wooden/5.png");
        this.load.image("num_6", "assets/fonts/wooden/6.png");
        this.load.image("num_7", "assets/fonts/wooden/7.png");
        this.load.image("num_8", "assets/fonts/wooden/8.png");
        this.load.image("num_9", "assets/fonts/wooden/9.png");
        this.load.image("colon", "assets/fonts/wooden/colon.png");
        this.load.image("a", "assets/fonts/wooden/a.png");
        this.load.image("B", "assets/fonts/wooden/B.png");
        this.load.image("c", "assets/fonts/wooden/c.png");
        this.load.image("e", "assets/fonts/wooden/e.png");
        this.load.image("F", "assets/fonts/wooden/F.png");
        this.load.image("k", "assets/fonts/wooden/k.png");
        this.load.image("o", "assets/fonts/wooden/o.png");
        this.load.image("r", "assets/fonts/wooden/r.png");
        this.load.image("s", "assets/fonts/wooden/s.png");
        this.load.image("u", "assets/fonts/wooden/u.png");
        this.load.image("T", "assets/fonts/wooden/T.png");
        this.load.image("i", "assets/fonts/wooden/i.png");
        this.load.image("m", "assets/fonts/wooden/m.png");
        this.load.image("P", "assets/fonts/wooden/P.png");
        this.load.image("d", "assets/fonts/wooden/d.png");
        this.load.image("l", "assets/fonts/wooden/l.png");
        this.load.image("woodenBar", "assets/ui/wooden_frame.png");
        this.load.image("woodenBarBorderless", "assets/ui/wooden_frame_borderless.png");
        this.load.image("upButton", "assets/ui/button_up.png");
        this.load.image("upButtonPressed", "assets/ui/button_up_pressed.png");
        this.load.image("downButton", "assets/ui/button_down.png");
        this.load.image("downButtonPressed", "assets/ui/button_down_pressed.png");
        this.load.image('startButton', "assets/ui/start_button.png");
        this.load.image('startButtonPressed', "assets/ui/start_button_pressed.png");
        this.load.image("numberFrame", "assets/ui/num_frame.png");
        this.load.image("upArrow", "assets/ui/arrow_up.png");
        this.load.image("downArrow", "assets/ui/arrow_down.png");
        this.load.image("upArrowPressed", "assets/ui/arrow_up_pressed.png");
        this.load.image("downArrowPressed", "assets/ui/arrow_down_pressed.png");
        this.load.image("settingButton", "assets/ui/button_setting.png");
        this.load.image("settingButtonPressed", "assets/ui/button_setting_pressed.png");
        this.load.image("dollarSign", "assets/ui/dollar_sign.png");
        this.load.image("coinFrame", "assets/ui/coin_frame.png");
        this.load.image("pomodoroMode", "assets/ui/pomodoro_mode.png");
        this.load.image("buildMode", "assets/ui/build_mode.png");
    }

    create() {
        const WIDTH = this.scale.width;
        const HEIGHT = this.scale.height;

        // Static UI Elements
        this.background = this.add.rectangle(-1, 0, this.scale.width, this.scale.height, "0xED9752").setOrigin(0);
        this.hotBackgroundColor = "0xED9752";
        this.coldBackgroundColor = "0x52A7ED";

        const distanceFromCenter = [-300, -150, 150, 300];
        let numberFrames = [];
        for (let i = 0; i < 4; i++) {
            numberFrames.push(this.add.image(WIDTH / 2 + distanceFromCenter[i], HEIGHT / 3, "numberFrame").setOrigin(0.5).setScale(1.5));
        }

        const colon = this.add.image(WIDTH / 2, HEIGHT / 3, "colon").setOrigin(0.5);

        const controllerFrame = this.add.image(0, HEIGHT / 2 + 50, "woodenBar");
        controllerFrame.setOrigin(0, 0);
        controllerFrame.setScale(20);

        // Numbers
        const distanceFromFirstQuartile = [-175, -75, 75, 175];
        const preloadTime = ["num_2", "num_5", "num_0", "num_0"];
        this.timerDigits = [];
        this.focusDigits = [];
        this.breakDigits = [];
        for (let i = 0; i < 4; i++) {
            this.timerDigits.push(this.add.image(numberFrames[i].x, numberFrames[i].y, preloadTime[i]).setOrigin(0.5));
            this.focusDigits.push(this.add.image(WIDTH / 5 + distanceFromFirstQuartile[i], HEIGHT - 125, "num_0").setOrigin(0.5).setScale(0.75));
            this.breakDigits.push(this.add.image(WIDTH / 5 * 4 + distanceFromFirstQuartile[i], HEIGHT - 125, "num_0").setOrigin(0.5).setScale(0.75));
        }

        this.focusColon = this.add.image(WIDTH / 5, HEIGHT - 125, "colon").setOrigin(0.5).setScale(0.75);
        this.breakColon = this.add.image(WIDTH / 5 * 4, HEIGHT - 125, "colon").setOrigin(0.5).setScale(0.75);

        // Buttons
        const createButton = (x, y, key, keyPressed, action) => {
            const button = this.add.sprite(x, y, key).setOrigin(0.5).setScale(1.5).setInteractive();
            button.on('pointerdown', () => {
                button.setTexture(keyPressed);
                action();
            });
            button.on('pointerup', () => {
                button.setTexture(key);
            });
            return button;
        }

        const nextNumTextureKey = (currentTexture, change) => {
            let num = parseInt(currentTexture.texture.key.split("_")[1]);
            num = (num + change + 10) % 10;
            return "num_" + num;
        }

        const linkButton = (texture, change) => {
            const newTextureKey = nextNumTextureKey(texture, change);
            texture.setTexture(newTextureKey);
        }

        this.controllerButtons = [];
        for (let i = 0; i < 4; i++) {
            this.controllerButtons.push(createButton(this.focusDigits[i].x, HEIGHT - 200, "upButton", "upButtonPressed", () => linkButton(this.focusDigits[i], 1)));
            this.controllerButtons.push(createButton(this.focusDigits[i].x, HEIGHT - 50, "downButton", "downButtonPressed", () => linkButton(this.focusDigits[i], -1)));

            this.controllerButtons.push(createButton(this.breakDigits[i].x, HEIGHT - 200, "upButton", "upButtonPressed", () => linkButton(this.breakDigits[i], 1)));
            this.controllerButtons.push(createButton(this.breakDigits[i].x, HEIGHT - 50, "downButton", "downButtonPressed", () => linkButton(this.breakDigits[i], -1)));
        }

        // Decorative Text
        const verticalDistance = [-60, -30, 0, 30, 60];
        const leftText = "Focus";
        const rightText = "Break";
        this.focusTextures = [];
        this.breakTextures = [];
        for (let i = 0; i < leftText.length; i++) {
            this.focusTextures.push(this.add.image(WIDTH / 2 - 100, HEIGHT - 125 + verticalDistance[i], leftText[i]).setOrigin(0.5).setScale(0.3));
            this.breakTextures.push(this.add.image(WIDTH / 2 + 100, HEIGHT - 125 + verticalDistance[i], rightText[i]).setOrigin(0.5).setScale(0.3));
        }


        const createText = (text, x, y, scale, letterSpacing, wordSpacing) => {
            let currentX = x;
            let textImages = [];
            for (let i = 0; i < text.length; i++) {
                if (text[i] === " ") {
                    currentX += wordSpacing;
                } else {
                    textImages.push(this.add.image(currentX, y, text[i]).setOrigin(0.5).setScale(scale));
                    currentX += letterSpacing;
                }
            }
            return textImages;
        }

        this.focusTimeTextImages = createText("Focus Time", WIDTH / 2 - 175, HEIGHT / 2 - 220, 0.5, 30, 60);
        this.breakTimeTextImages = createText("Break Time", WIDTH / 2 - 175, HEIGHT / 2 - 220, 0.5, 30, 60);

        const pomodoroTextImages = createText("Pomodoro", WIDTH / 2 - 275, 35, 0.4, 26, 48);
        const buildTextImages = createText("Build", WIDTH / 2 + 100, 35, 0.4, 26, 48);
        for (let img of pomodoroTextImages) img.setDepth(100);
        for (let img of buildTextImages) img.setDepth(100);

        // Open / Close Bottom Bar
        const showBottomBar = () => {
            this.openBottomBar.setVisible(false);
            this.closeBottomBar.setVisible(true);

            // Show bottom bar elements
            controllerFrame.setVisible(true);
            for (let digit of this.focusDigits) digit.setVisible(true);
            for (let digit of this.breakDigits) digit.setVisible(true);
            this.focusColon.setVisible(true);
            this.breakColon.setVisible(true);
            this.controllerButtons.forEach(button => button.setVisible(true));
            for (let img of this.focusTextures) img.setVisible(true);
            for (let img of this.breakTextures) img.setVisible(true);
            this.startButton.setVisible(true);

            // Shift timer up
            for (let frame of numberFrames) frame.y = HEIGHT / 3;
            colon.y = HEIGHT / 3;
            for (let digit of this.timerDigits) digit.y = HEIGHT / 3;
            for (let img of this.focusTimeTextImages) img.y = HEIGHT / 2 - 220;
            for (let img of this.breakTimeTextImages) img.y = HEIGHT / 2 - 220;
        }

        const hideBottomBar = () => {
            this.openBottomBar.setVisible(true);
            this.closeBottomBar.setVisible(false);

            // Hide bottom bar elements
            controllerFrame.setVisible(false);
            for (let digit of this.focusDigits) digit.setVisible(false);
            for (let digit of this.breakDigits) digit.setVisible(false);
            this.focusColon.setVisible(false);
            this.breakColon.setVisible(false);
            this.controllerButtons.forEach(button => button.setVisible(false));
            for (let img of this.focusTextures) img.setVisible(false);
            for (let img of this.breakTextures) img.setVisible(false);
            this.startButton.setVisible(false);

            // Shift timer down
            for (let frame of numberFrames) frame.y = HEIGHT / 2;
            colon.y = HEIGHT / 2;
            for (let digit of this.timerDigits) digit.y = HEIGHT / 2;
            for (let img of this.focusTimeTextImages) img.y = HEIGHT / 2 - 100;
            for (let img of this.breakTimeTextImages) img.y = HEIGHT / 2 - 100;
        }

        this.openBottomBar = createButton(WIDTH / 2, HEIGHT - 50, "upArrow", "upArrow", () => showBottomBar());
        this.closeBottomBar = createButton(WIDTH / 2, HEIGHT - 200, "downArrow", "downArrow", () => hideBottomBar());
        this.openBottomBar.setVisible(false);


        // Header Bar
        const headerBar = this.add.image(0, 75, "woodenBarBorderless").setOrigin(0, 1);
        headerBar.setScale(20);

        const settingButton = createButton(WIDTH - 75, 35, "settingButton", "settingButtonPressed", () => { });
        const dollarSign = this.add.image(75, 35, "dollarSign").setOrigin(0.5).setScale(1.5);
        const coinAmountFrame = this.add.image(100, 35, "coinFrame").setOrigin(0, 0.5).setScale(1.5);
        this.coinAmount = 0;
        this.coinAmountText = this.add.text(110, 35, "0", {
            fontFamily: 'Courier New',
            fontSize: '27px',
            color: '#000000',
            fontWeight: 'bold'
        }).setOrigin(0, 0.5);


        // Start countdown
        this.remainingFocusSeconds = this.getRemainingSeconds(this.timerDigits) + 1;
        this.remainingBreakSeconds = 0;
        this.focusInterval = 0;
        this.breakInterval = 0;
        this.isFocusTime = true;
        this.startButton = createButton(WIDTH / 2, HEIGHT - 125, "startButton", "startButtonPressed", () => {
            for (let i = 0; i < 4; i++) this.timerDigits[i].setTexture(this.focusDigits[i].texture.key);
            this.focusInterval = this.getRemainingSeconds(this.focusDigits) + 1;
            this.breakInterval = this.getRemainingSeconds(this.breakDigits) + 1;
            this.remainingFocusSeconds = this.focusInterval;
            this.remainingBreakSeconds = this.breakInterval;
            this.rewardCheckpoint = this.remainingFocusSeconds;
            this.isFocusTime = true;
        })

        //Switch mode 
        const switchButton = this.add.sprite(WIDTH / 2, 35, "pomodoroMode").setOrigin(0.5).setScale(3).setInteractive();
        switchButton.on('pointerdown', () => {
            this.scene.start("PreloadScene", { userId: this.userId });
        });

        this.loadUserData();
    }

    update(time, delta) {
        if (this.isFocusTime) {
            this.setTextVisibility(this.focusTimeTextImages, true);
            this.setTextVisibility(this.breakTimeTextImages, false);
            this.background.fillColor = Phaser.Display.Color.HexStringToColor(this.hotBackgroundColor).color;
            if (this.remainingFocusSeconds > 0) {
                this.remainingFocusSeconds -= delta / 1000;
                if (this.rewardCheckpoint - this.remainingFocusSeconds >= 10) {
                    console.log("Rewarding user 1 coin");
                    this.rewardCheckpoint -= 10;
                    this.rewardUserRealtime();
                }
            } else {
                this.isFocusTime = false;
                this.remainingBreakSeconds = this.breakInterval;
            }
            this.updateTimerDisplay(this.remainingFocusSeconds);
        } else { // Break time
            this.setTextVisibility(this.focusTimeTextImages, false);
            this.setTextVisibility(this.breakTimeTextImages, true);
            this.background.fillColor = Phaser.Display.Color.HexStringToColor(this.coldBackgroundColor).color;
            if (this.remainingBreakSeconds > 0) {
                this.remainingBreakSeconds -= delta / 1000;
            } else {
                this.isFocusTime = true;
                this.remainingFocusSeconds = this.focusInterval;
            }
            this.updateTimerDisplay(this.remainingBreakSeconds);
        }
    }

    getRemainingSeconds = (textures) => {
        const digits = textures.map(tex => parseInt(tex.texture.key.split("_")[1]));
        return (digits[0] * 10 + digits[1]) * 60 + (digits[2] * 10 + digits[3]);
    }

    updateTimerDisplay = (time) => {
        let minutes = Math.floor(time / 60);
        let seconds = Math.floor(time % 60);
        this.timerDigits[0].setTexture("num_" + Math.floor(minutes / 10));
        this.timerDigits[1].setTexture("num_" + (minutes % 10));
        this.timerDigits[2].setTexture("num_" + Math.floor(seconds / 10));
        this.timerDigits[3].setTexture("num_" + (seconds % 10));
    }

    setTextVisibility = (textImages, visible) => {
        for (let img of textImages) {
            img.setVisible(visible);
        }
    }

    async loadUserData() {
        if (!this.userId) {
            console.warn("No userId passed to PomodoroScene");
            return;
        }

        const userRef = doc(db, "users", this.userId);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
            console.warn("User document not found:", this.userId);
            this.coinAmount = 0;
            this.coinAmountText.setText("0");
            return;
        }

        const data = snap.data();
        this.coinAmount = data.money || 0;
        this.coinAmountText.setText(String(this.coinAmount));
    }

    async rewardUserRealtime() {
        this.coinAmount += 1;
        this.coinAmountText.setText(String(this.coinAmount));

        if (!this.userId) return;

        const userRef = doc(db, "users", this.userId);
        try {
            await updateDoc(userRef, {
                money: this.coinAmount
            });
        } catch (err) {
            console.error("Failed to update money:", err);
        }
    }
}   