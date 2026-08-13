export type AuthActionState = {
  message: string | null;
  status: 'error' | 'success' | 'idle';
};

export const initialAuthActionState: AuthActionState = {
  message: null,
  status: 'idle',
};
