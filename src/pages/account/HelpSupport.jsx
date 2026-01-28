import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Mail, FileText, Video, MessageCircle, Send } from 'lucide-react';
import Swal from 'sweetalert2';

const HelpSupport = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSupportRequest = (e) => {
    e.preventDefault();
    Swal.fire({
      icon: 'success',
      title: 'Request Sent',
      text: 'Our support team will contact you shortly.',
      confirmButtonColor: '#0D9488'
    });
  };

  const faqs = [
    { question: 'How do I reset my admin password?', answer: 'Go to Settings > Security > Change Password. If you forgot your password, use the "Forgot Password" link on the login page.' },
    { question: 'Can I add multiple branches?', answer: 'Yes, our Premium Plan supports up to 5 branches. Go to Plan & Billing to upgrade.' },
    { question: 'How to generate medication barcodes?', answer: 'Navigate to Inventory > Medicine List. Select a medicine and click the QR/Barcode icon to generate and print labels.' },
    { question: 'Is my data secure?', answer: 'We use industry-standard encryption for all data. 2FA is available for added security.' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center justify-center gap-2">
           <HelpCircle className="text-accent" /> Help & Support Center
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Find answers, documentation, or contact our support team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Quick Links */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer text-center group">
           <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
             <FileText size={24} />
           </div>
           <h3 className="font-bold text-gray-800 dark:text-white mb-2">Documentation</h3>
           <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Detailed guides on how to use every feature.</p>
           <button className="text-blue-600 font-bold text-sm hover:underline">View Docs →</button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer text-center group">
           <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
             <Video size={24} />
           </div>
           <h3 className="font-bold text-gray-800 dark:text-white mb-2">Video Tutorials</h3>
           <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Step-by-step video walkthroughs.</p>
           <button className="text-red-600 font-bold text-sm hover:underline">Watch Videos →</button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer text-center group">
           <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
             <MessageCircle size={24} />
           </div>
           <h3 className="font-bold text-gray-800 dark:text-white mb-2">Live Chat</h3>
           <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Chat with our support team in real-time.</p>
           <button className="text-green-600 font-bold text-sm hover:underline">Start Chat →</button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        
        {/* FAQs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{faq.question}</span>
                  {openFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {openFaq === index && (
                  <div className="p-4 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <Mail size={20} className="text-accent" /> Contact Support
          </h2>
          <form onSubmit={handleSupportRequest} className="space-y-4">
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
               <select className="w-full px-4 py-2 mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 focus:ring-2 focus:ring-accent outline-none text-sm">
                 <option>General Inquiry</option>
                 <option>Technical Issue</option>
                 <option>Billing Question</option>
                 <option>Feature Request</option>
               </select>
             </div>
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase">Message</label>
               <textarea 
                 rows="4" 
                 placeholder="Describe your issue..." 
                 className="w-full px-4 py-2 mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 focus:ring-2 focus:ring-accent outline-none text-sm resize-none"
               ></textarea>
             </div>
             <button type="submit" className="w-full py-2.5 bg-accent text-white font-bold rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
               <Send size={16} /> Send Message
             </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default HelpSupport;
