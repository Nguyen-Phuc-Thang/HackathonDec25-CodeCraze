import { db } from "../firebase/firebaseConfig.js";
import {
    doc,
    getDoc,
    onSnapshot,
    updateDoc,
    setDoc
} from "firebase/firestore";

import Phaser from "phaser";
import { auth } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";

const BLOCK_CATALOG = [
    { type: "stone", price: 5 },
    { type: "grass", price: 1 },
    { type: "dirt", price: 1 },
    { type: "sand", price: 2 },
    { type: "oak_planks", price: 3 },
    { type: "oak_wood", price: 4 },
    { type: "bedrock", price: 100 },
    { type: "obsidian", price: 50 },
    { type: "bricks", price: 10 },
    { type: "TNT", price: 20 }

];


export default class SignUpScene extends Phaser.Scene {
    constructor() {
        super("SignUpScene");
    }
    preload() { }

    create() {
        const WIDTH = this.scale.width;
        const HEIGHT = this.scale.height;
        this.background = this.add.rectangle(-1, 0, this.scale.width, this.scale.height, "0xA9AAA9").setOrigin(0);

        // Sign Up form
        const signupForm = this.add.dom(WIDTH / 2, HEIGHT / 2).createFromHTML(`
            <div style="
                background: #ffffff;
                width: 420px;
                height: 450px;
                border-radius: 12px;
                box-shadow: 0 0 10px rgba(0,0,0,0.3);
                display: flex;
                flex-direction: column;
                padding: 20px;">
                <h1 style="
                    font-family: Arial, sans-serif; 
                    font-size: 32px;
                    color: #333333;
                    margin-bottom: 20px;
                    text-align: center;
                    ">Sign Up</h1>
                
                <h2 style="font-family:Arial,sans-sefif; font-size:16px; margin-top:40px; margin-left:15px;">Enter your email</h2>
                <input type="text" id="email" name="email" placeholder="Enter email" style="
                    width: 90%;
                    padding: 12px 20px;
                    margin-top: 5px;
                    margin-left: 15px;
                    box-sizing: border-box;
                    border: 2px solid #ccc;
                    border-radius: 4px;
                    font-size: 16px;
                    display: block;
                " />
                
                <h2 style="font-family:Arial,sans-sefif; font-size:16px; margin-top:30px; margin-left:15px;">Create new password</h2>
                <input type="text" id="password" name="password" placeholder="Enter password" style="
                    width: 90%;
                    padding: 12px 20px;
                    margin-top: 5px;
                    margin-left: 15px;
                    box-sizing: border-box;
                    border: 2px solid #ccc;
                    border-radius: 4px;
                    font-size: 16px;
                    display: block;
                " />

                <button id="signupButton" style="
                    margin-top: 50px;
                    width: 50%;
                    padding: 12px;
                    margin-left: auto;
                    margin-right: auto;
                    background-color: #4796FD;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 18px;
                    cursor: pointer;
                ">Sign Up</button>

            </div>
        `)

        // Add events to buttons
        const signupButton = signupForm.getChildByID('signupButton');
        signupButton.addEventListener('click', async () => {
            const emailInput = signupForm.getChildByID('email');
            const passwordInput = signupForm.getChildByID('password');
            const email = emailInput.value;
            const password = passwordInput.value;

            await createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    this.createUserData(user.uid, user.email);
                    console.log("Account created successfully");
                    this.scene.start("LoginScene");
                }).catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                });
        });


    }

    async createUserData(uid, email) {
        console.log("Creating user data for:", uid);
        const initialInventory = BLOCK_CATALOG.map(block => ({ type: block.type, count: 0 }));

        await setDoc(doc(db, "users", uid), {
            email,
            money: 0,
            inventory: initialInventory,
            maps: {
                default: []
            }
        });

        console.log("User data created for:", uid);
    }

    update() {

    }
}