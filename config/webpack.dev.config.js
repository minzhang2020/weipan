var config = require('./webpack.base.config')

// Choose a developer tool to enhance debugging
// 具体看webpack的Configuration
config.devtool = 'eval-source-map'

// webpack-dev-server 配置
// suppress boring information.
config.devServer = {
  noInfo: true
}

module.exports = config
