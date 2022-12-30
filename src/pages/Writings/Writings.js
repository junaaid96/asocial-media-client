import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthProvider";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

const Writings = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm();
    const [loading, setLoading] = useState(false);

    const { user } = useContext(AuthContext);
    const userImageHostingKey = process.env.REACT_APP_imgbb_api;
    const navigate = useNavigate();

    const handlePost = (data) => {
        setLoading(true);
        //upload user's posted photo
        const formData = new FormData();
        formData.append("image", data.photo[0]);
        const url = `https://api.imgbb.com/1/upload?key=${userImageHostingKey}`;
        fetch(url, {
            method: "POST",
            body: formData,
        })
            .then((res) => res.json())
            .then((imageData) => {
                const username = user.displayName;
                const email = user.email;
                const writings = data.writings;
                const photo = imageData.data.display_url;
                const post = { username, email, writings, photo };
                fetch("http://localhost:5000/posts", {
                    method: "POST",
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                    },
                    body: JSON.stringify(post),
                }).then((res) => {
                    if (res.status === 200) {
                        setLoading(false);
                        reset();
                        toast.success("Posted Successfully");
                        navigate("/media");
                    }
                });
            });
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="w-1/2 m-auto bg-base-300 p-5">
            <form onSubmit={handleSubmit(handlePost)}>
                <div className="form-control">
                    <input
                        {...register("writings", {
                            required: "cannot be empty",
                        })}
                        type="text"
                        placeholder="write your thoughts..."
                        className="input input-bordered input-primary"
                    />
                    {errors.writings && (
                        <p className="text-red-500">
                            {errors.writings.message}
                        </p>
                    )}
                </div>
                <div className="form-control mt-1">
                    <input
                        {...register("photo", {
                            required: "Photo is Required",
                        })}
                        type="file"
                        placeholder="photo"
                        className="file-input file-input-bordered input-primary file-input-sm w-full max-w-xs"
                    />
                    {errors.photo && (
                        <p className="text-red-500">{errors.photo.message}</p>
                    )}
                </div>
                <div className="form-control mt-6">
                    <button type="submit" className="btn btn-primary">
                        Post
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Writings;
