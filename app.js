require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const ejs = require("ejs")
const encrypt = require("mongoose-encryption")
const md5 = require("md5")
const bcrypt = require("bcrypt")
const saltRounds = 10

const app = express()


let port = process.env.PORT;
if (port == null || port === "") {
    port = 3000;
}

app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.set("view engine", "ejs")

mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
})


const User = mongoose.model("User", userSchema)

app.get("/", (req, res) => {
    res.render("home")
})

app.post("/", (req, res) => {

})

app.route("/register")
    .get((req, res) => {
        res.render("register")
    })
    .post((req, res) => {
        bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
            const newUser = new User({
                email: req.body.email,
                password: hash,
            })
            newUser.save(function (error) {
                if (!error) {
                    res.render("secrets")
                } else {
                    console.log(err)
                }
            })
        });

    })


app.route("/login")
    .get((req, res) => {
        res.render("login")
    })
    .post((req, res) => {

        const email = req.body.email
        const password = req.body.password
        User.findOne({email: email}, function (err, foundUser) {
            if (err) {
                console.log(err)
            } else {
                if (foundUser) {
                    bcrypt.compare(password, foundUser.password, function (err, result) {
                        if (result === true) {
                            res.render("secrets")
                        }
                    });
                } else {
                    console.log("No User")
                }
            }
        })

    })
app.listen(port, () => {
    console.log(`App is running on http://localhost:${port}`)
})