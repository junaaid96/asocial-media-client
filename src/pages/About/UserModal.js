import { useQuery } from "@tanstack/react-query";
import React, { useContext } from "react";
import { toast } from "react-hot-toast";
import { AuthContext } from "../../contexts/AuthProvider";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

const UserModal = ({ isOpen, closeModal }) => {
    const { user } = useContext(AuthContext);

    const {
        data: userData = [],
        isLoading,
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
    });

    //update user data
    const handleUpdate = (event) => {
        event.preventDefault();
        const form = event.target;
        const username = form.username.value;
        const institute = form.institute.value;
        const address = form.address.value;
        const updatedData = {
            username,
            institute,
            address,
        };
        console.log(updatedData);
        fetch(`http://localhost:5000/user/${user?.email}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(updatedData),
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                if (data.modifiedCount > 0) {
                    toast.success("Data updated successfully");
                    refetch();
                    closeModal();
                } else {
                    toast.error("Something went wrong");
                }
            });
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <>
            {isOpen && (
                <div className="fixed top-0 left-0 right-0 bottom-0 bg-base-300 h-fit p-12 w-1/2 z-999 m-auto">
                    <div className=" mx-auto h-full flex justify-center items-center">
                        <div className="w-96 h-1/2 bg-base-100 rounded-lg shadow-2xl p-6">
                            <h3 className="text-2xl font-bold text-center mb-6">Update User Information</h3>
                            <form onSubmit={handleUpdate}>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Userame
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder="username"
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
                                        disabled
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
                                    type="submit"
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
