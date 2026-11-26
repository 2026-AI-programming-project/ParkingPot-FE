const storage = {
  async getItemAsync(key) {
    return typeof window === "undefined" ? null : window.sessionStorage.getItem(key);
  },
  async setItemAsync(key, value) {
    if (typeof window !== "undefined") window.sessionStorage.setItem(key, value);
  },
  async deleteItemAsync(key) {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(key);
  },
};

export const { getItemAsync, setItemAsync, deleteItemAsync } = storage;
