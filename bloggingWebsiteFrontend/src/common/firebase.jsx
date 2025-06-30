import { initializeApp } from "firebase/app";
import {GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth"


const firebaseConfig = {
    apiKey: "AIzaSyBXZGXqrifgYnlUnP7OCpz5d83p6N2lIAE",
    authDomain: "mern-blogging-website-e3921.firebaseapp.com",
    projectId: "mern-blogging-website-e3921",
    storageBucket: "mern-blogging-website-e3921.firebasestorage.app",
    messagingSenderId: "662428730397",
    appId: "1:662428730397:web:005190e1e0d24fc76172f4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


const provider = new GoogleAuthProvider()

const auth = getAuth();

export const authWithGoogle = async () => {

    let user = null;

    await signInWithPopup(auth, provider)
    .then((result) => {
        user = result.user;
    })
    .catch((error) => {
        console.log(error);
    })

    return user;

}