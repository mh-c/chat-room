var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + "/index.html");
});

// Global hashMap to store all online users and socket.id
var users = new Map();

io.on('connection', (socket) => {
    let user;
    console.log('a user connected');

    // boardcast when connected, add to online users, send list of current users
    socket.on('identity', (username) => {
        user = username;
        users.set(username, socket.id);
        socket.emit('update pmusers', [...users.keys()]);
        socket.broadcast.emit('user connect', username, 'connect', [...users.keys()]);
        console.log(username + ' joined, total ' + users.size + ' online');
    });

    // boardcast when disconnected, remove from online users
    socket.on('disconnect', function(){
        users.delete(user);
        socket.broadcast.emit('user connect', user, 'disconnect', [...users.keys()]);
        console.log(user + ' disconnected, total ' + users.size + ' online');
    });
    
    // boardcast / primate message depends on receivers
    socket.on('chat message', function(to, msg){
        if(to == 'To All'){
            socket.broadcast.emit('chat message', user, msg);
        }else{
            receiverid = users.get(to);
            if(receiverid != undefined){
                io.to(receiverid).emit('private message', user, msg);
            }
        }
    });

    // boardcast typing event
    socket.on('typing', function(username){
        socket.broadcast.emit('typing', username);
    })
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});