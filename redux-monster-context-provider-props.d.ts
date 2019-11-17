import { Action, AnyAction } from "redux";

import { ReduxMonsterContextValue } from "./redux-monster-context-value";

declare interface ReduxMonsterContextProviderProps<S = any, A extends Action = AnyAction> extends ReduxMonsterContextValue<S, A>
{

}

export {
    ReduxMonsterContextProviderProps,
};
