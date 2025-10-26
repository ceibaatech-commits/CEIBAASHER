import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, HelpCircle, MessageCircle, Shield, CreditCard, Users, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const FAQ = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqSections = [
    {
      icon: HelpCircle,
      title: "About Ceibaa",
      color: "#8B5CF6",
      bgColor: "bg-purple-50",
      faqs: [
        {
          question: "What is Ceibaa?",
          answer: "Ceibaa is India's #1 Live Quiz Battle Platform that combines social media engagement with exam preparation. Think of it as 'viral video apps meets Education' - where students compete in real-time quiz battles with video streaming, making learning as addictive as social media."
        },
        {
          question: "How is Ceibaa different from other learning apps?",
          answer: "Unlike boring educational apps, Ceibaa uses live battles, video streaming, virtual gifts, and social features to make learning exciting. We don't just teach - we create an experience that students can't resist, just like social media but productive!"
        },
        {
          question: "Why was Ceibaa created?",
          answer: "We saw millions of students failing exams because they were addicted to social media. Instead of fighting this addiction, we channelized it. We created a platform where the same features that make social media addictive (live videos, battles, challenges, rewards) are used to make studying irresistible."
        },
        {
          question: "Which exams does Ceibaa cover?",
          answer: "Ceibaa covers all major competitive exams including JEE, NEET, UPSC, SSC, Banking, Defence (NDA, Agniveer, CDS, CAPF), Teaching Exams (CTET, DSSB, KVS), State exams (RPSC, UP TGT/PGT), and admission tests (GATE, CAT, CLAT, GMAT). We have comprehensive question banks for each exam with topic-wise practice."
        },
        {
          question: "Who can use Ceibaa?",
          answer: "Anyone preparing for competitive exams! From 10th graders preparing for JEE/NEET to graduates preparing for government jobs. Whether you're a serious aspirant or casual learner, college student or working professional - if you want to make studying fun, Ceibaa is for you!"
        },
        {
          question: "Is Ceibaa only for serious exam preparation?",
          answer: "While we're serious about results, learning on Ceibaa feels like entertainment! You can casually play quiz battles during breaks, challenge friends for fun, or go hardcore with practice mode. It's flexible - study your way, at your pace."
        },
        {
          question: "Where is Ceibaa available?",
          answer: "Ceibaa is available across India! You can access it from anywhere via web browser on your phone, tablet, or computer. No app download needed - just visit ceibaa.com and start playing. Works on all devices with internet connection."
        },
        {
          question: "What makes Ceibaa 'India's #1' platform?",
          answer: "We're the only platform combining live video battles, social features, and gamification for exam prep. With 50,000+ active students, 100,000+ daily battles, and 95% success rate, our students consistently rank higher than those using traditional apps."
        }
      ]
    },
    {
      icon: Sparkles,
      title: "Live Battle Features",
      color: "#F59E0B",
      bgColor: "bg-amber-50",
      faqs: [
        {
          question: "What are Live Quiz Battles?",
          answer: "Live Quiz Battles are real-time competitions where you face opponents while streaming via video. It's like playing a multiplayer game - you see your opponent, compete on questions, earn points, and climb leaderboards. The live video makes it feel like you're in a gaming tournament!"
        },
        {
          question: "How do video battles work?",
          answer: "When you join a battle, your camera turns on and you can see your opponent live. As questions appear, both of you race to answer. You can see reactions in real-time, use quick chat, send emojis, and even send virtual gifts! The fastest correct answer wins more points. It's super engaging and makes you feel connected!"
        },
        {
          question: "Can I battle with my friends?",
          answer: "Absolutely! You can create private rooms with PIN codes and invite your friends. Or join public battles to meet new students across India. We also have study groups where you can form teams, practice together, and compete in team battles. It's WhatsApp groups but for studying!"
        },
        {
          question: "What are virtual gifts and how do they work?",
          answer: "Virtual gifts are fun rewards you can send to opponents during battles! Like hearts ❤️, fire 🔥, crowns 👑, etc. You earn gift coins by winning battles and can use them to appreciate good players. Top gifters get special badges and appear on leaderboards. It's social, fun, and builds community!"
        }
      ]
    },
    {
      icon: Users,
      title: "For Students",
      color: "#10B981",
      bgColor: "bg-emerald-50",
      faqs: [
        {
          question: "How does Ceibaa help me stop wasting time on social media?",
          answer: "Ceibaa gives you the same dopamine rush as social media - live videos, competitions, likes, comments, achievements - but it's all educational! You're still getting that addictive feeling, but now you're learning instead of wasting time. Your brain gets satisfied AND you're preparing for exams. Win-win!"
        },
        {
          question: "Is Ceibaa free to use?",
          answer: "Yes! Ceibaa has a generous free tier with daily battles, practice questions, and basic features. For unlimited battles, premium questions, and advanced features, we have affordable subscription plans starting at just ₹99/month. Way cheaper than coaching classes!"
        },
        {
          question: "How do I earn points and rewards?",
          answer: "Earn points by winning battles, daily practice, streak maintenance, referring friends, and completing challenges. Points unlock badges, move you up leaderboards, and can be converted to gift coins. Top performers get featured on homepage and win prizes in monthly tournaments!"
        },
        {
          question: "Can I study in Hindi?",
          answer: "Yes! Ceibaa supports both Hindi and English. You can choose your preferred language for questions, explanations, and interface. We understand that many students are more comfortable in Hindi, especially for government exams. Bilingual support coming for more regional languages soon!"
        },
        {
          question: "What if I'm weak in a subject?",
          answer: "That's perfect! Use our Practice Mode to build confidence without pressure. Our AI matches you with players at your level, so you're never overwhelmed. We also have topic-wise practice, detailed explanations, and a supportive community. Everyone starts somewhere - the key is to keep playing and improving!"
        }
      ]
    },
    {
      icon: MessageCircle,
      title: "For Content Creators",
      color: "#EC4899",
      bgColor: "bg-pink-50",
      faqs: [
        {
          question: "How can I become a creator on Ceibaa?",
          answer: "If you're good at any subject and love teaching, you can become a creator! Simply apply through our Creator Dashboard, submit sample questions, and once approved, start creating quiz battles. You need subject expertise and passion for teaching - no fancy equipment needed!"
        },
        {
          question: "How much can I earn as a creator?",
          answer: "Top creators earn ₹50,000-₹1,00,000+ per month! You earn from students taking your quizzes, premium subscriptions, virtual gifts, and bonuses for popular content. The more engaging your battles, the more you earn. It's performance-based - create great content, earn great money!"
        },
        {
          question: "What content can I create?",
          answer: "Create quiz questions, live battle rooms, topic explanations, mock tests, daily challenges, and more! You can specialize in one exam or cover multiple topics. Focus on what you're expert at. Most popular are JEE Physics, UPSC Current Affairs, SSC Math, and Banking Reasoning."
        },
        {
          question: "Do I need technical skills?",
          answer: "Not at all! Our creator tools are super simple - just type questions, add options, mark correct answer, and publish. If you can use WhatsApp, you can create on Ceibaa. We handle all the technical stuff. You focus on creating great educational content!"
        }
      ]
    },
    {
      icon: Shield,
      title: "Technical & Safety",
      color: "#3B82F6",
      bgColor: "bg-blue-50",
      faqs: [
        {
          question: "Is my data safe on Ceibaa?",
          answer: "Absolutely! We use bank-level encryption (SSL/TLS) for all data. Your personal information, payment details, and quiz performance are completely secure. We never share your data with third parties. Your privacy is our top priority. We're GDPR compliant and follow strict data protection guidelines."
        },
        {
          question: "What devices can I use Ceibaa on?",
          answer: "Ceibaa works on any device with a web browser - smartphones (Android/iOS), tablets, laptops, and desktops. No app download needed! Just visit ceibaa.com and you're ready. We recommend Chrome, Safari, or Firefox for best experience. Responsive design works perfectly on all screen sizes!"
        },
        {
          question: "Do I need a fast internet connection?",
          answer: "Good news - Ceibaa works even on 3G! While 4G/WiFi is recommended for smooth video battles, we've optimized everything to work on slower connections too. Questions load fast, videos are compressed smartly, and you can adjust quality settings. Studied from rural areas? No problem!"
        },
        {
          question: "What if I face technical issues during a battle?",
          answer: "If you disconnect during a battle, we save your progress! Reconnect within 2 minutes and continue. For fair play, if opponent disconnects, you get a free win. Our support team is available 24/7 via chat. Most issues are resolved within minutes. We also have detailed troubleshooting guides in Help Center."
        },
        {
          question: "Is there any age restriction?",
          answer: "Users must be 13+ years old. If you're under 18, we recommend parental supervision for payment features. Our platform is educational and safe, but we encourage responsible usage. We have anti-bullying policies, content moderation, and report systems to ensure a positive learning environment."
        }
      ]
    },
    {
      icon: CreditCard,
      title: "Payment & Subscriptions",
      color: "#EF4444",
      bgColor: "bg-red-50",
      faqs: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major payment methods: UPI (GPay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Wallets (Paytm, Mobikwik). All payments are processed through secure payment gateways (Razorpay/Stripe). We also accept EMI for annual plans!"
        },
        {
          question: "Can I cancel my subscription?",
          answer: "Yes, you can cancel anytime from your Account Settings. Your subscription remains active until the end of current billing period. No questions asked, no cancellation fees. If you cancel within 7 days of purchase, you're eligible for a full refund (see refund policy)."
        },
        {
          question: "Do you offer student discounts?",
          answer: "Yes! Students get 20% off on annual plans. Plus, we run special discount campaigns during exam seasons. Refer 5 friends and get 1 month free! Group plans (5+ friends) get 30% off. We also have scholarships for underprivileged students - apply through our website."
        },
        {
          question: "What's your refund policy?",
          answer: "7-day money-back guarantee! If you're not satisfied within 7 days of purchase, we'll refund 100% - no questions asked. For cancellations after 7 days, refunds are prorated based on unused time. Refunds are processed within 5-7 business days to original payment method."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Compact Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-white mb-4"
          >
            Got Questions? We've Got Answers!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90"
          >
            Everything you need to know about Ceibaa 🎯
          </motion.p>
        </div>
      </section>

      {/* FAQ Grid Layout */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {faqSections.map((section, sectionIndex) => (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sectionIndex * 0.1 }}
                className={`${section.bgColor} rounded-3xl p-8 border-2 border-gray-100`}
              >
                {/* Section Header - Compact */}
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: section.color }}
                  >
                    <section.icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">{section.title}</h2>
                </div>

                {/* FAQ Items - Clean Compact Design */}
                <div className="space-y-3">
                  {section.faqs.map((faq, faqIndex) => {
                    const globalIndex = `${sectionIndex}-${faqIndex}`;
                    const isOpen = openIndex === globalIndex;

                    return (
                      <div
                        key={faqIndex}
                        onClick={() => toggleAccordion(globalIndex)}
                        className={`cursor-pointer bg-white rounded-2xl border-2 transition-all ${
                          isOpen ? 'border-gray-300 shadow-lg' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="p-5">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-base font-bold text-gray-900 flex-1">
                              {faq.question}
                            </h3>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                            >
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            </motion.div>
                          </div>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <p className="text-gray-600 leading-relaxed pt-4 mt-4 border-t border-gray-100">
                                  {faq.answer}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compact CTA */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Still have questions?</h2>
          <p className="text-lg mb-8 text-white/90">
            Join 50,000+ students and start your learning journey today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl"
            >
              Start Your First Battle 🚀
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/10 backdrop-blur-sm border-2 border-white px-8 py-4 rounded-xl font-bold text-lg"
            >
              Talk to Support 💬
            </motion.button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
      faqs: [
        {
          question: "What is Ceibaa?",
          answer: "Ceibaa is India's #1 Live Quiz Battle Platform that combines social media engagement with exam preparation. Think of it as 'viral video apps meets Education' - where students compete in real-time quiz battles with video streaming, making learning as addictive as social media."
        },
        {
          question: "How is Ceibaa different from other learning apps?",
          answer: "Unlike boring educational apps, Ceibaa uses live battles, video streaming, virtual gifts, and social features to make learning exciting. We don't just teach - we create an experience that students can't resist, just like social media but productive!"
        },
        {
          question: "Why was Ceibaa created?",
          answer: "We saw millions of students failing exams because they were addicted to social media. Instead of fighting this addiction, we channelized it. We created a platform where the same features that make social media addictive (live videos, battles, challenges, rewards) are used to make studying irresistible."
        },
        {
          question: "Which exams does Ceibaa cover?",
          answer: "Ceibaa covers all major competitive exams including JEE, NEET, UPSC, SSC, Banking, Defence (NDA, Agniveer, CDS, CAPF), Teaching Exams (CTET, DSSB, KVS), State exams (RPSC, UP TGT/PGT), and admission tests (GATE, CAT, CLAT, GMAT). We have comprehensive question banks for each exam with topic-wise practice."
        },
        {
          question: "Who can use Ceibaa?",
          answer: "Anyone preparing for competitive exams! From 10th graders preparing for JEE/NEET to graduates preparing for government jobs. Whether you're a serious aspirant or casual learner, college student or working professional - if you want to make studying fun, Ceibaa is for you!"
        },
        {
          question: "Is Ceibaa only for serious exam preparation?",
          answer: "While we're serious about results, learning on Ceibaa feels like entertainment! You can casually play quiz battles during breaks, challenge friends for fun, or go hardcore with practice mode. It's flexible - study your way, at your pace."
        },
        {
          question: "Where is Ceibaa available?",
          answer: "Ceibaa is available across India! You can access it from anywhere via web browser on your phone, tablet, or computer. No app download needed - just visit ceibaa.com and start playing. Works on all devices with internet connection."
        },
        {
          question: "What makes Ceibaa 'India's #1' platform?",
          answer: "We're the only platform combining live video battles, social features, and gamification for exam prep. With 50,000+ active students, 100,000+ daily battles, and 95% success rate, our students consistently rank higher than those using traditional apps."
        }
      ]
    },
    {
      icon: Zap,
      title: "Live Battle Features",
      gradient: "from-orange-500 to-red-500",
      emoji: "⚡",
      faqs: [
        {
          question: "What are Live Quiz Battles?",
          answer: "Live Quiz Battles are real-time competitions where you face opponents while streaming via video. It's like playing a multiplayer game - you see your opponent, compete on questions, earn points, and climb leaderboards. The live video makes it feel like you're in a gaming tournament!"
        },
        {
          question: "How do video battles work?",
          answer: "When you join a battle, your camera turns on and you can see your opponent live. As questions appear, both of you race to answer. You can see reactions in real-time, use quick chat, send emojis, and even send virtual gifts! The fastest correct answer wins more points. It's super engaging and makes you feel connected!"
        },
        {
          question: "Can I battle with my friends?",
          answer: "Absolutely! You can create private rooms with PIN codes and invite your friends. Or join public battles to meet new students across India. We also have study groups where you can form teams, practice together, and compete in team battles. It's WhatsApp groups but for studying!"
        },
        {
          question: "What are virtual gifts and how do they work?",
          answer: "Virtual gifts are fun rewards you can send to opponents during battles! Like hearts ❤️, fire 🔥, crowns 👑, etc. You earn gift coins by winning battles and can use them to appreciate good players. Top gifters get special badges and appear on leaderboards. It's social, fun, and builds community!"
        }
      ]
    },
    {
      icon: GraduationCap,
      title: "For Students",
      gradient: "from-blue-500 to-cyan-500",
      emoji: "🎓",
      faqs: [
        {
          question: "How does Ceibaa help me stop wasting time on social media?",
          answer: "Ceibaa gives you the same dopamine rush as social media - live videos, competitions, likes, comments, achievements - but it's all educational! You're still getting that addictive feeling, but now you're learning instead of wasting time. Your brain gets satisfied AND you're preparing for exams. Win-win!"
        },
        {
          question: "Is Ceibaa free to use?",
          answer: "Yes! Ceibaa has a generous free tier with daily battles, practice questions, and basic features. For unlimited battles, premium questions, and advanced features, we have affordable subscription plans starting at just ₹99/month. Way cheaper than coaching classes!"
        },
        {
          question: "How do I earn points and rewards?",
          answer: "Earn points by winning battles, daily practice, streak maintenance, referring friends, and completing challenges. Points unlock badges, move you up leaderboards, and can be converted to gift coins. Top performers get featured on homepage and win prizes in monthly tournaments!"
        },
        {
          question: "Can I study in Hindi?",
          answer: "Yes! Ceibaa supports both Hindi and English. You can choose your preferred language for questions, explanations, and interface. We understand that many students are more comfortable in Hindi, especially for government exams. Bilingual support coming for more regional languages soon!"
        },
        {
          question: "What if I'm weak in a subject?",
          answer: "That's perfect! Use our Practice Mode to build confidence without pressure. Our AI matches you with players at your level, so you're never overwhelmed. We also have topic-wise practice, detailed explanations, and a supportive community. Everyone starts somewhere - the key is to keep playing and improving!"
        }
      ]
    },
    {
      icon: PenTool,
      title: "For Content Creators",
      gradient: "from-green-500 to-emerald-500",
      emoji: "👨‍🏫",
      faqs: [
        {
          question: "How can I become a creator on Ceibaa?",
          answer: "If you're good at any subject and love teaching, you can become a creator! Simply apply through our Creator Dashboard, submit sample questions, and once approved, start creating quiz battles. You need subject expertise and passion for teaching - no fancy equipment needed!"
        },
        {
          question: "How much can I earn as a creator?",
          answer: "Top creators earn ₹50,000-₹1,00,000+ per month! You earn from students taking your quizzes, premium subscriptions, virtual gifts, and bonuses for popular content. The more engaging your battles, the more you earn. It's performance-based - create great content, earn great money!"
        },
        {
          question: "What content can I create?",
          answer: "Create quiz questions, live battle rooms, topic explanations, mock tests, daily challenges, and more! You can specialize in one exam or cover multiple topics. Focus on what you're expert at. Most popular are JEE Physics, UPSC Current Affairs, SSC Math, and Banking Reasoning."
        },
        {
          question: "Do I need technical skills?",
          answer: "Not at all! Our creator tools are super simple - just type questions, add options, mark correct answer, and publish. If you can use WhatsApp, you can create on Ceibaa. We handle all the technical stuff. You focus on creating great educational content!"
        }
      ]
    },
    {
      icon: Shield,
      title: "Technical & Safety",
      gradient: "from-indigo-500 to-purple-500",
      emoji: "🔒",
      faqs: [
        {
          question: "Is my data safe on Ceibaa?",
          answer: "Absolutely! We use bank-level encryption (SSL/TLS) for all data. Your personal information, payment details, and quiz performance are completely secure. We never share your data with third parties. Your privacy is our top priority. We're GDPR compliant and follow strict data protection guidelines."
        },
        {
          question: "What devices can I use Ceibaa on?",
          answer: "Ceibaa works on any device with a web browser - smartphones (Android/iOS), tablets, laptops, and desktops. No app download needed! Just visit ceibaa.com and you're ready. We recommend Chrome, Safari, or Firefox for best experience. Responsive design works perfectly on all screen sizes!"
        },
        {
          question: "Do I need a fast internet connection?",
          answer: "Good news - Ceibaa works even on 3G! While 4G/WiFi is recommended for smooth video battles, we've optimized everything to work on slower connections too. Questions load fast, videos are compressed smartly, and you can adjust quality settings. Studied from rural areas? No problem!"
        },
        {
          question: "What if I face technical issues during a battle?",
          answer: "If you disconnect during a battle, we save your progress! Reconnect within 2 minutes and continue. For fair play, if opponent disconnects, you get a free win. Our support team is available 24/7 via chat. Most issues are resolved within minutes. We also have detailed troubleshooting guides in Help Center."
        },
        {
          question: "Is there any age restriction?",
          answer: "Users must be 13+ years old. If you're under 18, we recommend parental supervision for payment features. Our platform is educational and safe, but we encourage responsible usage. We have anti-bullying policies, content moderation, and report systems to ensure a positive learning environment."
        }
      ]
    },
    {
      icon: CreditCard,
      title: "Payment & Subscriptions",
      gradient: "from-yellow-500 to-orange-500",
      emoji: "💳",
      faqs: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major payment methods: UPI (GPay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Wallets (Paytm, Mobikwik). All payments are processed through secure payment gateways (Razorpay/Stripe). We also accept EMI for annual plans!"
        },
        {
          question: "Can I cancel my subscription?",
          answer: "Yes, you can cancel anytime from your Account Settings. Your subscription remains active until the end of current billing period. No questions asked, no cancellation fees. If you cancel within 7 days of purchase, you're eligible for a full refund (see refund policy)."
        },
        {
          question: "Do you offer student discounts?",
          answer: "Yes! Students get 20% off on annual plans. Plus, we run special discount campaigns during exam seasons. Refer 5 friends and get 1 month free! Group plans (5+ friends) get 30% off. We also have scholarships for underprivileged students - apply through our website."
        },
        {
          question: "What's your refund policy?",
          answer: "7-day money-back guarantee! If you're not satisfied within 7 days of purchase, we'll refund 100% - no questions asked. For cancellations after 7 days, refunds are prorated based on unused time. Refunds are processed within 5-7 business days to original payment method."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-20"
      >
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-20 -left-20 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <span className="text-7xl">❓</span>
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Everything you need to know about Ceibaa - India's most addictive learning platform!
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* FAQ Sections */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {faqSections.map((section, sectionIndex) => (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sectionIndex * 0.1 }}
              >
                {/* Section Header */}
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`w-16 h-16 bg-gradient-to-br ${section.gradient} rounded-2xl flex items-center justify-center shadow-xl`}
                  >
                    <section.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{section.emoji}</span>
                      <h2 className="text-3xl font-black text-gray-900">{section.title}</h2>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">Everything about {section.title.toLowerCase()}</p>
                  </div>
                </div>

                {/* FAQ Items */}
                <div className="space-y-4">
                  {section.faqs.map((faq, faqIndex) => {
                    const globalIndex = `${sectionIndex}-${faqIndex}`;
                    const isOpen = openIndex === globalIndex;

                    return (
                      <motion.div
                        key={faqIndex}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: faqIndex * 0.05 }}
                        className="group"
                      >
                        <div
                          onClick={() => toggleAccordion(globalIndex)}
                          className={`cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 ${
                            isOpen 
                              ? `border-transparent bg-gradient-to-br ${section.gradient} text-white` 
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between">
                              <h3 className={`text-lg font-bold pr-4 ${
                                isOpen ? 'text-white' : 'text-gray-900 group-hover:text-purple-600'
                              }`}>
                                {faq.question}
                              </h3>
                              <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                  isOpen ? 'bg-white/20' : 'bg-gray-100'
                                }`}
                              >
                                <ChevronDown className={`w-5 h-5 ${
                                  isOpen ? 'text-white' : 'text-gray-600'
                                }`} />
                              </motion.div>
                            </div>

                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-4 border-t border-white/20 mt-4">
                                    <p className="text-white/90 leading-relaxed">
                                      {faq.answer}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.5, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [360, 180, 0] }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-6"
            >
              <span className="text-7xl">🎯</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Transform Your Study Habits?</h2>
            <p className="text-2xl mb-10 text-white/90">
              Join 50,000+ students who stopped wasting time on social media and started using it for exam success!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="bg-white text-purple-600 px-10 py-5 rounded-xl font-bold text-xl shadow-2xl hover:shadow-white/50 transition-all"
              >
                🚀 Start Your First Battle
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 backdrop-blur-sm border-2 border-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-white/20 transition-all"
              >
                💬 Talk to Support
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
