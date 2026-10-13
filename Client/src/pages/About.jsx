import { Link } from "react-router-dom";
import ShopArt from "../components/ShopArt";
import useDocumentTitle from "../hooks/useDocumentTitle";

const cards = [
  ["🎯", "Our Mission", "Local dukanon ko digital banana aur customers ko easy shopping ka experience dena."],
  ["👁️", "Our Vision", "Har local dukan ki digital duniya mein pehchan bane."],
];
const values = ["Trust", "Support Local", "Customer First", "Simplicity"];

const About = () => {
  useDocumentTitle("About");
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <section className="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">About Dukan Saathi</h1>
          <p className="mt-2 text-lg font-semibold text-green-700">Local Dukaanein, Digital India Ki Pehchaan</p>
          <p className="mt-4 text-gray-700">
            Dukan Saathi ek digital platform hai jo local shopkeepers ko apna business online manage karne
            aur customers ko apne aas-paas ki dukanon se aasani se shopping karne ki suvidha deta hai.
            Dukandar khud delivery karta hai, beech mein koi third party nahi.
          </p>
          <Link to="/register" className="inline-block mt-5 bg-green-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-800">
            Register Your Shop →
          </Link>
        </div>
        <div className="flex justify-center"><ShopArt className="h-64 w-auto" /></div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {cards.map(([icon, t, d]) => (
          <div key={t} className="bg-white rounded-xl shadow p-5">
            <span className="text-3xl">{icon}</span>
            <h2 className="font-bold text-gray-900 mt-2">{t}</h2>
            <p className="text-sm text-gray-600 mt-1">{d}</p>
          </div>
        ))}
        <div className="bg-white rounded-xl shadow p-5">
          <span className="text-3xl">🤝</span>
          <h2 className="font-bold text-gray-900 mt-2">Our Values</h2>
          <ul className="text-sm text-gray-600 mt-1 space-y-1">
            {values.map((v) => <li key={v}>✔ {v}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default About;