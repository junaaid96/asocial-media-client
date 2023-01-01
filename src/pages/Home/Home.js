import React, { useContext } from "react";
import { AuthContext } from "../../contexts/AuthProvider";
import AllMedia from "../Media/AllMedia";
import Writings from "../Writings/Writings";
import Header from "./Header/Header";

const Home = () => {
    const { user } = useContext(AuthContext);
    return (
        <>
            {user ? (
                <>
                    <Writings />
                </>
            ) : (
                <>
                    <Header />
                    <AllMedia />
                </>
            )}
        </>
    );
};

export default Home;
