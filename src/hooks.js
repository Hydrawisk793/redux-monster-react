import { useStore } from "react-redux";
import { ReduxMonsterRegistry } from "redux-monster";

/**
 *  @param {import("redux-monster").ReduxMonster[]} monsters
 */
export function useMonsters(monsters)
{
    const store = useStore();

    if(Array.isArray(monsters)) {
        const monsterRegistry = ReduxMonsterRegistry.findMonsterRegistryFromReduxStore(store);

        for(let i = 0; i < monsters.length; ++i) {
            monsterRegistry.registerMonster(monsters[i]);
        }
    }
}
