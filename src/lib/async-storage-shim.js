// Shim for @react-native-async-storage/async-storage
// Used by @metamask/sdk but not needed in web environment

const AsyncStorage = {
  getItem: async (key) => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(key)
  },
  setItem: async (key, value) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, value)
  },
  removeItem: async (key) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  },
  clear: async () => {
    if (typeof window === 'undefined') return
    localStorage.clear()
  },
  getAllKeys: async () => {
    if (typeof window === 'undefined') return []
    return Object.keys(localStorage)
  },
  multiGet: async (keys) => {
    if (typeof window === 'undefined') return keys.map(k => [k, null])
    return keys.map(key => [key, localStorage.getItem(key)])
  },
  multiSet: async (keyValuePairs) => {
    if (typeof window === 'undefined') return
    keyValuePairs.forEach(([key, value]) => localStorage.setItem(key, value))
  },
  multiRemove: async (keys) => {
    if (typeof window === 'undefined') return
    keys.forEach(key => localStorage.removeItem(key))
  },
}

module.exports = AsyncStorage
module.exports.default = AsyncStorage
