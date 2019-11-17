var React = require("react");
var Provider = require("react-redux").Provider;

var ReduxMonsterContext = require("./redux-monster-context").ReduxMonsterContext;

const ReduxMonsterContextProvider =
React.memo(
/**
 *  @template S, A
 *  @param {React.PropsWithChildren<import("./redux-monster-context-provider-props").ReduxMonsterContextProviderProps<S, A>>} props
 */
function (props)
{
    var reduxStore = props.reduxStore;
    var monsterRegistry = props.monsterRegistry;
    var contextValue = React.useMemo(
        function ()
        {
            return (
                /**
                 *  @type {import("./redux-monster-context-value").ReduxMonsterContextValue<S, A>}
                 */
                {
                    reduxStore,
                    monsterRegistry,
                }
            );
        },
        [
            reduxStore,
            monsterRegistry,
        ]
    );

    return React.createElement(
        Provider,
        {
            store: contextValue.reduxStore
        },
        React.createElement(
            ReduxMonsterContext.Provider,
            {
                value: contextValue
            },
            props.children
        )
    );
}
);

module.exports = {
    ReduxMonsterContextProvider : ReduxMonsterContextProvider,
};
