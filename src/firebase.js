import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyBacLqR9vocAWwV2o_KohKDA1v2noG82SI",
    authDomain: "buzz-chat-17759.firebaseapp.com",
    projectId: "buzz-chat-17759",
    storageBucket: "buzz-chat-17759.appspot.com",
    messagingSenderId: "996339174890",
    appId: "1:996339174890:web:1ef3be0931143f91823693",
    measurementId: "G-3V7YT7YPB6"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

export { auth, db };

