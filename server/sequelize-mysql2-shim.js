/**
 * Sequelize 3 的 MySQL 连接管理器假定使用 `mysql` 包（存在 _protocol），
 * `mysql2` 结构不同，会在 disconnect/validate 时抛错。在加载 models 之前打补丁。
 */
var Promise = require('sequelize/lib/promise')
var sequelizeErrors = require('sequelize/lib/errors')
var CM = require('sequelize/lib/dialects/mysql/connection-manager')

CM.prototype.disconnect = function (connection) {
  if (!connection) {
    return Promise.resolve()
  }
  if (connection._protocol && connection._protocol._ended) {
    return Promise.resolve()
  }
  return new Promise(function (resolve, reject) {
    if (typeof connection.end === 'function') {
      connection.end(function (err) {
        if (err) {
          reject(new sequelizeErrors.ConnectionError(err))
        } else {
          resolve()
        }
      })
    } else {
      resolve()
    }
  })
}

CM.prototype.validate = function (connection) {
  if (!connection) {
    return false
  }
  if (typeof connection.state === 'string') {
    return ['disconnected', 'protocol_error'].indexOf(connection.state) === -1
  }
  return true
}
