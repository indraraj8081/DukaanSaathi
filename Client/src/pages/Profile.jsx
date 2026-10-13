import { useEffect, useRef, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import Avatar from "../components/Avatar";
import StoreLink from "../components/StoreLink";

const BUSINESS_TYPES = [
  "Kirana / Grocery", "Medical / Pharmacy", "Stationery", "Bakery", "Dairy",
  "Vegetables & Fruits", "General Store", "Electronics", "Clothing", "Other",
];

const toForm = (p) => ({
  name: p.name || "",
  phone: p.phone || "",
  shopName: p.shopName || "",
  businessType: p.businessType || "",
  address: p.address || "",
  city: p.city || "",
  pincode: p.pincode || "",
  gstin: p.gstin || "",
  acceptingOrders: p.acceptingOrders !== false,
  minOrder: String(p.minOrder ?? 0),
  deliveryCharge: String(p.deliveryCharge ?? 0),
  freeDeliveryAbove: String(p.freeDeliveryAbove ?? 0),
  deliveryPincodes: (p.deliveryPincodes || []).join(", "),
});

const Row = ({ label, value }) => (
  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className="sm:col-span-2 text-gray-800 wrap-break-words">
      {value || <span className="text-gray-400">Not added</span>}
    </dd>
  </div>
);

const Card = ({ title, children }) => (
  <section className="bg-white rounded-xl shadow p-4 sm:p-6">
    <h2 className="font-semibold text-gray-800 mb-2">{title}</h2>
    {children}
  </section>
);

const Profile = () => {
  useDocumentTitle("My Profile");
  const toast = useToast();
  const { updateUser } = useAuth();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/api/profile")
      .then((r) => {
        setProfile(r.data);
        setForm(toForm(r.data));
      })
      .catch((err) => setError(err.response?.data?.message || err.message || "Could not load profile"));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const startEdit = () => {
    setForm(toForm(profile));
    setError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm(toForm(profile));
    setError("");
    setEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(form.phone)) return setError("Enter a valid 10-digit mobile number");
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) return setError("Pincode must be 6 digits");
    if (form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin.toUpperCase())) {
      return setError("Enter a valid 15-character GSTIN");
    }

    setSaving(true);
    try {
      const { data } = await API.put("/api/profile", form);
      setProfile(data);
      updateUser({ name: data.name, shopName: data.shopName, phone: data.phone });
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allows choosing the same file again
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 3 * 1024 * 1024) return toast.error("Image must be under 3 MB");

    const fd = new FormData();
    fd.append("avatar", file);

    setUploading(true);
    try {
      const { data } = await API.put("/api/profile/avatar", fd); // browser sets the multipart header
      setProfile((p) => ({ ...p, avatar: data.avatar }));
      updateUser({ avatar: data.avatar });
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Could not upload the photo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Remove your profile photo?")) return;
    try {
      await API.delete("/api/profile/avatar");
      setProfile((p) => ({ ...p, avatar: undefined }));
      updateUser({ avatar: undefined });
      toast.success("Photo removed");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Could not remove the photo");
    }
  };

  if (error && !profile) return <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>;
  if (!profile) return <p className="text-gray-500">Loading...</p>;

  const input = "w-full border rounded p-2 bg-white";
  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header card */}
      <section className="bg-white rounded-xl shadow p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <Avatar src={profile.avatar} name={profile.name} size={96} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-800 wrap-break-words">{profile.name}</h1>
          <p className="text-gray-600 wrap-break-words">{profile.shopName}</p>
          <span className="inline-block mt-1 text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded capitalize">
            Shop {profile.role}
          </span>
          <div className="flex flex-wrap gap-2 mt-3">
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 border rounded hover:bg-green-50 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "📷 Change photo"}
            </button>
            {profile.avatar && (
              <button onClick={handleRemovePhoto} className="px-3 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50">
                Remove
              </button>
            )}
          </div>
        </div>
        {!editing && (
          <button onClick={startEdit} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            ✏️ Edit Profile
          </button>
        )}
      </section>

      {error && <p role="alert" className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}

      {!editing ? (
        <>
          <Card title="Personal Information">
            <dl className="divide-y">
              <Row label="Full name" value={profile.name} />
              <Row label="Mobile" value={profile.phone} />
              <Row label="Email" value={profile.email} />
              <Row label="Role" value={"Shopkeeper"} />
            </dl>
          </Card>

          <Card title="Shop Information">
            <dl className="divide-y">
              <Row label="Shop name" value={profile.shopName} />
              <Row label="Business type" value={profile.businessType} />
              <Row label="Address" value={profile.address} />
              <Row label="City" value={profile.city} />
              <Row label="Pincode" value={profile.pincode} />
              <Row label="GSTIN" value={profile.gstin} />
            </dl>
          </Card>

          <Card title="Online Store">
            <dl className="divide-y">
              <Row label="Accepting orders" value={profile.acceptingOrders ? "Yes, store is open" : "No, store is closed"} />
              <Row label="Minimum order" value={`₹${profile.minOrder || 0}`} />
              <Row label="Delivery charge" value={`₹${profile.deliveryCharge || 0}`} />
              <Row label="Free delivery above" value={profile.freeDeliveryAbove > 0 ? `₹${profile.freeDeliveryAbove}` : "Not set"} />
              <Row label="Delivers to pincodes" value={[profile.pincode, ...(profile.deliveryPincodes || [])].filter(Boolean).join(", ")} />
            </dl>
          </Card>

          <StoreLink shopId={profile._id} />
        </>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <Card title="Personal Information">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Full name *</label>
                <input name="name" value={form.name} onChange={handleChange} required className={input} />
              </div>
              <div>
                <label className={label}>Mobile *</label>
                <input name="phone" type="tel" inputMode="numeric" maxLength={10}
                  value={form.phone} onChange={handleChange} required className={input} />
              </div>
              <div>
                <label className={label}>Email</label>
                <input value={profile.email} disabled className={`${input} bg-gray-100 text-gray-500`} />
                <p className="text-xs text-gray-500 mt-1">Email is your login ID and cannot be changed.</p>
              </div>
              <div>
                <label className={label}>Role</label>
                <input value={"Shopkeeper"} disabled className={`${input} bg-gray-100 text-gray-500 capitalize`} />
              </div>
            </div>
          </Card>

          <Card title="Shop Information">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Shop name *</label>
                <input name="shopName" value={form.shopName} onChange={handleChange} required className={input} />
              </div>
              <div>
                <label className={label}>Business type</label>
                <select name="businessType" value={form.businessType} onChange={handleChange} className={input}>
                  <option value="">Select</option>
                  {BUSINESS_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Address</label>
                <textarea name="address" rows={3} value={form.address} onChange={handleChange} className={input} />
              </div>
              <div>
                <label className={label}>City</label>
                <input name="city" value={form.city} onChange={handleChange} className={input} />
              </div>
              <div>
                <label className={label}>Pincode</label>
                <input name="pincode" inputMode="numeric" maxLength={6} value={form.pincode} onChange={handleChange} className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>GSTIN (optional)</label>
                <input name="gstin" maxLength={15} value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  className={`${input} uppercase`} />
              </div>
            </div>
          </Card>

          <Card title="Online Store">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.acceptingOrders}
                onChange={(e) => setForm({ ...form, acceptingOrders: e.target.checked })}
                className="w-5 h-5 accent-green-700"
              />
              <span>Accept online orders (store is open)</span>
            </label>
            <div className="mt-3 max-w-xs">
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className={label}>Delivery charge (₹)</label>
                <input name="deliveryCharge" type="number" min="0" value={form.deliveryCharge} onChange={handleChange} className={input} />
              </div>
              <div>
                <label className={label}>Free delivery above (₹, 0 = never)</label>
                <input name="freeDeliveryAbove" type="number" min="0" value={form.freeDeliveryAbove} onChange={handleChange} className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Extra pincodes you deliver to</label>
                <input name="deliveryPincodes" value={form.deliveryPincodes} onChange={handleChange} placeholder="302001, 302002" className={input} />
                <p className="text-xs text-gray-500 mt-1">Your own pincode is always included. Separate with commas.</p>
              </div>
            </div>
              <label className={label}>Minimum order amount (₹)</label>
              <input name="minOrder" type="number" min="0" value={form.minOrder} onChange={handleChange} className={input} />
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={cancelEdit} className="px-4 py-2 border rounded bg-white">Cancel</button>
            <button disabled={saving} className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;