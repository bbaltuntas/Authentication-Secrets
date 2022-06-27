require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const ejs = require("ejs")
const session = require('express-session')
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


const app = express()


let port = process.env.PORT;
if (port == null || port === "") {
    port = 3000;
}

app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.set("view engine", "ejs")

app.use(session({
    secret: process.env.SOME_LONG_UNGUESSABLE_STRING,
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
})

const secretSchema = new mongoose.Schema({
    userId: String,
    secretContent: String,
})


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema)
const Secret = mongoose.model("Secret", secretSchema)

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, {id: user.id, username: user.username});
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({googleId: profile.id}, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/auth/google', passport.authenticate('google', {scope: ['profile']}));

app.get('/auth/google/secrets',
    passport.authenticate('google', {failureRedirect: '/login'}),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect('/secrets');
    });
app.get("/", (req, res) => {
    res.render("home")
})

app.post("/", (req, res) => {

})


app.route("/login")
    .get((req, res) => {
        res.render("login")
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })
        req.login(user, function (err) {
            if (err) {
                console.log(err)
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets")
                })
            }
        })
    })

app.route("/register")
    .get((req, res) => {
        res.render("register")
    })
    .post((req, res) => {
        User.register({username: req.body.username}, req.body.password, function (err, user) {
            if (err) {
                console.log(err)
                res.redirect("/register")
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets")
                })

            }
        });

    })

app.route("/secrets")
    .get((req, res) => {

        Secret.find({}, 'secretContent', function (err, foundSecrets) {
            if (!err) {
                res.render("secrets", {usersWithSecrets: foundSecrets})
            } else {
                console.log(err)
            }
        })

        /* User.find({"secret": {$ne: null}}, {secret: 1}, function (err, foundSecrets) {
             if (!err) {
                 if (foundSecrets) {
                     res.render("secrets", {usersWithSecrets: foundSecrets})
                 }
             } else {
                 console.log(err)
             }
         })*/
    })

app.route("/logout")
    .get((req, res) => {
        req.logout(function (err) {
            if (err) {
                console.log(err)
            }
        });
        res.redirect('/');
    })


app.route("/submit")
    .get((req, res) => {
        if (req.isAuthenticated) {
            res.render("submit")
        } else {
            res.redirect("/login")
        }
    })
    .post((req, res) => {
        const secret = req.body.secret
        User.findById(req.user.id, function (err, foundUser) {
            if (err) {
                console.log(err)
            } else {
                if (foundUser) {
                    const newSecret = new Secret({
                        userId: req.user.id,
                        secretContent: secret
                    })
                    newSecret.save(function (err) {
                        if (err) {
                            console.log(err)
                        } else {
                            res.redirect("/secrets")
                        }
                    })

                    /* foundUser.secret = secret
                     foundUser.save(function (err) {
                         if (!err) {
                             res.redirect("/secrets")
                         }
                     })*/
                }
            }
        })
    })
app.listen(port, () => {
    console.log(`App is running on http://localhost:${port}`)
})