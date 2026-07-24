"use client";
import { useServerStore } from "../store/serverStore";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
function ServerProvider({children}: {children: React.ReactNode}) {
  const { connectSocket } = useServerStore();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const connectToSocket = () => {
    if (userId) {
      connectSocket(userId);
    }
  };
  useEffect(() => {
    connectToSocket();
  }, [userId]);
  return <>{children}</>;
}

export default ServerProvider;
