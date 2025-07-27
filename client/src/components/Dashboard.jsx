import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is logged in
    fetch("http://localhost:5000/api/user", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => navigate("/"));
  }, [navigate]);

  const fetchRepos = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:5000/api/repos", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }

      const data = await response.json();
      setRepos(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch("http://localhost:5000/api/logout", {
      method: "POST",
      credentials: "include",
    });
    navigate("/");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dashboard</h2>
      {user && <p>Welcome, {user.name}</p>}
      <button onClick={fetchRepos}>Fetch Repositories</button>
      <button onClick={handleLogout} style={{ marginLeft: "10px" }}>
        Logout
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {repos.map((repo, idx) => (
          <li key={idx} style={{ marginBottom: "10px" }}>
            <h3>
              <a href={repo.html_url} target="_blank" rel="noreferrer">
                {repo.name}
              </a>
            </h3>
            <p>{repo.description}</p>
            <p>⭐ Stars: {repo.stargazers_count}</p>
            <p>🍴 Forks: {repo.forks_count}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
