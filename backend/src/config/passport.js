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
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
      scope:        ["profile", "email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
          return done(new Error("No email returned from Google"), null);
        }

        // ── Find by googleId first, then by email ─────────
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.findOne({ email });

          if (user) {
            // Existing local account — link Google to it
            user.googleId       = profile.id;
            user.authProvider   = "google";
            user.isEmailVerified = true; // Google already verified the email
            if (!user.avatar) user.avatar = profile.photos?.[0]?.value || "";
            await user.save();
          } else {
            // Brand-new user via Google
            user = await User.create({
              name:            profile.displayName || email.split("@")[0],
              email,
              googleId:        profile.id,
              authProvider:    "google",
              isEmailVerified: true,
              avatar:          profile.photos?.[0]?.value || "",
              role:            "customer",
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

export default passport;