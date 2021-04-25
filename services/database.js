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

const getQuizList = async(user) => {
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
                }
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
module.exports = {
    changePassword,
    getQuizList
}