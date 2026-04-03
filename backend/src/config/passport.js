/**
 * passport.js
 *
 * Configures Google OAuth 2.0 strategy.
 * Flow:
 *   1. User clicks "Login with Google"
 *   2. Redirect to Google consent screen
 *   3. Google POSTs to /api/auth/google/callback with profile
 *   4. We find-or-create a User document
 *   5. We sign a JWT and redirect to frontend with token in URL
 *
 * We do NOT use sessions (stateless JWT API).
 * passport.serializeUser / deserializeUser are no-ops.
 */
import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const googleClientID = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL?.trim();

const isGoogleConfigured =
  googleClientID &&
  googleClientSecret &&
  googleCallbackURL;

if (isGoogleConfigured) {
  console.log("✅ Google OAuth Strategy Loaded");

  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackURL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();

          if (!email) {
            return done(new Error("No email returned from Google"), null);
          }

          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.findOne({ email });

            if (user) {
              user.googleId = profile.id;
              user.authProvider = "google";
              user.isEmailVerified = true;
              if (!user.avatar) {
                user.avatar = profile.photos?.[0]?.value || "";
              }
              await user.save();
            } else {
              user = await User.create({
                name: profile.displayName || email.split("@")[0],
                email,
                googleId: profile.id,
                authProvider: "google",
                isEmailVerified: true,
                avatar: profile.photos?.[0]?.value || "",
                role: "customer",
              });
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.log("❌ Google OAuth NOT configured properly");
}


export default passport;