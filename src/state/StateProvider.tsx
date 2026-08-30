import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { createContext, PropsWithChildren, useContext, useEffect, useReducer } from 'react';
import { demoState } from './demo';
import { deserializeState, serializeState, STORAGE_KEY } from './logic';
import { Action, reducer, Store } from './reducer';

type StateContextValue = Store & { dispatch: React.Dispatch<Action> };
const StateContext = createContext<StateContextValue | null>(null);

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function StateProvider({ children }: PropsWithChildren) {
  const [store, dispatch] = useReducer(reducer, { data: demoState(), past: [], future: [], hydrated: false });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => dispatch({ type: 'HYDRATE', data: deserializeState(raw) }))
      .catch(() => dispatch({ type: 'HYDRATE', data: demoState() }));
  }, []);

  useEffect(() => {
    if (!store.hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, serializeState(store.data)).catch(() => undefined);
  }, [store.data, store.hydrated]);

  useEffect(() => {
    if (store.hydrated) SplashScreen.hideAsync().catch(() => undefined);
  }, [store.hydrated]);

  if (!store.hydrated) return null;
  return <StateContext.Provider value={{ ...store, dispatch }}>{children}</StateContext.Provider>;
}

export function useAppState() {
  const value = useContext(StateContext);
  if (!value) throw new Error('useAppState deve essere usato dentro StateProvider');
  return value;
}
