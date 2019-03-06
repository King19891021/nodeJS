var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var _ = require("underscore");
var db = require('./db.js');
var middleware = require('./middleware.js')(db);

var PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

app.get('/', function (req, res, error) {
    res.send('Todo API Test');
})

app.get('/todos', middleware.requireAuthentication, function (req, res, error) {
    res.json(todos);
})

// get/todos?completed=true&q=work
app.get('/todos_query', middleware.requireAuthentication, function(req, res){
    var queries = req.query;
    var where = {
        userId: req.user.get('id')
    };
    if(queries.hasOwnProperty('completed') && queries.completed === 'true'){
        where.completed = true;
    }
    else if(queries.hasOwnProperty('completed') && queries.completed === 'false'){
        where.completed = false;
    }

    if(queries.hasOwnProperty('q') && queries.q.length >0){
        where.description = {
            $like: '%' + queries.q + '%'
        };
    }

    db.todo.findAll({where: where}).then(function(todos){
        res.json(todos);
    }, function (e) {
        res.status(500).send();
    })
})

// get/todos/3
app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var requestId = parseInt(req.params.id, 10);

    db.todo.findOne({
        where: {
            id: requestId,
            userId: req.user.get('id')
        }
    }).then(function(todo){
        if(todo){
            res.json(todo.toJSON());
        }
        else{
            res.status(404).send();
        }        
    }, function (e) {
        res.status(500).send();
    });
})

// Delete/todos/:id
app.delete('/del_todos/:id', middleware.requireAuthentication, function (req, res) {
    var requestId = parseInt(req.params.id, 10);
    db.todo.destroy({where: {
        id: requestId,
        userId: req.user.get('id')
    }}).then(function(rowsDeleted){
        if(rowsDeleted === 0){
            res.status(404).json({
                error: 'No todo data with id'
            })
        }
        else{
            res.status(204).send();
        }
    }, function (e) {
        res.status(500).send();
    });
})

// Put/todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var requestId = parseInt(req.params.id, 10);
    var body = _.pick(req.body, 'description', 'completed');
    var attributes = {};
    if(body.hasOwnProperty('completed')){
        attributes.completed = body.completed;
    }
    if(body.hasOwnProperty('description')){
        attributes.description = body.description;
    }
    
    db.todo.findOne({
        where:{
            id: requestId,
            userId: req.user.get('id')
        }
    }).then(function(todo){
        if(todo){
            todo.update(attributes).then(function(todo){
                res.json(todo.toJSON());
            }, function (e) {
                console.log(e);
                res.status(400).json(e);
            });
        }
        else{
            res.status(404).send();
        }
    }, function (e) {
        res.status(500).send();
    })
})

// Post/todos
app.post('/todos', middleware.requireAuthentication, function(req, res){
    // getting request body
    // pick the required parameters using _.pick
    var body = _.pick(req.body, 'description', 'completed');

    // Inserting data in table from the request
    db.todo.create(body).then(function(todo){
        req.user.addTodo(todo).then(function(){
            return todo.reload();
        }).then(function(todo){
             res.json(todo.toJSON());
        })
    }, function (e) {
        res.status(400).json(e);
    })
})

// Post/user
app.post('/users',function(req, res){
    // getting request body
    // pick the required parameters using _.pick
    var body = _.pick(req.body, 'email', 'password');

    // Inserting data in table from the request
    db.user.create(body).then(function(user){
        // toPublicJSON() is in user.js model
        res.json(user.toPublicJSON());
    }, function (e) {
        res.status(400).json(e);
    })
})

// POST users/login
app.post('/users/login', function (req, res) {
    var body = _.pick(req.body, 'email', 'password');
    var userInstance;

    // Using sequelize method for user login
    // authentication method () is in user.js model
    db.user.authentication(body).then(function(user){
        var token = user.generateToken('authentication');
        userInstance = user;

        // Register token
        return db.token.create({
            token: token
        });

    }).then(function(tokenInstance){
        res.header({auth: tokenInstance.get('token')}).json(userInstance.toPublicJSON());
    }).catch(function(){
        res.status(401).send();
    });



    // if(typeof body.email !== 'string' || typeof body.password !== 'string'){
    //     return res.status(400).send;
    // }
    // db.user.findOne({
    //     where:{
    //         email: body.email
    //     }
    // }).then(function(user){
    //     if(!user || !bcrypt.compareSync(body.password, user.get('password_hash'))){
    //         return res.status(401).send();
    //     }
    //     res.json(user.toPublicJSON());

    // }, function (e) {
    //     res.status(500).send();
    // });
})

// Delete User's Token when user logout
app.delete('/users/logout', middleware.requireAuthentication, (req, res) => {
    req.token.destroy().then(function(){
        res.status(204).send();
    }).catch(function(){
        res.status(500).send();
    });
});

// Server starting after database is created
db.sequelize.sync({force: true}).then(function(){
    app.listen(PORT, function () {
        console.log('Server started');
    })
});

