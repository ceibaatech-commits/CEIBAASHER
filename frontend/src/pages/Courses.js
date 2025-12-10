import React from 'react';
import { ExternalLink, GraduationCap, Clock, Award, TrendingUp, Users, BookOpen } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const Courses = () => {
  const { user, isAuthenticated } = useAuth();

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Header isLoggedIn={isAuthenticated()} user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Professional Certificate Courses
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advance your career with world-class certificate programs from IIM Bangalore
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Card Header with Gradient */}
              <div className={`bg-gradient-to-r ${course.color} p-6 text-white`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
                    <p className="text-white/90 font-medium flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      {course.institution}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <TrendingUp className="w-4 h-4" />
                    <span>{course.level}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {course.description}
                </p>

                {/* Highlights */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Program Highlights:</h3>
                  <ul className="space-y-2">
                    {course.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <a
                  href={course.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full bg-gradient-to-r ${course.color} text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group`}
                >
                  <span>More Info & Apply</span>
                  <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Why Choose IIM Bangalore?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                IIM Bangalore is one of India's premier management institutions, consistently ranked among the top business schools globally. 
                These professional certificate programs are designed for working professionals seeking to advance their careers with world-class education.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;
