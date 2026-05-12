const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ─── Protect (any logged in user) ─────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-auth.password_hash");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired, please login again" });
    }
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

// ─── Admin Only ───────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
};

// ─── Admin or Receptionist ────────────────────────────────────────────────────
const adminOrReceptionist = (req, res, next) => {
  if (req.user && ["admin", "receptionist"].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Authorised staff only." });
  }
};

module.exports = { protect, adminOnly, adminOrReceptionist };