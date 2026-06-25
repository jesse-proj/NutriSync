import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { UserPlus, Search } from "lucide-react";
import { apiFetch } from "../api/client";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  consent_given: boolean;
}

interface PatientListProps {
  patients: User[];
  onSelectPatient: (patient: User) => void;
  onNotify: (type: "success" | "error", message: string) => void;
  onPatientCreated?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const PatientList = ({
  patients,
  onSelectPatient,
  onNotify,
  onPatientCreated,
  searchQuery,
  setSearchQuery,
}: PatientListProps) => {
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);

  const filteredPatients = patients.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail) {
      alert("Please enter the patient's email address");
      return;
    }
    setIsSubmittingPatient(true);
    try {
      const newPatient = await apiFetch("/api/clinicians/patients", {
        method: "POST",
        json: { email: addEmail },
      });
      if (newPatient) {
        setIsAddPatientOpen(false);
        setAddEmail("");
        onNotify("success", `Link request sent to patient.`);
        onPatientCreated?.();
      }
    } catch (err: any) {
      console.error("Error linking patient account", err);
      onNotify("error", err.message || "Failed to link patient account");
    } finally {
      setIsSubmittingPatient(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-outline-variant rounded-xl flex flex-col">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright/50 rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold text-on-surface">
              Patient Directory
            </h2>
            <p className="text-sm text-on-surface-variant">
              Select a patient to view their charts, logs, and modify profiles.
            </p>
          </div>
          <Button
            onClick={() => setIsAddPatientOpen(true)}
            className="bg-primary text-white hover:bg-primary/90 flex gap-2 font-bold px-4 rounded-xl"
          >
            <UserPlus className="h-4 w-4" />
            New Patient
          </Button>
        </div>
        <div className="p-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
            <Input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full bg-surface-container-low border-outline-variant focus:border-primary text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 font-medium">Patient Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredPatients.map((patient) => {
                const patInitials = patient.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <tr
                    key={patient.id}
                    className="hover:bg-surface-container-lowest transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {patInitials}
                        </div>
                        <span className="text-sm font-bold text-on-surface">
                          {patient.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {patient.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => onSelectPatient(patient)}
                        size="sm"
                        className="bg-secondary-container text-on-surface hover:bg-secondary-container/80 text-xs font-bold px-3"
                      >
                        View Profile & Logs
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PATIENT MODAL */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-outline-variant max-w-md w-full rounded-2xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsAddPatientOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-outline-variant/20 border-none bg-transparent cursor-pointer"
            >
              <span className="h-5 w-5 text-sm">✕</span>
            </button>
            <h2 className="text-xl font-bold text-on-surface mb-1 flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              Link Patient Account
            </h2>
            <p className="text-xs text-on-surface-variant mb-6">
              Enter the patient's email address to link their existing account
              to your dashboard.
            </p>
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="juan@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmittingPatient}
                className="w-full bg-primary hover:bg-primary/95 text-white h-12 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer border-none"
              >
                {isSubmittingPatient ? "Linking..." : "Link Patient"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientList;
