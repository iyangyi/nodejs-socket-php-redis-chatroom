nodejs-socket-redis-php-chatroom
================================

a chatroom framework with nodejs + socket.io + redis +php chatroom . it's fast,simple, stable and multipurpose !

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

5. socket.emit('function', info); 
