import { useQuery } from "@tanstack/react-query";
import React, { createContext, useContext } from "react";
import { AuthContext } from "./AuthProvider";

export const UserDataContext = createContext();

const UserData = ({ children }) => {
    const { user } = useContext(AuthContext);
    const {
        data: userData = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["userData", user?.email],
        queryFn: async () => {
            const res = await fetch(
                `https://asocial-media-server.vercel.app/user/${user?.email}`
            );
            const data = await res.json();
            return data;
        },
    });

    const userInformation = {
        userData,
        isLoading,
        refetch,
    };

    return (
        <UserDataContext.Provider value={{ userInformation }}>
            {children}
        </UserDataContext.Provider>
    );
};

export default UserData;
