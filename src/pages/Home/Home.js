import React, { useContext } from "react";
import { AuthContext } from "../../contexts/AuthProvider";
import Writings from "../Writings/Writings";
import Header from "./Header/Header";

const Home = () => {
    const { user } = useContext(AuthContext);
    return (
        <>
            {!user ? (
                <Header />
            ) : (
                <>
                    <Writings />
                </>
            )}
        </>
    );
};

export default Home;
