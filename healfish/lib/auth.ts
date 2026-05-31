function isTokenFresh(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is Unix seconds
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export const auth = {
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
  setToken: (t: string) => localStorage.setItem("token", t),
  removeToken: () => localStorage.removeItem("token"),
  isLoggedIn: () => {
    const token = auth.getToken();
    if (!token) return false;
    if (!isTokenFresh(token)) {
      auth.removeToken();
      return false;
    }
    return true;
  },
};
