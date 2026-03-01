"use client";

import { LiteCMSProvider, Editable, useEditMode } from "@litecms/react";
import { useState } from "react";

function AdminToggle() {
  const { isEditMode, isAdmin, toggleEditMode } = useEditMode();

  if (!isAdmin) return null;

  return (
    <button
      onClick={toggleEditMode}
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg font-medium transition-colors ${
        isEditMode
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      {isEditMode ? "Exit Edit Mode" : "Edit Mode"}
    </button>
  );
}

function Header() {
  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">
          <Editable field="site.name" defaultValue="LiteCMS Demo" />
        </h1>
        <nav className="space-x-6">
          <a href="#features" className="text-gray-600 hover:text-gray-900">
            Features
          </a>
          <a href="#about" className="text-gray-600 hover:text-gray-900">
            About
          </a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-24">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-5xl font-bold mb-6">
          <Editable
            field="hero.title"
            defaultValue="Inline Editing for Modern Web Apps"
            as="span"
          />
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          <Editable
            field="hero.subtitle"
            defaultValue="LiteCMS lets you edit content directly on your website. No separate admin panel needed."
          />
        </p>
        <div className="space-x-4">
          <a
            href="#"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Get Started
          </a>
          <a
            href="#"
            className="inline-block border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
          >
            View Demo
          </a>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      field: "feature.1",
      title: "Inline Editing",
      description:
        "Edit content directly on your page. Click, type, done. No context switching.",
    },
    {
      field: "feature.2",
      title: "Zero Config",
      description:
        "Install via npm, wrap your app, mark editable zones. That's it.",
    },
    {
      field: "feature.3",
      title: "Framework Agnostic",
      description:
        "Works with Next.js, Remix, Vite, or any React application.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
          <Editable field="features.title" defaultValue="Why LiteCMS?" />
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
              <h4 className="text-xl font-semibold mb-3 text-gray-900">
                <Editable
                  field={`${feature.field}.title`}
                  defaultValue={feature.title}
                />
              </h4>
              <p className="text-gray-600">
                <Editable
                  field={`${feature.field}.description`}
                  defaultValue={feature.description}
                />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p>
          <Editable
            field="footer.text"
            defaultValue="Built with LiteCMS - The inline editing CMS for React"
          />
        </p>
        <p className="mt-2 text-sm">
          <Editable
            field="footer.copyright"
            defaultValue="© 2024 LiteCMS. Open source under MIT license."
          />
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  // For demo: simple admin state (in production, use proper auth)
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <LiteCMSProvider
      config={{
        apiUrl: "/api/cms",
        debug: true,
      }}
      auth={{
        isAdmin,
        user: isAdmin ? { id: "1", email: "admin@demo.com" } : undefined,
      }}
    >
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Hero />
          <Features />
        </main>
        <Footer />

        {/* Admin toggle for demo */}
        <AdminToggle />

        {/* Login button when not admin */}
        {!isAdmin && (
          <button
            onClick={() => setIsAdmin(true)}
            className="fixed bottom-4 right-4 px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Admin Login
          </button>
        )}

        {/* Logout when admin */}
        {isAdmin && (
          <button
            onClick={() => setIsAdmin(false)}
            className="fixed bottom-4 left-4 px-3 py-1.5 text-sm bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </LiteCMSProvider>
  );
}
