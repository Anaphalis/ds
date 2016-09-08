var path = require('path')
var webpack = require('webpack')

module.exports = {
  //devtool: 'cheap-module-eval-source-map',
  entry: [
    //'webpack-hot-middleware/client',
    './src/index'
  ],
  output: {
    path: path.join(__dirname, 'dist/static/'),
    filename: 'bundle.js',
    publicPath: '/dist/static/'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: [ 'babel' ],
      exclude: /node_modules/,
      include: __dirname
    }, {
      test: /\.css?$/,
      loaders: [ 'style', 'raw' ],
      include: __dirname
    }]
  }
}
