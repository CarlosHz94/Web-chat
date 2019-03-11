var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var userNum = 1;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});




var chatlog = {};
chatlog.msgs = [];
chatlog.user = [];
chatlog.time = [];
var chatlogCount = 0;

var clients = [];

io.on('connection', function(socket){
	clients.push(socket.id);
	updateChatlog(clients[clients.length-1]);
	var temp = genUsername();
	io.emit('genUser', temp);
	
	socket.on('chat message', function(msg, userName){
		var command = msg.split(" ");
		if(command[0][0] == "/"){
			console.log("this is a command");
		}else{
			var now = new Date();
			var time = [now.getHours(), now.getMinutes(), now.getSeconds()];
			io.emit('chat message', msg, time);
			chatlog.msgs.push(msg);
			chatlog.user.push(userName);
			chatlog.time.push(time);
			chatlogCount++;
		}
	});
});


http.listen(3000, function(){
	console.log('listening on *:3000');
});

function updateChatlog(client){
	var i;
	var startIndex = 0;
	for(i = 0; i < 250	 && startIndex < chatlogCount; i++, startIndex++){
		io.to(client).emit('chatlog', chatlog.time[startIndex], chatlog.user[startIndex], chatlog.msgs[startIndex]);
	}
}


function genUsername(){
	var username = "User ";
	username = username + userNum;
	userNum++;
	return username;
}