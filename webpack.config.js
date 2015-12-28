var webpack = require('webpack');

module.exports = {
    devtool: 'eval-source-map',
    entry: [
        'webpack-dev-server/client?http://localhost:8080',
        'webpack/hot/only-dev-server',
        './src/Main.jsx'
    ],
    module: {
        loaders: [
            { test: /\.jsx?$/, loader: 'react-hot!babel', exclude: /node_modules/ },
            { test: /\.css$/,  loader: "style!css" },
            { test: /\.scss/,  loaders: ["style", "css", "sass"] }
        ]
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    output: {
        path: __dirname + '/dist',
        publicPath: '/',
        filename: 'bundle.js'
    },
    devServer: {
        contentBase: './dist',
        hot: true,
        headers: {
            "Access-Control-Allow-Origin" : "*"
        }
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
};