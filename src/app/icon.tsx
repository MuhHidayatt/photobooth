import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Icon generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 18,
          background: "#F6A04D", // Posean Warm Orange
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "6px",
          border: "1.5px solid #2D3142",
        }}
      >
        📸
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
