//jshint esversion:6
require("dotenv").config();// env variable file require
let express = require('express');
let bodyParser = require('body-parser');
let ejs = require('ejs');
let mongoose = require('mongoose');
let session = require('express-session');
let passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose'); // this plugin helps us to interact with database 
// without directly dealing saving and finding values


// using all the middlewares in express app
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
  maxAge: 24*60*60*1000
}));
app.use(passport.initialize());
app.use(passport.session());

// mongoose configuration
mongoose.connect('mongodb://localhost:27017/userDB');
// creating pure mongoose Schema
let userSchema = new mongoose.Schema ({
	username: String,
	password: String
});
userSchema.plugin(passportLocalMongoose);
let User = new mongoose.model("User", userSchema);


// passport configuration
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
	// check authentication for this route
	if(req.isAuthenticated()){
		res.render('secrets');
	}
	else{
		res.redirect('/login');
	}
});
app.post('/register', function(req, res){

	// registering user using mongoose passport plugin
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
		username: req.body.username,
		password: req.body.password
	});

	// this function only takes schema with username field
	req.login(checkUser, function(err){
		if(err){
			
  			console.log('hello');
			console.log(err);
		}else{
			passport.authenticate('local')(req, res, function(){
  				res.redirect('/secrets');
  			});
		}
	});
});

app.get('/logout', function(req, res){
	// logout route
	req.logout();
	res.redirect('/');
});


app.listen("3000", function(){
	console.log("server starte at port 3000");
})