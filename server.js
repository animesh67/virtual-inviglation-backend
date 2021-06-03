process.env.TZ = "UTC"
const { appendFileSync, mkdirSync, } = require("fs")
const path = require("path")
const express = require("express")
const jwtHelper = require("./services/jwtToken")
const { QuizResponse } = require("./databaseModels")
const {
    changePassword,
    getActiveQuizList,
    uploadQuiz,
    getList,
    addSingle,
    addCourse,
    getImg
} = require("./services/database")
const {
    getQuiz,
    getStudents,
    deleteQuiz,
    postImage,
    previewQuiz,
    getQuizQuestions,
    uploadResp,
    getResults,
    getResultStatus,
    tabSwitch,
    getTimestamps
} = require("./services/helpers");
const { add } = require("./services/fileUpload")
const { sendMail, releaseResults, sendToTeacher } = require("./services/email")
const { ProctoringDataList } = require("./services/proctoringDataList")
const fs = require("fs")


const app = express()

app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.json({ limit: '10mb' }))
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, bearertoken");
    next();
});

let proctoringList = new ProctoringDataList();


app.get('/video/:sid/:qid', (req, res) => {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }

    // get video stats (about 61MB)
    const videoPath = __dirname + `/../webcam-videos/${req.params.qid}/${req.params.sid}.webm`;
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

app.post("/addUser", async(req, res) => {
    const user = await jwtHelper.verifyToken(req);
    if (user === null || user.access === "student") {
        res.status(401).send("User Not Registered");
        return;
    }
    try {
        await addSingle(req.body);
        res.status(200).send({ status: "success" });
    } catch (err) {
        console.log(err)
        res.status(400).send({ err: err });
    }
})

/** API path that will upload the files */
app.post('/addUsers', async function(req, res) {
    console.log(req.headers)
    const user = await jwtHelper.verifyToken(req);
    if (user === null || user.access === "student") {
        res.status(401).send("User Not Registered");
        return;
    }
    try {
        add(req, res);
    } catch (err) {
        res.status(400).send({ status: "error" })
    }
});

app.get('/quizPreview', async function(req, res) {
    const user = await jwtHelper.verifyToken(req);
    if (user === null) {
        res.status(401).send("User Not Registered");
        return;
    }
    try {
        let preview = await previewQuiz(req.query, user);
        res.status(200).send(preview)
    } catch (err) {
        console.log(err)
        res.status(400).send({ err: err })
    }
});

app.get('/getImg', async function(req, res) {
    const user = await jwtHelper.verifyToken(req);
    if (user === null || user.access === "admin") {
        res.status(401).send("User Not Registered");
        return;
    }
    try {
        if (req.query.id) {
            user.sid = req.query.id;
        }
        let img = await getImg(user);
        res.status(200).send({ img: img });
    } catch (err) {
        res.status(400).send({ status: "error" })
    }
});

app.delete('/getImg', async function(req, res) {
    console.log("pppppp")
    const user = await jwtHelper.verifyToken(req);
    if (user === null || user.access === "admin") {
        res.status(401).send("User Not Registered");
        return;
    }
    try {
        if (req.query.id) {
            user.sid = req.query.id;
        }
        let img = await getImg(user, "delete");
        res.status(200).send({ img: img });
    } catch (err) {
        console.log(err)
        res.status(400).send({ status: "error" })
    }
});


app.post('/addCourse', async function(req, res) {
    console.log(req.headers)
    const user = await jwtHelper.verifyToken(req);
    if (user === null || user.access === "student") {
        res.status(401).send("User Not Registered");
        return;
    }
    try {
        await addCourse(req.body);
        res.status(200).send({ status: "success" })
    } catch (err) {
        console.log(err)
        res.status(400).send({ status: "error" })
    }
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
    if (user === null || user.access === "admin") {
        res.status(401).send("User Not Registered");
        return;
    }
    await postImage(req, user);
    res.status(200).send({ status: 200, message: "Upload Successful" })
})

app.post("/tab/:id", async(req, res) => {
    const user = await jwtHelper.verifyToken(req);
    if (user === null || user.access === "admin") {
        res.status(401).send("User Not Registered");
        return;
    }
    await tabSwitch(req, user);
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

app.get("/getResultsStatus", async(req, res) => {
    const status = await getResultStatus(req);
    res.status(200).send(status);
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

app.delete("/quiz/:id", async(req, res) => {
    const user = await jwtHelper.verifyToken(req);
    console.log("user")
    if (user === null || user.access !== "teacher") {
        res.status(400);
        console.log("p")
        return;
    }
    await deleteQuiz(req.params.id)
    res.status(200).send({ data: "done" })

})

app.get("/get-subjects", async(req, res) => {
    const user = jwtHelper.verifyToken(req)
    res.status(200).send(user.courseNames)
})

app.post("/upload-quiz", async(req, res) => {
    console.log("oo", req.body)
    const user = jwtHelper.verifyToken(req);
    if (user.access === 'student') {
        res.send(401)
    } else {
        const data = await uploadQuiz(req);
        mkdirSync(__dirname + `/../webcam-videos/${data.dataValues.id}`)
    }
})

app.post("/responses", async(req, res) => {
    const user = jwtHelper.verifyToken(req);
    if (user.access !== 'student') {
        res.send(401)
    } else {
        await uploadResp(req, user);
        res.status(200).send("upload successfull");
    }
})


app.get("/results", async(req, res) => {
    const user = jwtHelper.verifyToken(req);
    if (user === null || user.access === 'student') {
        res.send(401)
    } else {
        let results = await getResults(req.query.id, user);
        if (results === null) {
            res.sendStatus(400);
            return;
        }
        res.status(200).send({ data: results });
    }
})
app.post("/register-course", async(req, res) => {
    if (jwtHelper.verifyToken(req)) {

    }
    res.status(401)
})

app.post("/liveProctoring", async(req, res) => {
    const user = jwtHelper.verifyToken(req);
    if (user === null || user.access === 'student') {
        res.send(401)
    } else {
        console.log(user)
        proctoringList.list[user.name] = req.body.uuid;
        res.status(200).send({ status: "upload successfull" });
    }
})
app.get("/liveProctoring", (req, res) => {
    const user = jwtHelper.verifyToken(req);
    if (user === null) {
        res.send(401)
    } else {
        res.status(200).send(proctoringList.list)

    }
})
app.delete("/liveProctoring", (req, res) => {
    const user = jwtHelper.verifyToken(req);
    if (user === null) {
        res.send(401)
    } else {
        delete proctoringList.list[user.name];
        res.status(200).send({ status: "success" })

    }
})

app.get("/getQues", async(req, res) => {
    const user = jwtHelper.verifyToken(req);
    if (user === null) {
        res.send(401)
    } else {
        let ques = await getQuizQuestions(req.query, user);
        let questions = [];
        if (ques.questions[0].type === "googleForm") {
            questions = { type: "googleForm", link: ques.questions[0].link }
        } else {
            ques.questions.forEach(e => {
                let ops = [e.option1, e.option2, e.option3, e.option4];
                questions.push({
                    q: e.ques,
                    o: ops,
                    ans: ""
                });
            })
        }
        console.log(ques)
        res.status(200).send({
            subject: ques.subject_name,
            duration: ques.duration,
            ques: questions
        })

    }
})

app.get("/releaseResults", (req, res) => {
    console.log("yes")
    res.status(200).send({ o: "done" });
    releaseResults(req.query.id);
})

app.get("/getQuizStatus", async(req, res) => {
    const user = jwtHelper.verifyToken(req);
    if (user === null) {
        res.send(401)
    }
    console.log(req.query.id, user.sid_tid)
    let re = await QuizResponse.findOne({ where: { quiz_id: req.query.id, sid: user.sid_tid } })
    if (re !== null) {
        res.status(200).send({ status: 400 });
        return;
    }
    res.status(200).send({ status: 200 });
})

app.post("/sendEmailToTeacher", async(req, res) => {
    await sendToTeacher(req.body.id)
    res.send({ "ok": "ok" })

})
app.get("/getTimestamps", async(req, res) => {
    console.log(req.query)
    const timestamps = await getTimestamps(req.query.sid, req.query.quizId)
    console.log(timestamps)
    res.send(timestamps)

})

const port = 3000;
const http = require("http")
const { time } = require("console")
let server = http.createServer(app)

const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
})
io.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
});
io.on('connect', (socket) => {
    console.log("yes")
    socket.on("join", (data) => {
        let base64 = data.data.replace(/^data:(.*?);base64,/, ""); // <--- make it any type
        base64 = base64.replace(/ /g, '+'); // <--- this is important
        appendFileSync(__dirname + `/../webcam-videos/${data.id}/${data.sid}.webm`, base64, 'base64', function(err) {
            console.log(err);
        });
    })
})

server.listen(port)