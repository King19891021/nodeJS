var Sequelize = require('sequelize');

// Creating sqlite database
var sequelize = new Sequelize(undefined, undefined, undefined,{
    'dialect': 'sqlite',
    'storage': __dirname+'/basic-sqlite-database.sqlite'
});

// Creating Todo table
var Todo = sequelize.define('todo', {
    description:{
        type: Sequelize.STRING,
        allowNull: false,
        validate:{
            len:[1, 255]
        }
    },
    completed:{
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
})

// Synchronizing the database for creating db and creating table, adding data into table
sequelize.sync(
        // // force 명령문을 쓰면 명령이 실행될때마다 자료가 계속 replace 된다.
        // // 그렇지않으면 자료가 추가된다.
        // {force: true} 
    ).then(function(){
        console.log('Everything is synchronized!');
        // Inserting data in table
        Todo.create({
            description: 'It is the description'
        }).then(function(todo){
            return Todo.create({
                description: 'Clean coffee'
            });
        }).then(function(){
            // // getting data of which id=1 
            // return Todo.findById(1);
            // // getting filtered const 
            return Todo.findAll({
                where:{
                    description: {
                        $like: '%it is%'
                    }
                }
            })
        }).then(function(todos){
            if(todos){
                todos.forEach(function(todo){
                    console.log(todo.toJSON());
                })
            }
            else{
                console.log('No filtered data');
            }
        }).catch(function(e){
            console.log(e);
        })


        // Searching data from table by id
        Todo.findById(200).then(function(todo){
            if(todo){
                console.log(todo.toJSON());
            }
            else{
                console.log('No data to search');
            }
        })
    });