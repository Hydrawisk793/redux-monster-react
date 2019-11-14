import React from "react";
import { connect } from "react-redux";
import hoistNonReactStatics from "hoist-non-react-statics";

import { deepEquals } from "../../lib/kaphein-js/utils/object";
import { memoize } from "../../lib/kaphein-js/utils/function";

import { ReduxMonster } from "../../lib/redux-monster";
import { Dispatch } from "redux";
import { ConnectedComponent } from "react-redux";

function _createReactReduxMapStateToProps<M extends Record<string, ReduxMonster>, StateProps>(
    monsters : M,
    mapState : (monsterStates : { [K in keyof M] : M[K]["initialState"] }) => StateProps,
)
{
    return function ()
    {
        return memoize(
            function <ReduxStoreState>(state : ReduxStoreState extends Record<string, any> ? ReduxStoreState : Record<string, any>)
            {
                return mapState(
                    Object.keys(monsters).reduce(
                        function (monsterStates, key : keyof M)
                        {
                            var monster = monsters[key];
                            var ownStateKey = monsters[key].ownStateKey;
                            monsterStates[key] = ownStateKey in state ? state[ownStateKey] : Object.assign({}, monster.initialState);

                            return monsterStates;
                        },
                        {} as Parameters<typeof mapState>["0"]
                    )
                );
            },
            {
                alwaysEvaluate : true,
            }
        );
    };
};

function _createReactReduxMapDispatchToProps<M extends Record<string, ReduxMonster>, DispatchProps extends Record<string, (...args : any[]) => any>>(
    monsters : M,
    mapDispatch : (monsterActionCreators : { [K in keyof M] : (M[K]["actionCreators"]) }) => DispatchProps,
)
{
    return function ()
    {
        var cacheScope = {
            monsters : monsters,
            dispacth : null as unknown as Dispatch,
            props : {} as DispatchProps,
        };

        return function <OwnProps = any>(dispatch : Dispatch, ownProps : OwnProps)
        {
            if(cacheScope.dispacth !== dispatch) {
                var actionCreatorProps = mapDispatch(
                    Object.keys(cacheScope.monsters).reduce(
                        function (monsterActionCreators, key : keyof M)
                        {
                            monsterActionCreators[key] = cacheScope.monsters[key].actionCreators;

                            return monsterActionCreators;
                        },
                        {} as Parameters<typeof mapDispatch>["0"]
                    )
                );

                var props = Object.keys(actionCreatorProps).reduce(
                    function (props, actionCreatorPropName : keyof DispatchProps)
                    {
                        var actionCreator = actionCreatorProps[actionCreatorPropName];

                        props[actionCreatorPropName] = function (...args : Parameters<typeof actionCreator>)
                        {
                            return dispatch(actionCreator.apply(null, args));
                        };

                        return props;
                    },
                    {} as Record<keyof DispatchProps, (...args : any[]) => any>
                )  as DispatchProps;

                if(!deepEquals(cacheScope.props, props)) {
                    cacheScope.props = props;
                }
            }

            return cacheScope.props;
        }; 
    };
};

function createMonsterEnhancer<M extends Record<string, ReduxMonster>, StateProps, DispatchProps extends Record<string, (...args : any[]) => any>>(
    monsters : M,
    mapState : (monsterStates : { [K in keyof M] : (M[K]["initialState"]) }) => StateProps,
    mapDispatch : (monsterActionCreators : { [K in keyof M] : (M[K]["actionCreators"]) }) => DispatchProps,
)
{
    var reactReduxMapStateToProps = _createReactReduxMapStateToProps(monsters, mapState);
    var reactReduxMapDispatchToProps = _createReactReduxMapDispatchToProps(monsters, mapDispatch);

    var enhanceComponent = connect(
        reactReduxMapStateToProps,
        reactReduxMapDispatchToProps
    );

    return function <OwnProps = {}>(componentType : React.ComponentType<StateProps & DispatchProps & OwnProps>)
    {
        var E = enhanceComponent<any>(componentType) as ConnectedComponent<React.ComponentType<StateProps & DispatchProps>, OwnProps>;

        function W(props : OwnProps)
        {
            return (
                <E
                    { ...props }
                />
            );
        };
        W.injectedPropType = {} as StateProps & DispatchProps;
        W.whyDidYouRender = true;
        W.displayName = "WithReduxMonsterProps(" + (componentType.displayName || componentType.name) + ")";

        return hoistNonReactStatics(W, componentType);
    };
};

export {
    createMonsterEnhancer,
};
