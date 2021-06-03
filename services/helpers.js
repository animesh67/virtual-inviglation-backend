const { Course, User, QuizList, QuizResponse } = require("../databaseModels");
const { writeFileSync } = require("fs")
const axios = require('axios');

const getQuiz = async(subjectName) => {
    try {
        const course = await Course.findOne({ where: { course_name: subjectName } });
        if (!course) {
            return null;
        }
        return course;

    } catch (err) {
        console.log(err);
        throw err;
    }
}

const getStudents = async(id) => {
    let students = await User.findAll({
        attributes: ["name", "sid_tid", "email", "courses"],
        where: { access: "student" }
    });
    if (students === []) {
        return [];
    }
    let result = [];
    console.log(id)
    students.forEach((s) => {
        if (s.dataValues.courses.includes(id)) {
            result.push({ name: s.dataValues.name, id: s.dataValues.sid_tid, email: s.dataValues.email })
        }
    })
    console.log(result)
    return result;

}

const deleteQuiz = async(i) => {
    console.log("yes", i)
    await QuizList.update({ is_active: false }, { where: { id: i } });
}

const postImage = async(req, user) => {
    console.log(user)
    let data = req.body.img.replace("data:image\/png;base64,", '');
    writeFileSync(`${__dirname}/../../images/${user.sid_tid}.png`, data, { encoding: 'base64' }, function(err) {});
    const re = await User.update({ image: req.body.img }, { where: { email: user.email } });
    console.log(re)
}

const previewQuiz = async(params, user) => {
    let resp = await QuizList.findOne({
        where: {
            id: params.id
        }
    })
    if (resp === null) {
        throw new Error({ err: "no resposne" });
    }
    resp = resp.dataValues.questions;
    if (params.role === "student") {
        if (params.sid) {
            user.sid_tid = params.sid
        }
        let res = await QuizResponse.findOne({
            where: {
                sid: user.sid_tid,
                quiz_id: params.id
            }
        })
        if (res === null) {
            throw new Error({ err: "no resposne" });
        }
        res = res.dataValues.responses;
        for (let i in resp) {
            resp[i].correct = res[i].ans;
        }
    }

    return resp;

}
const getQuizQuestions = async(params, user) => {
    let quiz = await QuizList.findOne({ where: { id: params.id } });
    return quiz.dataValues;

}

const uploadResp = async(req, user) => {
    let p = await QuizResponse.findOne({ where: { sid: user.sid_tid, quiz_id: req.body.params.id } });
    if (p !== null) {
        return
    }
    let resp = req.body.response.resp;
    let ans = [];
    for (let i in resp) {
        let p = {}
        p.ques = resp[i].q;
        p.ans = resp[i].ans;
        ans.push(p)
    }
    let po = await QuizResponse.create({ sid: user.sid_tid, responses: ans, quiz_id: req.body.params.id });
}

const getResults = async(quizId, user) => {
    let data = await QuizList.findOne({ where: { id: quizId } });
    data = data.dataValues;
    let users = await QuizResponse.findAll({ where: { quiz_id: quizId } });
    let resp = []
    for (let i in users) {
        let el = users[i].dataValues;
        let name = await User.findOne({ attributes: ["name"], where: { sid_tid: el.sid } })
        name = name.dataValues.name
        resp.push({ name: name, sid: el.sid, score: el.score, timestamps: el.timestamps })
    }
    console.log(resp)
    return { data: resp, head: data.details }

}



startEvaluation = async(quizList, quizId) => {
    let users = await QuizResponse.findAll({ where: { quiz_id: quizId } });
    let students = [];
    users.forEach(el => {
        el = el.dataValues;
        students.push(el.sid)
    })

    const payload = { quidId: quizId, students: students };
    axios
        .post('http://localhost:5000/evaluate_results', {
            payload: payload
        })
        .then(res => {

        })
        .catch(error => {

        })

    console.log("yes-----")
    if (quizList.questions[0].type === "googleForm") {
        let details = {};
        details.noOfQues = 0;
        details.userAppeared = 0;
        details.mean = 0;
        details.min = 0;
        details.max = 0;
        await QuizList.update({ details: details }, { where: { id: quizId } });
        return
    }

    let details = {};
    let ques = quizList.questions;
    details.noOfQues = ques.length;
    details.userAppeared = users.length;
    details.mean = 0;
    details.min = 100;
    details.max = 0;
    users.forEach(async(el) => {
        let user1 = el.dataValues.responses;
        let score = 0;
        for (let i in user1) {
            if (user1[i].ques === ques[i].ques) {
                if (user1[i].ans === ques[i][`option${ques[i].correct}`])
                    score += 1
            }
            details.mean += score / details.userAppeared;
            details.min = Math.min(details.min, score);
            details.max = Math.max(details.max, score);
            await QuizResponse.update({ score: score }, { where: { sid: el.sid, quiz_id: quizId } })
        }
    })
    await QuizList.update({ details: details }, { where: { id: quizId } })
}

let getResultStatus = async(req) => {
    let res = await QuizList.findOne({ where: { id: req.query.id } });
    if (res.dataValues.result_status === "done") {
        return { status: 200, "message": "results done" }
    }
    if (res.dataValues.result_status === "progress") {
        return { status: 400, "message": "results under progress, you'll get an email" }
    }
    res = res.dataValues;
    await startEvaluation(res, req.query.id);
    const y = await QuizList.update({ result_status: "progress" }, { where: { id: req.query.id } });
    return { status: 400, "message": "results evaluation has been started, do not press this button again, you'll get an email after the results are evaluated" }
}
let tabSwitch = async(req, user) => {
    await QuizResponse.update({ tabSwitching: req.body }, { where: { sid: user.sid_tid, quiz_id: req.params.id } })
}

let getTimestamps = async(sid, quizId) => {
    const res = await QuizResponse.findOne({
        where: {
            sid: sid,
            quiz_id: quizId
        }
    })
    console.log(res)
    return res.dataValues.timestamps;
}

module.exports = {
    getResultStatus,
    getResults,
    uploadResp,
    getQuizQuestions,
    previewQuiz,
    postImage,
    deleteQuiz,
    getQuiz,
    getStudents,
    tabSwitch,
    getTimestamps
}