module.exports = {
    "presets": [
        [
            "@babel/preset-env",
            {
                "loose": true,
                "modules": "commonjs"
            }
        ],
        "@babel/preset-react",
        [
            "@babel/preset-typescript",
            {
                "isTSX": true,
                "allExtensions": true
            }
        ]
    ],
    "plugins": [
        "@babel/plugin-proposal-class-properties",
        [
            "@babel/plugin-transform-modules-commonjs",
            {
                "allowTopLevelThis": true
            }
        ],
        "@babel/plugin-transform-reserved-words"
    ]
};
