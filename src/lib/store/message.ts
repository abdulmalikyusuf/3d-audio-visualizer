import { create } from "zustand";

type MessageState = {
  terminalMessage: { message: null | string; isCommand: boolean };
  notification: string | null;
};
type MessageActions = {
  setTerminalMessage: (message: string, isCommand?: boolean) => void;
  showNotification: (message: string) => void;
};

type MessageStore = MessageState & MessageActions;

export const useMessage = create<MessageStore>((set) => ({
  terminalMessage: { message: null, isCommand: false },
  notification: null,
  setTerminalMessage: (message, isCommand) =>
    set({ terminalMessage: { message, isCommand: isCommand ? true : false } }),
  showNotification: (val: string) => set({ notification: val }),
}));
