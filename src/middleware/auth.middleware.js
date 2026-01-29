import admin from "firebase-admin";

export const authMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const idToken = authHeader.split(" ")[1];

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };

      const userDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();
      if (!userDoc.exists) {
        return res.status(401).json({ message: "User not found" });
      }

      const userData = userDoc.data();
      req.user.role = userData.role || "user";

      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden: insufficient permissions" });
      }

     
      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
};
