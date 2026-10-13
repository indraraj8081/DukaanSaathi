import { useState } from "react";
import useDocumentTitle from "../hooks/useDocumentTitle";

const email = import.meta.env.VITE_SUPPORT_EMAIL;
const phone = import.meta.env.VITE_SUPPORT_PHONE;
const address = import.meta.env.VITE_SUPPORT_ADDRESS;

const Contact = () => {
  useDocumentTitle("Contact");
  const [f, setF] = useState({ name: "", mobile: "", subject: "", message: "" });
  const change = (e) => setF({ ...f, [e.target.name]: e.target.value });

  // No mail server yet, so this opens the visitor's own mail app
  const send = (e) => {
    e.preventDefault();
    const body = `${f.message}\n\nName: ${f.name}\nMobile: ${f.mobile}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(f.subject)}&body=${encodeURIComponent(body)}`;
  };

  const input = "w-full border rounded-lg p-3 bg-white";
  const tel = phone ? phone.replace(/[^\d+]/g, "") : "";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-8">
      <div>
        <span className="text-xs font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full">GET IN TOUCH</span>
        <h1 className="text-4xl font-extrabold text-gray-900 mt-3">Contact Us</h1>
        <p className="text-gray-600 mt-2">Koi sawal hai? Humse sampark karein, hum aapki madad ke liye hamesha taiyaar hain.</p>

        {!email && !phone && !address && (
          <p className="mt-6 bg-orange-50 text-orange-800 text-sm p-3 rounded-lg">
            Add VITE_SUPPORT_EMAIL, VITE_SUPPORT_PHONE and VITE_SUPPORT_ADDRESS in client/.env to show contact details here.
          </p>
        )}
        <ul className="mt-6 space-y-4">
          {email && <li className="flex gap-3"><span>✉️</span><div><b>Email Us</b><a href={`mailto:${email}`} className="block text-green-700 underline break-all">{email}</a></div></li>}
          {phone && <li className="flex gap-3"><span>📞</span><div><b>Call Us</b><a href={`tel:${tel}`} className="block text-green-700 underline">{phone}</a></div></li>}
          {address && <li className="flex gap-3"><span>📍</span><div><b>Our Address</b><p className="text-gray-700 break-words">{address}</p></div></li>}
        </ul>
      </div>

      {email ? (
        <form onSubmit={send} className="bg-white rounded-2xl shadow p-6 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Send Us a Message</h2>
          <input name="name" value={f.name} onChange={change} required placeholder="Full name" className={input} />
          <input name="mobile" value={f.mobile} onChange={change} placeholder="Mobile number" inputMode="numeric" className={input} />
          <input name="subject" value={f.subject} onChange={change} required placeholder="Subject" className={input} />
          <textarea name="message" value={f.message} onChange={change} required rows={5} placeholder="Type your message here..." className={input} />
          <button className="w-full bg-green-700 text-white font-semibold py-3 rounded-lg hover:bg-green-800">Send Message →</button>
          <p className="text-xs text-gray-500">This opens your email app with the message ready to send.</p>
        </form>
      ) : null}
    </div>
  );
};

export default Contact;