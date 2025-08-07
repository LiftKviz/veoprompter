const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background/index.ts',
    content: './src/content/index.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  mode: 'production',
  devtool: false,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    modules: [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'node_modules')
    ],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src', 'components'),
      '@/services': path.resolve(__dirname, 'src', 'services'),
      '@/types': path.resolve(__dirname, 'src', 'types'),
      '@/utils': path.resolve(__dirname, 'src', 'utils')
    },
    symlinks: false
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'public/manifest.json',
          to: 'manifest.json'
        },
        {
          from: 'public/icons',
          to: 'icons'
        },
        {
          from: 'src/data/prompts.txt',
          to: 'data/prompts.txt'
        },
        {
          from: 'src/data/knowledge-base.json',
          to: 'data/knowledge-base.json'
        },
        {
          from: 'admin-dashboard/prompts-data.js',
          to: 'admin-dashboard/prompts-data.js',
          noErrorOnMissing: true
        }
      ]
    }),
    new HtmlPlugin({
      template: 'public/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 10
        }
      }
    }
  }
};