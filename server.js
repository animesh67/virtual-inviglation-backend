process.env.TZ = "UTC"

const express = require("express")
const jwtHelper = require("./services/jwtToken")
const { changePassword, getActiveQuizList, uploadQuiz, getQuizQuestions, getList } = require("./services/database")
const { getQuiz, getStudents, deleteQuiz, postImage, } = require("./services/helpers");
const { add } = require("./services/fileUpload")
const { sendMail } = require("./services/email")
const fs = require("fs")


const app = express()
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.json({ limit: '10mb' }))
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, bearertoken");
    next();
});


app.get('/video/:sid/:qid', (req, res) => {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }

    // get video stats (about 61MB)
    const videoPath = __dirname + "/videos/a.mp4";
    const videoSize = fs.statSync(videoPath).size;

    // Parse Range
    // Example: "bytes=32324-"
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    // Create headers
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);

    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end });

    // Stream the video chunk to the client
    videoStream.pipe(res);
})

/** API path that will upload the files */
app.post('/addUsers', async function(req, res) {
    console.log(req.headers)
    const user = await jwtHelper.verifyToken(req);
    if (user === null || user.access !== "admin") {
        res.status(401).send("User Not Registered");
        return;
    }
    add(req, res);

});


app.post("/login", async(req, res) => {
    try {
        let response = await jwtHelper.generateToken(req.body)
        if (response === null) {
            res.status(401).send("User Not Registered");
        } else {
            res.status(200).send(response);
        }
    } catch (err) {
        console.log(err)
        res.status(400).send("some error,#buggy code")
    }
})

app.post("/post-image", async(req, res) => {
    const user = await jwtHelper.verifyToken(req);
    if (user === null || user.access !== "admin") {
        res.status(401).send("User Not Registered");
        return;
    }
    await postImage(req, user);
    res.status(200).send({ status: 200, message: "Upload Successful" })
})

app.post("/change-password", async(req, res) => {
    try {
        const user = jwtHelper.verifyToken(req)
        await changePassword(req.body, user, res);
        res.send("Success");
    } catch (err) {
        console.log(err)
        res.status(400).send("unsuccessful")
    }
})

app.get("/get-students-list/:subject", async(req, res) => {
    try {
        const user = jwtHelper.verifyToken(req);
        if (user.access !== "teacher" && user.access !== "admin") {
            res.status(401).send("Unauthorized");
            return;
        }
        const course = await getQuiz(req.params.subject);
        if (course === null) {
            res.status(400).send("error");
            return;
        }
        let students = await getStudents(course.courseId);
        res.status(200).send(students);
    } catch (err) {
        console.log(err)
        res.status(400).send("unsuccessful")
    }
})

app.post("/forgot-password", (req, res) => {
    sendMail(req.body.email);
    res.status(200).send({ response: "email Sent" });

})

app.get("/quiz/:data", async(req, res) => {
    const user = jwtHelper.verifyToken(req)
    let list;
    if (req.params.data === "Results")
        list = await getList(user);
    else
        list = await getActiveQuizList(user, req.params.data);
    console.log(list)
    res.status(200).send(list)
})

app.get("/results/:id", async(req, res) => {
    console.log(req.headers)
    const user = jwtHelper.verifyToken(req)
    const list = await getActiveQuizLzist(user, req.params.data);
    res.status(200).send(list)
})

app.delete("/quiz", async(req, res) => {
    const user = await jwtHelper.verifyToken(req);
    console.log(user)
    if (user === null || user.access !== "teacher") {
        res.status(400);
        console.log("p")
        return;
    }
    await deleteQuiz(req.query.id)
    res.status(200).send({ data: "done" })

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
        await uploadQuiz(req);
        res.status(200).send("upload successfull");
    }
})

app.get("quiz-questions", async(req, res) => {
    const user = jwtHelper.verifyToken(req)
    await getQuizQuestions(req, user, res);
})

app.get("quiz-results", async(req, res) => {

})
app.post("/register-course", async(req, res) => {
    if (jwtHelper.verifyToken(req)) {

    }
    res.status(401)
})

const server = require('http').Server(app)
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        credentials: true
    }
});

const port = 3000;

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const roomName = data.roomName;
        socket.join(roomName);
        socket.to(roomName).broadcast.emit('new-user', data)

        socket.on('disconnect', () => {
            socket.to(roomName).broadcast.emit('bye-user', data)
        })
    })
})

server.listen(port, () => {
    console.log(`Server running port ${port}`)
});