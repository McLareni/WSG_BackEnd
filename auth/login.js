const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password" });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Генеруємо доступний токен
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // Термін дії accessToken 15 хвилин
  );

  // Генеруємо refresh токен
  const refreshToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET, // Використовуємо той самий секрет для refreshToken
    { expiresIn: "7d" } // Термін дії refreshToken 7 днів
  );

  res.status(200).json({
    message: "Login successful",
    accessToken,
    refreshToken
  });
};
