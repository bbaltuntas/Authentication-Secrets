require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const ejs = require("ejs")
const encrypt = require("mongoose-encryption")
const md5 = require("md5")

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
        const newUser = new User({
            email: req.body.email,
            password: md5(req.body.password),
        })
        newUser.save(function (err) {
            if (!err) {
                res.render("secrets")
            } else {
                console.log(err)
            }
        })
    })


app.route("/login")
    .get((req, res) => {
        res.render("login")
    })
    .post((req, res) => {
        const email = req.body.email
        const password = md5(req.body.password)
        User.findOne({email: email}, function (err, foundUser) {
            if (err) {
                console.log(err)
            } else {
                console.log("hata yok")
                if (foundUser) {
                    if (foundUser.password === password) {
                        res.render("secrets")
                    }
                } else {
                    console.log("kullanıcı yok")
                }
            }
        })

    })
app.listen(port, () => {
    console.log(`App is running on http://localhost:${port}`)
})