const path = require("path")

module.exports = {
  entry: "./src/lambda.ts",
  target: "node",
  mode: "production",
  resolve: {
    extensions: [".ts", ".js"],
    symlinks: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [{ loader: "ts-loader", options: { transpileOnly: true } }],
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    filename: "lambda.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs2",
  },
  externals: {
    "pg-native": "commonjs pg-native",
  },
}
