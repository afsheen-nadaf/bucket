import React from "react";
import Iridescence from "./Iridescence";

// Memoized component - will never re-render when parent state changes
const AuthBackground = React.memo(() => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 0,
      pointerEvents: "none",
      opacity: 0.4,
    }}
  >
    <Iridescence color={[0.4, 0.6, 1.0]} speed={0.5} amplitude={0.06} />
  </div>
));

AuthBackground.displayName = "AuthBackground";

export default AuthBackground;
