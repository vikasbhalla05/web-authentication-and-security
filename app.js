//jshint esversion:6
let express = require('express');
let bodyParser = require('body-parser');
let ejs = require('ejs');
let mongoose = require('mongoose');
let encrypt = require('mongoose-encryption');

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

const secret = "Thisisoursecretkey.";// creating a secret key
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] } ); 
//activating encrypt plugin to schema

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

	let newUser = new userModal({
		email: req.body.username,
		password: req.body.password
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

app.post('/login', function(req, res){
	userModal.findOne({email: req.body.username}, function(err, userFound){
		if(err){
			console.log(err);

		} else if(userFound)
		{
			if(userFound.password === req.body.password ){
				res.render("secrets");
			}else{
				console.log("incorrect password");
			}
		}
		else{
			console.log("incorrect email");
		}
	})
})


app.listen("3000", function(){
	console.log("server starte at port 3000");
})