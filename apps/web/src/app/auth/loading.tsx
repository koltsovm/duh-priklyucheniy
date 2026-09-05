export default function AuthLoading() {
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center", padding: 40 }}>
      <div className="skeleton skeleton--text" style={{ width: "40%", height: "2rem", margin: "0 auto 16px" }} />
      <div className="skeleton skeleton--text" style={{ width: "60%", height: "1rem", margin: "0 auto 8px" }} />
      <div className="skeleton skeleton--text" style={{ width: "80%", height: "1rem", margin: "0 auto 8px" }} />
      <div className="skeleton skeleton--text" style={{ width: "50%", height: "1rem", margin: "0 auto" }} />
    </div>
  );
}