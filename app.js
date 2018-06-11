var express = require('express');
var firebase = require('firebase');
var bodyParser = require('body-parser');

//firebase auth ------------------------------

//insert your info here
firebase.initializeApp({
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: ""
});

const auth = firebase.auth();

//creates a new user
const doCreateUserWithEmailAndPassword = (email, password) =>
  auth.createUserWithEmailAndPassword(email, password);

//signs in
const doSignInWithEmailAndPassword = (email, password) =>
  auth.signInWithEmailAndPassword(email, password);

//signs out
const doSignOut = () =>
  auth.signOut();

//if the user logs in or out this function is called and sets the currentUser variable
firebase.auth().onAuthStateChanged(function(user) {
    currentUser = user;
});

//current logged in user is saved in this var
var currentUser = null;

//firebase db ---------------------------------
const db = firebase.database();

//adds a measurement
const doAddWeightMeasurement = (id, timestamp, weight, latitude, longitude) =>
  db.ref(`weight/${id}`).push({
    timestamp,
    weight,
    latitude,
    longitude
  });

//gets all the weight data for a specific user
const onceGetWeight = (id) =>
  db.ref('weight/'+ id).once('value');

//middleware ------------------------------
//used for express
var app = express();
//used to serve the css and js files for the client
app.use(express.static('public'));
//I use pug(aka Jade) for generating html
app.set('view engine','pug');
//used to parse the body for the client
app.use(bodyParser.urlencoded({extended: true}));

//I use this in layout.pug to check if the user is logged in, if he/she is it will display the different links in the navbar
app.use(function(req, res, next) {
    res.locals.loggedIn = currentUser;
    next();
});

//routes ---------------------------------
//if you are logged in, render index else render login page
app.get('/',function (req,res) {
    if(currentUser){
        res.render('index');
    }
    else{
        res.render('login');
    }
});

//just to get rid of the favicon error
app.get('/favicon.ico', (req, res) => res.status(204));

//render signup
app.get('/signup',function(req,res){
    res.render('signup');
})

//post for signup, uses firebase db function to create a new user with email and password
//if there is an error I simply send the user to a blank page with the error message
app.post('/signup',function(req,res){
    let email = req.body.email;
    let password = req.body.password;
    doCreateUserWithEmailAndPassword(email, password)
        .then(result => {
            res.redirect('/');
        })
        .catch(error => {
            res.send(error.message);
        });
})

//renders the login page
app.get('/login',function(req,res){
    res.render('login');
})

//post for login, tries to sign in using firebase, if succesful redirect to / else redirect to login again
//if there is an error I simply send the user to a blank page with the error message
app.post('/login',function(req,res){
    let email = req.body.email;
    let password = req.body.password;

    doSignInWithEmailAndPassword(email, password)
      .then(() => {
        res.redirect('/');
      })
      .catch(error => {
          res.send(error.message);
      });
})

//logout function, redirects to /
app.get('/logout',function(req,res){
    doSignOut();
    res.redirect('/');
})

//if the user is logged in, render addMeasure else redirect to /
app.get('/addMeasure',function(req,res){
    if(currentUser){
        res.render('addMeasure');
    }
    else{
        res.redirect('/');
    }    
})

//adds a weight measurement, if any of the values are NaN or 0 it throws an error, else it adds the measurement
app.post('/addMeasure',function(req,res){
    let timestamp = Number(req.body.timestamp);
    let weight = Number(req.body.weight);
    let latitude = Number(req.body.latitude);
    let longitude = Number(req.body.longitude);

    //validate that all inputs are valid (numbers and greater than 0)
    if(timestamp == NaN || weight == NaN || latitude == NaN || longitude == NaN){
        throw "All inputs needs to be numbers, remember to use dot instead of comma for decimals"
    }
    else if(timestamp == 0 || weight == 0 || latitude == 0 || longitude == 0){
        throw "All numbers need to be greater than 0"
    }

    //add weight and geolocation to db for the logged in user
    doAddWeightMeasurement(currentUser.uid, timestamp, weight,latitude,longitude)
        .catch(error => {
            res.send(error.message);
        });
        res.redirect('/');
})

/*app.get('/getWeight/:timestampPast/:timestampFuture', function(req, res) {
    let timestampPast = req.params.timestampPast;
    let timestampFuture = req.params.timestampFuture; 

    console.log(timestampPast)
    console.log(timestampFuture)

    onceGetWeight(currentUser.uid)
    .then(function(result){
        res.json(result);
    });
})*/

//gets all the weight data for the user
//I wanted to send an range query for the timestamp but couldn't figure out how it worked with firebase.
app.get('/getWeight/', function(req, res) {
    onceGetWeight(currentUser.uid)
    .then(function(result){
        res.json(result);
    });
})


var server = app.listen(1337);