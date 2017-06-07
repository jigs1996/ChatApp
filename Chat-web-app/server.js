
var ip = require('ip');
var express = require('express');
var app = express();
var	mongo = require('mongodb').MongoClient;
var client =  require('socket.io').listen(8080).sockets;

var port=process.argv[2] || 4444;

//Main server
var server = app.listen(port,function(req,res){
   host = server.address().address;
  //var port = server.address().port;
  console.log('server run on http://localhost:'+port);
  //console.log('  Time    ||     Client-ip     || Requsted url');
});
//serving static file like css,javascript,jquery..............
app.use(function(req,res,next) {

  var ip = req.header['x-forwarded-for'] || req.connection.remoteAddress;
	if(ip=="::1")//local host address
      var i = 'localhost    ';
	else
	   var i = ip.slice(7);

  var dt = Date();
  console.log(dt.slice(16,24) + '  ||  ' + i + '        ||  ' + req.url);
  //console.log('Requsted url'+req.url);
  next();
});
app.use(express.static('./'));    // "./" indicate current working directory

app.get('/',function(req,res){

  res.sendFile(__dirname + '/index.html');
  //console.log("req.url");
});



//database connection
mongo.connect('mongodb://your server ip/chat',function(err,db){
	if(err) throw err;
	client.on('connection', function(socket) {
	//console.log('someone has connected.......');

	//database collection creation
		var col = db.collection('messages'),
			sendStatus = function(s){
				socket.emit('status',s);
			};

		//Emits all the messages....

		col.find().limit(100).sort({_id: 1}).toArray(function(err, res){
				if(err) throw err;
				socket.emit('output',res);
		});

		//wait for input
		socket.on('input',function(data) {
			//console.log(data);
			var name = data.name,
				message = data.message,

				pattern = /^\s*$/;	//This sign for empty space
				if (pattern.test(name) || pattern.test(message)) {
					//console.log('Invalide input');
					sendStatus('Name & message is requires.');
				} else {
					col.insert({name:name, message: message},function(){
						console.log(">"+name+':'+message);
						//Emits Latest messages o all clients
						client.emit('output',[data]);
						sendStatus({
								message: "Message sent",
								clear: true
						});
					});
				}

		});
	});
});

//Warnning appear till user not enter name
//get full information of client
//
