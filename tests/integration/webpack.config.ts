import path from 'path'
import { Configuration } from 'webpack'

const config: Configuration = {
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, '../../src')
    },
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        }
      }
    ]
  }
}

export default config
