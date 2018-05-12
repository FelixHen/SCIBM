/**
 * Node Server
 * @author Jan-Patrick Kirchner [742143], Felix Hennig [752734], Konstantinos Karagkiozis [752753], Marija Belova []
 * @version 1.0
 */
 
 
var express = require('express');
var app = require('express')();
var path = require('path');
var http = require('http').Server(app);
var server = require('http').createServer(app);
let io = require('socket.io')(http);
let port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
var bodyParser = require('body-parser');

var mysql = require('mysql'); 

var router = express.Router();
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
  // headers: {
  //   'X-Watson-Technology-Preview': '2017-07-01',
  //   'X-Watson-Learning-Opt-Out': true
  // }
});


app.post('/translate', function(req, res, next) {
	// console.log('!!!!translate!!!!! '+JSON.stringify(req.body));
	var msg=req.body.msg;
	
	var parameters = {
		text: msg
	}
	// var model=getModel(user.language);
	// console.log(model);
	// var target;
	// if(model==0){
	// 	target="en";
	// }
	// var from=identifyLanguage(parameters);
	// console.log('Language:',  user.language+" | from: "+identifyLanguage(parameters));

	/*
	Translate
	 */
	translator.translate({
		text: req.body.msg, source : "en", target:  "es" },
		//converting from english to spanish
	function (err, translation) {
			if (err)
					console.log('error:', err);
			else{
				var message={
					msg:translation['translations'][0].translation,
					dest:req.body.dest
					// ,from:req.body.from
				}
				// sendMessage(message);
				res.send(req.body.msg+" -> "+translation['translations'][0].translation);
			}
					
	});


	
// 	translator.getIdentifiableLanguages(
//   parameters,
//   function(err, response) {
//     if (err)
//       console.log(err)
//     else
//       console.log(JSON.stringify(response, null, 2));
//   }
// );

});

/*
 available translation models (source:  source language.)
*/
// function getModel(source){

// 	translator.listModels(
// 		{source:source},
// 		function(error, response) {
// 			if (error)
// 				console.log(error);
// 			else{
// 				// console.log(JSON.stringify(response, null, 2));
// 				console.log(response['models'].length);
// 				return JSON.stringify(response, null, 2);
// 			}
				
// 		}
// 	);
// }

/*
Identifies the language of the input text (parameters)
*/
// function identifyLanguage(parameters){
// 	translator.identify(
// 		parameters,
// 		function(error, language) {
// 			if (error)
// 				console.log(error);
// 			else{
// 				console.log("SPRACHE: "+language['languages'][0].language);
// 				return language['languages'][0].language;
// 			}
// 		}
// 	);
// }



require('dotenv').config({silent: true});


	
var numUsers = 0;		// number of users
var users = {};			// contains sockets
var userNames = [];		// names of users
var user={};


//-------------------------------------------------------------------------------------------------------------------------------------------

var con = mysql.createConnection({
  host: 'den1.mysql1.gear.host',
  user: 'simplechatusers',
  password: 'Qc4vAR-GBU_Y',
  database: 'SimpleChatUsers'
});

/*
var con = mysql.createConnection({
  host: "eu-mm-auto-sl-lhr-01-b.cleardb.net",	// london2
  user: "b4402c6bba0e8c",
  password: "364ab0a9"
});
*/


con.connect(function(err) {

  if (err) throw err;
  console.log("Connected!");
  
});
 

//-------------------------------------------------------------------------------------------------------------------------------------------



//login
app.post('/login', function(req, res) {
	console.log("LOGIN: "+JSON.stringify(req.body));
	
	// console.log(req.body.password);
	//the name from login field
	var username = req.body.username;  
	var password = req.body.password;  
	// var language = req.body.languages;
	// land=req.body.languages;
	// console.log("LAND: "+land);
	// var clients=getArrayWithNames();
	if(username!=null){
		console.log(req.body.username);
		user.name=username;
		user.password=password;
		// user.language=language;
	}
	/*
	con.connect(function(err) {
		if (err) throw err;
	*/
			var sql = "SELECT * FROM users WHERE username = ?";
			
			con.query(sql, [username], function (err, result) {
				if (err) {
					throw err;
					res.sendFile(__dirname + '/public/index.html');
				}
				if(result[0]){
					resultUsername = result[0].username;
					resultPassword = result[0].password;
					console.log("Result DB Name: "+result[0].username);
					console.log("Result DB PW: "+result[0].password);
					
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
	// console.log("LOGIN: "+JSON.stringify(req.body));

	/* check data*/ 

		// console.log(req.body.password);
	//the name from login field
	var username = req.body.username;  
	var password = req.body.password;  
	var language = req.body.languages;
	// land=req.body.languages;
	// console.log("LAND: "+land);
	// var clients=getArrayWithNames();
	if(username!=null){
		console.log(req.body.username);
		user.name=username;
		user.password=password;
		user.language=language;
	}
	
	var sql = "SELECT * FROM users WHERE username = ?";
	
	con.query(sql, [username], function (err, result) {
		if (err) {
			throw err;
			res.sendFile(__dirname + '/public/index.html');
		}
			
		if(!result[0]){

			var sql = "INSERT INTO users (username, password, mail, language, gender) VALUES ('"+username+"', '"+password+"', 'student@hochschule-rt.de', 'de', 0)";
			con.query(sql, function (err, result) {
			if (err) throw err;
				console.log("1 record inserted");
				res.sendFile(__dirname + '/public/chat.html');
			});
			
		
		}
		else{
			res.sendFile(__dirname + '/public/register.html');
		}
		
			
	});
	
	
	
	
	// res.send(req.body);
  });
  
app.get('/register', function(req, res) {

	res.sendFile(__dirname + '/public/register.html');

  });


/*

*/
io.on('connection', function(socket){
	
	console.log('a user connected');
	console.log("USER: "+user.name+" PASSWORD: "+user.password);
	addUser(user.name);
	/*
	Login process
	*/
	// socket.on('add_User', function(username) {
		
	// 	var username = username.replace(/[ `~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
		
	// 	if(users[username]) {
	// 		console.log('user exist: '+ username);
	// 		socket.emit('login_failed', { });			// username is taken
	// 	}
	// 	else {
	// 		console.log('add user: '+ username);
	// 		socket.username = username;
			
	// 		userNames.push(username);
			
	// 		users[username] = socket.id;

	// 		numUsers++;
			
	// 		socket.emit('login', {						// call client login
	// 			username: username
	// 		});
			
	// 		io.emit('userList', {						// sends userList to all clients
	// 			userList: userNames
	// 		});
			
	// 		socket.broadcast.emit('user_joined', {		// sends user joined message to other clients
	// 			username: socket.username
	// 		});
	// 	}
	// });

	function addUser(username){
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

			numUsers++;
			
			socket.emit('login', {						// call client login
				username: username
			});
			
			io.emit('userList', {						// sends userList to all clients
				userList: userNames
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
		
		socket.broadcast.emit('userList', {				// sends userList to all other clients
			userList: userNames
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
				dest: data.dest
			});
			
			socket.emit('chat_message', {		// send message to self client
				user: socket.username,
				date: time,
				message: data.msg,
				dest: data.dest
			});
		}
		else {			
			io.emit('chat_message', {			// sends to all clients
				user: socket.username,
				date: time,
				message: data.msg
			});
		}

	});
  
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
				dest: data.dest
			});
		}
		else{
			socket.broadcast.emit('file', file, type, {				// sends to all clients but not self
				user: socket.username,
				date: time,
				message: data.message
			});
		}

	});

});



function createToneRequest (request) {
	let toneChatRequest;
	// if (request.texts) {
		// toneChatRequest = {utterances: []};
		// toneChatRequest.utterances.push(request.texts);
	// }
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
