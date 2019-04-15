const path = require('path');

module.exports = function (env = {}) {
  return {
    mode: env.production ? 'production' : 'development',
    entry: './src/index',
    output: {
      path: path.resolve(__dirname, 'js'),
      filename: 'app.js',
      publicPath: '/js/',
      library: ['Boxman'],
      libraryTarget: 'umd',
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
          },
        },
      ],

      /* Advanced module configuration (click to show) */
    },

    // externals: {
    //   spritejs: 'spritejs',
    // },
    // Don't follow/bundle these modules, but request them at runtime from the environment

    stats: 'errors-only',
    // lets you precisely control what bundle information gets displayed

    devServer: {
      contentBase: path.join(__dirname, '.'),
      compress: true,
      port: 9090,
      // ...
    },

    plugins: [
      // ...
    ],
    // list of additional plugins


    /* Advanced configuration (click to show) */
  };
};