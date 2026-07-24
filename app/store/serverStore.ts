import { create } from "zustand";
import io from "socket.io-client";
interface ServerStore {
  onlineUsers: string[];
  socket: any;
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
}
export const useServerStore = create<ServerStore>((set, get) => ({
  onlineUsers: [],
  socket: null,
  connectSocket: (userId: string) => {
    if (!userId || get().socket) return;
    const socket = io(process.env.NEXT_PUBLIC_APP_URL, {
      query: { userId },
    });
    socket.on("receiverList", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });
    set({ socket: socket });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));
