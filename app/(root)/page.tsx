"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Users, Target, CheckCircle, Receipt } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function LandingPage() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg ">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              <div className="font-semibold text-lg text-black ">
                FinanceFlow
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8"></div>
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                {isSignedIn ? (
                  <Link href="/dashboard">Dashboard</Link>
                ) : (
                  <Link href="/sign-in">Sign In</Link>
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        {/* Centered Logo */}
        <div className="max-w-7xl mx-auto mb-10 flex justify-center items-center">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-xl">
            <img
              src="/mjp.png"
              alt="Financial Management Dashboard"
              className="w-full h-full object-cover object-center"
            />
            {/* Optional overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent"></div>
          </div>
        </div>

        {/* Text content */}
        <div className="max-w-7xl mx-auto text-center mt-10">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Complete Financial
            <span className="text-blue-600"> Management</span>
            <br />
            for Your Business
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your finances, manage employees, and grow your business
            with our comprehensive management platform designed for South
            African businesses.
          </p>
          <Badge className="mt-8 text-center text-lg font-semibold bg-green-400/70 border border-green-600">
            <a
              href="https://www.rethynk.co.za"
              target="_blank"
              rel="noopener noreferrer"
            >
              Rethynk Web Studio
            </a>
          </Badge>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From financial tracking to employee management, our platform
              provides all the tools you need in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>
                  Complete HR solution with payroll, performance tracking, and
                  more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Payroll Processing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Performance Reviews
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Department Management
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Quotation Management</CardTitle>
                <CardDescription>
                  Create, send, and track Quotation and convert to invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Professional Templates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Quotation Tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Automated Reminders
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Receipt className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Invoice Management</CardTitle>
                <CardDescription>
                  Create, send, and track invoices with automated reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Professional Templates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Payment Tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Automated Reminders
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
