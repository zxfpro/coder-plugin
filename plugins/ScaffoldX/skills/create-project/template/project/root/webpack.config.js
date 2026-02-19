const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require("path");

const dist = path.join(__dirname, 'dist');

function createConfig(mode, entry, output, plugins) {
    return {
        entry,
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: [{ loader: 'ts-loader', options: { transpileOnly: true, configFile: "tsconfig.json" } }],
                },
                { test: /\.css$/, use: ['style-loader', 'css-loader'] },
                { test: /\.(png|jpg|gif|webp|svg|zip|otf)$/, use: ['url-loader'] },
            ],
        },
        resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'] },
        output: {
            filename: '[name].js',
            path: output
        },
        plugins,
        devServer: {
            static: {
                directory: path.join(__dirname, 'src/frontend') // TODO1
            },
            compress: true,
            port: 3000,
            proxy: {
                '/api': {
                    target: 'http://localhost:8107',
                    changeOrigin: true
                }
            }
        }
    }
}

module.exports = (env, argv) => {
    const webAppConfig = createConfig(argv.mode, { app: "./src/frontend/api/client.tsx" }, dist, [ //TODO
        new HtmlWebpackPlugin({
            template: './src/frontend/index.html',
            filename: 'index.html',
            chunks: ['app'],
        }),
    ]);
    return [webAppConfig];
}