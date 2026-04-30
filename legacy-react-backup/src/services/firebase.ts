import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBuNZFPwyIns14mjUHkesTuq_6j4aa5E2U",
  authDomain: "my-personal-finance-mana-ab649.firebaseapp.com",
  projectId: "my-personal-finance-mana-ab649",
  storageBucket: "my-personal-finance-mana-ab649.firebasestorage.app",
  messagingSenderId: "36631576761",
  appId: "1:36631576761:web:497cf403efb12d84389b68",
  measurementId: "G-R00GEZDB1H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// const analytics = getAnalytics(app);