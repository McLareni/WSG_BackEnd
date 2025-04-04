require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

// Ініціалізація Firebase Admin SDK
const serviceAccount = require("./wsg-room-firebase-adminsdk-fbsvc-e37cd765ac.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key";

// 🛡️ Middleware для перевірки токена
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decodedToken = jwt.verify(token, SECRET_KEY);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
};

// 🔑 Функція генерації токенів
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ uid: userId }, SECRET_KEY, { expiresIn: "1h" });
  const refreshToken = jwt.sign({ uid: userId }, REFRESH_SECRET_KEY, { expiresIn: "7d" });

  return { accessToken, refreshToken };
};

// ✅ Валідація даних реєстрації
const validateRegisterData = (data) => {
  const errors = {};

  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) errors.email = "Invalid email";
  if (!data.imie || data.imie.length < 2) errors.imie = "Name too short";
  if (!data.nazwisko || data.nazwisko.length < 2) errors.nazwisko = "Surname too short";
  //if (!data.nrAlbumu || !/^\d+$/.test(data.nrAlbumu)) errors.nrAlbumu = "Invalid album number";
  if (!data.haslo || data.haslo.length < 6) errors.haslo = "Password must be at least 6 characters";
  if (data.haslo !== data.powtorzHaslo) errors.powtorzHaslo = "Passwords do not match";

  return errors;
};

// 👤 Реєстрація
app.post("/register", async (req, res) => {
  const { email, imie, nazwisko, nrAlbumu, haslo, powtorzHaslo } = req.body;
  const errors = validateRegisterData(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // Створення користувача в Firebase Authentication через Admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password: haslo,
    });

    // Логіка визначення ролі
    let role = "student"; // стандартно роль "учень"
    if (!nrAlbumu || nrAlbumu === "") {
      role = "teacher"; // якщо альбом пустий, роль "вчитель"
    }

    // Додавання додаткових даних в Firestore
    await db.collection("users").doc(userRecord.uid).set({
      email,
      imie,
      nazwisko,
      nrAlbumu,
      role, // додаємо роль
    });

    res.status(201).json({ message: "User registered", userId: userRecord.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔐 Логін
app.post("/login", async (req, res) => {
  const { email, haslo } = req.body;

  try {
    // Логін через Firebase Admin SDK, отримуємо користувача за email
    const userRecord = await admin.auth().getUserByEmail(email);

    if (!userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    // Генеруємо токени
    const tokens = generateTokens(userRecord.uid);

    // Отримуємо додаткові дані користувача з Firestore
    const userDoc = await db.collection("users").doc(userRecord.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found in Firestore" });
    }

    const userData = userDoc.data();

    // Формуємо відповідь (без пароля!)
    const responseData = {
      userId: userRecord.uid,
      email: userData.email,
      imie: userData.imie,
      nazwisko: userData.nazwisko,
      nrAlbumu: userData.nrAlbumu,
      role: userData.role, // додаємо роль до відповіді
      ...tokens,
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔍 Отримання даних користувача (захищений ендпоінт)
app.get("/user/:uid", verifyToken, async (req, res) => {
  const { uid } = req.params;

  try {
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    delete userData.haslo; // Видаляємо пароль з відповіді

    res.json({ userId: uid, ...userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🚀 Запуск сервера
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
