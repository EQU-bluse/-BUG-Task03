/**
 * Created by 胡志甫 on 2017/8/22.
 */
require('dotenv').config();
require('./server/sequelize-mysql2-shim');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path=require('path');
const router=require('./server/routes');
var http = require('http');
var app = express();

//body 解析
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

var port = process.env.API_PORT || process.env.PORT || 8081;
//session设置
app.use(session({
    secret: 'vue',
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 60 * 1000  //session过期时间
    },
    name: 'vue-project'
  }
));
/**  将vue代码打包（npm run build）后，静态资源放至node服务器访问，解决HTML5 History 模式的问题
app.use(require('connect-history-api-fallback')());
app.use(express.static(path.join('dist')));
*/
// 将路由用至应用程式
app.use('/api/v1', router);

var httpServer = http.createServer(app);
httpServer.on('error', onError);

var db = require('./server/models').client;
// Sequelize 3 的 authenticate() 与 mysql2 组合易报错，改用简单查询探测连接
db.query('SELECT 1')
  .then(function () {
    console.log('MySQL 已连接');
    if (process.env.SYNC_DB === '1') {
      return db.query('SET FOREIGN_KEY_CHECKS=0').then(function () {
        return db.sync();
      }).then(function () {
        return db.query('SET FOREIGN_KEY_CHECKS=1');
      });
    }
  })
  .then(function () {
    if (process.env.SYNC_DB === '1') {
      console.log('已执行 sequelize.sync()（仅当 SYNC_DB=1 时）');
    }
    httpServer.listen(port, '0.0.0.0', function () {
      console.log('Vue BackEnd Server is running on: http://%s:%s', 'localhost', port);
    });
  })
  .catch(function (err) {
    console.error('MySQL 连接失败:', err.message);
    console.error('请检查项目根目录 .env 中 MYSQL_*，确认 MySQL 已启动，并已创建数据库（可先设 SYNC_DB=1 自动建表）。');
    process.exit(1);
  });
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  //处理特殊error 的友好信息
  switch (error.code) {
    case 'EACCES':
      console.error('requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error('端口被占用!');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
