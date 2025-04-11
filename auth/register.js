const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Імпортуємо функції валідації
const { isValidEmail, isValidPassword, isValidNrAlbumu } = require("../utils/validate");

// Helper function for hashing password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = async (req, res) => {
  console.log("Request body:", req.body); // Логування для перевірки даних
  const { email, name, surname, nr_albumu, password, confirm_password } = req.body;

  // Валідація
  if (!email || !name || !surname || !password || !confirm_password) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  if (nr_albumu && !isValidNrAlbumu(nr_albumu)) {
    return res.status(400).json({ message: "Invalid nr_albumu format" });
  }

  // Check if user exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("email", email);

  if (existingUser && existingUser.length > 0) {
    return res.status(400).json({ message: "Email already exists" });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Determine role and confirmation status
  let role = "teacher"; // Default to teacher
  let isConfirmed = false; // Teachers are not confirmed by default

  if (nr_albumu && !isNaN(nr_albumu)) {
    role = "student"; // If nr_albumu exists, user is a student
    isConfirmed = true; // Students are confirmed
  }

  // Insert user into database
  const { data, error } = await supabase.from("users").insert([
    {
      email,
      name,
      surname,
      nr_albumu: nr_albumu || null, // If nr_albumu is empty, set it as null
      password: hashedPassword,
      role,
      is_confirmed: isConfirmed
    }
  ]);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(201).json({ message: "User registered successfully", user: data });
};
