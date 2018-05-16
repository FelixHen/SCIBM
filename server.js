/**
 * Node Server
 * @author Jan-Patrick Kirchner [742143], Felix Hennig [752734], Marija Belova [752684]
 * @version 2.0
 */
/*
var express = require('express');
//var express = require("express");
//var app = express();
var app = require('express')();
//var fs = require('fs');

app.enable('trust proxy');

app.use (function (req, res, next) {
  if (req.secure || process.env.BLUEMIX_REGION === undefined) {
    next();
  } else {
    console.log('redirecting to https');
    res.redirect('https://' + req.headers.host + req.url);
  }
});

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

var express = require('express');
var app = require('express')();

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

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


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


	
var numUsers = 0;		// number of users
var users = {};			// contains sockets
var userNames = [];		// names of users
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

//login
app.post('/login', function(req, res) {
	console.log("LOGIN: "+JSON.stringify(req.body));
	
	var username = req.body.username;  
	var password;
	var image;
	
	var data = req.body.password;
	password = crypto.createHash('md5').update(data).digest("hex");
	
	if(username!=null){
		console.log(req.body.username);
		user.name=username;
		user.password=password;
	}
	/*
	con.connect(function(err) {
		if (err) throw err;
	*/
			var sql = "SELECT * FROM users WHERE username = ?";
			
			connection.query(sql, [username], function (err, result) {
				if (err) {
					throw err;
					res.sendFile(__dirname + '/public/index.html');
				}
				if(result[0]){
					resultUsername = result[0].username;
					resultPassword = result[0].password;
					user.language = result[0].language;
					user.image = result[0].image;
					user.tmp=result;
					console.log("Result DB Name: "+result[0].username);
					console.log("Result DB PW: "+result[0].password);
					
					var keyImage = new Buffer(result[0].image, 'base64').toString('binary');
					// console.log("TEST_key: "+keyImage);
					user.image = keyImage;

					if(resultUsername == username && resultPassword == password){
		
						console.log("Login erfolgreich");
						res.sendFile(__dirname + '/public/chat.html');
					}
					else {
						
						res.sendFile(__dirname + '/public/index.html');
					}
				}
				else {
					
					res.sendFile(__dirname + '/public/index.html');
				}
			});
	/*
	});
	*/
	
	
	// res.send(req.body);
	
  });

//registration
app.post('/signup', function(req, res) {
	console.log("LOGIN: "+JSON.stringify(req.body));

	var username;  
	var password;
	var language;
	var image;

	var form = new formidable.IncomingForm();

	    form.parse(req, function(err, fields, files) {

		console.log("in form");
		
		username = fields.username;
		password = fields.password;
		language = fields.languages;
		
		console.log(fields.username);
		console.log(fields.password);

        if (files.file !== null && files.file.size > 0 && files.file.type.startsWith("image")) {
			
            var data = fs.readFileSync(files.file.path);
            var content = new Buffer(data).toString('base64');

            image = 'data:' + files.file.type + ';base64,' + content;
			console.log(image);
        }
		
		password = crypto.createHash('md5').update(password).digest("hex");
		
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
				res.sendFile(__dirname + '/public/index.html');
			}
				
			if(!result[0]){
				console.log("nach if in sql");

				var sql = "INSERT INTO users (username, password, mail, language, gender, image) VALUES ?";
				var values = [[username, password, 'student@hochschule-rt.de', language, 0,image]];
				connection.query(sql, [values], function (err, result) {
				if (err) throw err;
					console.log("1 record inserted");
					res.sendFile(__dirname + '/public/chat.html');
				});
				
			
			}
			else{
				res.sendFile(__dirname + '/public/register.html');
			}
	
		});
		
    });

	console.log("nach form");

  });
  
app.get('/register', function(req, res) {

	res.sendFile(__dirname + '/public/register.html');

  });


/*

*/
io.on('connection', function(socket){
	if(!user.name || user.name == null) {
		sendFile(__dirname + '/public/index.html');
	}
	
	console.log('a user connected');
	console.log("USER: "+user.name+" PASSWORD: "+user.password);
	addUser(user.name,user.language);

	function addUser(username,language){
		var username = username.replace(/[ `~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
		
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
	creates a timeStamp
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
