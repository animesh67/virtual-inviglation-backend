const express = require("express")
const cors = require("cors")
const jwtHelper = require("./services/jwtToken")
const { changePassword, getQuizList } = require("./services/database")
const app = express()

app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(cors());

app.post("/login", async(req, res) => {

    let token = await jwtHelper.generateToken(req.body)
    if (token === null) {
        res.status(401).send("User Not Registered");
    }
    res.send(token);

})

app.get("/profile", async(req, res) => {
    const verified = await jwtHelper.verifyToken(req);
    res.status(201).send(verified);

})
app.post("/change-password", async(req, res) => {
    const user = jwtHelper.verifyToken(req)
    await changePassword(req.body, res, user);
})

app.post("/forgot-password", (req, res) => {

})

app.get("/quiz", async(req, res) => {
    const user = jwtHelper.verifyToken(req)
    const list = await getQuizList(user);
    res.status(200).send(list)
})

app.get("/get-subjects", async(req, res) => {
    const user = jwtHelper.verifyToken(req)
    res.status(200).send(user.courseNames)
})

app.post("/upload-quiz", async(req, res) => {
    const user = jwtHelper.verifyToken(req);
    if (user.access === 'student') {
        res.send(401)
    } else {
        console.log(req.body)
    }
})

app.get("quiz-questions", async(req, res) => {

})

app.get("quiz-results", async(req, res) => {

})
app.post("/register-course", async(req, res) => {
    if (jwtHelper.verifyToken(req)) {

    }
    res.status(401)
})

app.post("register-students", async(req, res) => {

})



app.listen(3000, () => console.log("listening to server"));