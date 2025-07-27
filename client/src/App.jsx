import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // ✅ Declared here
  const navigate = useNavigate();

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/repos", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/"); // not authenticated
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }

      const data = await response.json();
      setRepos(data);
    } catch (err) {
      setError(err.message); // ✅ using err here
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

  useEffect(() => {
    fetchRepos();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {repos.map((repo, idx) => (
          <li key={idx}>
            <h3>{repo.name}</h3>
            <p>{repo.description}</p>
            <p>⭐ Stars: {repo.stars} | 🍴 Forks: {repo.forks}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
