var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
var sequelize;

if(env === 'production'){
    sequelize = new Sequelize("postgres://sfsxuiercrswrc:d6c10e323b8ded61f59c3cfcbcb6044764c324c94757569b5ef900600448cd47@ec2-50-19-208-11.compute-1.amazonaws.com:5432/dehsgb57tpak3j", {
        'dialect': 'postgres',
        'dialectOptions': {
            ssl: true
        }
    });
}
else{
    sequelize = new Sequelize(undefined, undefined, undefined,{
        'dialect': 'sqlite',
        'storage': __dirname+'/data/dev-todo-api.sqlite'
    });
}

var db = {};

db.todo = sequelize.import(__dirname+'/models/todo.js');
db.user = sequelize.import(__dirname+'/models/user.js');
db.token = sequelize.import(__dirname+'/models/token.js');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// todo table과 user table사이에 id를 가지고 서로 련관시켜준다.
// 서버를 실행하면 todo table에 userId라는 마당이 생긴다.
db.todo.belongsTo(db.user);
db.user.hasMany(db.todo);

module.exports = db;    
