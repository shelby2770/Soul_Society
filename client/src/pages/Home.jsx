import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";

const Home = () => {
  const user = null; // This should come from your auth context
  const [doctors, setDoctors] = useState([]);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    // Fetch doctors data
    fetch("/data/doctors.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.doctors) {
          setDoctors(data.doctors);
        }
      })
      .catch((error) => {
        console.error("Error fetching doctors:", error);
        // Set some default data in case of error
        setDoctors([
          {
            id: 1,
            name: "Dr. Arefin Rahman",
            specialty: "Psychiatrist",
            rating: 5.0,
            experience: "15 years",
            image:
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
            reviews: 1000,
          },
          {
            id: 2,
            name: "Dr. Nusrat Jahan",
            specialty: "Therapist",
            rating: 4.3,
            experience: "12 years",
            image:
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
            reviews: 300,
          },
        ]);
      });

    // Fetch comments data
    fetch("/dummy_data/comments.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.comments) {
          setComments(data.comments);
        }
      })
      .catch((error) => {
        console.error("Error fetching comments:", error);
        // Set some default data in case of error
        setComments([
          {
            id: 1,
            name: "Md. Faisal Karim",
            date: "January 7, 2023",
            rating: 5,
            image:
              "https://api.dicebear.com/7.x/avataaars/svg?seed=Md.FaisalKarim",
            text: "I've been seeing Dr. Ashfaq Hasan for a few months now, and it's been a really positive experience. He's easy to talk to, and I feel like he listens and understands my concerns. I would definitely recommend him to others.",
            likes: 2,
            dislikes: 0,
          },
          {
            id: 2,
            name: "Shamima Akter",
            date: "February 22, 2023",
            rating: 4,
            image:
              "https://api.dicebear.com/7.x/avataaars/svg?seed=ShamimaAkter",
            text: "I've only had a few sessions with Dr. Tanjina Sultana, but so far, I'm happy with the care I've received. She's professional and knowledgeable, and I appreciate her direct approach to therapy.",
            likes: 1,
            dislikes: 0,
          },
        ]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white text-black pt-16">
      {/* Hero section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col items-center">
          <div className="z-10 text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              Find your peace of mind
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
              Stay connected with your care team, manage medications, and
              more...
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button className="rounded-full bg-blue-500 text-white hover:bg-blue-600 text-base px-8 py-6 w-full sm:w-auto transition-colors">
                  Get Started
                </Button>
              </Link>
              <Link to="/about">
                <Button
                  variant="outline"
                  className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 text-base px-8 py-6 w-full sm:w-auto transition-colors"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* User Type Sections */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            How Soul Society Works For You
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Patient Section */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow p-6 border-t-4 border-blue-500 flex flex-col">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-blue-600">
                  For Patients
                </h3>
                <p className="text-gray-600 mb-4">
                  Access quality mental healthcare from the comfort of your
                  home. Book appointments, track your progress, and connect with
                  professionals who care.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Easy appointment booking
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Secure video consultations
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Progress tracking tools
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-auto">
                <Link to="/signup">
                  <Button className="w-full rounded-full bg-blue-500 hover:bg-blue-600 transition-colors">
                    Sign Up as Patient
                  </Button>
                </Link>
              </div>
            </div>

            {/* Doctor Section */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow p-6 border-t-4 border-purple-500 flex flex-col">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-purple-600">
                  For Doctors
                </h3>
                <p className="text-gray-600 mb-4">
                  Expand your practice online. Manage appointments, connect with
                  patients, and provide care on your schedule.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-purple-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">Flexible scheduling</span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-purple-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Digital prescription system
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-purple-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Secure patient communication
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-auto">
                <Link to="/signup">
                  <Button className="w-full rounded-full bg-purple-500 hover:bg-purple-600 transition-colors">
                    Join as Doctor
                  </Button>
                </Link>
              </div>
            </div>

            {/* Admin Section */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow p-6 border-t-4 border-green-500 flex flex-col">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-600">
                  For Administrators
                </h3>
                <p className="text-gray-600 mb-4">
                  Manage your healthcare organization efficiently. Monitor
                  performance, verify professionals, and ensure quality care.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Comprehensive analytics
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Doctor verification tools
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">System monitoring</span>
                  </li>
                </ul>
              </div>
              <div className="mt-auto">
                <Link to="/signup">
                  <Button className="w-full rounded-full bg-green-500 hover:bg-green-600 transition-colors">
                    Admin Access
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Top-Rated Doctors */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Meet Our Top-Rated Doctors
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-medium">{doctor.name}</h3>
                  <p className="text-sm text-gray-600">{doctor.specialty}</p>
                  <div className="flex items-center mt-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(doctor.rating)
                              ? "fill-current"
                              : "fill-current text-gray-300"
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 ml-1">
                      {doctor.rating} ({doctor.experience})
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What people are saying */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            What people are saying
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={comment.image}
                    alt={comment.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-medium">{comment.name}</h4>
                    <p className="text-xs text-gray-500">{comment.date}</p>
                  </div>
                </div>
                <div className="flex text-yellow-400 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < comment.rating
                          ? "fill-current"
                          : "fill-current text-gray-300"
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700">{comment.text}</p>
                <div className="flex items-center mt-4 text-gray-500">
                  <button className="flex items-center mr-4">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      ></path>
                    </svg>
                    {comment.likes}
                  </button>
                  <button className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2"
                      ></path>
                    </svg>
                    {comment.dislikes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
