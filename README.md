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
