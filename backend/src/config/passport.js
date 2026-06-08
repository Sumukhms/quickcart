/**
 * passport.js
 *
 * Configures Google OAuth 2.0 strategy.
 * Flow:
 *   1. User clicks "Login with Google"
 *   2. Redirect to Google consent screen
 *   3. Google POSTs to /api/auth/google/callback with profile
 *   4. We find-or-create a User document
 *   5. We sign a JWT and redirect to frontend with token in URL fragment
 *
 * Stateless JWT API — passport sessions are not used.
 *
 * New users get isNewGoogleUser = true attached to the user object so
 * authController.googleCallback can include it in the redirect, allowing
 * the frontend to show the role-selection screen unconditionally for new
 * sign-ups (instead of relying on the fragile createdAt < 60s heuristic).
 */
import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const googleClientID     = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const googleCallbackURL  = process.env.GOOGLE_CALLBACK_URL?.trim();

const isGoogleConfigured = googleClientID && googleClientSecret && googleCallbackURL;

if (isGoogleConfigured) {
  console.log("✅ Google OAuth Strategy Loaded");

  passport.use(
    new GoogleStrategy(
      {
        clientID:     googleClientID,
        clientSecret: googleClientSecret,
        callbackURL:  googleCallbackURL,
        scope:        ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error("No email returned from Google"), null);

          let user = await User.findOne({ googleId: profile.id });
          let isNewGoogleUser = false;

          if (!user) {
            user = await User.findOne({ email });

            if (user) {
              // Existing local account — link Google to it
              user.googleId       = profile.id;
              user.authProvider   = "google";
              user.isEmailVerified = true;
              if (!user.avatar) user.avatar = profile.photos?.[0]?.value || "";
              await user.save();
            } else {
              // Brand-new user — create with a temporary default role.
              // The frontend role-selection screen will update it immediately.
              user = await User.create({
                name:            profile.displayName || email.split("@")[0],
                email,
                googleId:        profile.id,
                authProvider:    "google",
                isEmailVerified: true,
                avatar:          profile.photos?.[0]?.value || "",
                role:            "customer", // overridden by frontend role-selection
              });
              isNewGoogleUser = true;
            }
          }

          // Attach the flag so googleCallback can pass it to the frontend
          user.isNewGoogleUser = isNewGoogleUser;
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );
} else {
  console.warn("⚠️  Google OAuth NOT configured — GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALLBACK_URL missing");
}

export default passport;