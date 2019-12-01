import { Store, Action, AnyAction } from "redux";
import { ReduxMonsterRegistry } from "../redux-monster";

export declare interface ReduxMonsterContextValue<S = any, A extends Action = AnyAction>
{
    reduxStore? : Store<S, A>;

    monsterRegistry? : ReduxMonsterRegistry;
}
