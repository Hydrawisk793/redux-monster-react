var createMonsterEnhancer = require("./create-monster-enhancer");
var hooks = require("./hooks");

module.exports = Object.assign(
    {},
    createMonsterEnhancer,
    hooks
);
