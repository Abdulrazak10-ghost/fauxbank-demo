import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// 🔧 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBMRQGmJJT6Op7szGtp8j9L7kag5lb6ObY",
  authDomain: "fauxbank-ebda3.firebaseapp.com",
  projectId: "fauxbank-ebda3",
  storageBucket: "fauxbank-ebda3.appspot.com",
  messagingSenderId: "665572637941",
  appId: "1:665572637941:web:07a70aa36f38d1182859bc",
  measurementId: "G-ZM0EWJ0KFZ"
};

// 🚀 Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// 📝 Sign Up Logic with Auto-Login
document.getElementById("SignUpform").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const phone = document.getElementById("number").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      phone: phone,
      balance: 500,
      transactions: []
    });

    document.getElementById("msg").innerText = "Account created! Redirecting...";
    setTimeout(() => window.location.href = "dashboard.html", 1500);
  } catch (error) {
    document.getElementById("msg").innerText = error.message;
  }
});

// 🔐 Login Logic
document.getElementById("LoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    document.getElementById("msg").innerText = "Login successful! Redirecting...";
    setTimeout(() => window.location.href = "dashboard.html", 1500);
  } catch (error) {
    document.getElementById("msg").innerText = error.message;
  }
});

// 💸 Send Money Logic
document.getElementById("SendMoneyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const recipientEmail = document.getElementById("recipient-email").value;
  const amount = parseFloat(document.getElementById("amount").value);

  const sender = auth.currentUser;
  const senderRef = doc(db, "users", sender.uid);
  const senderSnap = await getDoc(senderRef);

  if (!senderSnap.exists()) {
    alert("Sender not found.");
    return;
  }

  const senderData = senderSnap.data();

  if (senderData.balance < amount) {
    alert("Insufficient balance.");
    return;
  }

  // 🔻 Deduct from sender
  await updateDoc(senderRef, {
    balance: senderData.balance - amount,
    transactions: arrayUnion({
      type: "sent",
      amount,
      email: recipientEmail,
      timestamp: Date.now()
    })
  });

  // 🔍 Find recipient by email
  const usersSnap = await getDocs(collection(db, "users"));
  let recipientDocId = null;

  usersSnap.forEach(docSnap => {
    if (docSnap.data().email === recipientEmail) {
      recipientDocId = docSnap.id;
    }
  });

  if (!recipientDocId) {
    alert("Recipient not found.");
    return;
  }

  const recipientRef = doc(db, "users", recipientDocId);
  const recipientSnap = await getDoc(recipientRef);
  const recipientData = recipientSnap.data();

  // 🔺 Add to recipient
  await updateDoc(recipientRef, {
    balance: recipientData.balance + amount,
    transactions: arrayUnion({
      type: "received",
      amount,
      email: sender.email,
      timestamp: Date.now()
    })
  });

  alert("Transfer successful!");
});
