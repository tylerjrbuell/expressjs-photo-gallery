mongoose = require("mongoose");
const GoogleStategy = require("passport-google-oauth20").Strategy;
User = require("../models/User");

passport = function (passport) {
  passport.use(
    new GoogleStategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `https://${process.env.SERVER}/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        const newUser = {
          google_id: profile.id,
          email: profile.emails[0].value,
          display_name: profile.displayName,
          first_name: profile.name.givenName,
          last_name: profile.name.familyName,
          image: profile.photos[0].value,
        };

        try {
          let user = await User.findOne({
            google_id: profile.id
          });
          if (user) {
            done(null, user);
          } else {
            user = await User.create(newUser);
            done(null, user);
          }
        } catch (error) {
          console.error(error);
        }
      }
    )
  );

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });
};

module.exports = passport;