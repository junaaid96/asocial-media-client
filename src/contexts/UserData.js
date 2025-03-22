import { useQuery } from "@tanstack/react-query";
import React, { createContext, useContext } from "react";
import { AuthContext } from "./AuthProvider";

export const UserDataContext = createContext();

const UserData = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    
    const {
        data: userData = [],
        isLoading: isUserDataLoading,
        refetch,
    } = useQuery({
        queryKey: ["userData", user?.email],
        queryFn: async () => {
            const res = await fetch(
                `http://localhost:5000/user/${user?.email}`
            );
            const data = await res.json();
            return data;
        },
        enabled: !loading && !!user?.email,
    });

    // Combined loading state
    const isLoading = loading || isUserDataLoading;

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
