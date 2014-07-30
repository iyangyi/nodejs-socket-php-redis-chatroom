//线上稳定版本
var config = require('./config.js').config,
    io = require('socket.io').listen(config.socket.port),
    redis = require('redis');

//level log
io.set('log level', 1);

//authorization
// io.set('authorization', function (handshakeData, callback) 
// {
//     //origin
//     var referer = handshakeData.headers.referer;
//     if (referer == '' || referer == undefined || referer.indexOf(config.app.url) == '-1') {
//         return callback('not authorization', false);
//     } else {
//         return callback(null, true);
//     }
// });


//connect
io.sockets.on('connection', function (socket) 
{
    //console.log(socket.handshake);
    //实例化2个redis,redis_obj用来subscribe，msg_sender用来publish
    var redis_obj = redis.createClient(config.redis.port, config.redis.host),
        msg_sender = redis.createClient(config.redis.port, config.redis.host);
    //过滤HTML
    var removeHTMLTag = function (str) {
        str = str.replace(/<\/?[^>]*>/g,''); //去除HTML tag
        str = str.replace(/[ | ]*\n/g,'\n'); //去除行尾空白
        str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
        str = str.replace(/&nbsp;/ig,'');//去掉&nbsp;
        return str;
    }

    var checkTime = function(i) {
        if (i<10) {
            i = "0" + i;
        }
        return i;
    }

    var getServerTime = function() {
        var a = new Date();
        var time = checkTime(a.getHours())+":"+checkTime(a.getMinutes())+":"+checkTime(a.getSeconds());
        return time;
    }

    //传递user_name 和 r_id
    socket.on('on_load',function(info)
    {
        //数据初始化
        socket.user_name = info.user_name;
        socket.r_id = info.r_id || 1;
        socket.nick_name = info.nick_name || info.user_name;
        socket.level = info.level || 0;
        socket.json_info = JSON.stringify(info);
        socket.sub_r_id = config.app.name + '-' + info.r_id;
        socket.kick_out = config.app.name + ':room:' + socket.r_id + ':kick_out:';
        socket.online_list = config.app.name + ':room:' + socket.r_id + ':online_list';
        socket.forbidden_talk = config.app.name + ':room:' + socket.r_id + ':forbidden_talk:';
        socket.kick_out_time = config.app.kick_out_time || 900;
        socket.forbidden_talk_time = config.app.forbidden_talk_time || 180;
        socket.return_list_num = config.app.return_list_num || 100;
        //判断是否已被踢出
        msg_sender.get(socket.kick_out + socket.user_name, function(err, reply) {
            if(reply == 1) {
                //console.log('kick out from room: ' + socket.r_id);
                socket.emit('kick_out',1);
            }else {
                sendWelcome(info);
            }
        });
        //sendWelcome(info);
    });

    //发送欢迎信
    var sendWelcome = function (info) {
        //订阅房间 
        redis_obj.subscribe(socket.sub_r_id);
        //已经登陆
        if (info.user_name && info.user_name!= undefined) {
             //在线会员
            msg_sender.zadd(socket.online_list, socket.level, socket.json_info);
            //订阅
            redis_obj.subscribe(socket.sub_r_id + '-' + socket.user_name);
            //发送欢迎
            info.type = 'welcome';
            msg_sender.publish(socket.sub_r_id, JSON.stringify(info));
        } else {
            //没登陆,只发送online list
            onlineList();
        }
    }

    //online list
    var onlineList = function()
    {
        msg_sender.zrevrange(socket.online_list, 0, socket.return_list_num, function(error, reply){
            socket.emit('online_list', reply);
        });
    }

    //监听reids
    redis_obj.on("message", function(id, msg)
    {
        var mobj = JSON.parse(msg);
        //console.log(mobj);
        switch(mobj.type){
            case 'message':
                socket.emit('message', msg);
                break;
            case 'welcome':
                socket.emit('welcome', msg);
                onlineList();
                break;
            case 'system_message':
                socket.emit('system_message', msg);
                break;
            case 'quit':
                onlineList();
                break;
            case 'private_message':
                socket.emit('private_message', msg);
                break;
            case 'kick_out': 
                socket.emit('kick_out', 1);
                break;
            case 'forbidden_talk':
                socket.emit('forbidden_talk', 1);
                break;
            case 'gift':
                socket.emit('gift', msg);
                break;
            case 'begin_live':
                socket.emit('begin_live', msg);
                break;
            case 'guess_checkout':
                socket.emit('guess_checkout', msg);
                break;
            case 'guess_pk':
                socket.emit('guess_pk', msg);
                break;
            case 'guess_bet':
                socket.emit('guess_bet', msg);
                break;
            case 'guess_addsubject':
                socket.emit('guess_addsubject', msg);
                break;
            case 'end_live':
                socket.emit('end_live', msg);
                break;
            case 'activity_roll':
                socket.emit('activity_roll', msg);
                break;
        }
    });

    //接收消息
    socket.on('message', function(msg)
    {  
        //判断是否被禁言
        msg_sender.get(socket.forbidden_talk + socket.user_name, function(err, reply) {
            if(reply == 1) {
                socket.emit('forbidden_talk',1);
            }else {
                //console.log(msg);
                msg.type = 'message';
                msg.time = getServerTime();
                msg.user_name = socket.user_name;
                msg.nick_name = socket.nick_name;
                msg.content = removeHTMLTag(msg.content);
                msg_sender.publish(socket.sub_r_id, JSON.stringify(msg));
            }
        });
    });
    
    //公共信息
    socket.on('public_message',function(msg){
        msg.type = 'public_message';
        msg.time = getServerTime();
        msg.user_name = socket.user_name;
        msg.nick_name = socket.nick_name;
        msg.content = removeHTMLTag(msg.content);
        io.sockets.emit('public_message', JSON.stringify(msg));
    });

    //私人信息
    socket.on('private_message',function(msg){
        msg.type = 'private_message';
        msg.time = getServerTime();
        msg.content = removeHTMLTag(msg.content);
        msg.user_name = socket.user_name;
        msg.nick_name = socket.nick_name;
        socket.emit('private_message',JSON.stringify(msg));
        msg_sender.publish(socket.sub_r_id + '-' + msg.to, JSON.stringify(msg));
    });


     //踢出房间
    socket.on('kick_out', function(msg,fn)
    {
        msg.type = 'kick_out';
        msg.time = getServerTime();
        msg.user_name = socket.user_name;
        msg.nick_name = socket.nick_name;
        msg_sender.setex(socket.kick_out + msg.to, socket.kick_out_time, 1);
        msg_sender.publish(socket.sub_r_id + '-' + msg.to, JSON.stringify(msg));
        fn(true);
    })

     //禁言
    socket.on('forbidden_talk', function(msg,fn)
    {   
        msg.type = 'forbidden_talk';
        msg.time = getServerTime();
        msg.user_name = socket.user_name;
        msg.nick_name = socket.nick_name;
        msg_sender.setex(socket.forbidden_talk + msg.to, socket.forbidden_talk_time, 1);
        msg_sender.publish(socket.sub_r_id + '-' + msg.to, JSON.stringify(msg));
        fn(true);
    })

    //发送礼物
    socket.on('gift',function(msg){
        msg.type = 'gift';
        msg.time = getServerTime();
        msg.user_name = socket.user_name;
        msg.nick_name = socket.nick_name;
        msg_sender.publish(socket.sub_r_id, JSON.stringify(msg));
    });

    //监听退出
    socket.on('disconnect',function()
    {   
        //删除退出的用户信息
        msg_sender.zrem(socket.online_list, socket.json_info, function(data){});
        // //刷新列表
        var info = {};
        info.type = 'quit';
        msg_sender.publish(socket.sub_r_id, JSON.stringify(info));
        //退订
        redis_obj.unsubscribe(socket.sub_r_id);
        redis_obj.unsubscribe(socket.sub_r_id + '-' + socket.user_name);
        redis_obj.quit();
        msg_sender.quit();
    });
});

