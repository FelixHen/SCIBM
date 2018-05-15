/**
 * Main
 * @author Jan-Patrick Kirchner [742143], Felix Hennig [752734], Marija Belova [752684]
 * @version 1.0
 */

var mood;
 
$(document).ready(function () {
		var socket = io();
		//var io = require('socket.io-client') /* tried: socket.io-client@1.4.8 - failed, socket.io-client@1.4.7 - failed, socket.io-client@1.4.6 - failed, socket.io-client@1.4.5 - Success*/
		//var socket = io.connect('https://cloudibmreutlingenm.eu-de.mybluemix.net', {secure: true, reconnect: true});
		
		var $loginPage = $('.login.page');	// landing page
		var $chatPage = $('.chat.page');	// chat
		
		var maxFileSize = 3.5; 				// max File Size in MB
		var myUsername;
		var myLanguage;
		var $messages = $('.messages');
		
		var fileReader = new FileReader();	
		var file;
		var fileInfo;
		
		
		
		
		//fuer Emojis
		
		$("#m").emojioneArea({
			events: {
				keypress: function (editor, event) {
					console.log('event:keypress', event.which); //work
					if(event.which == 13){
						console.log('event:keypress2', event.which); //work
						$('#messageForm').submit(); // work
						//$('#txtMessage').val(''); //not work
						$('#m').data("emojioneArea").setText(""); // this work
					}
				}
			}
		});
				
		/*
		builds message in HTML
		*/
		function addMessage(data) {
			// console.log("language: "+data.lang);
			
			// getTone(data.message);
			
			//alert(mood);
			
			if(data.dest) {

				var $username1 = $('<span class="user1"/>')
				.text(data.user)
				.css('color', getUsernameColor(data.user));
				
				var $whisper = $('<span class="whisper"/>')
				.text(' ⇒ ')
				.css('color', '#000000');
				
				var $username2 = $('<span class="user2"/>')
				.text(data.dest)
				.css('color', getUsernameColor(data.dest));
				
				var $usernameDiv = $('<span class="username"/>')
				.append($username1, $whisper, $username2);
				
			}
			else {
				var $usernameDiv = $('<span class="username"/>')
				.text(data.user)
				.css('color', getUsernameColor(data.user));
			}
			
			var $messageBodyDiv = $('<span class="messageBody">')
				.text(data.message);
				
			var $moodDiv = $('<img src="img/'+ mood +'.png" alt="'+mood+'" class="moodEmote" title="'+mood+'" />');
				
			var $timeStampDiv = $('<span class="timeStamp">')
				.text(data.date);

			var $messageDiv = $('<li class="message"/>')
				.data('username', data.user)
				.append($usernameDiv, $messageBodyDiv, $timeStampDiv, $moodDiv);

			//alert(data.message);
			addMessageElement($messageDiv);
		}
		
		/*
		creates log
		*/
		function log (message) {
			var $log = $('<li>').addClass('log').text(message);
			addMessageElement($log);
		}
		
		/*
		add message to chat
		*/
		function addMessageElement (messageElement) {
			var $messageElement = $(messageElement);
			
			$('#messages').append($messageElement);
			
			$messages[0].scrollTop = $messages[0].scrollHeight;
		
		}
		
		/*
		Gets the color of a username through our hash function
		*/
		function getUsernameColor (username) {
			// Compute hash code
			var hash = 7;
			for (var i = 0; i < username.length; i++) {
				hash = username.charCodeAt(i) + (hash << 5) - hash;
			}
			// Calculate color
			var index = Math.abs(hash % COLORS.length);
			return COLORS[index];
		}

		/*
		updates userlist
		*/
		function updateUserList(userList) {
			
			$('#users').empty();
			$('#userCounter').empty();
			$('#user').empty();
			
			$('#userCounter').append(userList.length);
			
			var $userDropDown = $('<option value="">Whisper to ...</option>');
			$('#user').append($userDropDown);
			
			userList.forEach(function(user){
				//username, language, profilbild
				var $usernameDiv = $('<span class="username"/>')
					.text(user.username);
					//.css('color', getUsernameColor(user.username));
				
				if(user.username == myUsername){
					
					var $myUsernameDiv = $('<img src="img/star.png" alt="star" style="width: 20px;" />');
					
					var $userDiv = $('<li class="user"/>')
					.data('username', user.username)
					.append($usernameDiv, $myUsernameDiv);
				}
				else {
					var $userDiv = $('<li class="user"/>')
					.data('username', user.username)
					.append($usernameDiv);
					
					var $userDropDown = $('<option value="' + user.username + '">' + user.username + '</option>');
				}

				$('#user').append($userDropDown);
				
				$('#users').append($userDiv);

			});

		}
	
		/*
		Login function
		*/
		$('#loginButton').on('click', function (event) {

			if($('#login').val()) {		
				socket.emit('add_User', $('#login').val());
			}
		});
	  
		
        $('form').submit(function(){
			console.log("myLanguage: "+myLanguage);
			
			if($('#user').val() != ''){
				var dest = $('#user').val();
			}
			else{
				var dest = null;	
			}
			
			if (file){
				fileUpload();
			}
			else {
				
				if($('#m').val()){
					socket.emit('chat_message', {
						msg: $('#m').val(),
						dest: dest,
						from: myUsername,
						language: myLanguage
					});
				}
				
				$('#user').val('');
				$('#m').val('');
				$("div.emojionearea-editor").data("emojioneArea").setText('');

			}
			return false;
			
		});
		
		function formSubmit(message) {
			
			
		}
		
		
		/*
		shows chat page if login is successful (called from server)
		*/
		socket.on('login', function (data) {

			myUsername = data.username;
			myLanguage = data.language;
			console.log("myLanguage: "+data.language);

			log("Welcome to Chat: " + data.username);
		});
		
		/*
		receives userlist and calls function updateUserList (called from server)
		*/
		socket.on('userList', function (data) {
					
			updateUserList(data.userList);
		});
		
		/*
		failed login (called from server)
		*/
		socket.on('login_failed', function () {
			alert("login_failed: Name already taken");
		});
		
		/*
		receives message and calls function addMessage (called from server) or translate the message
		*/
        socket.on('chat_message', function(data){
			getTone(data.message);
			console.log("source: "+data.language+"| my: "+myLanguage);
			console.log(data.language!=myLanguage);
			if(data.language!=myLanguage){
				var message={
					msg: data.message,
					date: data.date,
					source:data.language,
					target:myLanguage,
					user:data.user
				}
			if(data.dest) message.dest = data.dest;
			console.log(message);
				translate(message);
			}else{
				addMessage(data);
			}
        });
		
		/*
		receives log message and calls function log (called from server)
		*/
		socket.on('user_joined', function(data){
			log("User joined: " + data.username);
        });
		
		/*
		receives log message and calls function log (called from server)
		*/
		socket.on('user_disconnected', function(data){
			log("User disconnect: " + data.username);
        });
		
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
		
		//File transfer
		//------------------------------------------

		$('#fileselect').change(function(e){

			file = e.target.files[0];

		});

		function fileUpload() {
		
			if (file){
				
				if (file.size > maxFileSize * 1000 * 1000)
				{
					alert('You can only send files with max. ' + maxFileSize + ' MB Size');
				}
				else if (file.type.substring(0,5) === 'image'){
					fileInfo = {
						name: file.name,
						fileType: 'image'
					};
					
					fileReader.readAsDataURL(file);
				}
				else if (file.type.substring(0,5) === 'video'){
					fileInfo = {
						name: file.name,
						fileType: 'video'
					};
					fileReader.readAsDataURL(file);
				}
				else if (file.type.substring(0,5) === 'audio'){
					fileInfo = {
						name: file.name,
						fileType: 'audio'
					}
					fileReader.readAsDataURL(file);
				}
				else {
					fileInfo = {
						name: file.name,
						fileType: 'other'
					}
					fileReader.readAsDataURL(file);
				}
				
				$('#fileselect').val('');
				file = '';
			}
			else
			{
				alert("Error: No file selected!");
			}
			
			return false;
		}
		
		function appendFile(file, fileInfo, data){
			
			if(data.dest) {

				var $username1 = $('<span class="user1"/>')
				.text(data.user)
				.css('color', getUsernameColor(data.user));
				
				var $whisper = $('<span class="whisper"/>')
				.text(' ⇒ ')
				.css('color', '#000000');
				
				var $username2 = $('<span class="user2"/>')
				.text(data.dest)
				.css('color', getUsernameColor(data.dest));
				
				var $usernameDiv = $('<span class="username"/>')
				.append($username1, $whisper, $username2);
				
			}
			else {
				var $usernameDiv = $('<span class="username"/>')
				.text(data.user)
				.css('color', getUsernameColor(data.user));
			}
		
			var $messageBodyDiv = $('<span class="messageBody">')
			.text(data.message);
			
			var $moodDiv = $('<img src="img/'+ mood +'.png" alt="'+mood+'" class="moodEmote" title="'+mood+'" />');
			
			var $timeStampDiv = $('<span class="timeStamp">')
			.text(data.date);

			if (fileInfo.fileType === 'image'){
				var $messageData = $('<li><a target="_blank" href="' + file + '" height="150px" ><img src="' + file + '" alt="Image" class="imageFile" /></a></li>');
			}
			else if (fileInfo.fileType === 'audio') {
				var $messageData = $('<li><audio controls><source src="' + file + '"></li>');
			}
			else if (fileInfo.fileType === 'video') {
				var $messageData = $('<li><video width="320" height="240" controls><source src="' + file + '"></li>');
			}
			else if (fileInfo.fileType === 'other') {
				var $messageData = $('<li>' + fileInfo.name + '<a download="' + fileInfo.name + '" href="' + file + '" download><button class="btn_round">Download</button></a></li>');
			}
			
			var $messageDiv = $('<li class="message"/>')
			.data('username', data.user)
			.append($usernameDiv, $messageData, $messageBodyDiv, $timeStampDiv, $moodDiv);
			
			addMessageElement($messageDiv);
		}
		
		fileReader.onload = function(file){
			
			if($('#user').val() != ''){
				var dest = $('#user').val();
			}
			else{
				var dest = null;	
			}
			
			time = timeStamp();
			
			var data = {
				user: myUsername,
				message: $('#m').val(),
				dest: dest,
				date: time
				
			};
			
			$('#user').val('');
			$('#m').val('');
			
			getTone(data.message);
			
			appendFile(file.target.result, fileInfo, data);
	
			socket.emit('file', file.target.result, fileInfo, data);
		};
		
		/*
		receives file + message and calls appendFile (called from server)
		*/
		socket.on('file', function(file, fileInfo, data){
			
			getTone(data.message);
			
			appendFile(file, fileInfo, data);
		});


		function getTone(message) {
	
			var text={"texts":["",message]};
	
			$.post({
				type: 'POST',
				dataType: 'json',
				data: JSON.stringify(text),
				contentType: 'application/json',
				url: 'https://cloudibmreutlingenm.eu-de.mybluemix.net/tone',
				async: false,
				success: function(data) {
					console.log('success: ',data);
					document.getElementById("mood").value = data.mood;
					
					if(data.mood == 'happy') {
						mood = data.mood;
					}
					else {
						mood = data.mood;
					}
					
				}
			});	
	
		}
	
		function translate(msg) {
		
				// var text={msg:message};
		
				$.post({
					type: 'POST',
					dataType: 'json',
					data: JSON.stringify(msg),
					contentType: 'application/json',
					// url: 'http://localhost:3000/translate',
					url: 'https://cloudibmreutlingenm.eu-de.mybluemix.net/translate',
					async: false,
					success: function(data) {
						console.log('success: ',data);	
						addMessage(data);				
					}
				});	
		
		}


});

	// function getTone(message) {
	
	// 	var text={"texts":["",message]};

    //     $.post({
	// 		type: 'POST',
	// 		dataType: 'json',
	// 		data: JSON.stringify(text),
	// 		contentType: 'application/json',
	// 		url: 'https://cloudibmreutlingenm.eu-de.mybluemix.net/tone',
	// 		async: false,
	// 		success: function(data) {
	// 			console.log('success: ',data);
	// 			document.getElementById("mood").value = data.mood;
				
	// 			if(data.mood == 'happy') {
	// 				mood = data.mood;
	// 			}
	// 			else {
	// 				mood = data.mood;
	// 			}
				
	// 		}
	// 	});	

	// }

	// function translate(msg) {
	
	// 		// var text={msg:message};
	
	// 		$.post({
	// 			type: 'POST',
	// 			dataType: 'json',
	// 			data: JSON.stringify(msg),
	// 			contentType: 'application/json',
	// 			// url: 'http://localhost:3000/translate',
	// 			url: 'https://cloudibmreutlingenm.eu-de.mybluemix.net/translate',
	// 			async: false,
	// 			success: function(data) {
	// 				console.log('success: ',data);				
	// 			}
	// 		});	
	
	// }