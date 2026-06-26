import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Briefcase,
  Calendar,
  CreditCard,
  Upload,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logoBrand from "../assets/nutrisync.png";


const PATIENT_COLOR = "#0058bc";
const CLINICIAN_COLOR = "#00B4AD";

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Register | NutriSync";
  }, []);

  const [role, setRole] = useState<"patient" | "clinician">("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consent, setConsent] = useState(false);
  // Clinician credential fields
  const [profession, setProfession] = useState("");
  const [prcNumber, setPrcNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [prcIdImage, setPrcIdImage] = useState<File | null>(null);
  const [prcIdPreview, setPrcIdPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ponytail: derive accent from current role; every element reads from this single source
  const accent = role === "clinician" ? CLINICIAN_COLOR : PATIENT_COLOR;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (role === "patient" && !consent) {
      setError(
        "Explicit consent to process health information is required for patients under the Philippine Data Privacy Act of 2012.",
      );
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);
      formData.append("consent_given", String(consent));
      formData.append("profession", profession);
      formData.append("prc_number", prcNumber);
      formData.append("date_of_birth", dateOfBirth);
      if (prcIdImage) formData.append("prc_id_image", prcIdImage);
      await register(formData);
      navigate("/login", {
        state: { success: "Account created successfully! Please log in." },
      });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Shared input class — focus border handled via inline style so it reacts to accent immediately
  const inputBase =
    "w-full pl-9 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-lg text-sm text-on-surface outline-none placeholder:text-outline/50 transition-colors duration-300";

  const iconStyle: React.CSSProperties = {
    color: accent,
    transition: "color 0.3s ease",
  };

  const inputStyle: React.CSSProperties = {
    // We handle focus with a global style block injected below
  };

  return (
    <main
      className="flex min-h-screen w-full items-center justify-center bg-radial from-[#e8eeff] to-[#f9f9ff] py-8 px-4"
      style={{ "--accent-color": accent } as React.CSSProperties}
    >
      <style>{`
        .reg-input:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px var(--accent-color)33;
        }
        .reg-checkbox { accent-color: var(--accent-color); }
        .reg-submit {
          background-color: var(--accent-color);
          transition: background-color 0.4s ease, opacity 0.2s ease;
        }
        .reg-submit:hover {
          opacity: 0.9;
        }
        .reg-tab-active {
          background-color: var(--accent-color);
          color: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          transition: background-color 0.4s ease, color 0.4s ease;
        }
        .reg-tab-idle {
          color: #717786;
          transition: color 0.4s ease;
        }
        .reg-link {
          color: var(--accent-color);
          transition: color 0.4s ease;
        }
        .reg-icon {
          color: var(--accent-color);
          transition: color 0.4s ease;
        }
      `}</style>
      <div className="w-full max-w-[480px] flex flex-col items-center">
        {/* Logo Section */}
        <img
          alt="NutriSync Logo"
          className="h-28 w-28 object-contain mb-3"
          draggable={false}
          src={logoBrand}
        />

        {/* Registration Card */}
        <section className="bg-white/90 backdrop-blur-md border border-white/50 shadow-lg w-full rounded-xl px-6 py-5 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Header Text */}
          <div className="text-center space-y-0.5">
            <h1 className="text-headline-sm font-headline-sm text-on-surface">
              Create your Account
            </h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Start your journey toward better nutritional recovery
            </p>
          </div>

          {/* Role Selection Segmented Control */}
          <div
            className="bg-surface-container p-1 rounded-lg flex relative"
            id="role-selector"
          >
            <button
              className={`flex-1 py-1.5 text-label-sm font-label-sm rounded-md z-10 transition-all duration-300 cursor-pointer ${
                role === "patient"
                  ? "reg-tab-active"
                  : "reg-tab-idle hover:text-on-surface"
              }`}
              onClick={() => {
                setRole("patient");
                setError(null);
              }}
              type="button"
            >
              Patient
            </button>
            <button
              className={`flex-1 py-1.5 text-label-sm font-label-sm rounded-md z-10 transition-all duration-300 cursor-pointer ${
                role === "clinician"
                  ? "reg-tab-active"
                  : "reg-tab-idle hover:text-on-surface"
              }`}
              onClick={() => {
                setRole("clinician");
                setError(null);
              }}
              type="button"
            >
              Clinician
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              className="w-full p-3 text-xs text-red-800 bg-red-50 rounded-lg border border-red-200"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form className="flex flex-col gap-2.5" onSubmit={handleRegister}>
            {/* Full Name */}
            <div className="flex flex-col gap-0.5">
              <label
                className="text-label-sm font-label-sm text-on-surface-variant ml-1"
                htmlFor="fullName"
              >
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <User className="h-4 w-4 reg-icon" style={inputStyle} />
                </span>
                <input
                  className={`${inputBase} reg-input`}
                  id="fullName"
                  placeholder="Juan dela Cruz"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-0.5">
              <label
                className="text-label-sm font-label-sm text-on-surface-variant ml-1"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Mail className="h-4 w-4 reg-icon" />
                </span>
                <input
                  className={`${inputBase} reg-input`}
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5">
                <label
                  className="text-label-sm font-label-sm text-on-surface-variant ml-1"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="h-4 w-4 reg-icon" />
                  </span>
                  <input
                    className={`${inputBase} reg-input`}
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <label
                  className="text-label-sm font-label-sm text-on-surface-variant ml-1"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <ShieldCheck className="h-4 w-4 reg-icon" />
                  </span>
                  <input
                    className={`${inputBase} reg-input`}
                    id="confirmPassword"
                    placeholder="••••••••"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Clinician Credential Fields */}
            {role === "clinician" && (
              <>
                <div className="flex flex-col gap-0.5">
                  <label
                    className="text-label-sm font-label-sm text-on-surface-variant ml-1"
                    htmlFor="profession"
                  >
                    Profession
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Briefcase className="h-4 w-4 reg-icon" />
                    </span>
                    <input
                      className={`${inputBase} reg-input`}
                      id="profession"
                      placeholder="e.g. Cardiologist, Nurse, Dietitian"
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label
                    className="text-label-sm font-label-sm text-on-surface-variant ml-1"
                    htmlFor="prcNumber"
                  >
                    PRC License Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">
                      <CreditCard className="h-4 w-4 reg-icon" />
                    </span>
                    <input
                      className={`${inputBase} reg-input`}
                      id="prcNumber"
                      placeholder="e.g. 1234567"
                      type="text"
                      value={prcNumber}
                      onChange={(e) => setPrcNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label
                    className="text-label-sm font-label-sm text-on-surface-variant ml-1"
                    htmlFor="dateOfBirth"
                  >
                    Date of Birth
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Calendar className="h-4 w-4 reg-icon" />
                    </span>
                    <input
                      className={`${inputBase} reg-input`}
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label
                    className="text-label-sm font-label-sm text-on-surface-variant ml-1"
                    htmlFor="prcIdImage"
                  >
                    PRC ID Photo
                  </label>
                  <div className="relative">
                    <input
                      className="hidden"
                      id="prcIdImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setPrcIdImage(file);
                        if (file) setPrcIdPreview(URL.createObjectURL(file));
                        else setPrcIdPreview(null);
                      }}
                    />
                    <label
                      htmlFor="prcIdImage"
                      className="flex items-center gap-3 w-full px-4 py-2 bg-surface-bright border border-outline-variant rounded-lg text-sm cursor-pointer hover:border-primary transition-colors"
                    >
                      <Upload className="h-4 w-4 reg-icon" />
                      <span
                        className={
                          prcIdImage ? "text-on-surface" : "text-outline/50"
                        }
                      >
                        {prcIdImage ? prcIdImage.name : "Upload PRC ID photo"}
                      </span>
                    </label>
                  </div>
                  {prcIdPreview && (
                    <img
                      src={prcIdPreview}
                      alt="PRC ID preview"
                      className="mt-2 w-full h-32 object-cover rounded-lg border border-outline-variant"
                    />
                  )}
                </div>
              </>
            )}

            {/* Privacy Compliance (Only visible for Patient role) */}
            {role === "patient" && (
              <div className="flex items-start gap-2">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    className="w-4 h-4 border-outline-variant rounded cursor-pointer reg-checkbox"
                    id="privacy"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                </div>
                <label
                  className="text-xs text-on-surface-variant leading-tight cursor-pointer select-none"
                  htmlFor="privacy"
                >
                  I agree to the Data Privacy Terms and understand that my
                  information is handled in compliance with DPA 2012 guidelines
                </label>
              </div>
            )}

            {/* Submit */}
            <button
              className="reg-submit w-full mt-1 text-white font-bold py-2.5 rounded-xl shadow-md active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              <span className="text-label-md font-label-md text-sm">
                {loading ? "Registering..." : "Register"}
              </span>
              {!loading && (
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-on-surface-variant">
              Already have an account?{" "}
              <Link className="reg-link font-bold hover:underline" to="/login">
                Log in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default RegisterPage;
