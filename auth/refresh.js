const jwt = require("jsonwebtoken");

module.exports = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  // Перевірка refreshToken
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    // Якщо refreshToken дійсний, генеруємо новий accessToken
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      process.env.JWT_SECRET, // Використовуємо той самий секрет для accessToken
      { expiresIn: "15m" } // Термін дії нового accessToken (15 хвилин)
    );

    res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken: newAccessToken
    });
  });
};
