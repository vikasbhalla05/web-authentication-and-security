//jshint esversion:6
require("dotenv").config();// env variable file require
let express = require('express');
let bodyParser = require('body-parser');
let ejs = require('ejs');
let mongoose = require('mongoose');
let bcrypt = require('bcrypt');
const saltRounds = 10;

let app = express();
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
	extended: true
}));

mongoose.connect('mongodb://localhost:27017/userDB');
// creating pure mongoose Schema
let userSchema = new mongoose.Schema ({
	email: String,
	password: String
});



let userModal = new mongoose.model("User", userSchema); 

app.get('/', function(req,res){
	res.render('home');
});
app.get('/login', function(req,res){
	res.render('login');
});
app.get('/register', function(req,res){
	res.render('register');
});
app.post('/register', function(req, res){

	bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    	let newUser = new userModal({
			email: req.body.username,
			password: hash
		});

		newUser.save(function(err){
		if(err){
			console.log(err)
		}
		else{
			res.render("secrets");
			console.log(newUser);
		}
		});
	});

	
});

app.post('/login', function(req, res){
	userModal.findOne({email: req.body.username}, function(err, userFound){
		if(err){
			console.log(err);

		} else if(userFound)
		{

			bcrypt.compare(req.body.password, userFound.password , function(err, result) {
    			// result == true
    			if(result){
                	res.render("secrets");
				}else{
					console.log("incorrect password");
				}
			});

		}
		else{
			console.log("incorrect email");
		}
	})
})


app.listen("3000", function(){
	console.log("server starte at port 3000");
})