import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer
      className="container-fluid text-white mt-auto pt-5"
      style={{ backgroundColor: "#063f32" }}
    >
      <div className="container">
        <div className="row gy-4 pb-4">

          {/* Brand */}
          <div className="col-12 col-md-4">
            <h4 className="fw-bold">🏪 Dukan Saathi</h4>

            <p className="text-white-50 mb-2">
              Apni Dukan, Hamara Saath.
            </p>

            <p className="small text-white-50">
              Shop Local. Grow Together.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-12 col-md-4">
            <h5 className="fw-bold mb-3">Quick Links</h5>

            <div className="d-flex flex-column gap-2">
              <Link to="/" className="text-white text-decoration-none">
                Home
              </Link>

              <Link to="/about" className="text-white text-decoration-none">
                About
              </Link>

              <Link to="/features" className="text-white text-decoration-none">
                Features
              </Link>

              <Link to="/contact" className="text-white text-decoration-none">
                Contact
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="col-12 col-md-4">
            <h5 className="fw-bold mb-3">Need Help?</h5>

            <p className="mb-2">
              <a
                href="mailto:singhindraraj66@gmail.com"
                className="text-white"
              >
                singhindraraj66@gmail.com
              </a>
            </p>

            <p className="mb-2">
              <a
                href="tel:+918081258517"
                className="text-white"
              >
                +91 8081258517
              </a>
            </p>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-top border-secondary py-3">
          <div className="row">
            <div className="col-md-6 text-center text-md-start">
              <small className="text-white-50">
                © {new Date().getFullYear()} Dukan Saathi. All rights reserved.
              </small>
            </div>

            <div className="col-md-6 text-center text-md-end">
              <small className="text-white-50">
                Made with ❤️ for Local Businesses
              </small>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;