import React, { createContext, useEffect, useState } from "react";
import firebaseApp from "../firebase/firebase.config";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";

export const AuthContext = createContext();
const auth = getAuth(firebaseApp);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const createUser = (email, password) => {
        setLoading(true);
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const existingUser = (email, password) => {
        setLoading(true);
        return signInWithEmailAndPassword(auth, email, password);
    };

    const updateUser = (userInfo) => {
        return updateProfile(auth.currentUser, userInfo);
    };

    const providerLogin = (provider) => {
        setLoading(true);
        return signInWithPopup(auth, provider);
    };

    const logOut = () => {
        setLoading(true);
        return signOut(auth);
    };

    useEffect(() => {
        const observingUser = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => observingUser(); // unsubscribe
    }, []);

    const authInformation = {
        createUser,
        existingUser,
        updateUser,
        providerLogin,
        logOut,
        user,
        loading,
    };
    return (
        <AuthContext.Provider value={authInformation}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
