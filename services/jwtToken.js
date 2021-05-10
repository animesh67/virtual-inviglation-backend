const jwt = require("jsonwebtoken")
const { User, Course, Op } = require("../databaseModels")
const { JWT_SECRET_KEY } = require("../enums/enums").ENUMS
const axios = require("axios");

generateToken = async(params) => {
    let user;
    try {
        if (params.googleToken) {
            let resp = await axios.get(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${params.googleToken}`)
            resp = resp.data;
            if (resp.error === "invalid_token") {
                throw new Error({ error: resp });
            }
            user = await User.findAll({
                where: { email: resp.email }
            })
        } else {
            user = await User.findAll({
                where: { email: params.email, password: params.password }
            })
        }
        if (user === []) {
            throw new Error({ error: "user does not exist" });
        }
        user = user[0].dataValues;
        let courses = await Course.findAll({
            where: {
                courseId: {
                    [Op.in]: user.courses
                }
            }
        })
        let c = {}
        console.log(courses)
        courses.forEach(el => {
            c[el.dataValues.courseId] = el.dataValues.course_name;
        })
        let isM = false;
        if (user.image) {
            isM = true
        }
        user.image = ""
        user.courses = c;
        const token = jwt.sign(user, JWT_SECRET_KEY);
        return {
            token: token,
            name: user.name,
            emailId: user.email,
            sid_tid: user.sid_tid,
            access: user.access,
            courses: c,
            isImage: isM
        };

    } catch (err) { console.log(err); return null }
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
        console.log(error);
        return null;
    }
}
module.exports = {
    generateToken,
    verifyToken
}