import { ReduxMonster } from "redux-monster";

declare interface MonsterEnhancerConstructionOption<
    M extends Record<string, ReduxMonster | string> = {},
    StateProps = {},
    DispatchProps = {}
>
{
    monsters : M;

    mapState? : (
        monsterStates : { [K in keyof M] : (M[K] extends ReduxMonster ? M[K]["initialState"] : (M[K] extends string ? any : never)) }
    ) => StateProps;

    mapDispatch? : (
        monsterActionCreators : { [K in keyof M] : (M[K] extends ReduxMonster ? M[K]["actionCreators"] : (M[K] extends string ? any : never)) }
    ) => DispatchProps;
}

export {
    MonsterEnhancerConstructionOption,
};
