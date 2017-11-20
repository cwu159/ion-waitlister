//(c) 2017 Charlie Wu
//Apache 2.0 License, github.com/charliewu159

var express = require('express')
var app = express()

var http = require('http').Server(app);

var io = require('socket.io')(http);

var cookieParser = require('cookie-parser')

var SHA512 = require("crypto-js/sha512");

var client_token = "790366436769-1pqbl5q0ovtqe0ebanpmo90g9r80l6g9.apps.googleusercontent.com";

var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;
var client = new auth.OAuth2(client_token, '', '');

app.use(cookieParser());

app.use(express.static('./views'));

var Datastore = require('nedb');

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

users = new Datastore({ filename: 'database/users', autoload: true });
users.persistence.setAutocompactionInterval(10000);

chats = new Datastore({ filename: 'database/chats', autoload: true });
chats.persistence.setAutocompactionInterval(5000);

questions = new Datastore({ filename: 'database/questions', autoload: true });
chats.persistence.setAutocompactionInterval(5000);

var current_ids = {};

/*var doc = { id: SHA512("TEST CHAT 2"+(Math.floor((Math.random() * 1000000) + 1))).toString(), name:"TEST CHAT 2", users: ["114045925412495818711"], messages: [{message_id: 0, text: 'SECOND ever wefa TWO 2222 message', user: 114045925412495818711, date: new Date}, {message_id: 1, text: '2nd message', user: 114045925412495818711, date: new Date}, {message_id: 2, text: '3rd', user: 114045925412495818711, date: new Date}, {message_id: 3, text: 'bangers #4', user: 114045925412495818711, date: new Date}], last_index: 3, chat_pfp: 'http://i.imgur.com/XftXCuB.png'};
chats.insert(doc, function (err, newDoc) {
  if(err==null){
    console.log("done");
  }else{
    console.log("err_first_chat_creation_failed:   "+err);
  }
});*/


http.listen((process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080), (process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'), function () {
  console.log('Harmony starting on port 8080 or not .');
  console.log('(c) 2017 Charlie Wu');
  console.log('Apache 2.0 License, github.com/charliewu159');
})

app.get('/', function (req, res)
{
  console.log("new index connection");
  res.render('index.ejs');
});

app.get('/chat', function (req, res)
{
  console.log("new chat connection");
  res.render('chat.ejs');
});

app.get('/logout', function (req, res) {  
    res.cookie('username', "logged out", { expires: 0, httpOnly: true });
    res.cookie('password', "logged out", { expires: 0, httpOnly: true });
    res.render("index.ejs");
})

io.on('connection', function(socket){
  socket.on('clientconnect', function(msg){
    console.log('user connected!');
    //wait as content loads
    //var output = {"fanclub":fanclub["name"], "description":fanclub["description"], "activeusersnum":activeusersnum};
    socket.emit('serverconnect');
  });
  socket.on('quit', function(msg){
    //user quit remove from db
  });


  socket.on('get_question', function(msg){

    var doc = { id: 0, question: "Whats my favorite day of the week?", answers: ["Monday", "Tuesday", "Wednesday", "Thursday"], correct: "Wednesday"};
    questions.insert(doc, function (err, newDoc) {
      if(err==null){
        console.log("create_success");
      }else{
        console.log("err_create_failed");
      }
    });



    console.log("question requested: "+msg);
    questions.findOne({ id: msg }, function (err, question_content) {
      if(question_content!=null){
        console.log("getting question");
        socket.emit('ask_question', question_content['question']);
      }else{
        console.log("uh bad question");
      }
    });
  });


  socket.on('login_attempt', function(msg){
    console.log("login_attempt");
    client.verifyIdToken(msg[0], client_token, function(e, login) {
      if(e==null){
        var payload = login.getPayload();
        console.log("auth_success by: "+payload['sub']+"  "+payload['name']);
        users.findOne({ id: payload['sub'] }, function (err, try_token) {
          if(try_token==null){
            console.log("create_new_user");
            var doc = { id: payload['sub']+"", full_name: payload['given_name']+" "+payload['family_name'],fname: payload['given_name'], lname: payload['family_name'], pfp: payload['picture'], email: payload['email'], chats: []};
            users.insert(doc, function (err, newDoc) {
              if(err==null){
                console.log("create_success");
                socket.emit("login_success");
              }else{
                console.log("err_create_failed");
              }
            });
          }else{
            console.log("login_success");
            socket.emit("login_success");
          }
        });
      }else{
        console.log("err_auth_failed");
      }
    });
  });


  socket.on('refresh_chats', function(msg){
    client.verifyIdToken(msg[0], client_token, function(e, login) {
      if(e==null){
        var payload = login.getPayload();
        var return_chats = [];
        users.findOne({ id: payload['sub'] }, function (err, in_chats) {
          socket.emit("clear_current_chats"); //TODO
          for(var i = 0; i < in_chats['chats'].length; i++){
            chats.findOne({ id: in_chats['chats'][i] }, function (err, in_chats_info) {
              socket.emit("put_refreshed_chat", [in_chats_info, i, payload['sub']]);
            });
          }
        });
      }else{
        console.log("err_chat_refresh_failed");
      }
    });
  });

  socket.on('get_messages', function(msg){
    client.verifyIdToken(msg[0], client_token, function(e, login) {
      if(e==null){
        var payload = login.getPayload();
        chats.findOne({ id: msg[1] }, function (err, messages) {
          socket.emit("clear_current_messages"); //TODO
          var test_index = messages['messages'].length-1-msg[2];
          while(messages['messages'].length-1-msg[3]<test_index && test_index<=messages['messages'].length-1){
            if(messages['messages'][test_index]!=undefined){
              socket.emit("message", [messages['messages'][test_index], msg[1], 'afterBegin']);
            }
            test_index--;
          }
        });
      }else{
        console.log("err_get_messages_failed");
      }
    });
  });

  socket.on('get_user_chat_info', function(msg){
    client.verifyIdToken(msg[0], client_token, function(e, login) {
      if(e==null){
        var payload = login.getPayload();
        users.findOne({ id: msg[1] }, function (err, user_info) {
          socket.emit("send_user_chat_info", [msg[2], msg[3], user_info['fname'], user_info['lname'], user_info['pfp']]);
        });
      }else{
        console.log("err_get_chat_info_failed");
      }
    });
  });

  socket.on('send_message', function(msg){
    console.log("received message");
    client.verifyIdToken(msg[0], client_token, function(e, login) {
      if(e==null){
        var payload = login.getPayload();
        chats.findOne({ id: msg[2] }, function (err, selected_chat) {
          if(selected_chat != null && selected_chat['users'].indexOf(payload['sub'])>-1){
            console.log("message from: "+payload['given_name']+" "+payload['family_name']+" to chat: "+ selected_chat['name']+" = "+msg[1]);
            chats.update({ id: msg[2] }, { $push: { messages: { message_id: selected_chat['messages'].length, text: msg[1], user: payload['sub'], date: new Date() } } }, {}, function (err, newDoc) {
              if(err==null){
                chats.findOne({ id: msg[2] }, function (err, messages) {
                  for(var j = 0; j < selected_chat['users'].length; j++){
                    users.findOne({ id: selected_chat['users'][j] }, function (err, temp_user_info) {
                      if(err==null){
                        users.update({ id: temp_user_info['id'] }, { $pull: { chats: temp_user_info['chats'][temp_user_info['chats'].indexOf(msg[2])] } }, {}, function (err, newDoc) {
                          if(err==null){
                            users.update({ id: temp_user_info['id'] }, { $push: { chats: temp_user_info['chats'][temp_user_info['chats'].indexOf(msg[2])] } }, {}, function (err, newDoc) {
                              if(err==null){
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                  for(var i = 0; i < selected_chat['users'].length; i++){
                    io.to(current_ids[selected_chat['users'][i]]).emit('message', [messages['messages'][messages['messages'].length-1], msg[2], 'beforeEnd']);
                  }
                });
              }else{
                console.log("err_update_new_message_failed");
              }
            });
          }
        });
        //socket.broadcast.to(current_ids[payload['sub']]).emit('my message', msg);
      }else{
        console.log("err_user_send_message_failed");
      }
    });
  });

  //TODO USE ID FROM PAYLOAD INSTEAD OF FROM SOCKET REQUEST!!!

  socket.on('put_socket_id', function(msg){
    client.verifyIdToken(msg[0], client_token, function(e, login) {
      if(e==null){
        var payload = login.getPayload();
        current_ids[payload['sub']+""]=msg[1];
        console.log(payload['sub']+" added to socket id list with id: "+msg[1]);
      }else{
        console.log("err_user_put_socket_id_failed");
      }
    });
  });

  socket.on('search_people_new_chat', function(msg){
    client.verifyIdToken(msg[0], client_token, function(e, login) {
      if(e==null){
        var payload = login.getPayload();
        socket.emit("new_chat_user_search_clear_current_results", []);
        if(msg[1]!=""&&msg[1]!=" "){
          users.find({ full_name: new RegExp(msg[1], 'i') }, function (err, search_users_array) {
            for(var i = 0; i < search_users_array.length; i++){
              socket.emit("new_chat_user_search_result", [search_users_array[i]['full_name'], search_users_array[i]['pfp'], search_users_array[i]['id']]);
            }
          });
        }
      }else{
        console.log("err_user_search_people_new_chat_failed");
      }
    });
  });

  socket.on('get_name_pfp_added_users', function(msg){
    client.verifyIdToken(msg[0], client_token, function(e, login) {
      if(e==null){
        var payload = login.getPayload();
        users.findOne({ id: msg[1] }, function (err, user_info_added) {
          socket.emit("set_name_pfp_added_users", [user_info_added['id'], user_info_added['full_name'], user_info_added['pfp']]);
        });
      }else{
        console.log("err_set_name_pfp_added_users");
      }
    });
  });

  socket.on('create_new_chat', function(msg){
    client.verifyIdToken(msg[0], client_token, function(e, login) {
      if(e==null){
        var payload = login.getPayload();
        users.findOne({ id: payload['sub'] }, function (err, user_creating) {
          msg[1][msg[1].length] = payload['sub'];
          var doc = { id: SHA512(msg[2]+(Math.floor((Math.random() * 1000000) + 1))).toString(), name: msg[2], users: msg[1], read_last: {}, messages: [{"message_id":0,"text":"Welcome to a new Harmony Chat!","user":"114045925412495818711","date":new Date}], last_index: 0, chat_pfp: 'http://i.imgur.com/XftXCuB.png'};
          chats.insert(doc, function (err, newDoc) {
            if(err==null){
              console.log("created new chat: "+msg[2]);
              for(var i = 0; i < msg[1].length; i++){
                users.update({ id: msg[1][i] }, { $push: { chats: doc['id'] } }, {}, function (err, newDoc) {
                  if(err==null){
                  }else{
                    console.log("err_add_user_to_new_chat_failed");
                  }
                });
              }
              for(var i = 0; i < msg[1].length; i++){
                io.to(current_ids[msg[1][i]]).emit('new_refresh_chats');
              }
            }else{
              console.log("err_chat_creation_failed_db");
            }
          });
        });
      }else{
        console.log("err_create_new_chat");
      }
    });
  });

  socket.on('read_message', function(msg){
    client.verifyIdToken(msg[0], client_token, function(e, login) {
      if(e==null){
        var payload = login.getPayload();
        users.findOne({ id: payload['sub'] }, function (err, user_read) {
          if(user_read['chats'].indexOf(msg[1])>-1){
            chats.findOne({ id: msg[1] }, function (err, chat_read) {
              chats.update({ id: msg[1] }, { $set: { ["read_last."+payload['sub']]: { message_index: chat_read['messages'].length-1 } } }, {}, function (err, newDoc) {
                if(err==null){
                   chats.findOne({ id: msg[1] }, function (err, test_chat_read) {
                   });
                  for(var i = 0; i < chat_read['users'].length; i++){ //TODO length-1 or NOT?
                    io.to(current_ids[chat_read['users'][i]]).emit('other_user_read', [msg[1], payload['sub']]);
                  }
                }else{
                  console.log("err_update_user_read_chat_failed_2nd" + err);
                }
              });
            });
          }
        });
      }else{
        console.log("err_update_user_read_chat_failed_1st");
      }
    });
  });

});