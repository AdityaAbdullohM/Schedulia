import { Suspense } from "react";
import LoginContent from "./login-content";

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
