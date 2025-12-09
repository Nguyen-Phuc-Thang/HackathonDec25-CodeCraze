import Phaser from "phaser";
import { auth } from "../firebase/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super("LoginScene");
    }
    
    init(data) {
        this.userId = data.userId;  
    }

    preload() {}

    create() {
        const WIDTH = this.scale.width;
        const HEIGHT = this.scale.height;
        this.background = this.add.rectangle(-1, 0, this.scale.width, this.scale.height, "0xA9AAA9").setOrigin(0);
        
        // Login form
        const loginForm = this.add.dom(WIDTH / 2, HEIGHT / 2).createFromHTML(`
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
                    ">Login</h1>
                
                <h2 style="font-family:Arial,sans-sefif; font-size:16px; margin-top:40px; margin-left:15px;">Email</h2>
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
                
                <h2 style="font-family:Arial,sans-sefif; font-size:16px; margin-top:30px; margin-left:15px;">Password</h2>
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

                <button id="loginButton" style="
                    margin-top: 30px;
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
                ">Login</button>
                <p style="margin-top:30px; text-align:center; font-family:Arial,sans-serif; font-size:14px; color:#555555;">
                    Don't have an account? <a id="linkSignUp" href="#" style="color:#2882F7; cursor:pointer; text-decoration:none">Sign up here</a>
                </p>

            </div>
        `) 

        // Add events to buttons
        const loginButton = loginForm.getChildByID('loginButton');
        loginButton.addEventListener('click', () => {
            const emailInput = loginForm.getChildByID('email');
            const passwordInput = loginForm.getChildByID('password');
            const email = emailInput.value;
            const password = passwordInput.value;
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Signed in
                    const user = userCredential.user;  
                    console.log("Login successful");
                    this.scene.start("PomodoroScene", { userId: user.uid });
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode);
                    console.log(errorMessage);
                    console.log("Login failed");
                    this.scene.start("PomodoroScene");
                });            
        });

        const linkSignUp = loginForm.getChildByID('linkSignUp');
        linkSignUp.addEventListener('click', () => {
            this.scene.start("SignUpScene");
        });
    }

    update() {
        
    }
}