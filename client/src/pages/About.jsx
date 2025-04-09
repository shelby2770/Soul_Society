import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="container mx-auto px-4 pt-36 pb-16">
      {/* <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
        About Soul Society
      </h1> */}
      <div className="max-w-3xl mx-auto">
        <div className="prose prose-lg">
          <p className="text-gray-600 mb-6">
            Soul Society is a pioneering mental healthcare platform dedicated to
            making quality mental health services accessible to everyone. We
            believe that mental health is just as important as physical health,
            and everyone deserves access to professional care and support.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-12 mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 mb-6">
            To break down barriers to mental healthcare by connecting
            individuals with qualified professionals through a secure,
            user-friendly platform. We strive to create a world where seeking
            mental health support is normalized and accessible to all.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-12 mb-4">
            Our Values
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-3 mb-6">
            <li>
              Accessibility - Making mental healthcare available to everyone
            </li>
            <li>Privacy - Ensuring secure and confidential care</li>
            <li>
              Quality - Connecting you with verified, experienced professionals
            </li>
            <li>
              Innovation - Using technology to improve mental healthcare
              delivery
            </li>
            <li>Empathy - Understanding and supporting your journey</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mt-12 mb-4">
            Why Choose Us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Verified Professionals
              </h3>
              <p className="text-gray-600">
                All our mental health professionals go through a rigorous
                verification process to ensure you receive the highest quality
                care.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Secure Platform
              </h3>
              <p className="text-gray-600">
                Your privacy and security are our top priorities. All
                communications are encrypted and confidential.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
