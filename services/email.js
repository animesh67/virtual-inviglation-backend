const nodemailer = require("nodemailer");
const { User, QuizResponse, QuizList } = require("../databaseModels");
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'animeshgarg39@gmail.com',
        pass: 'animeshgarg39'
    }
});


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
    releaseResults,
    sendMail
}