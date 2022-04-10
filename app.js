//jshint esversion:6
require("dotenv").config();// env variable file require
let express = require('express');
let bodyParser = require('body-parser');
let ejs = require('ejs');
let mongoose = require('mongoose');
let session = require('express-session');
let passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

let app = express();
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(session({
  secret: 'This is a test secret.',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB');
// creating pure mongoose Schema
let userSchema = new mongoose.Schema ({
	email: String,
	password: String
});

userSchema.plugin(passportLocalMongoose);

let User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); 

app.get('/', function(req,res){
	res.render('home');
});
app.get('/login', function(req,res){
	res.render('login');
});
app.get('/register', function(req,res){
	res.render('register');
});
app.get('/secrets', function(req, res){
	if(req.isAuthenticated()){
		res.render('secrets');
	}
	else{
		res.redirect('/login');
	}
});
app.post('/register', function(req, res){

	User.register({username: req.body.username}, req.body.password, function(err, user) {
  		if (err) { 
  			console.log(err);
  			res.redirect('/register')
  		}else{
  			passport.authenticate('local')(req, res, function(){
  				res.redirect('/secrets');
  			});
  			
  		}
  	});
});

app.post('/login', function(req, res){
	let checkUser = new User({
		email: req.body.username,
		password: req.body.password
	});


	req.login(checkUser, function(err){
		if(err){
			console.log('hello');
			console.log(err);
			res.redirect('/login');
		}
		if(err){
			passport.authenticate('local')(req, res, function(){
  				res.redirect('/secrets');
  			});
		}
	});
});


app.listen("3000", function(){
	console.log("server starte at port 3000");
})