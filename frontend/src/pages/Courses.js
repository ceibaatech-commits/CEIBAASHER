import React from 'react';
import { ExternalLink, GraduationCap, Clock, Award, TrendingUp, Users, BookOpen, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const Courses = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const courses = [
    {
      id: 1,
      title: "Hospital Management",
      subtitle: "IIM Professional Certificate",
      institution: "IIM Bangalore",
      duration: "6 Months",
      level: "Professional",
      link: "https://iimbx.iimb.ac.in/hospital-management-program/",
      gradient: "from-cyan-400 via-blue-500 to-indigo-600",
      icon: "🏥"
    },
    {
      id: 2,
      title: "AI for Managers",
      subtitle: "Professional Certificate",
      institution: "IIM Bangalore",
      duration: "4 Months",
      level: "Professional",
      link: "https://iimbx.iimb.ac.in/ai-for-managers/",
      gradient: "from-fuchsia-400 via-purple-500 to-pink-600",
      icon: "🤖"
    },
    {
      id: 3,
      title: "User Interface Design",
      subtitle: "NPTEL Online Course",
      institution: "NPTEL",
      duration: "12 Weeks",
      level: "Intermediate",
      link: "https://onlinecourses.nptel.ac.in/noc26_ar15/preview",
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      icon: "🎨"
    },
    {
      id: 4,
      title: "Unit Operations of Particulate Matter",
      subtitle: "NPTEL Online Course",
      institution: "NPTEL",
      duration: "12 Weeks",
      level: "Advanced",
      link: "https://onlinecourses.nptel.ac.in/noc26_ch44/preview",
      gradient: "from-orange-400 via-red-500 to-rose-600",
      icon: "⚗️"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header isLoggedIn={isAuthenticated()} user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 md:mb-8 group transition-colors"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Back</span>
        </button>

        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl mb-4 md:mb-6 shadow-xl">
            <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
            Professional Courses
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Advance your career with premium certificate programs
          </p>
        </div>

        {/* Courses Grid - 3 columns on desktop, 2 on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {courses.map((course) => (
            <a
              key={course.id}
              href={course.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden cursor-pointer"
            >
              {/* Gradient Header */}
              <div className={`bg-gradient-to-br ${course.gradient} p-4 md:p-6 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                
                <div className="relative">
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3">{course.icon}</div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-1 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs md:text-sm text-white/90 font-medium mb-3 md:mb-4">
                    {course.subtitle}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 md:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                    <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">{course.institution}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3 text-gray-600" />
                    <span className="text-gray-700">{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3 text-gray-600" />
                    <span className="text-gray-700">{course.level}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <div className={`w-full bg-gradient-to-r ${course.gradient} text-white py-2 md:py-2.5 px-4 rounded-lg font-semibold text-xs md:text-sm hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105`}>
                  <span>More Info</span>
                  <ExternalLink className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-8 md:mt-12 bg-white/80 backdrop-blur-sm border-2 border-purple-200 rounded-2xl p-4 md:p-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl md:rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <Award className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                Premium Learning Partners
              </h3>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                IIM Bangalore and NPTEL are India's premier educational institutions offering world-class programs. 
                These certificate courses are designed for professionals seeking career advancement with recognized credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;
