const email = import.meta.env.VITE_SUPPORT_EMAIL;
const phone = import.meta.env.VITE_SUPPORT_PHONE;

const ContactLinks = ({ className = "" }) => {
  if (!email && !phone) return null; // shows nothing until you add real details

  const tel = phone ? phone.replace(/[^\d+]/g, "") : "";

  return (
    <div className={`text-sm text-gray-600 space-y-1 ${className}`}>
      <p className="font-medium text-gray-700">Need help?</p>
      {email && (
        <a href={`mailto:${email}`} className="block break-all text-green-700 underline">{email}</a>
      )}
      {phone && (
        <a href={`tel:${tel}`} className="block text-green-700 underline">{phone}</a>
      )}
    </div>
  );
};

export default ContactLinks;