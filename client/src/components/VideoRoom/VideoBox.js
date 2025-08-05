import React, { forwardRef } from "react";

const VideoBox = forwardRef(({ id, muted }, ref) => (
  <div style={{ display: "inline-block", margin: "5px" }}>
    <video
      id={id === "local" ? "localVideo" : "remote-" + id}
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      width={320}
      height={240}
      style={{ border: "2px solid black" }}
    ></video>
  </div>
));

export default VideoBox;
