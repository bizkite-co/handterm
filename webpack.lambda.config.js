const path = require('path');

module.exports = {
    target: 'node18',
    mode: 'production',
    entry: {
        'oauth_callback': './dist/lambda/authentication/oauth_callback.js',
        'listRecentRepos': './dist/lambda/authentication/listRecentRepos.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist/lambda/authentication'),
        filename: '[name].bundle.js',
        libraryTarget: 'commonjs2'
    },
    resolve: {
        extensions: ['.js', '.mjs', '.json'],
        fullySpecified: false
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    node: '18'
                                }
                            }]
                        ]
                    }
                }
            }
        ]
    },
    externals: [
        '@aws-sdk/client-cognito-identity-provider',
        '@octokit/rest',
        '@octokit/auth-oauth-app'
    ],
    optimization: {
        minimize: true
    }
};
