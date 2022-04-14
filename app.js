//jshint esversion:6
let dotenv = require("dotenv").config({path:'.env'});// env variable file require
let express = require('express');
let bodyParser = require('body-parser');
let ejs = require('ejs');
let mongoose = require('mongoose');
let session = require('express-session');
let passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose'); // this plugin helps us to interact with database 
// without directly dealing saving and finding values
let GoogleStrategy = require('passport-google-oauth20').Strategy;
let findOrCreate = require('mongoose-findorcreate');


// using all the middlewares in express app
let app = express();
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  maxAge: 24*60*60*1000
}));
app.use(passport.initialize());
app.use(passport.session());


// mongoose configuration
// mongoose.connect('mongodb://vikasbhalla:Vikas@123.com@cluster0.j9vrw.mongodb.net/userDB', { useNewUrlParser: true, useUnifiedTopology: true},
//   () => {
//     console.log('Connected to MongoDB');
//   });
// setTimeout( async function() {
//   await mongoose.connect('mongodb://vikasbhalla:Vikas@123.com@cluster0.j9vrw.mongodb.net/userDB');
// }, 10000);

let options = { useNewUrlParser: true, useUnifiedTopology: true};

const uri = process.env.MONGODB_URI
mongoose
  .connect(uri)
  .then(x => {
    console.log(
      `Connected to Mongo! Database name: ""`
    );
  })
  .catch(err => {
    console.error("Error connecting to mongo", err);
  });
// creating pure mongoose Schema
let userSchema = new mongoose.Schema ({
	username: String,
	password: String,
	googleId: String,
	secret: String
});
// mongoose.set('bufferCommands', false);
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
let User = new mongoose.model("User", userSchema);


// passport configuration
passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});
passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
}); 

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://secret-web-authentication.herokuapp.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
  	console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', function(req,res){
	res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
 });

app.get('/login', function(req,res){
	res.render('login');
});
app.get('/register', function(req,res){
	res.render('register');
});
app.get('/secrets',  function(req, res){
	// check authentication for this route
	User.find({"secret":{$ne:null}}, function(err, foundUsers){
		if(err){
			console.log(err);
		}
		else{
			if(foundUsers){
				res.render("secrets", {"usersWithSecrets": foundUsers});
			}
		}
	});
});
app.get('/submit', function(req, res){
	// check authentication for this route
	if(req.isAuthenticated()){
		res.render('submit');
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
app.post('/submit', function(req, res){

	User.findById(req.user.id, function(err, foundUser){
		if(err){
			console.log(err);
		} else{
			if(foundUser){
				foundUser.secret = req.body.secret;
				foundUser.save(function(){
					res.redirect('/secrets');
				});
			}
		}
	});
});

app.get('/logout', function(req, res){
	// logout route
	req.logout();
	res.redirect('/');
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(){
	console.log("server starte at port 3000");
})