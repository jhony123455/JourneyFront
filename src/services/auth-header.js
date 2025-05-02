export default function authHeader() {
  const token = JSON.parse(localStorage.getItem("user_free"));
  if (token) {
    return { Authorization: `Bearer ${token}` };
  } else {
    return {};
  }
}