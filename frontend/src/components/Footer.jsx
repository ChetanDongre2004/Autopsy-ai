import { Link } from "react-router-dom";
import { Rocket, Github, Linkedin, Twitter, HeartPulse } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-16">
      <div className="container max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-14">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2">
            <Link to="/" className="font-heading font-extrabold text-2xl tracking-wide flex items-center gap-3 text-zinc-100 hover:opacity-80 transition mb-6 inline-flex">
              <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
                <Rocket className="w-5 h-5 text-indigo-400" />
              </div>
              Autopsy<span className="text-indigo-400">.ai</span>
            </Link>
            <p className="text-zinc-500 text-lg leading-relaxed max-w-sm font-medium mb-6">
              AI-powered Engineering Intelligence Platform for code review, security, repository analysis, and QA automation.
            </p>
            <div className="flex gap-4">
               <a href="#" className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition"><Github className="w-5 h-5 text-zinc-400"/></a>
               <a href="#" className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition"><Linkedin className="w-5 h-5 text-zinc-400"/></a>
               <a href="#" className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition"><Twitter className="w-5 h-5 text-zinc-400"/></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide">Products</h4>
            <ul className="space-y-4 font-medium text-zinc-400">
              <li><Link to="/products/github" className="hover:text-indigo-400 transition">GitHub Intelligence</Link></li>
              <li><Link to="/products/security" className="hover:text-indigo-400 transition">Security Platform</Link></li>
              <li><Link to="/products/review" className="hover:text-indigo-400 transition">AI Code Review</Link></li>
              <li><Link to="/products/qa" className="hover:text-indigo-400 transition">QA Automation</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide">Resources</h4>
            <ul className="space-y-4 font-medium text-zinc-400">
              <li><a href="#" className="hover:text-indigo-400 transition">Documentation</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">API Reference</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Blog / Updates</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Community</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide">Company</h4>
            <ul className="space-y-4 font-medium text-zinc-400">
              <li><a href="#" className="hover:text-indigo-400 transition">About Us</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Careers</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Contact</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Privacy Policy</a></li>
            </ul>
          </div>

        </div>
        <div className="pt-8 border-t border-zinc-800/80 text-zinc-500 font-medium text-sm flex flex-col md:flex-row justify-between items-center gap-4">
           <span>© 2026 Autopsy AI Inc. All rights reserved.</span>
           <span className="flex items-center gap-2">Built with <HeartPulse className="w-4 h-4 text-indigo-500"/> for developers</span>
        </div>
      </div>
    </footer>
  );
}
