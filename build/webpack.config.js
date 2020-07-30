const webpack = require('webpack')
const path = require('path')
const glob = require('glob')

// variables
const isProduction = process.argv.indexOf('-p') >= 0 || process.env.NODE_ENV === 'production'
const sourcePath = path.join(__dirname, '../src')
const outPath = path.join(__dirname, '../dist')

// TODO:commonEntry
const commonEntry = {}
const entry = Object.assign({}, commonEntry)
const pageFiles = []

// plugins
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

function getEntries () {
  const root = path.resolve(__dirname, '../src/pages')
  const r = glob.sync('./**/index.tsx', {
    cwd: root
  })
  console.log('Entry list: \n', r)
  return r.map(p => {
    const name = /([^/]+)\/index\.tsx/g.exec(p)
    const filename = p.replace(/\/index\.tsx/g, '.html')
    return {
      name: name[1],
      entry: path.resolve(__dirname, '../src/pages', p),
      page: {
        // 输出的文件名称
        filename: path.resolve(__dirname, '../dist/pages', filename),
        // 输入的模板文件
        // TODO: 目前模板文件都一样，后期可以加入自定义
        template: path.resolve(__dirname, '../public/index.html'),
        chunks: Object.keys(commonEntry).concat(['chunk-common', name[1]])
      }
    }
  })
}

const entries = getEntries()
if (!entries || !entries.length) {
  throw (new ReferenceError(' can not find the entry file , please check page dir'))
}

entries.forEach(v => {
  entry[v.name] = v.entry
  pageFiles.push(new HtmlWebpackPlugin(v.page))
})

module.exports = {
  entry: entry,
  output: {
    path: outPath,
    filename: '[name]_[hash:8].js'
  },
  target: 'web',
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    mainFields: ['module', 'browser', 'main'],
    alias: {
      '@': path.resolve(__dirname, '../src/'),
      src: path.resolve(__dirname, '../src/'),
      pages: path.resolve(__dirname, '../src/pages'),
      components: path.resolve(__dirname, '../src/components')
    }
  },
  module: {
    rules: [
      // .ts, .tsx
      {
        test: /\.tsx?$/,
        use: [
          !isProduction && {
            loader: 'babel-loader',
            options: { plugins: ['react-hot-loader/babel'] }
          },
          'ts-loader'
        ].filter(Boolean)
      },
      // less
      {
        test: /\.(less)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader'
        ]
      },
      // css
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            query: {
              sourceMap: !isProduction,
              importLoaders: 1,
              modules: {
                localIdentName: isProduction ? '[hash:base64:5]' : '[local]__[hash:base64:5]'
              }
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [
                require('postcss-import')({ addDependencyTo: webpack }),
                require('postcss-url')(),
                require('postcss-preset-env')({
                  /* use stage 2 features (defaults) */
                  stage: 2
                }),
                require('postcss-reporter')(),
                require('postcss-browser-reporter')({
                  disabled: isProduction
                })
              ]
            }
          }
        ]
      },
      // static assets
      { test: /\.html$/, use: 'html-loader' },
      { test: /\.(a?png|svg)$/, use: 'url-loader?limit=10000' },
      {
        test: /\.(jpe?g|gif|bmp|mp3|mp4|ogg|wav|eot|ttf|woff|woff2)$/,
        use: 'file-loader'
      }
    ]
  },
  optimization: {
    splitChunks: {
      name: true,
      cacheGroups: {
        commons: {
          chunks: 'initial',
          minChunks: 2
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          filename: isProduction ? 'vendor.[contenthash].js' : 'vendor.[hash].js',
          priority: -10
        }
      }
    },
    runtimeChunk: true
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development', // use 'development' unless process.env.NODE_ENV is defined
      DEBUG: false
    }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin(),
    ...pageFiles
  ],
  devServer: {
    contentBase: sourcePath,
    hot: true,
    inline: true,
    historyApiFallback: {
      disableDotRule: true
    },
    stats: 'minimal',
    clientLogLevel: 'warning'
  },
  devtool: isProduction ? 'hidden-source-map' : 'cheap-module-eval-source-map',
  node: {
    fs: 'empty',
    net: 'empty'
  }
}
