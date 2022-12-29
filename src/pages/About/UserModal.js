import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthProvider";

const UserModal = ({ isOpen, closeModal }) => {
    const { user } = useContext(AuthContext);

    const [userData, setUserData] = useState("");

    useEffect((
    ) => {
        fetch(`http://localhost:5000/user/${user?.email}`)
            .then((res) => res.json())
            .then((data) => setUserData(data));
    }, [user?.email]);


    return (
        <>
            {isOpen && (
                <div className="fixed top-0 left-0 bottom-0 right-0 bg-base-100 bg-opacity-75">
                    <div className=" mx-auto h-full flex justify-center items-center">
                        <div className="w-96 h-1/2 bg-base-300 bg-opacity-75 rounded-lg shadow-2xl p-6">
                            <form className="">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="name"
                                        className="input input-bordered"
                                        defaultValue={userData.username}
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Email
                                        </span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="email"
                                        className="input input-bordered "
                                        defaultValue={userData.email}
                                        required
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
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Address
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        placeholder="address"
                                        className="input input-bordered "
                                        defaultValue={userData.address}
                                        required
                                    />
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="btn btn-primary w-full mt-4"
                                >
                                    Save
                                </button>
                            </form>
                            <button
                                onClick={closeModal}
                                className="btn btn-outline w-full mt-4"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserModal;
