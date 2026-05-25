import { createContext, useContext, useState, useEffect } from "react";
import { apiPost, apiGet, apiFetch, setToken, getToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from token on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiGet("/auth/me")
      .then((res) => {
        if (res.success) setCurrentUser(res.data.user);
        else setToken(null);
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await apiPost("/auth/login", { email, password });
    if (!res.success) return { success: false, message: res.message };
    setToken(res.data.token);
    setCurrentUser(res.data.user);
    return { success: true, user: res.data.user };
  }

  async function register(data) {
    const res = await apiPost("/auth/register", {
      name:     data.name,
      email:    data.email,
      password: data.password,
      phone:    data.phone || "",
    });
    if (!res.success) return { success: false, message: res.message };
    setToken(res.data.token);
    setCurrentUser(res.data.user);
    return { success: true, user: res.data.user };
  }

  function logout() {
    apiPost("/auth/logout", {}).catch(() => {});
    setToken(null);
    setCurrentUser(null);
  }

  async function updateProfile(data) {
    const formData = new FormData();
    if (data.name)              formData.append("name",     data.name);
    if (data.phone !== undefined) formData.append("phone",  data.phone);
    if (data.bio  !== undefined)  formData.append("bio",    data.bio);
    if (data.location !== undefined) formData.append("location", data.location);
    if (data.avatarFile)        formData.append("avatar",   data.avatarFile);

    const res = await apiFetch("/users/profile", { method: "PUT", body: formData });
    if (!res.success) return { success: false, message: res.message };
    setCurrentUser(res.data.user);
    return { success: true };
  }

  async function changePassword(oldPassword, newPassword) {
    const res = await apiFetch("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({ oldPassword, newPassword }),
      headers: { "Content-Type": "application/json" },
    });
    return res;
  }

  async function refreshUser() {
    const res = await apiGet("/auth/me");
    if (res.success) setCurrentUser(res.data.user);
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout, updateProfile, changePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
