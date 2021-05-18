const { Course, User, QuizList, QuizResponse } = require("../databaseModels");


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
    const re = await User.update({ image: req.body.img }, { where: { email: user.email } });
    console.log(re)
}

const previewQuiz = async(params, user) => {
    if (params.role === "student") {
        let resp = await QuizResponse.findOne({
            where: {
                sid: user.sid_tid,
                quiz_id: params.id
            }
        })
        if (resp === null) {
            throw new Error({ err: "no resposne" });
        }
        return resp.dataValues.responses;
    } else {
        let resp = await QuizList.findOne({
            where: {
                id: params.id
            }
        })
        console.log(resp)
        if (resp === null) {
            throw new Error({ err: "no resposne" });
        }
        return resp.dataValues.questions;
    }
}


module.exports = {
    previewQuiz,
    postImage,
    deleteQuiz,
    getQuiz,
    getStudents
}