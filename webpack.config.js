const path = require('path');

module.exports = {
    entry: path.join(__dirname, 'src/app.ts'),
    output: {
        filename: './dist/app.js',
        path: __dirname
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.less$/,
                use: [
                    "style-loader",
                    {
                        loader: "typings-for-css-modules-loader",
                        options: {
                            modules: true,
                            namedExport: true,
                            camelCase: true,
                            localIdentName: "[path][name]---[local]---[hash:base64:5]"
                        }
                    },
                    "less-loader"
                ]
            }            
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
};