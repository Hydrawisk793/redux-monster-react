var kapheinJs = require("kaphein-js");
var isNonNullObject = kapheinJs.isNonNullObject;
var shallowEquals = kapheinJs.shallowEquals;
var React = require("react");
var useEffect = React.useEffect;
var ReactRedux = require("react-redux");
var useStore = ReactRedux.useStore;
var kapheinJsReactUtils = require("kaphein-js-react-utils");
var useDeepMemo = kapheinJsReactUtils.useDeepMemo;
var reduxMonster = require("redux-monster");
var ReduxMonsterRegistry = reduxMonster.ReduxMonsterRegistry;

module.exports = (function ()
{
    /**
     *  @typedef {import("redux-monster").ReduxMonster} AnyReduxMonster
     */

    /**
     *  @param {...AnyReduxMonster} [monsters]
     */
    function useMonsters()
    {
        /** @type {AnyReduxMonster[]} */var monsters = Array.from(arguments);
        var i;
        for(i = 0; i < monsters.length; ++i)
        {
            if(!isNonNullObject(monsters[i]))
            {
                throw new TypeError("The parameters must satisfy \"redux-monster\".ReduxMonster interface.");
            }
        }

        var memoizedMonsters = useDeepMemo(
            function ()
            {
                return monsters;
            },
            monsters,
            shallowEquals
        );
        var reduxStore = useStore();
        var registry = (reduxStore ? ReduxMonsterRegistry.findFromReduxStore(reduxStore) : null);
        useEffect(
            function ()
            {
                if(registry && memoizedMonsters)
                {
                    for(var i = 0; i < memoizedMonsters.length; ++i)
                    {
                        registry.registerMonster(memoizedMonsters[i]);
                    }
                }
            },
            [registry, memoizedMonsters]
        );
    }

    return {
        useMonsters : useMonsters
    };
})();
