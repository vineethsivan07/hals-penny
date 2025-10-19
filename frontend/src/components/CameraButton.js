import React, { useRef } from "react";
import { Camera } from "lucide-react"; // optional icon library

const CameraButton = ({ onImageCapture }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImageCapture(file); // send file to parent
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Visible camera button */}
      <button
        onClick={() => fileInputRef.current.click()}
        className="camera-button"
        title="Take or upload photo"
      >
        <Camera size={20} />
      </button>
    </>
  );
};

export default CameraButton;
