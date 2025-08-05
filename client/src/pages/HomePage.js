import React, { useState } from "react";

function HomePage() {
  const [meetingLink, setMeetingLink] = useState("");

  const createMeeting = async () => {
    try {
      const res = await fetch("https://video-call-igjd.onrender.com/create-room");
      
      if (!res.ok) throw new Error("Failed to create meeting");
  
      const data = await res.json();
  
      const link = `${window.location.origin}/room/${data.roomId}`;
      setMeetingLink(link);
    } catch (err) {
      console.error("Error creating meeting:", err);
      alert("Could not create meeting. Check backend connection.");
    }
  };
  
  
  

  const joinMeeting = () => {
    if (meetingLink) window.location.href = meetingLink;
  };

  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h1>Video Chat</h1>
      <button onClick={createMeeting}>Create Meeting</button>
      {meetingLink && (
        <div>
          <p>Share this link to join:</p>
          <input type="text" value={meetingLink} readOnly style={{ width: "60%" }} />
        </div>
      )}
      <h3>Or Join with a Link</h3>
      <input
        type="text"
        placeholder="Enter meeting link"
        onChange={(e) => setMeetingLink(e.target.value)}
        style={{ width: "60%", marginBottom: 10 }}
      />
      <button onClick={joinMeeting}>Join Meeting</button>
    </div>
  );
}

export default HomePage;
