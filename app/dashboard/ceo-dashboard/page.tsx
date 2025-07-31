"use client";

import { useState } from "react";
import PinEntry from "./_components/PinEntry";
import Dashboard from "./_components/Dashboard";

const Page = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handlePinSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <PinEntry onSuccess={handlePinSuccess} />;
  }

  return <Dashboard onLogout={handleLogout} />;
};

export default Page;
