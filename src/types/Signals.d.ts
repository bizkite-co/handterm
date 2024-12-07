export interface AppSignals {
  isInLoginProcessSignal: { value: boolean };
  setIsInLoginProcess: (value: boolean) => void;
  setTempUserName: (username: string) => void;
  tempUserNameSignal: { value: string };
}
