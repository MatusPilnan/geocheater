const path = require('path');

module.exports = {
  entry: {
    background: './src/js/background',
    content: './src/js/content',
    devTools: './src/js/devTools',
    options: './src/js/options',
    popup: './src/js/popup'
  },
  output: {
    filename: (pathData) => {
      return pathData.chunk.name === 'background' ? '[name].js': 'js/[name].js';
    },
  },
  resolve: {
    modules: [path.join(__dirname, 'src'), 'node_modules']
  },
  module: {
    rules: [{
      test: /\.js$/,
      // loader: 'babel-loader',
      include: path.resolve(__dirname, '../src/js')
    }]
  }
};
