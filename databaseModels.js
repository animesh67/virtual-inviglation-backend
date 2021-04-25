const Sequelize = require("sequelize");
const { Op } = require("sequelize")
const { development } = require("./enums/enums").ENUMS


const sequelize = new Sequelize(development)

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});




const User = sequelize.define("users", {
    "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true

    },
    "courses_enrolled": {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
    },
    "name": Sequelize.TEXT,
    "emailId": Sequelize.TEXT,
    "password": Sequelize.TEXT,
    "sid": Sequelize.INTEGER,
    "access": Sequelize.TEXT
});

const Course = sequelize.define("courses", {
    "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true

    },
    "instructor": Sequelize.TEXT,
    "courseId": Sequelize.INTEGER,
    "course_name": Sequelize.TEXT
});

const QuizList = sequelize.define("quiz_lists", {
    "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true

    },
    "subject_name": Sequelize.TEXT,
    "start_date": Sequelize.DATE,
    "duration": Sequelize.INTEGER,
    "questions": Sequelize.JSONB,
    "is_active": Sequelize.BOOLEAN
});



module.exports = {
    User,
    Course,
    QuizList,
    Op
}