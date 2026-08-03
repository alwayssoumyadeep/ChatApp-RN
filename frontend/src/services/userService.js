import api from "./api";

export async function fetchAllUsers() {
  const res = await api.get("/users");
  return res.data.users;
}

export async function fetchMyProfile() {
  const res = await api.get("/users/me");
  return res.data.user;
}

export async function updateMyProfile(data) {
  const res = await api.patch("/users/me", data);
  return res.data.user;
}
