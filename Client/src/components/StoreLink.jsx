import { useToast } from "../context/ToastContext";

const StoreLink = ({ shopId }) => {
  const toast = useToast();
  const url = `${window.location.origin}/shop/${shopId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Store link copied");
    } catch {
      toast.error("Could not copy. Please select the link and copy it.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="font-semibold text-gray-800">🔗 Your online store link</p>
      <p className="text-sm text-gray-500">Share this with customers so they can order from you.</p>
      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 border rounded p-2 bg-gray-50 text-sm"
        />
        <div className="flex gap-2">
          <button onClick={copy} className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Copy
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Order from my shop online: ${url}`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-none text-center px-4 py-2 border rounded hover:bg-green-50"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default StoreLink;