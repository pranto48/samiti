/**
 * Somiti (অগ্রযাত্রা সমবায় সমিতি)
 * Firebase Modular SDK Setup & Services with Cloud Backup & Batch Restore
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDtUrWW5j-HVECJmHHM5hGFWG-ZsabyN6A",
  authDomain: "somiti-956b5.firebaseapp.com",
  projectId: "somiti-956b5",
  storageBucket: "somiti-956b5.firebasestorage.app",
  messagingSenderId: "977921265997",
  appId: "1:977921265997:web:ede083d0a6884be0632704",
  measurementId: "G-C99QLWTZGZ"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Default seed data for initial setup from project records
export const SEED_DATA = {
  members: [
    { id: 'M-01', name: 'মোঃ আক্তারুজ্জামান', phone: '01814853305', shares: 2, savings: 50000, fine: 200, fee: 400, installments: 20 },
    { id: 'M-02', name: 'দেলোয়ার হোসেন ভূঁইয়া', phone: '01861586634', shares: 1, savings: 22000, fine: 0, fee: 200, installments: 17 },
    { id: 'M-03', name: 'মোঃ লোকমান', phone: '01863478505', shares: 3, savings: 66000, fine: 0, fee: 600, installments: 17 },
    { id: 'M-04', name: 'মোঃ মুশফিকুর রহমান', phone: '01683810187', shares: 1, savings: 22000, fine: 0, fee: 200, installments: 17 },
    { id: 'M-05', name: 'মোঃ মোস্তাফিজুর রহমান', phone: '01635661885', shares: 1, savings: 22000, fine: 0, fee: 200, installments: 17 },
    { id: 'M-07', name: 'মোঃ মেহেদী হাসান', phone: '01673707545', shares: 2, savings: 44000, fine: 200, fee: 400, installments: 17 },
    { id: 'M-08', name: 'মোঃ সাইফুল আলম', phone: '01831284720', shares: 4, savings: 92000, fine: 0, fee: 800, installments: 18 },
    { id: 'M-09', name: 'মইনুল হাসান নাহিদ', phone: '01684040462', shares: 1, savings: 22000, fine: 100, fee: 200, installments: 17 },
    { id: 'M-10', name: 'মোঃ রুবেল বেপারী', phone: '01700000000', shares: 5, savings: 110000, fine: 0, fee: 1000, installments: 17 }
  ],
  investments: [
    { title: 'জমি রেহান ১৮ গন্ডা', amount: 155000, recovered: 0 },
    { title: 'দোকান বন্ধক (মাসিক ১,৫০০/-)', amount: 50000, recovered: 0 },
    { title: 'হাল চাষ ও কৃষি বিনিয়োগ', amount: 42320, recovered: 0 }
  ],
  profits: [
    { date: '2024-05-15', title: 'দোকান ভাড়া আদায়', amount: 20000 },
    { date: '2024-08-20', title: 'ধান বিক্রয় বাবদ (আমন ফসল)', amount: 9600 }
  ],
  expenses: [
    { date: '2024-01-10', title: 'স্ট্যাম্প ও চুক্তিপত্র ক্রয়', amount: 1200 },
    { date: '2024-03-12', title: 'যাতায়াত ও মিটিং আপ্যায়ন', amount: 800 },
    { date: '2024-06-05', title: 'SMS অ্যালার্ট ও ব্যাংক চার্জ', amount: 1705.86 }
  ],
  otherIncome: [
    { date: '2024-06-30', title: 'ব্যাংক হিসাব মুনাফা (Interest)', amount: 107.86 }
  ],
  collections: [
    { receiptId: 'REC-101', date: '2024-10-01', memberId: 'M-01', memberName: 'মোঃ আক্তারুজ্জামান', savings: 2000, fine: 0, fee: 0, total: 2000, remarks: 'অক্টোবর কিস্তি' },
    { receiptId: 'REC-102', date: '2024-10-01', memberId: 'M-03', memberName: 'মোঃ লোকমান', savings: 3000, fine: 0, fee: 0, total: 3000, remarks: 'অক্টোবর কিস্তি' },
    { receiptId: 'REC-103', date: '2024-10-02', memberId: 'M-08', memberName: 'মোঃ সাইফুল আলম', savings: 4000, fine: 0, fee: 0, total: 4000, remarks: 'অক্টোবর কিস্তি' }
  ]
};

// Global Firebase Service helper
window.FirebaseService = {
  auth,
  db,
  signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
  logout: () => signOut(auth),
  onAuthState: (callback) => onAuthStateChanged(auth, callback),

  // Real-time listener on collections
  listenToCollection: (colName, onData, onError) => {
    try {
      const colRef = collection(db, colName);
      return onSnapshot(colRef, (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ _docId: docSnap.id, ...docSnap.data() });
        });
        onData(items);
      }, (err) => {
        console.warn(`Firestore listener warning on [${colName}]:`, err);
        if (onError) onError(err);
      });
    } catch (e) {
      console.error(`Error attaching listener to [${colName}]:`, e);
      if (onError) onError(e);
      return () => {};
    }
  },

  // Document management (CRUD)
  addDoc: async (colName, data) => {
    const colRef = collection(db, colName);
    return await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp()
    });
  },

  updateDoc: async (colName, docId, data) => {
    const docRef = doc(db, colName, docId);
    return await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  deleteDoc: async (colName, docId) => {
    const docRef = doc(db, colName, docId);
    return await deleteDoc(docRef);
  },

  // Seed initial records into Firestore if collection is empty
  seedCloudDatabase: async () => {
    const results = { members: 0, investments: 0, profits: 0, expenses: 0, otherIncome: 0, collections: 0 };
    
    const collectionsToSeed = [
      { name: "members", data: SEED_DATA.members, counter: "members" },
      { name: "investments", data: SEED_DATA.investments, counter: "investments" },
      { name: "profits", data: SEED_DATA.profits, counter: "profits" },
      { name: "expenses", data: SEED_DATA.expenses, counter: "expenses" },
      { name: "other_income", data: SEED_DATA.otherIncome, counter: "otherIncome" },
      { name: "collections", data: SEED_DATA.collections, counter: "collections" }
    ];

    for (const c of collectionsToSeed) {
      const colRef = collection(db, c.name);
      const snap = await getDocs(colRef);
      if (snap.empty) {
        for (const item of c.data) {
          await addDoc(colRef, { ...item, createdAt: serverTimestamp() });
          results[c.counter]++;
        }
      }
    }

    return results;
  },

  // Restore or Merge from imported JSON file
  restoreFromJSON: async (backupData) => {
    let restoredCount = 0;
    const collectionsMap = {
      members: backupData.members || [],
      investments: backupData.investments || [],
      profits: backupData.profits || [],
      expenses: backupData.expenses || [],
      other_income: backupData.otherIncome || [],
      collections: backupData.collections || []
    };

    for (const [colName, items] of Object.entries(collectionsMap)) {
      if (Array.isArray(items) && items.length > 0) {
        const colRef = collection(db, colName);
        for (const item of items) {
          const itemCopy = { ...item };
          delete itemCopy._docId;
          await addDoc(colRef, {
            ...itemCopy,
            restoredAt: serverTimestamp()
          });
          restoredCount++;
        }
      }
    }
    return restoredCount;
  }
};

// Dispatch readiness event
window.dispatchEvent(new CustomEvent('firebase-ready'));
