const { User, QuizList, Op, Course } = require("../databaseModels")
var moment = require('moment');


const changePassword = async(body, verified, res) => {
    const user = await User.findOne({ where: { id: verified.id } })
    console.log(user);
    if (user.password !== body.old) {
        res.status(400).send("Old password Incorrect");
        return;
    }
    await User.update({ password: body.new }, { where: { id: verified.id } })
}

const getActiveQuizList = async(user, param) => {
    courseNames = [];
    for (let i in user.courses) {
        courseNames.push(user.courses[i]);
    }
    let list;
    if (user.access !== "student") {
        list = await QuizList.findAll({
            attributes: ["id", "subject_name", "start_date", "duration", "is_active"],
            where: {
                is_active: true,
            }
        });
    } else {
        list = await QuizList.findAll({
            attributes: ["id", "subject_name", "start_date", "duration", "is_active"],
            where: {
                "subject_name": {
                    [Op.in]: courseNames
                },
                is_active: true,
            }
        });
    }
    let quizList = [];
    list.forEach(el => {
        let startDate = moment(el.start_date, 'YYYY-MM-DD HH:mm:ss')
        let endDate = moment(new Date())
        let secondsDiff = endDate.diff(startDate, 'seconds')

        if (param === "Past Quizzes" && secondsDiff > (Number(el.duration) * 60))
            quizList.push(el.dataValues)
        if (param !== "Past Quizzes" && secondsDiff < (Number(el.duration) * 60)) {
            quizList.push(el.dataValues);
        }
    })

    return quizList;
}

const getList = async(user) => {
    let courseNames = [];
    for (let i in user.courses) {
        courseNames.push(user.courses[i]);
    }
    list = await QuizList.findAll({
        attributes: ["id", "subject_name", "start_date", "duration", "is_active"],
        where: {
            "subject_name": {
                [Op.in]: courseNames
            },
            is_active: true,
        }
    });
    let quizList = [];
    list.forEach(el => {
        let startDate = moment(el.start_date, 'YYYY-MM-DD HH:mm:ss')
        let endDate = moment(new Date())
        let secondsDiff = endDate.diff(startDate, 'seconds')
        if (secondsDiff > (Number(el.duration) * 60))
            quizList.push(el.dataValues)
    })
    return quizList;
}

const uploadQuiz = async(req) => {
    console.log(req.body)
    if (req.body.type) {
        req.body.questions = [{ type: "googleForm", link: req.body.googleForm }]
    }
    console.log(req.body)
    const upload = await QuizList.create({
        "subject_name": req.body.subjectName,
        "start_date": Date(req.body.date),
        "duration": req.body.duration,
        "questions": req.body.questions,
        "is_active": true
    }).then(data => data).catch(err => { console.log(err); return err; });
    return upload
}

const getQuizQuestions = async(req, user, res) => {
    try {
        if (!user.courseNames.includes(req.body.subjectName)) {
            res.status(401).send("Course Not Registered");
            return;
        }
        const quiz = await User.findOne({
            where: { id: req.body.id, subject_name: req.body.subjectName, is_active: true }
        });
        res.status(200).send(quiz);
    } catch (err) {
        res.status(400);
        return;
    }


}

const addSingle = async(user) => {
    let courses = [];
    user.courses.split(",").forEach(e => {
        courses.push(e.trim().toUpperCase())
    })
    user.courses = courses;
    await User.upsert(user)
}

const addCourse = async(course) => {
    console.log(course)
    course.courseId = course.courseId.toUpperCase()
    await Course.create(course)
}
const getImg = async(user, del = "") => {
    if (del === "delete") {
        await User.update({
            image: null
        }, {
            where: {
                sid_tid: user.sid
            }
        })
        return "";
    }
    if (user.sid) {
        const img = await User.findOne({ where: { sid_tid: user.sid } });
        return img.image;
    }
    const img = await User.findOne({ where: { id: user.id } });
    return img.image;
}

module.exports = {
    getImg,
    addCourse,
    addSingle,
    getList,
    changePassword,
    getActiveQuizList,
    uploadQuiz,
    getQuizQuestions
}