import React from "react";
import { Link } from "react-router-dom";
import UserInfo from "../UserInfo/UserInfo";

const About = () => {
    return (
        <div className="flex flex-col w-full border-opacity-50">
            <div className="flex gap-6 items-center justify-center h-96">
                <Link to="/login">
                    <button className="btn btn-primary">Login</button>
                </Link>
                <Link to="/signup">
                    <button className="btn btn-primary">Sign Up</button>
                </Link>
            </div>
            <div className="divider">you are visiting from</div>
            <div className="text-center">
                <UserInfo />
            </div>
        </div>
    );
};

export default About;
