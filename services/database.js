const { User, QuizList, Op } = require("../databaseModels")

const changePassword = async(body, res, jwt) => {
    const user = await User.findOne({ where: { id: jwt.id } })
    if (user.password !== body.old) {
        res.status(400).send("Old password Incorrect");
        return;
    }
    user.dataValues.password = body.new;
    const p = await User.update(user.dataValues, { where: { id: jwt.id } })
}

const getActiveQuizList = async(user) => {
    let list;
    if (user.access != "student") {
        list = await QuizList.findAll({
            attributes: ["id", "subject_name", "start_date", "duration", "is_active"],
        });
    } else {
        list = await QuizList.findAll({
            attributes: ["id", "subject_name", "start_date", "duration", "is_active"],
            where: {
                "subject_name": {
                    [Op.in]: user.courseNames
                },
                is_active: true,
            }
        });
    }

    let quizList = [];
    list.forEach(el => {
        if (el.dataValues.is_active === true)
            quizList.push(el.dataValues)
    })
    return quizList;
}

const uploadQuiz = async(req) => {
    console.log(req.body)
    const upload = await QuizList.create({
        "subject_name": req.body.subjectName,
        "start_date": req.body.date,
        "duration": req.body.duration,
        "questions": req.body.questions,
        "is_active": true
    }).then(data => data).catch(err => { console.log(err); return err; })
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
module.exports = {
    changePassword,
    getActiveQuizList,
    uploadQuiz,
    getQuizQuestions
}