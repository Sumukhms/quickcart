import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Access denied. Required role: ${roles.join(" or ")}` });
  }
  next();
};

// Aliases for clean role-based route protection
export const customerOnly = restrictTo("customer");
export const storeOnly = restrictTo("store");
export const deliveryOnly = restrictTo("delivery");
export const storeOrDelivery = restrictTo("store", "delivery");