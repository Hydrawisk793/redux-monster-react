import { Store, Action, AnyAction } from "redux";
import { ReduxMonsterRegistry } from "../redux-monster";

declare interface ReduxMonsterContextValue<S = any, A extends Action = AnyAction>
{
    reduxStore? : Store<S, A>;

    monsterRegistry? : ReduxMonsterRegistry;
}

export {
    ReduxMonsterContextValue,
};
