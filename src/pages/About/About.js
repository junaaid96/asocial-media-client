import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthProvider";
import UserModal from "./UserModal";
import LoadingScreen from "../LoadingScreen/LoadingScreen";
import { UserDataContext } from "../../contexts/UserData";
import { toast } from "react-hot-toast";
// import VisitingInfo from "../VisitingInfo/VisitingInfo";

const About = () => {
    const { user, updateUser, logOut } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { userInformation } = useContext(UserDataContext);
    const { userData, isLoading, refetch } = userInformation;
    const [newUserData, setNewUserData] = useState([]);

    //update state with updated user information after closing modal
    useEffect(() => {
        setNewUserData(userData);
    }, [userData]);

    //update user data
    const handleUpdate = (data) => {
        const updatedData = {
            username: data.username,
            institute: data.institute,
            address: data.address,
        };
        fetch(`https://asocial-media-server.onrender.com/user/${user?.email}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(updatedData),
        }).then((res) => {
            if (res.status === 200) {
                const userInformation = {
                    displayName: data.username,
                };
                console.log(userInformation);
                console.log(user);
                //update user's display name
                updateUser(userInformation);
                //update existing post's username
                fetch(
                    `https://asocial-media-server.onrender.com/posts/${user?.email}`,
                    {
                        method: "PATCH",
                        headers: {
                            "content-type": "application/json",
                        },
                        body: JSON.stringify({
                            username: data.username,
                        }),
                    }
                )
                    .then((res) => res.json())
                    .then((data) => console.log(data));

                toast.success("Saved successfully");
                refetch();
                closeModal();
            }
        });
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <>
            <h2 className="text-3xl font-bold text-center">User Information</h2>
            <div className="flex gap-3 items-center justify-center h-screen">
                <div className="flex flex-col items-center">
                    <div className="avatar">
                        <div className="w-24 rounded-full">
                            <img src={userData.photo} alt="profile" />
                        </div>
                    </div>
                    <div className="w-96">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Username</span>
                            </label>
                            <input
                                type="text"
                                name="username"
                                placeholder="username"
                                className="input input-bordered "
                                defaultValue={newUserData.username}
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
                                <span className="label-text">Institute</span>
                            </label>
                            <input
                                type="text"
                                name="institute"
                                placeholder="school/college/university"
                                className="input input-bordered "
                                defaultValue={newUserData.institute}
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
                                defaultValue={newUserData.address}
                                readOnly
                            />
                        </div>
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
                                handleUpdate={handleUpdate}
                            />
                            <button
                                className="btn btn-outline mt-4"
                                onClick={logOut}
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="divider">you are visiting from</div>
            {/* <div className="text-center">{<VisitingInfo />}</div> */}
        </>
    );
};

export default About;
