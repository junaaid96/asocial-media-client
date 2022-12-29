import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthProvider";
import UserInfo from "../UserInfo/UserInfo";
import UserModal from "./UserModal";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

const About = () => {
    const { user, logOut } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [userData, setUserData] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:5000/user/${user?.email}`)
            .then((res) => res.json())
            .then((data) => {
                setUserData(data);
                setLoading(false);
            });
    }, [user?.email]);

    if (loading) {
        return <LoadingScreen />;
    }

    const openModal = (event) => {
        event.preventDefault();
        setIsModalOpen(true);
    };

    const closeModal = (event) => {
        event.preventDefault();
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-col w-full border-opacity-50">
            <div className="flex gap-3 items-center justify-center h-screen">
                {user?.email ? (
                    <div className="flex flex-col items-center">
                        <div className="avatar">
                            <div className="w-24 rounded-full">
                                <img src={userData.photo} alt="profile" />
                            </div>
                        </div>
                        <form className="w-96">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Username</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="username"
                                    className="input input-bordered "
                                    defaultValue={userData.username}
                                    readOnly
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Email</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="email"
                                    className="input input-bordered "
                                    defaultValue={userData.email}
                                    readOnly
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">
                                        Institute
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    name="institute"
                                    placeholder="school/college/university"
                                    className="input input-bordered "
                                    defaultValue={userData.institute}
                                    readOnly
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Address</span>
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="address"
                                    className="input input-bordered "
                                    defaultValue={userData.address}
                                    readOnly
                                />
                            </div>
                            <UserModal />
                            <div className="form-control mt-6">
                                <button
                                    className="btn btn-primary"
                                    onClick={openModal}
                                >
                                    Edit
                                </button>
                                <UserModal
                                    isOpen={isModalOpen}
                                    closeModal={closeModal}
                                />
                                <button
                                    className="btn btn-outline mt-4"
                                    onClick={logOut}
                                >
                                    Sign Out
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        <Link to="/login">
                            <button className="btn btn-primary">Login</button>
                        </Link>
                        <Link to="/signup">
                            <button className="btn btn-primary">Sign Up</button>
                        </Link>
                    </>
                )}
            </div>
            <div className="divider">you are visiting from</div>
            <div className="text-center">
                <UserInfo />
            </div>
        </div>
    );
};

export default About;
