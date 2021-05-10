const multer = require("multer");
const CSVToJSON = require('csvtojson');
const { User } = require("../databaseModels")

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
    }
});

var upload = multer({ //multer settings
    storage: storage
}).single('file');

const add = (req, res) => {
    upload(req, res, (err) => {
        console.log(req.file);
        if (err) {
            res.status(400).json({ error_code: 1, err_desc: err });
            return;
        }

        CSVToJSON().fromFile(req.file.path)
            .then(us => {
                us.forEach(el => {
                    let course = [];
                    el.courses.split(",").forEach(el => course.push(el))
                    el.courses = course;
                    User.upsert(el).then().catch(err => {
                        console.log(err);
                        res.send("error in gettin data")
                    });
                })
            }).catch(err => {
                console.log(err);
                res.json({ error_code: 1, err_desc: err });
            });
    })

};

module.exports = {
    add
}