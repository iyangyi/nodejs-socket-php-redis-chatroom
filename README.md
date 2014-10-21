nodejs-socket-redis-php-chatroom
================================

a chatroom framework with nodejs + socket.io + redis +php chatroom . it's fast,simple, stable and multipurpose !

[点击这里你可以链接到v2新版，效能更强](https://github.com/iyangyi/nodejs-socket-php-redis-chatroom-2)

功能
================================
1. 支持多房间，多人聊天，支持踢出房间，屏蔽15分钟，发送全局系统消息

2. 聊天室服务与php业务完全分类，互不影响，可以在php代码中向聊天室推送各种消息，以达到实时响应的作用

启动聊天服务器
================================

1. cd /home/web/chatroom #进入chat的代码目录

2. npm install #安装package依赖包

3. node index.js #运行

4. 浏览器打开这个链接试一下：127.0.0.1:8081（Welcome to socket.io.表示成功）

客户端连接
================================

在demo/index.php 里有详细的使用，可以去看，这里简单说下。

1. html头部加入socket.io的js：http://127.0.0.1:8080/socket.io/socket.io.js

2. 连接socket.io服务器： var socket = io.connect('http://127.0.0.1:8081');

3. 初始化传递数据 on_load 将房间号r_id,user_name,nick_name,level 等参数传递给chat服务器的on_load方法

4. 接受消息就用 socket.on('function', function (msg){});

5. 发送消息就用socket.emit('function', info); 

php端发送消息
================================
    //redis_key =  app_name + room_id + username
    
    $send_info = array(
	    "game_name" => $room_info['game_name'],
	    "username" => $room_info['username'],
	    "type" => 'begin_live', #必填
	    "time" => date("H:i:s")
    );
    $this->redis->publish('chat-34332', json_encode($send_info)); //向34332房间所有人发
    $this->redis->publish('chat-34332-iyangyi', json_encode($send_info));向34332房间的iyangyi发

原理以及注意
================================
1. 采用的redis 的pub/sub模式，每一个链接都会产生2个redis长连接,所以需要将redis的链接数搞大点。

2. config.js 里有各种可以自行配置，可以配置redis的各个配置，以及整个聊天室的名字等等。

3. 可以自行使用forever 或者 supervisor 来达到守护进程及其修改代码重启的作用。

4. index.js里io.set('authorization') 被注释掉，可以自行根据需要读取cook或者refer来安全校验。

使用
================================
使用请带上来源，开源的版权东西需要一起维护，谢谢。
