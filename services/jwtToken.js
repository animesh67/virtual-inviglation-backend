const jwt = require("jsonwebtoken")
const { User, Course, Op } = require("../databaseModels")
const { JWT_SECRET_KEY } = require("../enums/enums").ENUMS

generateToken = async(params) => {
    try {
        let user = await User.findAll({
            where: { emailId: params.username, password: params.password }
        })
        if (user === []) {
            throw new Error({ error: "user does not exist" });
        }
        user = user[0].dataValues;
        const courses = await Course.findAll({
            attributes: ["course_name"],
            where: {
                courseId: {
                    [Op.in]: user.courses_enrolled
                }
            }
        })
        user.courseNames = []
        courses.forEach(el => {
            user.courseNames.push(el.dataValues.course_name)
        })
        const token = jwt.sign(user, JWT_SECRET_KEY);
        return { token: token, name: user.name, sid: user.sid, access: user.access };

    } catch (err) { return null }
}

verifyToken = (req) => {
    let tokenHeaderKey = "bearertoken";
    let jwtSecretKey = JWT_SECRET_KEY;

    try {
        const token = req.headers[tokenHeaderKey];
        const verified = jwt.verify(token, jwtSecretKey);
        if (verified) {
            return verified;
        } else {
            throw new Error({ status: 401, error: "Token verification unsuccessful" })
        }
    } catch (error) {
        throw error;
    }
}
module.exports = {
    generateToken,
    verifyToken
}