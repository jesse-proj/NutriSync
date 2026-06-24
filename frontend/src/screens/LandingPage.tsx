import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Smartphone,
  Layers,
  Stethoscope,
  Utensils,
  Languages,
  ShieldAlert,
  Type,
  ArrowRight,
  Menu,
  Activity,
  Verified
} from 'lucide-react'
import { Button } from '../components/ui/button'
import logoBrand from '../assets/nutrisync.png'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isTextLarge, setIsTextLarge] = useState(false)

  // Interactive state for mouse move card tilt effect (optional, fallback to standard CSS hover is smoother on some devices)
  const [tiltStyle, setTiltStyle] = useState<{ [key: number]: string }>({})

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, cardIndex: number) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * 10 // max 10 degrees
    const rotateY = ((centerX - x) / centerX) * 10 // max 10 degrees
    setTiltStyle(prev => ({
      ...prev,
      [cardIndex]: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    }))
  }

  const handleMouseLeave = (cardIndex: number) => {
    setTiltStyle(prev => ({
      ...prev,
      [cardIndex]: 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
    }))
  }

  const toggleTextSize = () => {
    setIsTextLarge(!isTextLarge)
  }

  return (
    <div
      className="min-h-screen text-on-background bg-background font-sans transition-all duration-300 animate-fadeIn"
      style={{ fontSize: isTextLarge ? '110%' : '100%' }}
    >
      {/* Top Navigation Bar */}
      <header className="w-full sticky top-0 z-50 bg-surface shadow-sm h-20 border-b border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8 flex justify-between items-center h-full">
          <div className="flex items-center gap-3">
            <img
              alt="NutriSync Logo"
              className="h-10 w-auto object-contain"
              src={logoBrand}
            />
            <span className="font-headline-md text-headline-md font-bold text-primary">NutriSync</span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-primary hover:bg-surface-container rounded-lg"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="font-label-md text-label-md text-primary border-b-2 border-primary pb-1 font-medium">Solutions</a>
            <a href="#features" className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors font-medium">Clinical Workflow</a>
            <a href="#compliance" className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors font-medium">Compliance</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="font-label-md text-primary cursor-pointer hover:bg-primary/5"
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate('/register')}
              className="bg-primary text-on-primary font-label-md px-6 py-2 rounded-lg cursor-pointer hover:bg-primary-container active:scale-95 transition-transform"
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-surface border-b border-outline-variant shadow-lg py-4 px-6 flex flex-col gap-4 z-40">
            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="text-primary font-bold text-sm"
            >
              Solutions
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
            >
              Clinical Workflow
            </a>
            <a
              href="#compliance"
              onClick={() => setMobileMenuOpen(false)}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
            >
              Compliance
            </a>
            <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant">
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/login')
                }}
                className="w-full border-primary text-primary"
              >
                Log In
              </Button>
              <Button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/register')
                }}
                className="w-full bg-primary hover:bg-primary-container text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[60vh] md:min-h-[80vh] flex items-center pt-8 md:pt-16 pb-12 overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-5 md:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-surface-container-high px-4 py-1.5 rounded-full border border-outline-variant/30">
                <Verified className="text-primary h-4.5 w-4.5" />
                <span className="text-xs font-semibold text-primary tracking-wide">AI-powered remote patient monitoring</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-on-background leading-tight">
                Your Health, <br />
                <span className="text-primary">Our Intelligence</span>
              </h1>

              <p className="text-base md:text-lg text-on-surface-variant max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Empowering Filipino homes with AI-driven Remote Patient Monitoring. Bridge the gap between clinical excellence and daily wellness.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-4 justify-center lg:justify-start">
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-primary hover:bg-primary-container text-white font-semibold px-8 py-3 h-auto rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  Start Your Journey
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="border-primary text-primary hover:bg-surface-container-low font-semibold px-8 py-3 h-auto rounded-lg transition-all cursor-pointer"
                >
                  Clinician Login
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -z-10 -top-20 -right-20 w-80 h-80 bg-primary opacity-10 blur-[100px] rounded-full"></div>
              <div className="rounded-xl overflow-hidden shadow-xl md:shadow-2xl border-2 md:border-4 border-surface shadow-primary-container/20">
                <img
                  className="w-full aspect-[4/3] object-cover"
                  alt="Clinician showing data visualization on tablet to an elderly patient"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUaB7koTc4bQzXGz0EhKnVlhd2FPaP__g8pTatUZ5QJ14zg1pIsQZileCSa8VOo-RAap7udXP3Lgn2r_F4R3utXjubFOMuXsyTa0UmHFOvlhGRK6c4EhSi7a6axhzJaiuErMuWoGoA_Kxv6Ha5Yxm66x2Qs4E-4w9XtjSfgQMwTSFLtN1CXwK_2hPYYK58QijCA0WgmrKvny5A4jRK0yv9xPftEPkmB8Oev0yGmoJl1QJYqkNr0jJihFM4u3eOcaVyxBixV2-2Yg"
                />
              </div>

              {/* Stats Overlay Card */}
              <div className="absolute -bottom-8 -left-8 bg-white/70 backdrop-blur-md border border-white/30 p-6 rounded-xl shadow-xl max-w-xs hidden md:block">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-primary/10 p-1.5 rounded-full">
                    <Activity className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-on-surface">Live Monitoring</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-3/4 rounded-full"></div>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium">Daily vitals synced across 2,400+ patients today.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-[1280px] mx-auto px-6 md:px-8">
            <div className="mb-12 text-center">
              <span className="text-primary text-xs font-semibold tracking-widest uppercase block mb-1">WHY TRADITIONAL APPS FAIL</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-2">Filipino patients deserve better</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 transition-colors">
                <Utensils className="text-primary h-10 w-10 mb-4" />
                <h3 className="text-lg font-bold mb-2 text-on-surface">No local food recognition</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Apps like MyFitnessPal can't distinguish Sinigang from generic vegetable soup, producing inaccurate nutritional data.
                </p>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 transition-colors">
                <Languages className="text-primary h-10 w-10 mb-4" />
                <h3 className="text-lg font-bold mb-2 text-on-surface">Low nutritional literacy</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Patients can't translate "2g sodium" into everyday meals like tuyo, instant noodles, or adobo without help.
                </p>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 transition-colors">
                <Stethoscope className="text-primary h-10 w-10 mb-4" />
                <h3 className="text-lg font-bold mb-2 text-on-surface">Post-discharge void</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Clinicians have no visibility into patient compliance between visits, leading to preventable readmissions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16">
          <div className="max-w-[1280px] mx-auto px-6 md:px-8">
            <div className="mb-12 max-w-2xl mx-auto text-center">
              <span className="text-primary text-xs font-semibold tracking-widest uppercase block mb-1">Intelligent Solutions</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-2">Clinical monitoring reimagined for the local context</h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Feature 1: Photo-Based Logging */}
              <div
                onMouseMove={(e) => handleMouseMove(e, 1)}
                onMouseLeave={() => handleMouseLeave(1)}
                style={{ transform: tiltStyle[1] || 'none' }}
                className="bg-surface shadow-sm rounded-xl overflow-hidden hover:shadow-xl border border-outline-variant/30 flex flex-col transition-all duration-150"
              >
                <div className="h-64 relative overflow-hidden">
                  <img
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    alt="NutriSync camera UI detecting Chicken Adobo"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeEFCEL27Sr7cc1OBO67_AKf3pOzIKSIMvJ5lXAbeSMkXchKUGmk4BXDNsABr0JII9WKQ3DC_XKGkhTRTODCfXou4INvCyUxImdkKCD2O3A46SP0UrICd66SgSxoMfhcEhCWHegf2f_t_A2xsezZXCypuHfm0MS3-pMjIo94mMHZlQhqlFClyCRIgb0MMvv9mP7KTMSp1mf4zq27lADR7paZ24BqANQGF1yHDqVnSGw0Hv6lFpK2HV5tgHkPzwsX81fD_0usn_yA"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-secondary text-on-secondary px-2.5 py-1 rounded text-xs font-semibold">AI-Powered</span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Photo-Based Logging</h3>
                    <p className="text-sm text-on-surface-variant mb-4 leading-relaxed font-normal">
                      Our AI is trained on over 50,000 local Filipino dishes. Simply snap a photo of your Adobo, Kare-kare, or Sinigang for instant analysis.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <span>Try the demo</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Feature 2: NutriGabay */}
              <div
                onMouseMove={(e) => handleMouseMove(e, 2)}
                onMouseLeave={() => handleMouseLeave(2)}
                style={{ transform: tiltStyle[2] || 'none' }}
                className="bg-surface shadow-sm rounded-xl overflow-hidden hover:shadow-xl border border-outline-variant/30 flex flex-col transition-all duration-150"
              >
                <div className="h-64 relative overflow-hidden">
                  <img
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    alt="Friendly Tagalog AI chatbot conversational UI"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP8BLpAV0c5OP1jKZ7IRUlZzSkJmOa3YDht5blEOXQMAGq_vnRnMRh-qm1E9QSqXgOGv9wslAH9drd9a5hhPNslJAnue_FsluDL6iCfthlA7AsNZXTXAiEYAsjLmPItNV5GjpCkwRYL3luKRYJZPRHkHB3OfamKoVGow4pb27Qn3LwYs3MTzQMI0VjOTCPafX9uF8ExIS53zXcPkoZtAj7MyyqpQV1jCq6LpppI53M9wr3dK6CtVsD7XnMdJSXhUQNFxtK9m83DQ"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-primary text-on-primary px-2.5 py-1 rounded text-xs font-semibold">24/7 Companion</span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-2">NutriGabay Tagalog Chatbot</h3>
                    <p className="text-sm text-on-surface-variant mb-4 leading-relaxed font-normal">
                      A conversational health companion that speaks your language. Ask in Tagalog or Taglish about your diet, medication, or wellness goals.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <span>Chat with Gabay</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Feature 3: Clinician Sync */}
              <div
                onMouseMove={(e) => handleMouseMove(e, 3)}
                onMouseLeave={() => handleMouseLeave(3)}
                style={{ transform: tiltStyle[3] || 'none' }}
                className="bg-surface shadow-sm rounded-xl overflow-hidden hover:shadow-xl border border-outline-variant/30 flex flex-col transition-all duration-150"
              >
                <div className="h-64 relative overflow-hidden">
                  <img
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    alt="Clinician monitoring dashboard layout"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXRKrv1o8PHjFLS-Eg6hW0VHMUwrQtPfaPIq22r3BC2966851ote2cK6toQOoaK1mfJ-suGx29T7WsfHvzVamz65y0h4EhbHtVzL6bD-sESQT2J98M5USLLNjPmfkPOOg9ZIMrEth7oXOxhwAuP-0dLl6ECp8yYE8UzXgKeI3eb7uU1XuLfRBd5Z7A54pffpwgAKHhBawP0_EIkuyW1r1uNpGOAowlKXnnbK2ufFFtIdt92y_AHz0A565DGliQCHmx7Ex1kb0A8w"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-error text-on-error px-2.5 py-1 rounded text-xs font-semibold">Real-time Alert</span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Clinician Sync</h3>
                    <p className="text-sm text-on-surface-variant mb-4 leading-relaxed font-normal">
                      Critical alerts are sent directly to your doctor's dashboard. Enable faster interventions and data-backed consultations from home.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <span>Provider features</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For: Alternate Layout */}
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-[1280px] mx-auto px-6 md:px-8">
            <div className="mb-12 text-center">
              <span className="text-primary text-xs font-semibold tracking-widest uppercase block mb-1">WHO IT'S FOR</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-2 text-on-surface">Two personas, one platform</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-surface-container-lowest p-5 sm:p-8 rounded-xl border border-outline-variant hover:border-primary/30 flex flex-col gap-5 sm:gap-6 shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">JC</div>
                  <div>
                    <h4 className="text-lg font-bold text-on-surface">Juan dela Cruz</h4>
                    <p className="text-xs text-on-surface-variant">58 · Cavite · Post-stroke recovery</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1 rounded-full border border-primary/20">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span className="text-xs text-primary font-semibold">Budget Android · Tagalog-first</span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Can't translate "2g sodium" into real meals. Finds calorie-counting apps frustrating and can't afford a dietitian.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/register')}
                  variant="outline"
                  className="mt-auto border-primary text-primary hover:bg-primary/5 rounded-lg px-6 w-fit font-semibold cursor-pointer"
                >
                  Start your journey
                </Button>
              </div>

              <div className="bg-surface-container-lowest p-5 sm:p-8 rounded-xl border border-outline-variant hover:border-primary/30 flex flex-col gap-5 sm:gap-6 shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center font-bold text-lg">MS</div>
                  <div>
                    <h4 className="text-lg font-bold text-on-surface">Dr. Maria Santos</h4>
                    <p className="text-xs text-on-surface-variant">Cardiologist · Provincial public hospital</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-secondary/10 px-4 py-1 rounded-full border border-secondary/20">
                    <Layers className="h-4 w-4 text-secondary" />
                    <span className="text-xs text-secondary font-semibold">Desktop + iPad · 80+ patients</span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    No visibility into patient compliance between visits. Needs exception-based alerts — not a system that pings for minor infractions.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="mt-auto border-primary text-primary hover:bg-primary/5 rounded-lg px-6 w-fit flex items-center gap-2 font-semibold cursor-pointer"
                >
                  Clinician dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Steps Timeline Section */}
        <section className="py-16 bg-surface-container-low text-on-surface">
          <div className="max-w-[1280px] mx-auto px-6 md:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Three Steps to Better Health</h2>
            <div className="relative flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-12">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-0 right-0 h-[2px] bg-primary/10 -z-0"></div>

              {/* Step 1 */}
              <div className="relative z-10 flex-1 text-center group">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-primary/10 group-hover:scale-110 transition-transform">
                  <span className="text-primary font-bold text-2xl md:text-3xl">1</span>
                </div>
                <h4 className="text-lg font-bold mb-2">Snap</h4>
                <p className="text-sm text-on-surface-variant px-4 leading-relaxed">
                  Take a quick photo of your meal or log your vitals in seconds using our intuitive interface.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 flex-1 text-center group">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-primary/10 group-hover:scale-110 transition-transform">
                  <span className="text-primary font-bold text-2xl md:text-3xl">2</span>
                </div>
                <h4 className="text-lg font-bold mb-2">Calculate</h4>
                <p className="text-sm text-on-surface-variant px-4 leading-relaxed">
                  Our localized AI calculates nutritional value and trends specifically for Filipino dietary habits.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex-1 text-center group">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-primary/10 group-hover:scale-110 transition-transform">
                  <span className="text-primary font-bold text-2xl md:text-3xl">3</span>
                </div>
                <h4 className="text-lg font-bold mb-2">Connect</h4>
                <p className="text-sm text-on-surface-variant px-4 leading-relaxed">
                  Data is automatically analyzed and shared with your medical provider for proactive care.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance and Security Trust Section */}
        <section id="compliance" className="py-16 border-t border-outline-variant/30">
          <div className="max-w-[1280px] mx-auto px-6 md:px-8">
            <div className="bg-surface-container-high rounded-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex-1 space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold">Data Privacy <span className="text-primary">Guaranteed</span></h2>
                <p className="text-sm text-on-surface-variant max-w-lg leading-relaxed">
                  Your medical data is processed under Philippine Data Privacy Act of 2012 (RA 10173). AES-256 encryption at rest, HTTPS/TLS in transit. Your clinician can only see your data — no one else's.
                </p>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-primary h-5 w-5" />
                    <span className="text-sm font-semibold text-on-surface">DPA 2012 (RA 10173) certified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="text-primary h-5 w-5" />
                    <span className="text-sm font-semibold text-on-surface">HIPAA Compliant</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 sm:gap-6">
                {/* Compliance Badges */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-surface rounded-lg shadow-inner flex items-center justify-center p-3 sm:p-4 border border-outline-variant/60">
                  <img
                    className="max-w-full object-contain"
                    alt="Republic of Philippines Data Privacy Act 2012 certified seal"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMV_97kRfCN-dJG9MFdh8_y280ficoQtky7uaS_A2a9y--ABv-8dMDW1nfpGYCXyTjYcqXk0LgBJH4N5kJNrHUA7XYgJTg-wcLCrvFO6_Avtg-eefpkegIrrY5-0ORLJX0edRZ-obMe3bMS7KrfdQkKlhVqAFzgkkOQeMlhv0UfVXFBOobANXAoLBNICq0iMMprk2HJDkf6BItSJtzc7HpLmatMMSZCRdAGEjBMSU9-VwlHBnrweKNkhSQZvG0ZOnW2qT_WZxXEA"
                  />
                </div>
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-surface rounded-lg shadow-inner flex items-center justify-center p-3 sm:p-4 border border-outline-variant/60">
                  <img
                    className="max-w-full object-contain"
                    alt="HIPAA Compliant caduceus badge"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcBCtPDxn1VKlthUTU_w6-W3ElJm2a59-S8bMHkDLz-hnFi9PcTuabM5bJZghhIIpNOdANFLHT7fPUqxt5Vay5q966dzme5gDO5BecW3NntrkPCH38lxrQ7yVQVfRikU1vJ7A6SYg78WehRFvHxIDRFxKc2JDNrXlVi-V8vyMWebssRU3uEroW7emh1vtntXq7XOFbek_I9nrt_aF3GovWxioEZReBCtYPuoCScHHqW5We9aQRmNy_GM01n43MHez6pSvHLhqx1g"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 relative overflow-hidden bg-primary-container">
          <div className="max-w-[1280px] mx-auto px-6 md:px-8 text-center py-12 text-on-primary-container space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Ready to take control of your health?</h2>
            <p className="text-base max-w-xl mx-auto opacity-90 leading-relaxed text-white">
              Join thousands of Filipino patients and clinicians bridging the gap in modern healthcare.
            </p>
            <Button
              onClick={() => navigate('/register')}
              className="bg-white hover:bg-surface-bright text-primary font-semibold px-8 py-3.5 h-auto rounded-full shadow-2xl active:scale-95 transition-all cursor-pointer"
            >
              Get Started Now
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
            <div className="space-y-4 max-w-xs">
              <div className="flex items-center gap-2">
                <img
                  alt="NutriSync Logo"
                  className="h-8 w-auto"
                  src={logoBrand}
                />
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">NutriSync</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                The future of remote patient monitoring, designed for the unique needs of Filipino families and healthcare systems.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-12">
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary uppercase tracking-wider">Company</h5>
                <ul className="space-y-2 text-xs text-on-surface-variant font-medium">
                  <li><a className="hover:text-primary transition-colors" href="#">About Us</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Careers</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary uppercase tracking-wider">Legal</h5>
                <ul className="space-y-2 text-xs text-on-surface-variant font-medium">
                  <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary uppercase tracking-wider">Support</h5>
                <ul className="space-y-2 text-xs text-on-surface-variant font-medium">
                  <li><a className="hover:text-primary transition-colors" href="#">Support Center</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Documentation</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-on-surface-variant font-medium">© 2026 NutriSync . HIPAA &amp; DPA 2012 Compliant. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Accessibility Size Toggle */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleTextSize}
          aria-label="Toggle Text Size"
          className={`w-12 h-12 rounded-full shadow-lg border border-outline-variant flex items-center justify-center transition-colors cursor-pointer ${isTextLarge ? 'bg-primary/10 hover:bg-primary/20' : 'bg-white hover:bg-surface-container'
            }`}
        >
          <Type className="text-primary h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default LandingPage
