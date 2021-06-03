const nodemailer = require("nodemailer");
const { User, QuizResponse, QuizList, Course } = require("../databaseModels");
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'animeshgarg39@gmail.com',
        pass: 'animeshgarg39'
    }
});

const sendToTeacher = async(id) => {
    let quiz = await QuizList.findOne({ where: { id: id } });
    quiz = quiz.dataValues;
    let subject = quiz.subject_name
    let courses = await Course.findOne({ where: { course_name: subject } });
    let courseId = courses.dataValues.courseId;
    let user = await User.findAll();
    to = []
    user.forEach(element => {
        element = element.dataValues;
        element.courses.forEach(e => {
            if (e === courseId) {
                to.push(element.email);
            }
        })
    });
    let body = JSON.stringify({
        "subject name": subject,
        "duration": quiz.duration + " mins",
        "start date": quiz.start_date + "",
        "No of Questions": quiz.questions.length,
        "quiz Type": quiz.questions[0].link ? "google form" : "Uploaded through website"

    }, null, 2)
    let mailOptions = {
        from: 'animeshgarg39@gmail.com',
        to: to,
        subject: 'Quiz Results Cpmpiled',
        text: body
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}


const sendMail = async(to) => {
    let mailOptions = {
        from: 'animeshgarg39@gmail.com',
        to: '',
        subject: 'Password Reset Mail',
        text: 'This is your Temporary Password Valid for 10 minutes, Login with this and then change your password'
    };
    mailOptions.to = to;
    let pswd = `PaS@12${Date.now()}`;
    await User.update({ password: pswd }, { where: { email: to } });

    mailOptions.text = `${mailOptions.text}
     Password is ${pswd}`;

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

const releaseResults = (quizId) => {
    let mailOptions = {
        from: 'animeshgarg39@gmail.com',
        to: '',
        subject: 'Password Reset Mail',
        text: 'This is your Temporary Password Valid for 10 minutes, Login with this and then change your password'
    };
}

module.exports = {
    sendToTeacher,
    releaseResults,
    sendMail
}