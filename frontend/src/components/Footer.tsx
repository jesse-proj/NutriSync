// ponytail: Shared footer component to eliminate repeating footer code on patient pages

const Footer = () => {
  return (
    <footer className="w-full bg-surface-container-low border-t border-outline-variant/50">
      <div className="flex flex-col items-center py-8 px-6 w-full max-w-7xl mx-auto text-center gap-4">
        <span className="text-sm font-bold text-primary">NutriSync RPM</span>
        <div className="flex gap-6">
          <a className="text-on-surface-variant hover:text-secondary text-xs transition-all" href="#">Privacy Policy</a>
          <a className="text-on-surface-variant hover:text-secondary text-xs transition-all" href="#">Terms of Service</a>
          <a className="text-on-surface-variant hover:text-secondary text-xs transition-all" href="#">Compliance Documentation</a>
        </div>
        <p className="text-[11px] text-on-surface-variant opacity-85 leading-relaxed">
          © 2026 NutriSync. All rights reserved. HIPAA Compliant | DPA 2012 Certified.
        </p>
      </div>
    </footer>
  )
}

export default Footer
