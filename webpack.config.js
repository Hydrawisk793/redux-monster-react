var path = require("path");

var CopyWebpackPlugin = require("copy-webpack-plugin");
var UglifyJsPlugin = require("uglifyjs-webpack-plugin");
// var ES3Plugin = require("webpack-es3-plugin");
var nodeExternals = require("webpack-node-externals");

module.exports = (function ()
{
    var outputDirectoryName = "dist";

    return {
        entry : path.resolve(__dirname, "src", "index.js"),
        target : "web",
        output : {
            filename : "index.js",
            path : path.resolve(__dirname, outputDirectoryName),
            library : "kapheinJsReactUtils",
            libraryTarget : "umd"
        },
        optimization : {
            minimizer : [
                new UglifyJsPlugin({
                    uglifyOptions : {
                        // ie8 : true,
                        // safari10 : true,
                        output : {
                            quote_keys : true
                        }
                    }
                })
            ]
        },
        plugins : [
            // new ES3Plugin(),
            new CopyWebpackPlugin([
                {
                    context : "src",
                    from : "**/*.d.ts",
                    to : ""
                }
            ]),
        ],
        module : {
            rules: [
                {
                    test : /\.tsx?$/,
                    exclude : ["/node_modules/"],
                    loaders : ["babel-loader"],
                },
                {
                    test : /\.jsx?$/,
                    exclude : ["/node_modules/"],
                    loaders : ["babel-loader"],
                },
            ],
        },
        externals : [
            nodeExternals()
        ],
        resolve : {
            modules : ["node_modules"],
            extensions : [".ts", ".tsx", ".js", ".jsx", ".json"]
        }
    };
})();
