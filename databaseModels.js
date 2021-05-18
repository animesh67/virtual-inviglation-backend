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
        autoIncrement: true

    },
    "courses": {
        type: Sequelize.ARRAY(Sequelize.TEXT),
    },
    "name": Sequelize.TEXT,
    "email": {
        type: Sequelize.TEXT,
        allowNull: false,
        primaryKey: true,
    },
    "password": Sequelize.TEXT,
    "sid_tid": Sequelize.INTEGER,
    "access": Sequelize.TEXT,
    "image": Sequelize.TEXT
});

const Course = sequelize.define("courses", {
    "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true

    },
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

const QuizResponse = sequelize.define("quiz_responses", {
    "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true

    },
    sid: Sequelize.BIGINT,
    responses: Sequelize.JSONB,
    quiz_id: Sequelize.BIGINT
})



module.exports = {
    QuizResponse,
    User,
    Course,
    QuizList,
    Op
}