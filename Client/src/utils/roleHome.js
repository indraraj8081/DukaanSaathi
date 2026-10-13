// Where each kind of user lands after login
export const homeFor = (user) => {
  if (user?.role === "admin") return "/admin";
  if (user?.role === "shopkeeper") return "/dashboard";
  return "/shops";
};