"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  Users,
  Target,
  CheckCircle,
  Receipt,
  Zap,
  ArrowRight,
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

export default function LandingPage() {
  const { isSignedIn } = useUser();
  const canvasRef = useRef(null);
  const [activeMetric, setActiveMetric] = useState("revenue");
  const [timeframe, setTimeframe] = useState("year");

  // Sample financial data
  const financialData = {
    revenue: [
      12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 32000, 40000,
      38000, 45000,
    ],
    expenses: [
      8000, 10000, 12000, 9000, 15000, 18000, 16000, 14000, 20000, 18000, 22000,
      25000,
    ],
    profit: [
      4000, 9000, 3000, 16000, 7000, 12000, 12000, 21000, 12000, 22000, 16000,
      20000,
    ],
  };

  const metrics = [
    {
      id: "revenue",
      name: "Revenue",
      color: "rgba(59, 130, 246, 0.8)",
      icon: TrendingUp,
    },
    {
      id: "expenses",
      name: "Expenses",
      color: "rgba(139, 92, 246, 0.8)",
      icon: Activity,
    },
    {
      id: "profit",
      name: "Profit",
      color: "rgba(16, 185, 129, 0.8)",
      icon: DollarSign,
    },
  ];

  useEffect(() => {
    // 3D background animation
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    const particleCount = 100;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.color = `rgba(59, 130, 246, ${Math.random() * 0.5})`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        // Connect particles with lines
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Function to draw the financial chart
  const drawChart = (canvasId, data, color) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * (height / 5));
      ctx.lineTo(width, i * (height / 5));
      ctx.stroke();
    }

    // Find max value for scaling
    const maxValue = Math.max(...data);

    // Draw data line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";

    data.forEach((value, index) => {
      const x = index * (width / (data.length - 1));
      const y = height - (value / maxValue) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = color;
    data.forEach((value, index) => {
      const x = index * (width / (data.length - 1));
      const y = height - (value / maxValue) * height;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  useEffect(() => {
    // Draw charts when component mounts or activeMetric changes
    const metric = metrics.find((m) => m.id === activeMetric);
    if (metric) {
      setTimeout(() => {
        drawChart("financialChart", financialData[activeMetric], metric.color);
      }, 100);
    }
  }, [activeMetric]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden relative">
      {/* Animated background */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full opacity-30"
      />

      {/* Navigation */}
      <nav className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-100">
                  <Link href="/">
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                  </Link>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight select-none">
                  <span className="truncate font-semibold">BizFlow</span>
                  <span className="truncate text-xs">Management System</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="bg-transparent text-white border-white/20 hover:bg-white/10"
                asChild
              >
                {isSignedIn ? (
                  <Link href="/dashboard">Dashboard</Link>
                ) : (
                  <Link href="/sign-in">Sign In</Link>
                )}
              </Button>
              {/* <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                asChild
              >
                <Link href="/sign-up">Get Started</Link>
              </Button> */}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 ring-1 ring-inset ring-blue-500/20 mb-8">
            <Zap className="h-4 w-4 mr-2" />
            Now with AI-powered financial insights
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
              Financial Intelligence
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Reimagined
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Harness the power of mathematical modeling and advanced
            visualization to transform your business finances. The future of
            financial management is here.
          </p>

          {/*  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-6"
              asChild
            >
              <Link href="/sign-up">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white/20 hover:bg-white/10 text-lg px-8 py-6"
              asChild
            >
              <Link href="#analytics">View Demo</Link>
            </Button>
          </div> */}
        </div>
      </section>

      {/* Analytics Visualization Section */}
      <section
        id="analytics"
        className="py-20 px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Interactive Financial Analytics
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Explore your financial data with our interactive dashboard and
              predictive analytics.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-8">
            <div className="flex flex-wrap gap-4 mb-6">
              {metrics.map((metric) => {
                const IconComponent = metric.icon;
                return (
                  <button
                    key={metric.id}
                    onClick={() => setActiveMetric(metric.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activeMetric === metric.id
                        ? "bg-white/10 text-white"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{metric.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mb-6">
              {["month", "quarter", "year"].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    timeframe === period
                      ? "bg-blue-500 text-white"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative h-80 w-full">
              <canvas id="financialChart" className="w-full h-full" />
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-sm text-gray-300 mb-1">
                  Current {activeMetric}
                </div>
                <div className="text-2xl font-bold">
                  R
                  {financialData[activeMetric][
                    financialData[activeMetric].length - 1
                  ].toLocaleString()}
                </div>
                <div className="text-sm text-green-400 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% from last period
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-sm text-gray-300 mb-1">Average</div>
                <div className="text-2xl font-bold">
                  R
                  {Math.round(
                    financialData[activeMetric].reduce((a, b) => a + b, 0) /
                      financialData[activeMetric].length
                  ).toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Per month</div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-sm text-gray-300 mb-1">Forecast</div>
                <div className="text-2xl font-bold">
                  R
                  {Math.round(
                    financialData[activeMetric][
                      financialData[activeMetric].length - 1
                    ] * 1.15
                  ).toLocaleString()}
                </div>
                <div className="text-sm text-green-400">+15% next period</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 transform transition-transform hover:scale-105">
              <div className="text-blue-400 text-4xl font-mono mb-4">
                ∫ f(x) dx
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Continuous Analysis
              </h3>
              <p className="text-gray-400">
                We continuously integrate financial data to identify trends and
                patterns.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 transform transition-transform hover:scale-105">
              <div className="text-purple-400 text-4xl font-mono mb-4">∇F</div>
              <h3 className="text-xl font-semibold mb-2">
                Gradient Optimization
              </h3>
              <p className="text-gray-400">
                Our algorithms find the optimal path to maximize your financial
                growth.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 transform transition-transform hover:scale-105">
              <div className="text-green-400 text-4xl font-mono mb-4">σ/√n</div>
              <h3 className="text-xl font-semibold mb-2">Risk Management</h3>
              <p className="text-gray-400">
                We quantify and minimize financial risk using statistical
                models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to manage your business finances with
              mathematical precision.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-white/10 backdrop-blur-md overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/20 transition-all">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Employee Analytics</CardTitle>
                <CardDescription className="text-gray-400">
                  Advanced HR analytics with performance forecasting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-blue-400" />
                    </div>
                    Predictive payroll modeling
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-blue-400" />
                    </div>
                    Performance trend analysis
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-blue-400" />
                    </div>
                    Department efficiency metrics
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-white/10 backdrop-blur-md overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/20 transition-all">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="h-6 w-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">
                  Quotation Intelligence
                </CardTitle>
                <CardDescription className="text-gray-400">
                  AI-powered quotation optimization and conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-purple-400" />
                    </div>
                    Price optimization algorithms
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-purple-400" />
                    </div>
                    Conversion probability scoring
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-purple-400" />
                    </div>
                    Automated follow-up scheduling
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-white/10 backdrop-blur-md overflow-hidden group hover:shadow-2xl hover:shadow-orange-500/20 transition-all">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Receipt className="h-6 w-6 text-orange-400" />
                </div>
                <CardTitle className="text-white">Invoice Analytics</CardTitle>
                <CardDescription className="text-gray-400">
                  Predictive invoice management with cash flow forecasting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-orange-400" />
                    </div>
                    Payment prediction models
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-orange-400" />
                    </div>
                    Cash flow optimization
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-orange-400" />
                    </div>
                    Automated collection strategies
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isSignedIn && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-10 border border-white/10 backdrop-blur-md">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Transform Your Financial Management?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join 10 + businesses using BizFlow to optimize their financial
                operations with mathematical precision.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/*  <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-6"
                asChild
              >
                <Link href="/sign-up">Get Started Free</Link>
              </Button> */}
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-white border-white/20 hover:bg-white/10 text-lg px-8 py-6"
                  asChild
                >
                  <Link
                    href="https://www.rethynk.co.za"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Request a Demo
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                BizFlow
              </div>
            </div>

            <div className="flex gap-6">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Contact
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8  text-center">
            <Badge className="text-center text-sm font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
              <a
                href="https://www.rethynk.co.za"
                target="_blank"
                rel="noopener noreferrer"
              >
                Created by Rethynk Web Studio
              </a>
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
