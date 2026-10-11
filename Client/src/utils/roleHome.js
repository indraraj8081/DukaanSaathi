// Where each kind of user lands after login
export const homeFor = (user) =>
  user?.role === "shopkeeper" ? "/dashboard" : "/shops";
// Admin gets its own home in Step F