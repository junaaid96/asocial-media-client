import React, { useState, useEffect } from "react";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

const UserInfo = () => {
    const [ip, setIp] = useState("");
    const [location, setLocation] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchIp() {
            const res = await fetch("https://api.ipify.org?format=json");
            const data = await res.json();
            setIp(data.ip);
        }

        async function fetchLocation() {
            const res = await fetch(`https://ipapi.co/${ip}/json/`);
            const data = await res.json();
            setLocation(
                `${data.city}, ${data.region}-${data.postal}, ${data.country_name}`
            );
            setLoading(false);
        }

        fetchIp();
        fetchLocation();
    }, [ip]);

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div>
            <p>IP Address: {ip}</p>
            <p>Location: {location}</p>
        </div>
    );
};

export default UserInfo;