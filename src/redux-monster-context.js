var React = require("react");

/**
 *  @template S, A
 *  @type {import("./redux-monster-context-value").ReduxMonsterContextValue<S, A>}
 */
var defaultContextValue = {
    reduxStore : null,
    monsterRegistry : null,
};

var ReduxMonsterContext = React.createContext(defaultContextValue);
ReduxMonsterContext.Provider.displayName = "ReduxMonsterContext.Provider";
ReduxMonsterContext.Consumer.displayName = "ReduxMonsterContext.Consumer";

module.exports = {
    ReduxMonsterContext : ReduxMonsterContext,
};
