import React from "react";
import { connect, ReactReduxContext } from "react-redux";
import hoistNonReactStatics from "hoist-non-react-statics";
import { Dispatch } from "redux";
import { ConnectedComponent } from "react-redux";
import { ReduxMonster, ReduxMonsterRegistry } from "redux-monster";
import {
    isUndefinedOrNull, isString, isCallable,
    deepEquals, memoize
} from "kaphein-js";

export function createMonsterEnhancer<
    M extends Record<string, ReduxMonster | string>,
    StateProps = {},
    DispatchProps = {}
>(
    monsters : M,
    mapState : <ReduxStoreState extends Record<string, any> = Record<string, any>, OwnProps = {}>(
        monsterStates : { [K in keyof M] : (M[K] extends ReduxMonster ? M[K]["initialState"] : (M[K] extends string ? any : never)) },
        rootState? : ReduxStoreState,
        context? : {},
        ownProps? : OwnProps
    ) => StateProps,
    mapDispatch : (
        monsterActionCreators : { [K in keyof M] : (M[K] extends ReduxMonster ? M[K]["actionCreators"] : (M[K] extends string ? any : never)) }
    ) => DispatchProps
)
{
    const monsterEntries = Object.entries(monsters);
    const monsterOwnStateKeys = monsterEntries.reduce(
        function (monsterOwnStateKeys, pair)
        {
            const monster = pair[1];
            if(isString(monster)) {
                monsterOwnStateKeys[pair[0]] = monster;
            }

            return monsterOwnStateKeys;
        },
        {} as Record<string, string>
    ) as { [K2 in ({ [K in keyof M] : (M[K] extends string ? K : never)}[keyof M])] : M[K2] extends string ? M[K2] : never };
    const monsterOwnStateKeyEntries = Object.entries(monsterOwnStateKeys);
    const actualMonsters = monsterEntries.reduce(
        function (actualMonsters, pair)
        {
            const monster = pair[1];
            if(!isString(monster) && !isUndefinedOrNull(monster)) {
                actualMonsters[pair[0]] = monster;
            }

            return actualMonsters;
        },
        {} as Record<string, ReduxMonster>
    ) as { [K2 in ({ [K in keyof M] : (M[K] extends ReduxMonster ? K : never)}[keyof M])] : M[K2] extends ReduxMonster ? M[K2] : never };
    const actualMonsterEntries = Object.entries(actualMonsters);

    const reactReduxMapStateToProps = (function ()
    {
        if (
            isCallable(mapState)
            && (monsterOwnStateKeyEntries.length > 0 || actualMonsterEntries.length > 0)
        ) {
            const createMonsterStates = function <ReduxStoreState>(state : ReduxStoreState)
            {
                const monsterStates = {} as Parameters<typeof mapState>["0"];
                actualMonsterEntries.reduce(
                    function (acc, pair)
                    {
                        const monster = pair[1] as ReduxMonster;
                        const ownStateKey = monster.ownStateKey;
                        acc[pair[0] as keyof M] = ownStateKey in state ? state[ownStateKey] as typeof monster["initialState"] : Object.assign({}, monster.initialState);

                        return acc;
                    },
                    monsterStates
                );
                monsterOwnStateKeyEntries.reduce(
                    function (acc, pair)
                    {
                        const monsterOwnStateKey = pair[1] as string;
                        if(monsterOwnStateKey in state) {
                            acc[pair[0] as keyof M] = state[monsterOwnStateKey];
                        }

                        return acc;
                    },
                    monsterStates
                );

                return monsterStates;
            };

            const finalFunction = (
                mapState.length >= 4
                ? function <ReduxStoreState, OwnProps>(state : ReduxStoreState, ownProps : OwnProps)
                {
                    return mapState(createMonsterStates(state), state, {}, ownProps);
                }
                : function <ReduxStoreState>(state : ReduxStoreState)
                {
                    return mapState(createMonsterStates(state), state, {});
                }
            );

            return memoize(
                finalFunction,
                {
                    alwaysEvaluate : true,
                }
            );
        }
        else {
            return null;
        }
    })();

    const reactReduxMapDispatchToProps = (
        isCallable(mapDispatch)
        ? (
            function ()
            {
                const cacheScope = {
                    monsters : monsters,
                    dispacth : null as unknown as Dispatch,
                    monsterOwnStateKeyEntries : monsterOwnStateKeyEntries,
                    actualMonsterActionCreators : actualMonsterEntries.reduce(
                        function (acc, pair)
                        {
                            const monster = pair[1] as ReduxMonster;
                            acc[pair[0] as keyof M] = monster.actionCreators;

                            return acc;
                        },
                        {} as Parameters<typeof mapDispatch>["0"]
                    ),
                    props : {} as ReturnType<typeof mapDispatch>,
                };

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                return function <OwnProps = any>(dispatch : Dispatch, ownProps : OwnProps)
                {
                    if(cacheScope.dispacth !== dispatch) {
                        const mappedActionCreators = mapDispatch(
                            // Object.assign(
                            //     cacheScope.monsterOwnStateKeyEntries.reduce(
                            //         function (acc, pair)
                            //         {
                            //             const monsterOwnStateKey = pair[1] as string;

                            //             //TODO : Find the actual monster with own state key from a registry;
                            //             throw new Error("Not implemented yet...");
                            //         },
                            //         {} as Parameters<typeof mapDispatch>["0"]
                            //     ),
                            //     actualMonsterActionCreators
                            // )
                            cacheScope.actualMonsterActionCreators
                        );

                        const props = (
                            mappedActionCreators
                            ? Object
                                .entries(mappedActionCreators)
                                .reduce(
                                    function (acc, pair)
                                    {
                                        const actionCreator = pair[1];

                                        acc[pair[0]] = function (...args : Parameters<typeof actionCreator>)
                                        {
                                            return dispatch(actionCreator.apply(null, args));
                                        };

                                        return acc;
                                    },
                                    {} as Record<string, any>
                                ) as ReturnType<typeof mapDispatch>
                            : {}
                        ) as DispatchProps;

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

    const enhanceComponent = connect(
        reactReduxMapStateToProps,
        reactReduxMapDispatchToProps
    );

    return (
        function <C extends React.ComponentType<any> = React.ComponentType<any>>(
            componentType : C
        )
        {
            type OwnProps = Omit<React.ComponentProps<C>, keyof InjectedProps>;

            const E = enhanceComponent<any>(componentType) as ConnectedComponent<React.ComponentType<InjectedProps>, OwnProps>;

            function W(props : OwnProps)
            {
                return (
                    <>
                        <ReactReduxContext.Consumer>
                            {
                                (context) =>
                                {
                                    if(context) {
                                        const monsterRegistry = ReduxMonsterRegistry.findMonsterRegistryFromReduxStore(context.store);
                                        if(null !== monsterRegistry) {
                                            for(let count = actualMonsterEntries.length, i = 0; i < count; ++i) {
                                                const monster = actualMonsterEntries[i][1] as ReduxMonster;
                                                monsterRegistry.registerMonster(monster);
                                            }
                                        }
                                    }

                                    return null;
                                }
                            }
                        </ReactReduxContext.Consumer>
                        <E
                            { ...props }
                        />
                    </>
                );
            }
            W.ConnectedComponent = E;
            W.OwnPropType = {} as OwnProps;
            W.injectedPropType = {} as InjectedProps;
            W.displayName = "WithReduxMonsterProps(" + (componentType.displayName || componentType.name) + ")";
            W.whyDidYouRender = true;

            return hoistNonReactStatics(hoistNonReactStatics(React.memo(W), W), componentType);
            // return hoistNonReactStatics(W, componentType);
        }
    );
}
