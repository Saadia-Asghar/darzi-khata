import { createContext, useContext } from 'react';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  shopName: string;
  role: 'owner' | 'karigar';
  ownerId?: string;        // karigar only: their owner's userId
  ownerShopName?: string;  // karigar only: for display
  createdAt: string;
}

export interface AuthContextValue {
  currentUser: UserAccount | null;
  userId: string;          // always currentUser.id
  dataOwnerId: string;     // for orders/karigars/templates: owner's id. For owner === userId, for karigar === ownerId
  logout: () => void;
  updateCurrentUser: (updates: Partial<UserAccount>) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  userId: 'guest',
  dataOwnerId: 'guest',
  logout: () => {},
  updateCurrentUser: () => {},
});

export function useAuthContext() {
  return useContext(AuthContext);
}
