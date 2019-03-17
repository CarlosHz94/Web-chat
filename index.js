var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var userNum = 1;
var port = process.env.PORT || 3000;

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

var chatlog = {};
chatlog.msgs = [];
chatlog.user = [];
chatlog.time = [];
chatlog.count = 0;

var clients = [];

var userList = {};
userList.userName = [];
userList.colour = [];

io.on('connection', function(socket){
	clients.push(socket.id);
	updateChatlog(clients[clients.length-1]);
	addUser(genUsername());
	io.to(clients[clients.length-1]).emit('genUser', userList.userName[userList.userName.length-1], userList.colour[userList.colour.length-1]);
	
	io.emit('updateUsers', userList.userName);
	
	socket.on('chat message', function(msg, userName){
		var command = msg.split(" ");
		if(command[0][0] == "/"){
			console.log("this is a command");
			executeCommand(command[0], command[1], socket.id);
		}else{
			var now = new Date();
			var time = [now.getHours(), now.getMinutes(), now.getSeconds()];
			var index = clients.indexOf(socket.id);
			io.emit('chat message', msg, time, userName, userList.colour[index]);
			chatlog.msgs.push(msg);
			chatlog.user.push(userName);
			chatlog.time.push(time);
			chatlog.count++;
		}
	});
	
	socket.on('disconnect', function(){
		var index = clients.indexOf(socket.id);
		console.log("index of disconnect = " + index);
		clients.splice(index, 1);
		userList.userName.splice(index, 1);
		userList.colour.splice(index, 1);
		io.emit('updateUsers', userList.userName);
	});
	
});

http.listen(port, function(){
	console.log('listening on *:3000');
});

function updateChatlog(client){
	var i;
	var startIndex = 0;
	for(i = 0; i < 250	 && startIndex < chatlog.count; i++, startIndex++){
		io.to(client).emit('chatlog', chatlog.time[startIndex], chatlog.user[startIndex], chatlog.msgs[startIndex]);
	}
}

function genUsername(){
	var username = "User ";
	username = username + userNum;
	userNum++;
	return username;
}

function addUser(name){
	userList.userName.push(name);
	userList.colour.push("#000");
}

function executeCommand(command, argument, client){
	clientIndex = clients.indexOf(client);
	switch(command){
		case "/nick":
			var index = userList.userName.indexOf(argument);
			console.log("index = " + index);
			if(index === -1){
				userList.userName[clientIndex] = argument;
				io.emit('updateUsers', userList.userName);
				io.to(clients[clientIndex]).emit('genUser', userList.userName[clientIndex], userList.colour[clientIndex]);
				io.to(client).emit('serverMessage', "Your username is now '" + argument + "'");
			}else{
				io.to(client).emit('serverMessage', "This username is already taken");
			}
			break;
		case "/nickColor":
			userList.colour[clientIndex] = argument;
			io.to(clients[clientIndex]).emit('genUser', userList.userName[clientIndex], userList.colour[clientIndex]);
			io.to(client).emit('serverMessage', "Your user colour is now '" + argument + "'");
			break;
		default:
			io.to(client).emit('serverMessage', "This is not a valid command");
	}
}
