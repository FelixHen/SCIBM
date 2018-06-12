/**
 * Node Server
 * @author Jan-Patrick Kirchner [742143], Felix Hennig [752734], Marija Belova [752684]
 * @version 2.0
 */

var express = require("express"); 
var app = express(); 


app.enable('trust proxy'); 
 
app.use (function (req, res, next) { 
  if (req.secure || process.env.BLUEMIX_REGION === undefined) { 
    next(); 
  } else { 
    console.log('redirecting to https'); 
    res.redirect('https://' + req.headers.host + req.url); 
  } 
});
/*
var path = require('path');

//var https = require('https').Server(app);
//var server = require('https').createServer(app);
//let io = require('socket.io').listen(server);

var http = require('http').Server(app);
var server = require('http').createServer(app);
let io = require('socket.io')(http);


var https = require('https');

var options = {
  key: fs.readFileSync('./file.key'),
  cert: fs.readFileSync('./file.cert')
};
var server = https.createServer(options, app);
*/

//var express = require('express');
//var app = require('express')();

var path = require('path');
var http = require('http').Server(app);
var server = require('http').createServer(app);
let io = require('socket.io')(http);




var crypto = require('crypto');

let port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
var bodyParser = require('body-parser');
var mysql = require('mysql'); 
var router = express.Router();
var formidable = require('formidable');
var fs = require('fs');
const bcrypt = require('bcrypt');
var session = require('express-session');
var passport = require('passport');
var passportLocal = require('passport-local');
var sri = require('node-sri');
var helmet = require('helmet'); // helmet@3.12.1

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set('views', __dirname + '/view');
  
app.use(session({
    secret: 'basjfbiasIF()t89f9BIJ"4ui2424bij2bkasf0hhfh8AWF(GF89',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Create the service wrapper
let ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

let toneAnalyzer = new ToneAnalyzerV3({
    version_date: '2016-05-19',
    username: 'd13d161c-37a8-497c-b72d-ccb5601a83ef',
    password: 'vBRie4TxLo2Y',
    url: 'https://gateway-fra.watsonplatform.net/tone-analyzer/api'
});



// authenticate to the Language Translator API
var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');
var translator = new LanguageTranslatorV2({

  username: '14dff385-eee3-466a-9f61-9e10278b75d1',
  password: 'bpUjUDQ2qvKO',
  url: 'https://gateway-fra.watsonplatform.net/language-translator/api'
});


app.post('/translate', function(req, res, next) {
	console.log('Translate Body: '+JSON.stringify(req.body));
	var sourcelang=req.body.source;
	var targetlang=req.body.target;
	console.log(' TranslateLANG '+JSON.stringify(sourcelang)+" | "+JSON.stringify(targetlang));

	// var msg=req.body.msg;
	
	// var parameters = {
	// 	text: msg
	// }

	/*
	Translate
	 */
	translator.translate({
		text: req.body.msg, source : sourcelang, target: targetlang },
			//
		function (err, translation) {
			console.log("translate");
				if (err)
						console.log('error:', err);
				else{
					var message=req.body;
					message.message=translation['translations'][0].translation;
					console.log(message);
					res.send(message);
				}
						
	});

});


app.post('/model', function(req, res, next) {
	console.log('Model Body: '+JSON.stringify(req.body));
	var sourcelang=req.body.source;
	var targetlang=req.body.target;
	console.log(' MODELLANG '+JSON.stringify(sourcelang)+" | "+JSON.stringify(targetlang));
	
	translator.listModels(
		{source:sourcelang, target:targetlang},
		function(error, response) {
		  if (error)
			console.log(error);
		  else{
			console.log(response['models'].length);
			// console.log(JSON.stringify(response, null, 2));
			res.send(JSON.stringify(response['models']));
		  }
		}
	  );
		
});

require('dotenv').config({silent: true});


var maxImageSize = 200000;
var numUsers = 0;		// number of users
var users = {};			// contains sockets
var userNames = [];		// names of users
var userImages = [];
var user={};
var tmp;


//-------------------------------------------------------------------------------------------------------------------------------------------
/*
var con = mysql.createConnection({
  host: 'den1.mysql1.gear.host',
  user: 'simplechatusers',
  password: 'Qc4vAR-GBU_Y',
  database: 'SimpleChatUsers'
});
*/

//mysql connection
var options = {
    host: 'sl-eu-fra-2-portal.4.dblayer.com',
    port: 16736,
    user: 'admin',
    password: 'KKAKNFEBLHRXCTTZ',
    database: 'compose',
    expiration: 86400000,
    checkExpirationInterval: 900000
};

var connection = mysql.createConnection(options);

/*
let mysqlurl = new url.URL(mysql://admin:KKAKNFEBLHRXCTTZ@sl-eu-fra-2-portal.4.dblayer.com:16736/compose);
let options = {
    host: mysqlurl.hostname,
    port: mysqlurl.port,
    user: mysqlurl.username,
    password: mysqlurl.password
    //database: mysqlurl.pathname.split("/")[1]
};
*/
/*
var con = mysql.createConnection({
  host: "eu-mm-auto-sl-lhr-01-b.cleardb.net",	// london2
  user: "b4402c6bba0e8c",
  password: "364ab0a9"
});
*/


connection.connect(function(err) {

  if (err) throw err;
  console.log("Connected!");
  /*
  var sql = "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), password VARCHAR(255), mail VARCHAR(255), language VARCHAR(255), gender INT(1))"; 
  con.query(sql, function (err, result) { 
    if (err) throw err; 
    console.log("Table created"); 
  });


  */
});

//-------------------------------------------------------------------------------------------------------------------------------------------


//X-XSS-Protection header
/*
1; mode=block
enables the XSS Filter. 
Rather than sanitize the page, when a XSS attack is detected,
the browser will prevent rendering of the page.
*/
// app.use(function(req, res, next) {
//     res.header("X-XSS-Protection", "1; mode=block");
//     next();
// });

// //X-CONTENT-TYPE-OPTIONS
// app.use(function(req, res, next) {
//     res.header("X-Content-Type-Options", "nosniff");
//     next();
// });
// //CONTENT-SECURITY-POLICY
// /*
// The configuration below allows loading 
// scripts,XMLHttpRequest (AJAX), images and styles from same domain 
// and nothing else.
// */
app.use(function(req, res, next) {
	res.header("Content-Security-Policy", 
	"default-src https:; script-src 'self' https://www.google-analytics.com https://ajax.googleapis.com https://cdn.socket.io https://code.jquery.com https://cdn.jsdelivr.net 'unsafe-inline' https://cdn.rawgit.com; connect-src 'self'; img-src 'self' data: https://cdn.jsdelivr.net ; style-src 'self'  'unsafe-inline' https://cdn.jsdelivr.net data: ;");
    next();
});


// app.use(helmet.contentSecurityPolicy({directives: {
// 	defaultSrc: ["'self'"],
// 	scriptSrc: ["'unsafe-inline'",'google-analytics.com' , 'ajax.googleapis.com', 'cdn.socket.io', 'code.jquery.com', 'cdn.jsdelivr.net', 'cdn.rawgit.com'],
// 	styleSrc: ["'self'",  "'unsafe-inline'", 'cdn.jsdelivr.net'],
// 	imgSrc: ['data:', 'cdn.jsdelivr.net'],
// 	connectSrc: ["'self'"]}
//   }));

 // Implement X-XSS-Protection
app.use(helmet.xssFilter());

 // Implement X-Content-Type-Options
 app.use(helmet.noSniff());

// Hide X-Powered-By
app.use(helmet.hidePoweredBy());

// Implement X-Frame: SameOrigin :Allows our page to be served inside a frame with the same origin.
app.use(helmet.xframe('sameorigin'));


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

//login
app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/chat',
    failureRedirect: '/'
}));
  
//registration
app.post('/signup', function(req, res, next) {
	console.log("LOGIN: "+JSON.stringify(req.body));

	var username;  
	var password;
	var language;
	var image;
	
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	    form.parse(req, function(err, fields, files) {

		console.log("in form");
		
		username = fields.username;
		password = fields.password;
		language = fields.languages;
		
		req.body.username = fields.username;
		req.body.password = fields.password;
		req.body.language = fields.languages;
		
		console.log(fields.username);
		console.log(fields.password);
		
		if (files.file !== null && files.file.type.startsWith("image")) {
			
			if(files.file.size < maxImageSize){

				var data = fs.readFileSync(files.file.path);
				var data2 = new Buffer(data).toString('base64');
			
				req.body.image = 'data:' + files.file.type + ';base64,' + data2;

			}
			else {
			
				console.log("image to large");
			}
			
		}
		else {
			console.log("no file or no image file");
		}
		
		passport.authenticate('local-register', { successRedirect: '/chat', failureRedirect: '/' })(req, res, next);
		
    });

  });
  
app.get('/register', function(req, res) {

	res.sendFile(__dirname + '/public/register.html');

});

app.get('/chat', function (req, res) {
    if (typeof req.session.passport != "undefined") {
        if (req.session.passport.user.user !== null && req.session.passport.user.language !== null) {
	
			res.render('chat', {
                username: req.session.passport.user.user,
                language: req.session.passport.user.language
            });

        }
    } else {
        res.redirect('/');
    }
});

passport.serializeUser(function (user, done) {
    console.log("serializing " + user.user);
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    console.log("deserializing " + obj.user);
    done(null, obj);
});

passport.use('local-register', new passportLocal({passReqToCallback: true},

    function (req, username, password, done) {
		
		console.log("local-register");
		
		username = req.body.username;
		language = req.body.language;
		password = req.body.password;
		image = req.body.image;
		
		password = bcrypt.hashSync(password, 10);
		
		if(username!=null){
			console.log(username);
			user.name=username;
			user.password=password;
			user.language=language;
			user.image=image;
		}
		
		var sql = "SELECT * FROM users WHERE username = ?";
		console.log("vor sql");
		connection.query(sql, [username], function (err, result) {
			if (err) {
				throw err;
				done(null, false);

			}
			else{
				console.log("nach if in sql");

				var sql = "INSERT INTO users (username, password, mail, language, gender, image) VALUES ?";
				var values = [[username, password, 'student@hochschule-rt.de', language, 0,image]];
				connection.query(sql, [values], function (err, result) {
				if (err) throw err;
					
					console.log("1 record inserted");
					
					if (result) {
                        done(null, { user: username, language: language });
                        console.log('Registrierung von ' + req.body.username + ' erfolgreich!');
                    } else {
                        done(null, false);
                        console.log('Registrierung von ' + req.body.username + ' fehlgeschlagen!');
                    }
					
				});
			}
	
		});
		
    }));

passport.use('local-login', new passportLocal({ passReqToCallback: true},
    function (req, username, password, done) {
		
		console.log('local-login');
        
		if (req.body.username || req.body.password) {
            if (isWhitespaceOrEmpty(req.body.username) || req.body.username.length > 15) {
                console.log('username has whitespaces or is empty or exceeded the length of 15!');
                done(null, false);
            } if (req.body.password.length > 15) {
                console.log('password has exceeded the length of 15!');
                done(null, false);
            }
			
			var sql = "SELECT * FROM users WHERE username = ?";
			
			connection.query(sql, [username], function (err, result) {
				if (err) {
					throw err;
					done(null, false);
				}
				if(!result[0]){
				
					done(null, false);
				}
				else{
					
					resultUsername = result[0].username;
					resultPassword = result[0].password;
					resultLanguage = result[0].language;
					user.language = result[0].language;
					
					if(resultUsername == username && bcrypt.compareSync(req.body.password, resultPassword)){
						
						
						done(null, { user: resultUsername, language: resultLanguage });
                               
					} 
					else {
						done(null, false);
                    }
				}
				
			});
			
		
        } else {
            console.log('Fehler, Passwort oder Username gehlt');
        }
    }));

	
function isWhitespaceOrEmpty(text) {
	return !/[^\s]/.test(text);
}

/*
connection establishment
*/
io.on('connection', function(socket){
	
	socket.on('sendUser', function (user) {
		
		addUser(user.name, user.language);
		console.log('a user connected');
		console.log("USER: "+user.name);
	
    });
	
	function addUser(username, language){
		
		if(users[username]) {
			console.log('user exist: '+ username);
			socket.emit('login_failed', { });			// username is taken
		}
		else {
			console.log('add user: '+ username);
			socket.username = username;
			
			userNames.push(username);
			
			users[username] = socket.id;

			userImages.push({name:username, image:user.image});

			numUsers++;
			
			socket.emit('login', {						// call client login
				username: username,
				language: language,
				image: user.image
			});
			
			/*
			var userListe = null;
			var sql = "SELECT username, language, profilbild FROM users";
			connection.query(sql, function (err, result) {
				if (err) {
				console.log(err);
					throw err;
					
				}
				if(result[0]){
					console.log(result);
					userListe = result;
					
					io.emit('userList', {						// sends userList to all clients
						userList: userListe
					});
				}
				else {
						
				}
			});
			*/
			
			io.emit('userList', {						// sends userList to all clients
				userList: userNames,
				users:userImages
			});
			
			socket.broadcast.emit('user_joined', {		// sends user joined message to other clients
				username: socket.username
			});
		}
	}
	
	/*
	removes user
	called when a user disconnects
	*/
	socket.on('disconnect', function(){
		console.log('user disconnected: ' + socket.username);
		
		numUsers--;
		delete users[socket.username];

		remove(userNames, socket.username);
		removeImg(userImages, socket.username);
		
		/*
		var userListe = null;
		
		
			var sql = "SELECT username, language, profilbild FROM users";
			connection.query(sql, function (err, result) {
				if (err) {
				console.log(err);
					throw err;
					
				}
				if(result[0]){
					console.log(result);
					userListe = result;
					socket.broadcast.emit('userList', {				// sends userList to all other clients
						userList: userNames
					});
					
				}
				else {
						
				}
			});
		*/
		
		socket.broadcast.emit('userList', {				// sends userList to all other clients
			userList: userNames,
			users:userImages
		});
		
		socket.broadcast.emit('user_disconnected', {	// sends user disconnected message to other clients
			username: socket.username	
		});
	
	});

	/*
	remove element from array
	*/	
	function remove(array, element) {
		const index = array.indexOf(element);

		if (index !== -1) {
			array.splice(index, 1);
		}
	}

	function removeImg(array, name) {
		console.log("DELETE: "+name);
			for(var i=0;i<array.length;i++){
			  if(name==array[i].name){
				console.log("DELETE user from the array : "+name+" | ID: "+ array.findIndex(x => x.name==name));
				array.splice(array.findIndex(arr => arr.name==name),1);    
			  }  
			}console.log("Users online: "+JSON.stringify());
		  
	}

	 	/*
	receives file+message from a user
	sends file+message to one or all clients
	*/	
	socket.on('file', function(file, type, data){
        console.log(socket.username + ' is sharing a file');
		
		var time = timeStamp();
		
		if(data.dest != null) {		
			socket.broadcast.to(users[data.dest]).emit('file', file, type, {	// sends to specific client
				user: socket.username,
				date: time,
				message: data.message,
				dest: data.dest,
				language:data.language,
				isFile:true
			});
		}
		else{
			socket.broadcast.emit('file', file, type, {				// sends to all clients but not self
				user: socket.username,
				date: time,
				message: data.message,
				language: data.language,
				isFile:true
			});
		}

	});

/*
	receives message from a user
	sends message to one or all clients
	*/	
	socket.on('chat_message', function(data){
		console.log('user: ' + socket.username + ' send message');
		console.log('message: ' + data.msg);
		
		var time = timeStamp();
		

		if(data.dest != null) {					
			socket.broadcast.to(users[data.dest]).emit('chat_message', {	// sends to specific client
				user: socket.username,
				date: time,
				message: data.msg,
				dest: data.dest,
				language:data.language
			});
			
			socket.emit('chat_message', {		// send message to self client
				user: socket.username,
				date: time,
				message: data.msg,
				dest: data.dest,
				language:data.language
			});
		}
		else {			
			io.emit('chat_message', {			// sends to all clients
				user: socket.username,
				date: time,
				message: data.msg,
				language:data.language
			});
		}

	});

});


	/*
	Create a TimeStamp for the Chat
	*/	
	function timeStamp() {
		var date = new Date();
		
		var year = date.getFullYear();
		var month = date.getMonth()+1;
		var day = date.getDate();
		var hours = date.getHours();
		var minutes = date.getMinutes()
		
		if(minutes < 10){
			var minutes = "0" + minutes;
		}
		if(hours < 10){
			var hours = "0" + hours;
		}
		if(month < 10){
			var month = "0" + month;
		}
		if(day < 10){
			var day = "0" + day;
		}
		
		var time = day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;
			
		return time;
	}
/*
return toneRequest
*/
function createToneRequest (request) {
	let toneChatRequest;

  if (request.texts) {
	 toneChatRequest = {utterances: []};

	 for (let i in request.texts) {
	  let utterance = {text: request.texts[i]};
	   toneChatRequest.utterances.push(utterance);
	 }
  }

  return toneChatRequest;
}

/*
return state of happyness
*/
function happyOrUnhappy (response) {
  const happyTones = ['satisfied', 'excited', 'polite', 'sympathetic'];
  const unhappyTones = ['sad', 'frustrated', 'impolite'];

  let happyValue = 0;
  let unhappyValue = 0;

  for (let i in response.utterances_tone) {
    let utteranceTones = response.utterances_tone[i].tones;
    for (let j in utteranceTones) {
      if (happyTones.includes(utteranceTones[j].tone_id)) {
        happyValue = happyValue + utteranceTones[j].score;
      }
      if (unhappyTones.includes(utteranceTones[j].tone_id)) {
        unhappyValue = unhappyValue + utteranceTones[j].score;
      }
    }
  }
  if (happyValue >= unhappyValue) {
    return 'happy';
  }
  else {
    return 'unhappy';
  }
}

/*
Tone API IBM
*/
app.post('/tone', (req, res, next) => {
	
  let toneRequest = createToneRequest(req.body);
  console.log("request  "+ toneRequest);

  if (toneRequest) {console.log("toneRequest: "+ toneRequest);
    toneAnalyzer.tone_chat(toneRequest, (err, response) => {
      if (err) {
        return next(err);
      }
      let answer = {mood: happyOrUnhappy(response)};

      return res.json(answer);
    });
  }
  else {
    return res.status(400).send({error: 'Invalid Input'});
  }
});


/*
listen on Port XXXX
*/	
http.listen(port, function(){
	console.log('listening on *:' + port);
});
