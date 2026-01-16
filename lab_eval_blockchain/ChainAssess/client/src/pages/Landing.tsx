import { Link, useLocation } from "wouter";
import { Shield, Upload, Calculator, FileSearch, Clock, Users, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWeb3 } from "@/hooks/useWeb3";

export default function Landing() {
  const { walletState, connect } = useWeb3();
  const [, setLocation] = useLocation();

  const handleConnectWallet = async () => {
    try {
      await connect();
      setLocation('/dashboard');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };
  const features = [
    {
      icon: <Shield className="w-12 h-12 text-green-400" />,
      title: "Immutable Records",
      description: "Once marks are recorded on the blockchain, they cannot be altered or deleted, ensuring permanent academic integrity.",
      bgColor: "bg-green-500/10 border-green-500/20"
    },
    {
      icon: <Users className="w-12 h-12 text-blue-400" />,
      title: "Complete Transparency", 
      description: "Students can view their marks and evaluations in real-time, with full visibility into the grading process.",
      bgColor: "bg-blue-500/10 border-blue-500/20"
    },
    {
      icon: <Shield className="w-12 h-12 text-yellow-400" />,
      title: "Secure Access Control",
      description: "Only authorized teachers can add marks, while students can only view their own academic records.",
      bgColor: "bg-yellow-500/10 border-yellow-500/20"
    },
    {
      icon: <Upload className="w-12 h-12 text-purple-400" />,
      title: "IPFS Integration",
      description: "Lab reports and files are stored on IPFS for decentralized, permanent file storage linked to each evaluation.",
      bgColor: "bg-purple-500/10 border-purple-500/20"
    },
    {
      icon: <Calculator className="w-12 h-12 text-indigo-400" />,
      title: "Automated Calculations",
      description: "Final grades and evaluations are automatically calculated using smart contract logic for consistent results.",
      bgColor: "bg-indigo-500/10 border-indigo-500/20"
    },
    {
      icon: <Clock className="w-12 h-12 text-cyan-400" />,
      title: "Complete Audit Trail",
      description: "Every transaction is recorded with timestamps and teacher information, providing a complete evaluation history.",
      bgColor: "bg-cyan-500/10 border-cyan-500/20"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Connect Wallet",
      description: "Teachers and students connect their MetaMask wallet to authenticate their identity.",
      color: "bg-gradient-to-br from-purple-500 to-pink-500"
    },
    {
      number: "2", 
      title: "Submit Assignment",
      description: "Teachers add lab marks to the blockchain. Students view their academic progress transparently.",
      color: "bg-gradient-to-br from-emerald-500 to-cyan-500"
    },
    {
      number: "3",
      title: "Upload to IPFS",
      description: "Lab reports and supporting documents are uploaded to IPFS for permanent storage.",
      color: "bg-gradient-to-br from-amber-500 to-orange-500"
    },
    {
      number: "4",
      title: "Smart Contract Evaluation",
      description: "Smart contracts automatically calculate final grades and provide comprehensive evaluations.",
      color: "bg-gradient-to-br from-cyan-500 to-blue-500"
    }
  ];

  const benefits = [
    "Secure wallet authentication",
    "Real-time blockchain transactions", 
    "Decentralized file storage",
    "Transparent evaluation process"
  ];

  const techStack = ["Ethereum", "Solidity", "Web3.js", "IPFS", "React", "MetaMask"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🔗</span>
              </div>
              <span className="text-white font-semibold text-lg">Blockchain Lab Evaluation</span>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-gray-400 text-sm">🏠 Home</span>
              <span className="text-gray-400 text-sm">👨‍🏫 Teacher</span>
              <span className="text-gray-400 text-sm">🎓 Student</span>
              <div className="flex items-center space-x-2">
                {walletState.isConnected ? (
                  <>
                    <span className="text-green-400 text-sm">🟢 Connected</span>
                    <Button 
                      className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 text-sm"
                      onClick={() => setLocation('/dashboard')}
                    >
                      GO TO DASHBOARD
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-red-400 text-sm">🔴 Disconnected</span>
                    <Button 
                      className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 text-sm"
                      onClick={handleConnectWallet}
                    >
                      CONNECT WALLET
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-glow">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-700/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 floating-animation">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Blockchain <span className="text-indigo-400">Academic</span><br/>
                Lab Evaluation
              </h1>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Secure, transparent, and immutable academic evaluation system powered by Ethereum blockchain technology and IPFS storage.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-full text-lg"
                  asChild
                >
                  <Link href="/dashboard">
                    👨‍🏫 Teacher Dashboard
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-8 py-4 rounded-full text-lg border border-gray-600"
                  asChild
                >
                  <Link href="/dashboard">
                    🎓 Student Dashboard
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Status Card */}
            <div className="bg-gray-800/80 border border-cyan-500/40 rounded-lg p-6 backdrop-blur-sm shadow-2xl">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-indigo-500 rounded mr-3">🔍</div>
                <h3 className="text-white font-semibold">System Status</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm">Wallet</span>
                  </div>
                  <span className="text-gray-400 text-sm">Not Connected</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm">Network</span>
                  </div>
                  <span className="text-gray-400 text-sm">Chain ID: null</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm">Contract</span>
                  </div>
                  <span className="text-gray-400 text-sm">Deployed</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm">IPFS</span>
                  </div>
                  <span className="text-gray-400 text-sm">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Blockchain Section */}
      <div className="bg-gray-900/50 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Why Blockchain for Academic Evaluation?</h2>
          <p className="text-gray-400 mb-12">Experience the future of secure and transparent academic assessment</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className={`${feature.bgColor} border p-6 hover:scale-105 transition-all duration-300 backdrop-blur-sm`}>
                <div className="text-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 text-center">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-center text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-xl text-gray-400">Simple steps to secure academic evaluation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center mx-auto mb-6 step-circle`}>
                <span className="text-3xl font-bold text-white">{step.number}</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-gray-900/50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold text-white mb-4">Technology Stack</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {techStack.map((tech, index) => (
                <span 
                  key={index}
                  className="tech-badge text-gray-300 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Connect your MetaMask wallet and experience the future of academic evaluation
          </p>
          
          <Button 
            size="lg" 
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-lg"
            asChild
          >
            <Link href="/dashboard">
              <Zap className="w-5 h-5 mr-2" />
              CONNECT WALLET
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">Blockchain Lab Evaluation System</h4>
              <p className="text-gray-400">
                Secure, transparent, and immutable academic evaluation using blockchain technology.
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">© 2025 Blockchain Lab Evaluation System. Built for academic excellence.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}