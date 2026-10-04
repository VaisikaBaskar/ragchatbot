"use client";

import { useRouter } from "next/navigation";
import { Check, Rocket, Zap, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function PricingPage() {
  const router = useRouter();

  const handlePayment = async () => {
    const toastId = toast.loading("Processing payment...");
    
    try {
      // Mock payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const token = localStorage.getItem("token");
      const res = await fetch("/backend/user/upgrade", {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success("Payment successful! You are now Pro. 🚀", { id: toastId });
        // Give a moment for the user to see success
        setTimeout(() => {
          router.push("/chat");
        }, 1500);
      } else {
        toast.error("Upgrade failed: " + (data.message || "Unknown error"), { id: toastId });
      }
    } catch (err) {
      toast.error("Network error during payment processing", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      <button 
        onClick={() => router.push("/chat")}
        className="absolute top-8 left-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Chat
      </button>

      <div className="max-w-4xl w-full space-y-12 z-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Upgrade Your Plan
          </h1>
          <p className="text-zinc-400 text-lg">
            Choose the perfect plan to supercharge your RAG Assistant
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col space-y-6 backdrop-blur-sm transition-transform hover:scale-[1.02]">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Free Plan</h2>
              <div className="text-4xl font-bold">₹0<span className="text-lg text-zinc-500 font-normal">/month</span></div>
            </div>
            
            <ul className="flex-1 space-y-4">
              <li className="flex items-center gap-3 text-zinc-300">
                <Check className="text-green-500" size={18} />
                5 Document uploads
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <Check className="text-green-500" size={18} />
                Standard AI response speed
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <Check className="text-green-500" size={18} />
                Single user access
              </li>
            </ul>

            <button
              disabled
              className="w-full py-3 px-6 rounded-xl bg-white/5 text-zinc-500 font-semibold cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-purple-900/20 border-2 border-purple-500 rounded-3xl p-8 flex flex-col space-y-6 backdrop-blur-sm relative overflow-hidden transition-transform hover:scale-[1.02] shadow-2xl shadow-purple-500/10">
            <div className="absolute top-4 right-4 bg-purple-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Popular
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Pro Plan</h2>
                <Rocket className="text-purple-400" size={20} />
              </div>
              <div className="text-4xl font-bold">₹199<span className="text-lg text-purple-400/50 font-normal">/month</span></div>
            </div>
            
            <ul className="flex-1 space-y-4">
              <li className="flex items-center gap-3 text-zinc-100">
                <Zap className="text-yellow-400 fill-yellow-400" size={18} />
                <span className="font-medium">Unlimited document uploads</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <Check className="text-purple-400" size={18} />
                Priority AI processing
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <Check className="text-purple-400" size={18} />
                Early access to new features
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <Check className="text-purple-400" size={18} />
                Premium support
              </li>
            </ul>

            <button
              onClick={handlePayment}
              className="w-full py-4 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-600/30"
            >
              Subscribe Now 🚀
            </button>
          </div>
        </div>

        <p className="text-center text-zinc-500 text-xs">
          Payments are handled securely. No hidden charges. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
