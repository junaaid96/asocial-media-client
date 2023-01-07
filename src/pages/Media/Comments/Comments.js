import React, { useContext } from "react";
import { toast } from "react-hot-toast";
import { RxCrossCircled } from "react-icons/rx";
import { AuthContext } from "../../../contexts/AuthProvider";

const Comments = ({ userComment, refetch }) => {
    const { user } = useContext(AuthContext);
    const { _id, username, email, comment } = userComment;

    //delete comment
    const handleDeleteComment = () => {
        fetch(`https://asocial-media-server.vercel.app/comment/${_id}`, {
            method: "DELETE",
        }).then((res) => {
            if (res.status === 200) {
                refetch();
                toast.success("Comment deleted successfully!");
            }
        });
    };

    return (
        <div className="bg-gray-600 bg-opacity-50 p-3 rounded-r-lg flex items-start justify-between">
            <div>
                <p className="font-bold">{username}</p>
                <p>{comment}</p>
            </div>
            {email === user?.email && (
                <button onClick={handleDeleteComment}>
                    <RxCrossCircled size={20} />
                </button>
            )}
        </div>
    );
};

export default Comments;
