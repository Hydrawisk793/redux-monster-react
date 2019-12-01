import React from "react";
import { connect } from "react-redux";
import hoistNonReactStatics from "hoist-non-react-statics";

import { isUndefinedOrNull, isString, isCallable } from "../../lib/kaphein-js/utils/type-trait";
import { deepEquals } from "../../lib/kaphein-js/utils/object";
import { memoize } from "../../lib/kaphein-js/utils/function";

import { ReduxMonster } from "../redux-monster";
import { Dispatch } from "redux";
import { ConnectedComponent } from "react-redux";

function createMonsterEnhancer<M extends Record<string, ReduxMonster | string>, StateProps = {}, DispatchProps = {}>(
    monsters : M,
    mapState : (
        monsterStates : { [K in keyof M] : (M[K] extends ReduxMonster ? M[K]["initialState"] : (M[K] extends string ? any : never)) }
    ) => StateProps,
    mapDispatch : (
        monsterActionCreators : { [K in keyof M] : (M[K] extends ReduxMonster ? M[K]["actionCreators"] : (M[K] extends string ? any : never)) }
    ) => DispatchProps,
)
{
    var monsterEntries = Object.entries(monsters);
    var monsterOwnStateKeys = monsterEntries.reduce(
        function (monsterOwnStateKeys, pair)
        {
            var monster = pair[1];
            if(isString(monster)) {
                monsterOwnStateKeys[pair[0]] = monster;
            }

            return monsterOwnStateKeys;
        },
        {} as Record<string, string>
    ) as { [K2 in ({ [K in keyof M] : (M[K] extends string ? K : never)}[keyof M])] : M[K2] extends string ? M[K2] : never };
    var monsterOwnStateKeyEntries = Object.entries(monsterOwnStateKeys);
    var actualMonsters = monsterEntries.reduce(
        function (actualMonsters, pair)
        {
            var monster = pair[1];
            if(!isString(monster) && !isUndefinedOrNull(monster)) {
                actualMonsters[pair[0]] = monster;
            }

            return actualMonsters;
        },
        {} as Record<string, ReduxMonster>
    ) as { [K2 in ({ [K in keyof M] : (M[K] extends ReduxMonster ? K : never)}[keyof M])] : M[K2] extends ReduxMonster ? M[K2] : never };
    var actualMonsterEntries = Object.entries(actualMonsters);

    var reactReduxMapStateToProps = (
        (
            isCallable(mapState)
            && (monsterOwnStateKeyEntries.length > 0 || actualMonsterEntries.length > 0)
        )
        ? (
            memoize(
                function <ReduxStoreState>(state : ReduxStoreState extends Record<string, any> ? ReduxStoreState : Record<string, any>)
                {
                    var monsterStates = {} as Parameters<typeof mapState>["0"];
                    actualMonsterEntries.reduce(
                        function (acc, pair)
                        {
                            var monster = pair[1] as ReduxMonster;
                            var ownStateKey = monster.ownStateKey;
                            acc[pair[0] as keyof M] = ownStateKey in state ? state[ownStateKey] as typeof monster["initialState"] : Object.assign({}, monster.initialState);

                            return acc;
                        },
                        monsterStates
                    );
                    monsterOwnStateKeyEntries.reduce(
                        function (acc, pair)
                        {
                            var monsterOwnStateKey = pair[1] as string;
                            if(monsterOwnStateKey in state) {
                                acc[pair[0] as keyof M] = state[monsterOwnStateKey];
                            }

                            return acc;
                        },
                        monsterStates
                    );

                    return mapState(monsterStates);
                },
                {
                    alwaysEvaluate : true,
                }
            )
        )
        : null
    );

    var reactReduxMapDispatchToProps = (
        isCallable(mapDispatch)
        ? (
            function ()
            {
                var cacheScope = {
                    monsters : monsters,
                    dispacth : null as unknown as Dispatch,
                    monsterOwnStateKeyEntries : monsterOwnStateKeyEntries,
                    actualMonsterActionCreators : actualMonsterEntries.reduce(
                        function (acc, pair)
                        {
                            var monster = pair[1] as ReduxMonster;
                            acc[pair[0] as keyof M] = monster.actionCreators;

                            return acc;
                        },
                        {} as Parameters<typeof mapDispatch>["0"]
                    ),
                    props : {} as ReturnType<typeof mapDispatch>,
                };

                return function <OwnProps = any>(dispatch : Dispatch, ownProps : OwnProps)
                {
                    if(cacheScope.dispacth !== dispatch) {
                        var props = Object
                            .entries(
                                mapDispatch(
                                    // Object.assign(
                                    //     cacheScope.monsterOwnStateKeyEntries.reduce(
                                    //         function (acc, pair)
                                    //         {
                                    //             var monsterOwnStateKey = pair[1] as string;

                                    //             //TODO : Find the actual monster with own state key from a registry;
                                    //             throw new Error("Not implemented yet...");
                                    //         },
                                    //         {} as Parameters<typeof mapDispatch>["0"]
                                    //     ),
                                    //     actualMonsterActionCreators
                                    // )
                                    cacheScope.actualMonsterActionCreators
                                )
                            )
                            .reduce(
                                function (acc, pair)
                                {
                                    var actionCreator = pair[1];

                                    acc[pair[0]] = function (...args : Parameters<typeof actionCreator>)
                                    {
                                        return dispatch(actionCreator.apply(null, args));
                                    };

                                    return acc;
                                },
                                {} as Record<string, any>
                            ) as ReturnType<typeof mapDispatch>
                        ;

                        if(!deepEquals(cacheScope.props, props)) {
                            cacheScope.props = props;
                        }
                    }

                    return cacheScope.props;
                };
            }
        )
        : null
    );

    type InjectedProps = (typeof reactReduxMapStateToProps extends null ? {} : ReturnType<NonNullable<typeof reactReduxMapStateToProps>>)
        & (typeof reactReduxMapDispatchToProps extends null ? {} : ReturnType<ReturnType<NonNullable<typeof reactReduxMapDispatchToProps>>>)
    ;

    var enhanceComponent = connect(
        reactReduxMapStateToProps,
        reactReduxMapDispatchToProps
    );

    return (
        function <C extends React.ComponentType<any> = React.ComponentType<any>>(
            componentType : C
        )
        {
            type OwnProps = Omit<React.ComponentProps<C>, keyof InjectedProps>;

            var E = enhanceComponent<any>(componentType) as ConnectedComponent<React.ComponentType<InjectedProps>, OwnProps>;

            function W(props : React.PropsWithChildren<OwnProps>)
            {
                return (
                    <E
                        { ...props }
                    />
                );
            };
            W.ConnectedComponent = E;
            W.injectedPropType = {} as InjectedProps;
            W.displayName = "WithReduxMonsterProps(" + (componentType.displayName || componentType.name) + ")";
            W.whyDidYouRender = true;

            return hoistNonReactStatics(W, componentType);
        }
    );
};

export {
    createMonsterEnhancer,
};
