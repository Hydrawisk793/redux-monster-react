var isNonNullObject = require("kaphein-js").isNonNullObject;
var useStore = require("react-redux").useStore;

var ReduxMonsterRegistry = require("redux-monster").ReduxMonsterRegistry;

module.exports = (function ()
{
    /**
     *  @typedef {import("redux-monster").ReduxMonster} AnyReduxMonster
     */

    /**
     *  @param {...AnyReduxMonster} [monster]
     */
    function useMonsters()
    {
        var i;

        for(i = 0; i < arguments.length; ++i)
        {
            if(!isNonNullObject(arguments[i]))
            {
                throw new TypeError("The parameters must satisfy \"redux-monster\".ReduxMonster interface.");
            }
        }

        var reduxStore = useStore();
        if(reduxStore)
        {
            var registry = ReduxMonsterRegistry.findFromReduxStore(reduxStore);
            if(registry)
            {
                for(i = 0; i < arguments.length; ++i)
                {
                    registry.registerMonster(arguments[i]);
                }
            }
        }
    }

    return {
        useMonsters : useMonsters
    };
})();
