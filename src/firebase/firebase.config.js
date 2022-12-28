// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJcixsbcCKqxU5v608dQl7PGmxq-lVNYw",
    authDomain: "asocial-media.firebaseapp.com",
    projectId: "asocial-media",
    storageBucket: "asocial-media.appspot.com",
    messagingSenderId: "309321946223",
    appId: "1:309321946223:web:1059acbbc98b347346a99a",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

export default firebaseApp;
