console.log("main.js loaded");

import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { db } from "./firebase/firebaseConfig.js";

async function test() {
    const userId = "demoUser";
    const userRef = doc(db, "users", userId);

    console.log("Appending item...");

    try {
        await updateDoc(userRef, {
            blocksOwned: {
                type: "stone",
                quantity: 1
            }
        });

        console.log("Update success!");

        const snap = await getDoc(userRef);
        console.log("Updated data:", snap.data());

    } catch (err) {
        console.error("ERROR during update:", err);
    }
}

test();